import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";


const openai = new OpenAI();

/**
 * POST /api/compare-texts
 * body: { text1, text2 }
 */
export async function POST(request) {
  try {
    await dbConnect();
    
    const { text1, text2 } = await request.json();
    
    if (!text1 || !text2) {
      return NextResponse.json(
        { error: "Missing text1 or text2" },
        { status: 400 }
      );
    }




    // Prepare text for OpenAI Vision API
    const messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Compare these two texts and determine if they are the same. Look at the content, text, layout, and overall appearance. Respond with a JSON object containing: { \"areSame\": boolean, \"confidence\": number (0-1), \"explanation\": \"detailed explanation of your comparison\" }"
          },
          {
            type: "text",
            text: text1
            
          },
          {
            type: "text",
            text: text2
                
          }
        ]
      }
    ];


    // Call OpenAI Text API
    const response = await openai.chat.completions.create({
      model: "o4-mini", 
      messages: messages,

    });

    const aiResponse = response.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error("No response from OpenAI");
    }

    // Try to parse the JSON response
    let comparisonResult;
    try {
      comparisonResult = JSON.parse(aiResponse);
    } catch (parseError) {
      // If JSON parsing fails, create a structured response
      comparisonResult = {
        areSame: aiResponse.toLowerCase().includes("same") || aiResponse.toLowerCase().includes("similar"),
        confidence: 0.5,
        explanation: aiResponse
      };
    }

    return NextResponse.json({
      success: true,
      comparison: comparisonResult,
      rawResponse: aiResponse
    });

  } catch (error) {
    console.error("POST /api/compare-texts error", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
} 