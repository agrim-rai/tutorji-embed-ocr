import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Summary from '@/models/summary';
import Breakdown from '@/models/breakdown';
import Share from '@/models/share';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, userEmail } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Image URL is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Fetch the latest summary and breakdown for this image
    let summaryData = null;
    let breakdownData = null;

    if (userEmail) {
      // Try to find summary data
      const summaryRecord = await Summary.findOne({
        useremail: userEmail,
        imageurl: imageUrl
      }).sort({ createdAt: -1 }).limit(1);

      if (summaryRecord) {
        summaryData = summaryRecord.jsonoutput;
      }

      // Try to find breakdown data
      const breakdownRecord = await Breakdown.findOne({
        useremail: userEmail,
        imageurl: imageUrl
      }).sort({ createdAt: -1 }).limit(1);

      if (breakdownRecord) {
        breakdownData = breakdownRecord.jsonoutput;
      }
    }

    // Generate unique share ID
    const shareId = nanoid(12); // 12 character unique ID

    // Create share record
    const shareRecord = new Share({
      shareId,
      imageUrl,
      summaryData,
      breakdownData,
      originalUserEmail: userEmail || null
    });

    await shareRecord.save();

    return NextResponse.json({
      success: true,
      shareId,
      shareUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/share/${shareId}`
    });

  } catch (error) {
    console.error('Error creating share:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create share link' },
      { status: 500 }
    );
  }
} 