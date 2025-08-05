import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import PluginAnswer from '@/models/PluginAnswer';

export async function POST(request) {
  // Add CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  };

  try {
    // Connect to database
    await dbConnect();
    
    // Get session for authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.email) {
      return new Response(
        JSON.stringify({ error: 'Authentication required. Please log in to use this service.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find user and check credits
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found. Please contact support.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has sufficient credits
    if (!user.credits || user.credits <= 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient credits. You need at least 1 credit to use this service.',
          creditsRemaining: user.credits || 0
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request data
    const { imageBase64, imageUrl, answerId } = await request.json();
    
    if (!imageBase64 && !imageUrl) {
      return new Response(
        JSON.stringify({ error: 'No image data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Deduct one credit from user
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { credits: -1 } },
      { new: true }
    );

    console.log(`[PLUGIN-STREAM]: Credit deducted. User ${user.email} has ${updatedUser.credits} credits remaining`);

    // Create or update plugin answer record if answerId is provided
    if (answerId) {
      await PluginAnswer.findByIdAndUpdate(
        answerId,
        { status: 'streaming', updatedAt: new Date() }
      );
    }

    // Prepare image URL for OpenAI
    const imageUrlForAI = imageBase64 
      ? `data:image/jpeg;base64,${imageBase64}`
      : imageUrl;

    console.log(`[PLUGIN-STREAM]: Starting streaming for user ${user.email}, answerId: ${answerId || 'N/A'}`);

    // Stream text using Vercel AI SDK with error handling
    const result = streamText({
      model: openai('o4-mini'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Please analyze this image and solve any mathematical or academic question you find. 

Instructions:
1. Provide a detailed step-by-step solution for the provided question.
2. Provide clear explanations for each step
3. Include the final answer using \\boxed{} notation: \\boxed{answer}
4. If you cannot identify a clear question, describe what you see and provide relevant educational insights
5. Make sure the user is able to understand and interpret the solution.
6. If the question is multiple choice, provide the correct answer and the explanation for why it is the correct answer.
7. Keep the answer short and concise but provide a detailed explanation for the answer.
8. Use LaTeX notation for mathematical expressions:
   - For inline math, use \\( and \\) like: \\( f(x) = x^2 \\)
   - For display math, use \\[ and \\] like: \\[ \\int_0^1 x^2 dx = \\frac{1}{3} \\]
9. Do not use any *** or ** ### type of formating in response

Please provide your response in the following format:

Solution:
[Provide step-by-step solution]

Answer: [Final answer]

If there are multiple questions, repeat this format for each question.`
            },
            {
              type: 'image',
              image: imageUrlForAI,
            }
          ]
        }
      ],
      onFinish: async (result) => {
        // Update plugin answer record when streaming is complete
        if (answerId) {
          try {
            await dbConnect(); // Ensure connection is still active
            await PluginAnswer.findByIdAndUpdate(
              answerId,
              {
                answer: result.text,
                status: 'completed',
                metadata: {
                  model_used: 'o4-mini',
                  streaming: true,
                  finishReason: result.finishReason,
                  usage: result.usage
                },
                updatedAt: new Date()
              }
            );
            console.log(`[PLUGIN-STREAM]: Updated answer record ${answerId}`);
          } catch (error) {
            console.error(`[PLUGIN-STREAM]: Failed to update answer record: ${error.message}`);
          }
        }
      }
    });

    // Return the streaming response
    return result.toDataStreamResponse({
      headers: corsHeaders
    });

  } catch (error) {
    console.error(`[PLUGIN-STREAM]: Error: ${error.message}`);
    
    return new Response(
      JSON.stringify({ error: 'Streaming failed: ' + error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Add OPTIONS handler for preflight requests
export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
} 