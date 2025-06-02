import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import SharedUpload from '@/models/SharedUpload';
import User from '@/models/User';

/**
 * POST /api/save-upload
 * 
 * Saves uploaded image URL and session ID to database for sharing
 * 
 * Body:
 * {
 *   imageUrl: string,
 *   sessionId: string
 * }
 * 
 * Returns:
 * {
 *   success: true,
 *   id: string,
 *   shareUrl: string
 * }
 */
export async function POST(request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    
    // Parse request body
    const { imageUrl, sessionId } = await request.json();
    
    // Validate required fields
    if (!imageUrl || !sessionId) {
      return NextResponse.json(
        { error: 'imageUrl and sessionId are required' },
        { status: 400 }
      );
    }
    
    // Validate URLs
    try {
      new URL(imageUrl);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid imageUrl format' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await dbConnect();
    
    // Get user ID if authenticated
    let userId = null;
    if (session?.user?.email) {
      const user = await User.findOne({ email: session.user.email });
      userId = user?._id;
    }
    
    // Create shared upload entry
    const sharedUpload = await SharedUpload.create({
      imageUrl,
      sessionId,
      userId,
    });
    
    // Generate share URL
    const shareUrl = `${request.nextUrl.origin}/share/${sharedUpload._id}`;
    
    return NextResponse.json({
      success: true,
      id: sharedUpload._id.toString(),
      shareUrl,
    });
    
  } catch (error) {
    console.error('Error saving upload:', error);
    return NextResponse.json(
      { error: 'Failed to save upload data' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/save-upload?id=<shareId>
 * 
 * Retrieves shared upload data by ID
 * 
 * Returns:
 * {
 *   imageUrl: string,
 *   sessionId: string,
 *   createdAt: string
 * }
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID parameter is required' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await dbConnect();
    
    // Find shared upload by ID
    const sharedUpload = await SharedUpload.findById(id);
    
    if (!sharedUpload) {
      return NextResponse.json(
        { error: 'Shared upload not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      imageUrl: sharedUpload.imageUrl,
      sessionId: sharedUpload.sessionId,
      createdAt: sharedUpload.createdAt,
    });
    
  } catch (error) {
    console.error('Error retrieving shared upload:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve shared upload' },
      { status: 500 }
    );
  }
} 