import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to clean up and normalize LaTeX formatting
const normalizeLatex = (text: string): string => {
  if (!text) return text;
  
  let cleaned = text
    // Fix common LaTeX delimiter issues - ensure proper spacing
    .replace(/\\\[([^]*?)\\\]/g, '\\[ $1 \\]')  // Ensure spaces around display math
    .replace(/\\\(([^]*?)\\\)/g, '\\( $1 \\)')  // Ensure spaces around inline math
    // Clean up multiple spaces
    .replace(/\\\[\s+/g, '\\[ ')
    .replace(/\s+\\\]/g, ' \\]')
    .replace(/\\\(\s+/g, '\\( ')
    .replace(/\s+\\\)/g, ' \\)');
    
  console.log('Original text:', text);
  console.log('Normalized LaTeX:', cleaned);
  return cleaned;
};

export async function POST(request: NextRequest) {
  try {
    const { problem, type, stepContext, imageData } = await request.json();

    let prompt = '';
    let messages: any[] = [];
    
    if (type === 'main') {
      if (imageData) {
        prompt = `Analyze this image and break down the problem or task shown into exactly 5-6 main steps. Each step should be clear and actionable. Format each step as "Step X: [description]" where each step builds logically on the previous ones.

IMPORTANT: For mathematical expressions, use LaTeX notation:
- For inline math, use \\( ... \\) like: \\( x^2 + 2x + 1 \\)
- For display math, use \\[ ... \\] like: \\[ f(x) = \\int_0^x t^2 dt \\]
- Always wrap variables, equations, and formulas in these delimiters

Please provide only the numbered steps, nothing else.`;
        
        messages = [
          {
            role: "system",
            content: "You are a helpful math tutor. Always use LaTeX notation: \\( \\) for inline math and \\[ \\] for display equations. Wrap all mathematical content properly."
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

IMPORTANT: For mathematical expressions, use LaTeX notation:
- For inline math, use \\( ... \\) like: \\( x^2 + 2x + 1 \\)
- For display math, use \\[ ... \\] like: \\[ f(x) = \\int_0^x t^2 dt \\]
- Always wrap variables, equations, and formulas in these delimiters

Problem: ${problem}

Please provide only the numbered steps, nothing else.`;
        
        messages = [
          {
            role: "system",
            content: "You are a helpful math tutor. Always use LaTeX notation: \\( \\) for inline math and \\[ \\] for display equations. Wrap all mathematical content properly."
          },
          {
            role: "user",
            content: prompt
          }
        ];
      }
    } else if (type === 'sub') {
      prompt = `For the following step: "${stepContext}", break it down into exactly 2-3 detailed sub-steps. Each sub-step should be specific and actionable. Format as "Sub-step X.Y: [description]".

IMPORTANT: For mathematical expressions, use LaTeX notation:
- For inline math, use \\( ... \\) like: \\( \\frac{d}{dx}[f(x)] \\)
- For display math, use \\[ ... \\] like: \\[ \\int_0^1 x^2 dx = \\frac{1}{3} \\]
- Always wrap variables, equations, and formulas in these delimiters

Original step: ${stepContext}

Please provide only the numbered sub-steps, nothing else.`;
      
      messages = [
        {
          role: "system",
          content: "You are a helpful math tutor. Always use LaTeX notation: \\( \\) for inline math and \\[ \\] for display equations. Wrap all mathematical content properly."
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

IMPORTANT: For mathematical expressions, use LaTeX notation:
- For inline math, use \\( ... \\) like: \\( f'(x) = 2x \\)
- For display math, use \\[ ... \\] like: \\[ \\int x^n dx = \\frac{x^{n+1}}{n+1} + C \\]
- Always wrap variables, equations, and formulas in these delimiters

Sub-step: ${stepContext}

Provide only the concise explanation, nothing else.`;
      
      messages = [
        {
          role: "system",
          content: "You are a helpful math tutor. Always use LaTeX notation: \\( \\) for inline math and \\[ \\] for display equations. Wrap all mathematical content properly."
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
      max_tokens: type === 'theory' ? 400 : 1000,
      temperature: 0.3,
    });

    let content = completion.choices[0].message.content;
    
    // Post-process the content to normalize LaTeX formatting
    if (content) {
      content = normalizeLatex(content);
    }

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