/**
 * Question History API Route
 * 
 * This endpoint provides access to a user's historical questions and answers.
 * It allows retrieving the complete history of AI interactions for a logged-in user.
 * 
 * Features:
 * - User authentication and session validation
 * - Secure access to only the user's own history
 * - Sorted results with newest questions first
 * - Field selection to optimize response size
 * - Proper error handling for various scenarios
 * 
 * @route GET /api/history
 * @access Private - Requires user authentication
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import AIResponse from '@/models/AIResponse';
import { authOptions } from '@/lib/auth';

/**
 * GET handler for question history
 * 
 * Retrieves the authenticated user's question history from the database,
 * ordered by creation date (newest first).
 * 
 * @param {Request} req - The incoming request
 * @returns {Promise<NextResponse>} JSON response with the user's question history
 */
export async function GET(req) {
  try {
    console.log('History API: Starting execution');
    
    // Establish database connection
    try {
      console.log('History API: Attempting to connect to MongoDB');
      await dbConnect();
      console.log('History API: Successfully connected to MongoDB');
    } catch (dbError) {
      console.error('History API: MongoDB connection error:', dbError);
      return NextResponse.json(
        { error: 'Database connection error: ' + (dbError.message || 'Failed to connect to database') },
        { status: 500 }
      );
    }

    // Verify user authentication via NextAuth session
    try {
      console.log('History API: Verifying user session');
      const session = await getServerSession(authOptions);
      console.log('History API: Session data:', session ? 'Session exists' : 'No session');
      
      // Ensure user is authenticated
      if (!session || !session.user || !session.user.email) {
        console.log('History API: User not authenticated');
        return NextResponse.json(
          { error: 'Unauthorized: You must be logged in to view history' }, 
          { status: 401 }
        );
      }

      // Find the user record from the database
      console.log('History API: Looking up user with email:', session.user.email);
      const user = await User.findOne({ email: session.user.email });
      
      // Handle case where user is not found in database
      if (!user) {
        console.log('History API: User not found in database');
        return NextResponse.json(
          { error: 'User not found' }, 
          { status: 404 }
        );
      }
      console.log('History API: Found user with ID:', user._id);

      // Retrieve user's question history from AIResponse collection
      console.log('History API: Fetching responses for user ID:', user._id);
      const responses = await AIResponse.find({ userId: user._id })
        .sort({ createdAt: -1 }) // Descending order by creation date
        .select('question answer heading createdAt imageUrl') // Add heading and imageUrl to returned fields
        .lean(); // Convert to plain JS object for better performance
      
      console.log('History API: Found', responses.length, 'responses');

      // Return the formatted history data
      return NextResponse.json({
        success: true,
        history: responses
      });
    } catch (sessionError) {
      console.error('History API: Session verification error:', sessionError);
      return NextResponse.json(
        { error: 'Authentication error: ' + (sessionError.message || 'Failed to verify user session') },
        { status: 500 }
      );
    }
    
  } catch (error) {
    // Handle any errors during processing
    console.error('History API: Unhandled error:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch history: ' + (error.message || 'Unknown database error') },
      { status: 500 }
    );
  }
} 