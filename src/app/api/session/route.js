import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import ChatbotSession from '@/models/ChatbotSession';

export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    // Find session by ID
    const session = await ChatbotSession.findOne({ sessionId: id });
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      sessionId: session.sessionId,
      jsonData: session.jsonData,
      createdAt: session.createdAt
    });
    
  } catch (error) {
    console.error('Error retrieving session:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session data' },
      { status: 500 }
    );
  }
} 