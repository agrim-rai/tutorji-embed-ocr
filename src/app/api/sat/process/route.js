import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import SatQuestion from '@/models/SatQuestion';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';

// Check if OpenAI API key is available
const hasOpenAIKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10;

/**
 * Generate a mock response for development when OpenAI API key is not available
 */
const generateMockResponse = (questionId) => {
  return `# Mock SAT Question Analysis

## Question Analysis:
This is a mock analysis for SAT question ID: ${questionId}. This mock response is generated because no OpenAI API key is configured.

## Step-by-step Solution:
1. First, we would identify the key components of the question
2. Next, we would apply the relevant mathematical or logical concepts
3. Then, we would work through the steps methodically
4. Finally, we would arrive at the answer

## Final Answer:
The answer would be determined after careful analysis of the question.

Note: This is a development mock response. In production, this would be a detailed AI-generated solution.`;
};

// Initialize OpenAI SDK with API key from environment variables (if available)
let openai;
try {
  openai = hasOpenAIKey ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  }) : null;
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error);
  openai = null;
}

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
    const { questionId } = data;

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

    // If the question already has an AI response, return it
    if (question.aiResponse) {
      return NextResponse.json({
        success: true,
        message: 'AI response already exists',
        aiResponse: question.aiResponse
      });
    }

    // Process the image with AI
    try {
      // Check if OpenAI API is available
      if (!openai) {
        console.log('SAT Process API: No OpenAI API key found, using mock response');
        const mockResponse = generateMockResponse(questionId);
        
        // Save the mock response
        question.aiResponse = mockResponse;
        await question.save();
        
        return NextResponse.json({
          success: true,
          message: 'SAT question processed with mock response',
          aiResponse: mockResponse,
          devFallback: true // Flag indicating this is a development fallback
        });
      }

      // Formulate the prompt for the AI
      const prompt = `Please solve this SAT question. The question is in the image located at: ${question.imageUrl}
      
Analyze the question carefully and provide a comprehensive detailed and exact solution. Structure your response in the following format:
1. Question Analysis: Identify the subject area and key concepts being tested
2. Step-by-step Solution: Break down the problem-solving process
3. Final Answer: Clearly state the answer with explanation

IMPORTANT FORMATTING INSTRUCTIONS:
- DO NOT include introductory phrases like "Sure!" or "Let me solve this"
- DO preserve all LaTeX mathematical notation (keep all math expressions intact)

Make sure to be thorough but concise.`;

      // Call OpenAI API using the current SDK format
      const completion = await openai.chat.completions.create({
        model: "o4-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: question.imageUrl
                }
              }
            ],
          }
        ],
      });

      // Extract AI response
      const aiResponse = completion.choices[0]?.message?.content || "No response generated";

      // Update the question record with AI response
      question.aiResponse = aiResponse;
      await question.save();

      return NextResponse.json({
        success: true,
        message: 'SAT question processed successfully',
        aiResponse
      });

    } catch (aiError) {
      console.error('Error processing image with AI:', aiError);
      
      // Fallback response for development or if AI API fails
      const fallbackResponse = 
        "I apologize, but I couldn't process this SAT question due to a technical issue. " + 
        "This could be because the OpenAI API key is not configured correctly or there was a problem " +
        "with the image processing. Please try again later or contact support.";
      
      // Still save the fallback response
      question.aiResponse = fallbackResponse;
      await question.save();
      
      return NextResponse.json({
        success: false,
        error: 'Failed to process image with AI',
        aiResponse: fallbackResponse
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error processing SAT question:', error);
    return NextResponse.json(
      { error: 'Failed to process SAT question' },
      { status: 500 }
    );
  }
} 