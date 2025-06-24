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
    console.log('Plugin Upload API: Starting process');
    
    // Connect to database
    await dbConnect();
    
    // Get session for authentication (optional)
    const session = await getServerSession(authOptions);
    
    // Get form data from request
    const formData = await request.formData();
    const file = formData.get('image');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    console.log('Plugin Upload API: Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);

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

    console.log('Plugin Upload API: Determined file extension:', fileExtension);

    // Optimize image using Sharp if it's too large
    let metadata = null;
    try {
      metadata = await sharp(buffer).metadata();
      console.log('Plugin Upload API: Original image metadata:', metadata);

      // Resize if image is too large (max 2048px on longest side)
      if (metadata.width > 2048 || metadata.height > 2048) {
        console.log('Plugin Upload API: Resizing large image');
        buffer = await sharp(buffer)
          .resize(2048, 2048, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .jpeg({ quality: 85 })
          .toBuffer();
        fileExtension = 'jpg'; // Convert to JPG after processing
      } else if (buffer.length > 5 * 1024 * 1024) { // If larger than 5MB
        console.log('Plugin Upload API: Compressing large file');
        buffer = await sharp(buffer)
          .jpeg({ quality: 80 })
          .toBuffer();
        fileExtension = 'jpg'; // Convert to JPG after processing
      }
    } catch (sharpError) {
      console.warn('Plugin Upload API: Sharp processing failed, using original:', sharpError.message);
      // Continue with original buffer if Sharp fails
      metadata = null;
    }

    // Generate unique filename with proper extension
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `plugin-${timestamp}-${randomString}.${fileExtension}`;

    console.log('Plugin Upload API: Generated filename:', fileName);

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

    console.log('Plugin Upload API: Uploading to S3');

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Construct the public S3 URL
    const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    
    console.log('Plugin Upload API: Upload successful, URL:', imageUrl);

    // Create initial plugin answer record
    let userId = null;
    if (session?.user?.email) {
      const user = await User.findOne({ email: session.user.email });
      userId = user ? user._id : null;
    }
    
    pluginAnswer = new PluginAnswer({
      userId: userId,
      imageUrl: imageUrl,
      imageId: fileName,
      status: 'processing'
    });

    await pluginAnswer.save();
    console.log('Plugin Upload API: Created plugin answer record:', pluginAnswer._id);

    // Return the answer link immediately
    const answerId = pluginAnswer._id.toString();
    const answerUrl = `/answers/${answerId}`;
    
    console.log('Plugin Upload API: Returning immediate response, processing in background');

    // Start OpenAI processing in the background (don't await)
    processImageWithOpenAI(pluginAnswer._id, buffer, getContentType(fileExtension), metadata, fileExtension, startTime)
      .catch(error => {
        console.error('Background OpenAI processing failed:', error);
        // Update the record with error status
        updatePluginAnswerWithError(pluginAnswer._id, error.message);
      });

    return NextResponse.json({
      success: true,
      answerId: answerId,
      imageUrl: imageUrl,
      status: 'processing',
      redirectUrl: answerUrl,
      message: 'Image uploaded successfully. Processing in progress...'
    }, {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Plugin Upload API: Error during process:', error);
    
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
async function processImageWithOpenAI(pluginAnswerId, buffer, mimeType, metadata, fileExtension, startTime) {
  try {
    console.log('Background OpenAI processing started for:', pluginAnswerId);
    
    // Convert image to base64 for OpenAI
    const base64Image = buffer.toString('base64');

    console.log('Sending to OpenAI for analysis');

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
1. First, identify and extract the question from the image
2. Provide a detailed step-by-step solution 
3. Include all mathematical reasoning and calculations
4. Use LaTeX notation for mathematical expressions:
   - For inline math, use \\( and \\) like: \\( f(x) = x^2 \\)
   - For display math, use \\[ and \\] like: \\[ \\int_0^1 x^2 dx = \\frac{1}{3} \\]
5. Provide clear explanations for each step
6. Include the final answer using \\boxed{} notation: \\boxed{answer}
7. If you cannot identify a clear question, describe what you see and provide relevant educational insights
8. Do not use any *** or ** ### type of formating in response

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

    console.log('Background OpenAI processing completed for:', pluginAnswerId);
    return updatedAnswer;

  } catch (error) {
    console.error('OpenAI processing error:', error);
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
    console.log('Updated plugin answer with error status:', pluginAnswerId);
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