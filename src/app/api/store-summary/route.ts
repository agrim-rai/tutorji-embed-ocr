import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Summary from '@/models/summary';

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

    // Create new summary document
    const summary = await Summary.create({
      useremail,
      imageurl,
      jsonoutput
    });

    return NextResponse.json(
      { message: 'Summary stored successfully', data: summary },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error storing summary:', error);
    return NextResponse.json(
      { error: 'Failed to store summary' },
      { status: 500 }
    );
  }
}