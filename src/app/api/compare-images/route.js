import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import adaAndImage from "@/models/adaAndImage.js";

const openai = new OpenAI();

/**
 * POST /api/compare-images
 * body: { topResultId, userImageBase64 }
 */
export async function POST(request) {
  try {
    await dbConnect();
    
    const { topResultId, userImageBase64 } = await request.json();
    
    if (!topResultId || !userImageBase64) {
      return NextResponse.json(
        { error: "Missing topResultId or userImageBase64" },
        { status: 400 }
      );
    }

    // Fetch the stored image from database using the top result ID
    const storedImageDoc = await adaAndImage.findOne({ ada: topResultId });
    
    if (!storedImageDoc) {
      return NextResponse.json(
        { error: "No image found for the provided Ada ID" },
        { status: 404 }
      );
    }

    const storedImageBase64 = storedImageDoc.image;

    // Prepare images for OpenAI Vision API
    const messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Compare these two images and determine if they are the same. Look at the content, text, layout, and overall appearance. Respond with a JSON object containing: { \"areSame\": boolean, \"confidence\": number (0-1), \"explanation\": \"detailed explanation of your comparison\" }"
          },
          {
            type: "image_url",
            image_url: {
              url: storedImageBase64
            }
          },
          {
            type: "image_url",
            image_url: {
              url: userImageBase64
            }
          }
        ]
      }
    ];


    // Call OpenAI Vision API
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
      topResultId: topResultId,
      rawResponse: aiResponse
    });

  } catch (error) {
    console.error("POST /api/compare-images error", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
} 