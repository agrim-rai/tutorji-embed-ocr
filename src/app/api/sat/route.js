import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import SatQuestion from '@/models/SatQuestion';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request data
    const data = await req.json();
    const { questionId, imageId, imageUrl } = data;

    if (!questionId || !imageId || !imageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: questionId, imageId, and imageUrl are required' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Check if question already exists
    const existingQuestion = await SatQuestion.findOne({ questionId });
    if (existingQuestion) {
      return NextResponse.json(
        { error: 'Question with this ID already exists' },
        { status: 409 }
      );
    }

    // Create new question record
    const newQuestion = new SatQuestion({
      questionId,
      imageId,
      imageUrl,
      // Initially empty, will be populated after processing
      aiResponse: '',
      questionText: ''
    });

    await newQuestion.save();

    return NextResponse.json({
      success: true,
      message: 'SAT question registered successfully',
      questionId
    });

  } catch (error) {
    console.error('Error in SAT question registration:', error);
    return NextResponse.json(
      { error: 'Failed to register SAT question' },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const questionId = url.searchParams.get('id');

    if (!questionId) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find the question
    const question = await SatQuestion.findOne({ questionId });
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Return the question data
    return NextResponse.json({
      success: true,
      question: {
        questionId: question.questionId,
        imageUrl: question.imageUrl,
        aiResponse: question.aiResponse,
        questionText: question.questionText
      }
    });

  } catch (error) {
    console.error('Error retrieving SAT question:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve SAT question' },
      { status: 500 }
    );
  }
} 