import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import PluginAnswer from '@/models/PluginAnswer';
import User from '@/models/User';
import OpenAI from 'openai';
import sharp from 'sharp';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  // Add CORS headers for Chrome extension support
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  };

  let pluginAnswer = null;
  const startTime = Date.now();

  try {
    const uploadId = Math.random().toString(36).substr(2, 6);
    console.log(`[PLUGIN-UPLOAD] ${uploadId}: Starting upload`);
    
    // Connect to database
    await dbConnect();
    
    // Get session for authentication (required)
    const session = await getServerSession(authOptions);
    
    // Check if user is logged in
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to use this service.' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Find user and check credits
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please contact support.' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if user has sufficient credits
    if (!user.credits || user.credits <= 0) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits. You need at least 1 credit to use this service.',
          creditsRemaining: user.credits || 0
        },
        { status: 402, headers: corsHeaders }
      );
    }

    // Deduct one credit from user
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { credits: -1 } },
      { new: true }
    );

    console.log(`[PLUGIN-UPLOAD] ${uploadId}: Credit deducted. User ${user.email} has ${updatedUser.credits} credits remaining`);
    
    // Get form data from request
    const formData = await request.formData();
    const file = formData.get('image');

    if (!file || typeof file === 'string') {
      // Refund the credit if no image is provided
      await User.findByIdAndUpdate(user._id, { $inc: { credits: 1 } });
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`[PLUGIN-UPLOAD] ${uploadId}: ${file.name} (${(file.size/1024/1024).toFixed(2)}MB)`);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);

    // Get file extension from the original filename or mime type
    let fileExtension = '';
    if (file.name && file.name.includes('.')) {
      fileExtension = file.name.split('.').pop().toLowerCase();
    } else {
      // Fallback to mime type
      const mimeTypeMap = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/bmp': 'bmp',
        'image/tiff': 'tiff'
      };
      fileExtension = mimeTypeMap[file.type] || 'jpg';
    }

    // Removed verbose logging

    // Optimize image using Sharp if it's too large
    let metadata = null;
    try {
      metadata = await sharp(buffer).metadata();

      // Resize if image is too large (max 2048px on longest side)
      if (metadata.width > 2048 || metadata.height > 2048) {
        console.log(`[PLUGIN-UPLOAD] ${uploadId}: Resizing ${metadata.width}x${metadata.height}`);
        buffer = await sharp(buffer)
          .resize(2048, 2048, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .jpeg({ quality: 85 })
          .toBuffer();
        fileExtension = 'jpg'; // Convert to JPG after processing
      } else if (buffer.length > 5 * 1024 * 1024) { // If larger than 5MB
        console.log(`[PLUGIN-UPLOAD] ${uploadId}: Compressing ${(buffer.length/1024/1024).toFixed(2)}MB file`);
        buffer = await sharp(buffer)
          .jpeg({ quality: 80 })
          .toBuffer();
        fileExtension = 'jpg'; // Convert to JPG after processing
      }
    } catch (sharpError) {
      console.warn(`[PLUGIN-UPLOAD] ${uploadId}: Sharp failed, using original`);
      metadata = null;
    }

    // Generate unique filename with proper extension
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `plugin-${timestamp}-${randomString}.${fileExtension}`;

    // Generated filename

    // Determine content type
    const getContentType = (ext) => {
      const contentTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'bmp': 'image/bmp',
        'tiff': 'image/tiff'
      };
      return contentTypes[ext.toLowerCase()] || 'image/jpeg';
    };

    // Upload to S3
    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: getContentType(fileExtension),
      CacheControl: 'max-age=31536000', // Cache for 1 year
      Metadata: {
        'uploaded-by': session?.user?.email || 'anonymous',
        'upload-timestamp': timestamp.toString(),
        'original-filename': file.name || 'unknown',
        'upload-type': 'plugin'
      }
    };

    console.log(`[PLUGIN-UPLOAD] ${uploadId}: Uploading to S3`);

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Construct the public S3 URL
    const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    // Create initial plugin answer record
    const userId = user._id;
    
    pluginAnswer = new PluginAnswer({
      userId: userId,
      imageUrl: imageUrl,
      imageId: fileName,
      status: 'processing'
    });

    await pluginAnswer.save();
    console.log(`[PLUGIN-UPLOAD] ${uploadId}: Created record ${pluginAnswer._id.toString().slice(-8)}`);

    // Return the answer link immediately
    const answerId = pluginAnswer._id.toString();
    const answerUrl = `/answers/${answerId}`;
    
    console.log(`[PLUGIN-UPLOAD] ${uploadId}: Returning immediate response, AI processing started`);

    // Start OpenAI processing in the background (don't await)
    processImageWithOpenAI(uploadId, pluginAnswer._id, buffer, getContentType(fileExtension), metadata, fileExtension, startTime)
      .catch(error => {
        console.error(`[PLUGIN-UPLOAD] ${uploadId}: AI processing failed - ${error.message}`);
        updatePluginAnswerWithError(pluginAnswer._id, error.message);
      });

    return NextResponse.json({
      success: true,
      answerId: answerId,
      imageUrl: imageUrl,
      status: 'processing',
      redirectUrl: answerUrl,
      message: 'Image uploaded successfully. Processing in progress...',
      creditsRemaining: updatedUser.credits
    }, {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error(`[PLUGIN-UPLOAD] Error: ${error.message}`);
    
    // Update plugin answer with error if it exists (only for upload/creation errors)
    if (pluginAnswer) {
      try {
        await updatePluginAnswerWithError(pluginAnswer._id, error.message);
      } catch (updateError) {
        console.error('Failed to update plugin answer with error:', updateError);
      }
    }
    
    // More specific error messages
    if (error.name === 'CredentialsError') {
      return NextResponse.json(
        { error: 'AWS credentials not configured properly' },
        { status: 500, headers: corsHeaders }
      );
    } else if (error.name === 'NoSuchBucket') {
      return NextResponse.json(
        { error: 'S3 bucket not found' },
        { status: 500, headers: corsHeaders }
      );
    } else if (error.message?.includes('OpenAI')) {
      return NextResponse.json(
        { error: 'AI processing failed: ' + error.message },
        { status: 500, headers: corsHeaders }
      );
    } else {
      return NextResponse.json(
        { error: 'Processing failed: ' + error.message },
        { status: 500, headers: corsHeaders }
      );
    }
  }
}

