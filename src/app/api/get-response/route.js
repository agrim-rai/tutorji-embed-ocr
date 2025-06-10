import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import AIResponse from '@/models/AIResponse';

/**
 * API Route to fetch AI response data by imageUrl
 * This is used by the bot page to retrieve question context without passing large data in URL
 * Also used by the shareask page which doesn't require authentication
 */
export async function GET(req) {
  try {
    console.log('Get Response API: Starting execution');
    
    // Connect to database
    await dbConnect();
    console.log('Get Response API: Connected to MongoDB');
    
    // Get imageUrl from query parameters
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get('imageUrl');
    
    // Check if the request is from the shareask page
    // Use multiple methods to determine the source
    const referer = req.headers.get('referer') || '';
    const origin = req.headers.get('origin') || '';
    const fromParam = searchParams.get('from') || '';
    
    // Consider it a shareask page if any of these conditions are true
    const isShareAskPage = referer.includes('/shareask') || 
                          origin.includes('/shareask') || 
                          fromParam === 'shareask';
    
    // Only require authentication for non-shareask pages (like bot page)
    if (!isShareAskPage) {
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
    }
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'ImageUrl parameter is required' },
        { status: 400 }
      );
    }
    
    console.log('Get Response API: Looking for image with URL:', imageUrl);
    
    // First try to find by exact imageUrl
    let aiResponse = await AIResponse.findOne({ 
      imageUrl: imageUrl 
    }).sort({ createdAt: -1 });
    
    // If not found, try with common image extensions
    if (!aiResponse) {
      const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      
      for (const ext of extensions) {
        aiResponse = await AIResponse.findOne({
          imageUrl: imageUrl + ext
        }).sort({ createdAt: -1 });
        
        if (aiResponse) break;
      }
    }
    
    if (!aiResponse) {
      console.log('Get Response API: No AI response found for imageUrl:', imageUrl);
      return NextResponse.json(
        { error: 'No response found for the provided image' },
        { status: 404 }
      );
    }
    
    console.log('Get Response API: Found AI response:', aiResponse._id);
    
    // Return the response data
    return NextResponse.json({
      success: true,
      data: {
        question: aiResponse.question,
        answer: aiResponse.answer,
        heading: aiResponse.heading,
        imageId: aiResponse.imageId,
        imageUrl: aiResponse.imageUrl,
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