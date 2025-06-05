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
    if (type === 'theory') {  
      model = "gpt-4o-mini"; // Use gpt-4o-mini for theory
    } else if (type === 'summary' || type === 'main' || type === 'sub') {
      model = "o4-mini"; // Use o4-mini for breakdown (main and sub steps)
    }

    console.log(`[Breakdown API] Using model: ${model} for type: ${type}`);
    
    if (type === 'summary') {
      if (imageData) {
        prompt = `Analyze this image and provide a structured summary of the question/problem shown.

Return your response as a valid JSON object with this exact structure:
{
  "cruxOfProblem": "[Single line summary describing what the problem is asking]",
  "formulaeUsed": "[Key formulae or principles that will be needed to solve this]",
  "termDefinitions": "[Variables and their meanings, referencing where they appear in the question]"
}

Keep each field concise and meaningful:
  - cruxOfProblem: One clear sentence describing what needs to be solved
- formulaeUsed: Key formulae, theorems, or principles needed (e.g., "Fundamental Theorem of Calculus, Integration by parts")
- termDefinitions: Define all variables, constants, and key terms with their meanings and location in the original question (e.g., "\\( x \\) represents the independent variable in the function, \\( f(x) = x^2 \\) is the given function to integrate")

For mathematical expressions, use LaTeX notation:
- For inline math, use \\( and \\) like: \\( \\int_0^1 x^2 dx \\)
- For display math, use \\[ and \\] like: \\[ f(x) = x^2 + 2x + 1 \\]

Return ONLY the JSON object, no other text.`;
        
        messages = [
          {
            role: "system",
            content: "You are a helpful tutor. Return only valid JSON responses. Use LaTeX notation: \\( \\) for inline math and \\[ \\] for display equations."
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
      }
    } else if (type === 'main') {
      if (imageData) {
        prompt = `Analyze this image and break down the problem or task shown into exactly 3-5 main steps. Each step should be clear and actionable.

Return your response as a valid JSON object with this exact structure:
{
  "steps": [
    {
      "id": 1,
      "title": "Step 1: [Brief title]",
      "description": "[Detailed description of what to do in this step]"
    },
    {
      "id": 2, 
      "title": "Step 2: [Brief title]",
      "description": "[Detailed description of what to do in this step]"
    }
  ]
}

For mathematical expressions, use LaTeX notation:
- For inline math, use \\( and \\) like: \\( x^2 + 2x + 1 \\)
- For display math, use \\[ and \\] like: \\[ f(x) = \\int_0^x t^2 dt \\]

Return ONLY the JSON object, no other text.`;
        
        messages = [
          {
            role: "system",
            content: "You are a helpful tutor. Return only valid JSON responses. Use LaTeX notation: \\( \\) for inline math and \\[ \\] for display equations."
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
      }
    } else if (type === 'sub') {
      prompt = `For the following step: "${stepContext}", break it down into exactly 2-3 detailed sub-steps. Generate some theory for each sub-step along with required formulae. Each sub-step should be specific and actionable.

Return your response as a valid JSON object with this exact structure:
{
  "subSteps": [
    {
      "id": 1,
      "title": "Sub-step 1: [Brief title]", 
      "description": "[Detailed description of what to do in this sub-step]"
    },
    {
      "id": 2,
      "title": "Sub-step 2: [Brief title]",
      "description": "[Detailed description of what to do in this sub-step]"
    }
  ]
}

For mathematical expressions, use LaTeX notation:
- For inline math, use \\( and \\) like: \\( \\frac{d}{dx}[f(x)] \\)
- For display math, use \\[ and \\] like: \\[ \\int_0^1 x^2 dx = \\frac{1}{3} \\]

Original step: ${stepContext}

Return ONLY the JSON object, no other text.`;
      
      messages = [
        {
          role: "system",
          content: "You are a helpful tutor. Return only valid JSON responses. Use LaTeX notation: \\( \\) for inline math and \\[ \\] for display equations."
        },
        {
          role: "user",
          content: prompt
        }
      ];
    } else if (type === 'theory') {
      prompt = `For the following sub-step: "${stepContext}", provide a concise, practical explanation focused on solving the problem. Keep it brief (2-3 sentences max) and focus on:
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
          content: "You are a helpful tutor. Use LaTeX notation: \\( \\) for inline math and \\[ \\] for display equations."
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
      ...(type === 'main' || type === 'sub' || type === 'summary' ? {
        response_format: { type: "json_object" }
      } : {}),
      ...(model === "o4-mini" ? {
          // no max tokens or temperature required and supported for o4-mini
      } : {
        max_tokens:  type === 'theory' ? 400 : 1000,
        temperature: 0.3
      }),
    });

    const content = completion.choices[0].message.content;
    console.log(`[Breakdown API] Success - Model: ${model}, Type: ${type}, Content length: ${content?.length || 0}`);

    // Parse JSON response for structured types
    let parsedData = null;
    if (type === 'main' || type === 'sub' || type === 'summary') {
      try {
        parsedData = JSON.parse(content || '{}');
        console.log(`[Breakdown API] Successfully parsed JSON for type: ${type}`);
      } catch (parseError) {
        console.error(`[Breakdown API] JSON parse error for type ${type}:`, parseError);
        console.log(`[Breakdown API] Raw content:`, content);
        
        // Fallback: try to extract structured data from text
        if (type === 'main') {
          parsedData = extractStepsFromText(content || '');
        } else if (type === 'sub') {
          parsedData = extractSubStepsFromText(content || '');
        } else if (type === 'summary') {
          // Fallback for summary - extract basic info from text
          parsedData = {
            cruxOfProblem: content || "Problem analysis needed",
            formulaeUsed: "Various mathematical principles",
            termDefinitions: "Variables and terms to be defined from context"
          };
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      content: type === 'main' || type === 'sub' || type === 'summary' ? null : content, // For backward compatibility
      data: parsedData, // New structured data
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

// Fallback function to extract steps from text if JSON parsing fails
function extractStepsFromText(text: string) {
  const lines = text.split('\n').filter(line => line.trim());
  const steps: any[] = [];
  let currentStep = null;
  
  for (const line of lines) {
    const stepMatch = line.match(/^Step\s+(\d+):\s*(.+)/i);
    if (stepMatch) {
      if (currentStep) {
        steps.push(currentStep);
      }
      currentStep = {
        id: parseInt(stepMatch[1]),
        title: `Step ${stepMatch[1]}: ${stepMatch[2].split('.')[0]}`,
        description: stepMatch[2]
      };
    } else if (currentStep && line.trim()) {
      currentStep.description += '\n' + line.trim();
    }
  }
  
  if (currentStep) {
    steps.push(currentStep);
  }
  
  return { steps };
}

// Fallback function to extract sub-steps from text if JSON parsing fails
function extractSubStepsFromText(text: string) {
  const lines = text.split('\n').filter(line => line.trim());
  const subSteps: any[] = [];
  let currentSubStep = null;
  
  for (const line of lines) {
    const subStepMatch = line.match(/^Sub-step\s+(\d+(?:\.\d+)?):\s*(.+)/i);
    if (subStepMatch) {
      if (currentSubStep) {
        subSteps.push(currentSubStep);
      }
      currentSubStep = {
        id: subSteps.length + 1,
        title: `Sub-step ${subStepMatch[1]}: ${subStepMatch[2].split('.')[0]}`,
        description: subStepMatch[2]
      };
    } else if (currentSubStep && line.trim()) {
      currentSubStep.description += '\n' + line.trim();
    }
  }
  
  if (currentSubStep) {
    subSteps.push(currentSubStep);
  }
  
  return { subSteps };
} 