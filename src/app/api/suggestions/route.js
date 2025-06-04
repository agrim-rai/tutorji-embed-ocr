import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Suggestion from '@/models/Suggestion';

// POST /api/suggestions - Create a new suggestion
export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { name, email, topic, message } = body;

    // Basic validation
    if (!name || !email || !topic || !message) {
      return NextResponse.json(
        { error: 'Name, email, topic, and message are required' },
        { status: 400 }
      );
    }

    // Create new suggestion
    const suggestion = new Suggestion({
      name: name.trim(),
      email: email.trim(),
      topic: topic.trim(),
      message: message.trim(),
    });

    await suggestion.save();

    return NextResponse.json(
      { message: 'Suggestion submitted successfully', id: suggestion._id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating suggestion:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/suggestions - Fetch all suggestions
export async function GET() {
  try {
    await dbConnect();
    
    // Fetch all suggestions sorted by creation date (newest first)
    const suggestions = await Suggestion.find({})
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance

    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 