// Background processing function for OpenAI
async function processImageWithOpenAI(uploadId, pluginAnswerId, buffer, mimeType, metadata, fileExtension, startTime) {
  try {
    console.log(`[PLUGIN-AI] ${uploadId}: Starting AI analysis`);
    
    // Convert image to base64 for OpenAI
    const base64Image = buffer.toString('base64');

    // Sending to OpenAI

    // Send to OpenAI for question solving
    const response = await openai.chat.completions.create({
      model: "o4-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please analyze this image and solve any mathematical or academic question you find. 

Instructions:
1. Provide a detailed step-by-step solution for the provided question.
2. Provide clear explanations for each step
3. Include the final answer using \\boxed{} notation: \\boxed{answer}
4. If you cannot identify a clear question, describe what you see and provide relevant educational insights
5. Make sure the user is able to understand and interpret the solution.
6. If the question is multiple choice, provide the correct answer and the explanation for why it is the correct answer.
7. Keep the answer short and concise but provide a detailed explanation for the answer.
8. Use LaTeX notation for mathematical expressions:
   - For inline math, use \\( and \\) like: \\( f(x) = x^2 \\)
   - For display math, use \\[ and \\] like: \\[ \\int_0^1 x^2 dx = \\frac{1}{3} \\]
9. Do not use any *** or ** ### type of formating in response

Please provide your response in the following format:

Solution:
[Provide step-by-step solution]

Answer: [Final answer]

If there are multiple questions, repeat this format for each question.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
    });

    if (!response.choices || !response.choices[0] || !response.choices[0].message) {
      throw new Error("No response from OpenAI");
    }

    const aiAnswer = response.choices[0].message.content;
    const processingTime = Date.now() - startTime;

    // Extract question from the AI response (look for **Question:** pattern)
    const questionMatch = aiAnswer.match(/\*\*Question:\*\*\s*(.*?)(?=\n\*\*|$)/s);
    const extractedQuestion = questionMatch ? questionMatch[1].trim() : 'Question extracted from image';

    // Connect to database for background update
    await dbConnect();

    // Update plugin answer with results
    const updatedAnswer = await PluginAnswer.findByIdAndUpdate(
      pluginAnswerId,
      {
        question: extractedQuestion,
        answer: aiAnswer,
        status: 'completed',
        metadata: {
          processing_time: processingTime,
          model_used: 'o4-mini',
          confidence: 0.9,
          image_analysis: {
            file_size: buffer.length,
            dimensions: metadata ? `${metadata.width}x${metadata.height}` : 'unknown',
            format: fileExtension
          }
        },
        updatedAt: new Date()
      },
      { new: true }
    );

    console.log(`[PLUGIN-AI] ${uploadId}: Completed in ${(processingTime/1000).toFixed(1)}s`);
    return updatedAnswer;

  } catch (error) {
    console.error(`[PLUGIN-AI] ${uploadId}: Error - ${error.message}`);
    throw error;
  }
}

// Helper function to update plugin answer with error
async function updatePluginAnswerWithError(pluginAnswerId, errorMessage) {
  try {
    await dbConnect();
    await PluginAnswer.findByIdAndUpdate(
      pluginAnswerId,
      {
        status: 'failed',
        error_message: errorMessage,
        updatedAt: new Date()
      }
    );
    console.log(`[PLUGIN-ERROR] Updated record ${pluginAnswerId.toString().slice(-8)} with error`);
  } catch (updateError) {
    console.error('Failed to update plugin answer with error:', updateError);
  }
}

// Add OPTIONS handler for preflight requests
export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
} 