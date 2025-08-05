import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export async function POST(request) {
  try {
    const { message } = await request.json();

    console.log('[TEST-STREAM]: Starting test stream with message:', message);

    const result = streamText({
      model: openai('gpt-4o-mini'),
      maxTokens: 100,
      messages: [
        {
          role: 'user',
          content: message || 'Count from 1 to 10, explaining each number.'
        }
      ]
    });

    console.log('[TEST-STREAM]: Streaming response created');
    
    return result.toDataStreamResponse();

  } catch (error) {
    console.error('[TEST-STREAM]: Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 