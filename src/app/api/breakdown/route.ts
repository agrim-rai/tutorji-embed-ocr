import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { problem, type, stepContext, imageData } = await request.json();

    let prompt = '';
    let messages: any[] = [];
    
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
      model: "gpt-4o-mini",
      messages: messages,
      max_tokens: type === 'summary' ? 200 : type === 'theory' ? 400 : 1000,
      temperature: 0.3,
    });

    const content = completion.choices[0].message.content;

    return NextResponse.json({ 
      success: true, 
      content: content,
      type: type 
    });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 