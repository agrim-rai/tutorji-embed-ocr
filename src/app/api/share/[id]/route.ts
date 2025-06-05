import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Share from '@/models/share';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shareId } = await params;

    if (!shareId) {
      return NextResponse.json(
        { success: false, error: 'Share ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the share record
    const shareRecord = await Share.findOne({ shareId });

    if (!shareRecord) {
      return NextResponse.json(
        { success: false, error: 'Share not found or expired' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: shareRecord.imageUrl,
        summaryData: shareRecord.summaryData,
        breakdownData: shareRecord.breakdownData,
        createdAt: shareRecord.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching share:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch share data' },
      { status: 500 }
    );
  }
} 