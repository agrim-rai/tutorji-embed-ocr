import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import AIResponse from '@/models/AIResponse';

/**
 * API Route to fetch AI response data by imageId or imageUrl
 * This is used by the bot page to retrieve question context without passing large data in URL
 */
export async function GET(req) {
  try {
    console.log('Get Response API: Starting execution');
    
    // Connect to database
    await dbConnect();
    console.log('Get Response API: Connected to MongoDB');
    
    // Get session for authentication
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user || !session.user.email) {
      console.log('Get Response API: No authenticated user');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get imageId from query parameters
    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get('imageId');
    
    if (!imageId) {
      return NextResponse.json(
        { error: 'ImageId parameter is required' },
        { status: 400 }
      );
    }
    
    console.log('Get Response API: Looking for imageId:', imageId);
    
    // Helper function to extract imageId from various formats
    const extractImageId = (id) => {
      // If it's already a clean imageId, return as is
      if (!id.includes('/') && !id.includes('.')) {
        return id;
      }
      
      // Extract from S3 URL: https://tutorji.s3.us-east-1.amazonaws.com/uploads/MRw5FZHLtsOUK0hNNmaEl.jpg
      const s3UrlMatch = id.match(/\/([^\/]+)\.(jpg|jpeg|png|gif|webp)$/i);
      if (s3UrlMatch) {
        return s3UrlMatch[1];
      }
      
      // Extract from filename with extension: MRw5FZHLtsOUK0hNNmaEl.jpg
      const filenameMatch = id.match(/^([^.]+)\.(jpg|jpeg|png|gif|webp)$/i);
      if (filenameMatch) {
        return filenameMatch[1];
      }
      
      return id;
    };
    
    const cleanImageId = extractImageId(imageId);
    console.log('Get Response API: Cleaned imageId:', cleanImageId);
    
    // First try to find by imageId directly
    let aiResponse = await AIResponse.findOne({ 
      imageId: cleanImageId 
    }).sort({ createdAt: -1 }); // Get most recent if multiple exist
    
    // If not found by exact imageId, try to find by imageUrl containing the imageId
    if (!aiResponse) {
      aiResponse = await AIResponse.findOne({
        imageUrl: { $regex: cleanImageId, $options: 'i' }
      }).sort({ createdAt: -1 });
    }
    
    // If still not found, try the original imageId
    if (!aiResponse && cleanImageId !== imageId) {
      aiResponse = await AIResponse.findOne({
        $or: [
          { imageId: imageId },
          { imageUrl: { $regex: imageId, $options: 'i' } }
        ]
      }).sort({ createdAt: -1 });
    }
    
    if (!aiResponse) {
      console.log('Get Response API: No AI response found for imageId:', imageId);
      return NextResponse.json(
        { error: 'No response found for the provided imageId' },
        { status: 404 }
      );
    }
    
    console.log('Get Response API: Found AI response:', aiResponse._id);
    
    // Construct the S3 URL if we have imageId but no imageUrl
    let imageUrl = aiResponse.imageUrl;
    if (!imageUrl && aiResponse.imageId) {
      const bucketName = process.env.S3_BUCKET_NAME;
      const region = process.env.AWS_REGION;
      
      if (bucketName && region) {
        imageUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${aiResponse.imageId}`;
      }
    }
    
    // Return the response data
    return NextResponse.json({
      success: true,
      data: {
        question: aiResponse.question,
        answer: aiResponse.answer,
        heading: aiResponse.heading,
        imageId: aiResponse.imageId,
        imageUrl: imageUrl,
        createdAt: aiResponse.createdAt
      }
    });
    
  } catch (error) {
    console.error('Get Response API: Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch response data: ' + error.message },
      { status: 500 }
    );
  }
} 