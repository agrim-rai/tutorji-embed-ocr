import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Breakdown from '@/models/breakdown';

export async function POST(request: Request) {
  try {
    // Connect to database
    await dbConnect();

    // Parse the request body
    const body = await request.json();
    const { useremail, imageurl, jsonoutput } = body;

    // Validate required fields
    if (!useremail || !imageurl || !jsonoutput) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new breakdown document
    const breakdown = await Breakdown.create({
      useremail,
      imageurl,
      jsonoutput
    });

    return NextResponse.json(
      { message: 'Breakdown stored successfully', data: breakdown },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error storing breakdown:', error);
    return NextResponse.json(
      { error: 'Failed to store breakdown' },
      { status: 500 }
    );
  }
}
