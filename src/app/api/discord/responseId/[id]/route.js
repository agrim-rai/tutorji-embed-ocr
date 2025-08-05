import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Response ID is required' },
        { status: 400 }
      );
    }

    // Construct the S3 URL
    const s3Url = `https://tutorji.s3.us-east-1.amazonaws.com/discord-jsons/${id}.json`;
    
    // Fetch the JSON file from S3
    const response = await fetch(s3Url);
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Discord response not found', responseId: id },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch Discord response', status: response.status },
        { status: 500 }
      );
    }
    
    const jsonData = await response.json();
    
    return NextResponse.json({
      success: true,
      data: jsonData,
      responseId: id
    });
    
  } catch (error) {
    console.error('Error fetching Discord response:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}