import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import ChatbotSession from '@/models/ChatbotSession';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    await dbConnect();
    
    const jsonData = await request.json();
    
    // Validate the required fields
    if (!jsonData || !jsonData.questions || !jsonData.options || 
        !jsonData.correct_answers || !jsonData.hint1 || !jsonData.hint2 ||
        !jsonData.explanations || !jsonData.conceptual_explanation || !jsonData.concept_tags) {
      return NextResponse.json(
        { error: 'Invalid JSON data. Missing required fields: questions, options, correct_answers, hint1, hint2, explanations, conceptual_explanation, concept_tags' },
        { status: 400 }
      );
    }
    
    // Validate array lengths match
    const numQuestions = jsonData.questions.length;
    if (jsonData.options.length !== numQuestions ||
        jsonData.correct_answers.length !== numQuestions ||
        jsonData.hint1.length !== numQuestions ||
        jsonData.hint2.length !== numQuestions ||
        jsonData.explanations.length !== numQuestions ||
        jsonData.conceptual_explanation.length !== numQuestions ||
        jsonData.concept_tags.length !== numQuestions) {
      return NextResponse.json(
        { error: 'All arrays must have the same length as questions array' },
        { status: 400 }
      );
    }
    
    // Validate options format (each question should have 4 options)
    for (let i = 0; i < jsonData.options.length; i++) {
      if (!Array.isArray(jsonData.options[i]) || jsonData.options[i].length !== 4) {
        return NextResponse.json(
          { error: `Question ${i + 1} must have exactly 4 options` },
          { status: 400 }
        );
      }
    }
    
    // Validate correct answers are within range (0-3)
    for (let i = 0; i < jsonData.correct_answers.length; i++) {
      const answer = jsonData.correct_answers[i];
      if (typeof answer !== 'number' || answer < 0 || answer > 3) {
        return NextResponse.json(
          { error: `Correct answer for question ${i + 1} must be a number between 0 and 3` },
          { status: 400 }
        );
      }
    }
    
    // Generate a unique session ID
    const sessionId = uuidv4();
    
    // Create new session in database
    const session = new ChatbotSession({
      sessionId,
      jsonData,
    });
    
    await session.save();
    
    // Return the chatbot link
    const chatbotLink = `/learnbot?id=${sessionId}`;
    
    return NextResponse.json({
      success: true,
      sessionId,
      chatbotLink,
      message: 'JSON data uploaded successfully'
    });
    
  } catch (error) {
    console.error('Error uploading JSON:', error);
    return NextResponse.json(
      { error: 'Failed to upload JSON data' },
      { status: 500 }
    );
  }
} 