import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  let model = '';
  let requestType = '';
  
  try {
    const { problem, type, stepContext, imageData } = await request.json();
    requestType = type;

    console.log(`[Breakdown API] Request type: ${type}, has imageData: ${!!imageData}, has stepContext: ${!!stepContext}`);

    let prompt = '';
    let messages: any[] = [];
    
    // Choose model based on request type
    if (type === 'summary' || type === 'theory') {
      model = "gpt-4o-mini"; // Use gpt-4o-mini for theory and summary
    } else if (type === 'main' || type === 'sub') {
      model = "o4-mini"; // Use o1-mini for breakdown (main and sub steps)
    }

    console.log(`[Breakdown API] Using model: ${model} for type: ${type}`);
    
    if (type === 'summary') {
      if (imageData) {
        prompt = `Analyze this image and provide a brief 1-2 line summary of the question/problem shown. The summary should include:
1. What type of problem/question this is
2. Key mathematical concepts or topics involved

End with exactly this phrase: "Here is a step by step solution for the problem followed by interactive bot to solve it"
Keep it concise, professional, and informative. Use LaTeX notation for any mathematical expressions: \\( \\) for inline math.`;
        
        messages = [
          {
            role: "system",
            content: "You are a helpful math tutor. Provide concise, professional summaries. Use LaTeX notation: \\( \\) for inline math."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ];
      } else {
        prompt = `Provide a brief 1-2 line summary of the following problem. The summary should include:
1. What type of problem/question this is
2. Key mathematical concepts or topics involved

End with exactly this phrase: "Here is a step by step solution for the problem followed by interactive bot to solve it"

Problem: ${problem}

Keep it concise, professional, and informative. Use LaTeX notation for any mathematical expressions: \\( \\) for inline math.`;
        
        messages = [
          {
            role: "system",
            content: "You are a helpful math tutor. Provide concise, professional summaries. Use LaTeX notation: \\( \\) for inline math."
          },
          {
            role: "user",
            content: prompt
          }
        ];
      }
    } else if (type === 'main') {
      if (imageData) {
        prompt = `Analyze this image and break down the problem or task shown into exactly 5-6 main steps. Each step should be clear and actionable. Format each step as "Step X: [description]" where each step builds logically on the previous ones.

For mathematical expressions, use LaTeX notation:
- For inline math, use \\( and \\) like: \\( x^2 + 2x + 1 \\)
- For display math, use \\[ and \\] like: \\[ f(x) = \\int_0^x t^2 dt \\]

Please provide only the numbered steps, nothing else.`;
        
        messages = [
          {
            role: "system",
            content: "You are a helpful math tutor. Use LaTeX notation: \\( \\) for inline math and \\[ \\] for display equations."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ];
      } else {
        prompt = `Break down the following problem into exactly 5-6 main steps. Each step should be clear and actionable. Format each step as "Step X: [description]" where each step builds logically on the previous ones.

For mathematical expressions, use LaTeX notation:
- For inline math, use \\( and \\) like: \\( x^2 + 2x + 1 \\)
- For display math, use \\[ and \\] like: \\[ f(x) = \\int_0^x t^2 dt \\]

Problem: ${problem}

Please provide only the numbered steps, nothing else.`;
        
        messages = [
          {
            role: "system",
            content: "You are a helpful math tutor. Use LaTeX notation: \\( \\) for inline math and \\[ \\] for display equations."
          },
          {
            role: "user",
            content: prompt
          }
        ];
      }
    } else if (type === 'sub') {
      prompt = `For the following step: "${stepContext}", break it down into exactly 2-3 detailed sub-steps. Each sub-step should be specific and actionable. Format as "Sub-step X.Y: [description]".

For mathematical expressions, use LaTeX notation:
- For inline math, use \\( and \\) like: \\( \\frac{d}{dx}[f(x)] \\)
- For display math, use \\[ and \\] like: \\[ \\int_0^1 x^2 dx = \\frac{1}{3} \\]

Original step: ${stepContext}

Please provide only the numbered sub-steps, nothing else.`;
      
      messages = [
        {
          role: "system",
          content: "You are a helpful math tutor. Use LaTeX notation: \\( \\) for inline math and \\[ \\] for display equations."
        },
        {
          role: "user",
          content: prompt
        }
      ];
    } else if (type === 'theory') {
      prompt = `For the following sub-step: "${stepContext}", provide a concise, practical explanation focused on solving the problem. Keep it brief (3-4 sentences max) and focus on:
- Key concept or principle
- Why this step is important  
- Practical tip or formula if applicable

For mathematical expressions, use LaTeX notation:
- For inline math, use \\( and \\) like: \\( f'(x) = 2x \\)
- For display math, use \\[ and \\] like: \\[ \\int x^n dx = \\frac{x^{n+1}}{n+1} + C \\]

Sub-step: ${stepContext}

Provide only the concise explanation, nothing else.`;
      
      messages = [
        {
          role: "system",
          content: "You are a helpful math tutor. Use LaTeX notation: \\( \\) for inline math and \\[ \\] for display equations."
        },
        {
          role: "user",
          content: prompt
        }
      ];
    }

    const completion = await openai.chat.completions.create({
      model: model,
      messages: messages,
      ...(model === "o4-mini" ? {
        max_completion_tokens: type === 'summary' ? 200 : type === 'theory' ? 400 : 1000
      } : {
        max_tokens: type === 'summary' ? 200 : type === 'theory' ? 400 : 1000,
        temperature: 0.3
      }),
    });

    const content = completion.choices[0].message.content;
    console.log(`[Breakdown API] Success - Model: ${model}, Type: ${type}, Content length: ${content?.length || 0}`);

    return NextResponse.json({ 
      success: true, 
      content: content,
      type: type,
      model: model // Include model name in response for testing
    });
  } catch (error) {
    console.error('[Breakdown API] Error occurred:', error);
    console.log(`[Breakdown API] Error context - Model: ${model}, Type: ${requestType}`);
    
    // Enhanced error handling for model configuration testing
    let errorMessage = 'Failed to process request';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      console.log(`[Breakdown API] Error message: ${errorMessage}`);
      
      // Check for specific OpenAI API errors
      if (error.message.includes('model') || error.message.includes('Model')) {
        errorDetails = `Model configuration error. Attempted to use model: ${model}`;
      } else if (error.message.includes('API key')) {
        errorDetails = 'API key configuration error';
      } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
        errorDetails = 'API quota or rate limit exceeded';
      } else {
        errorDetails = `General API error with model: ${model}`;
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        errorDetails: errorDetails,
        model: model,
        type: requestType,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 