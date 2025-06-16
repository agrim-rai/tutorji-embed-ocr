import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongoose';
import OCRRecord from '@/models/OCRRecord';
import { authOptions } from '@/lib/auth';

/**
 * POST handler to link an OCR record with an AI response
 * 
 * @param {Request} req - The incoming request with OCR record ID and AI response ID
 * @returns {Promise<NextResponse>} JSON response indicating success or failure
 */
export async function POST(req) {
  try {
    // Connect to database
    await dbConnect();
    
    // Get session for authentication
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const { ocrRecordId, aiResponseId } = await req.json();
    
    if (!ocrRecordId || !aiResponseId) {
      return NextResponse.json(
        { error: 'OCR record ID and AI response ID are required' },
        { status: 400 }
      );
    }
    
    // Update the OCR record with the AI response ID
    const updatedRecord = await OCRRecord.findByIdAndUpdate(
      ocrRecordId,
      { airesponseID: aiResponseId },
      { new: true }
    );
    
    if (!updatedRecord) {
      return NextResponse.json(
        { error: 'OCR record not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'OCR record linked with AI response successfully'
    });
    
  } catch (error) {
    console.error('Error linking OCR with AI response:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
} 