import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    // Connect to database
    await dbConnect();
    
    // Get session for authentication
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: 'Authentication required to process images' },
        { status: 401 }
      );
    }
    
    // Find user in database
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }
    
    // Check if user has enough credits
    if (user.credits <= 0) {
      return NextResponse.json(
        { error: 'No credits remaining. Please upgrade your account or wait for credits to reset.' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const image = formData.get("image");

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");
    const mimeType = image.type;

//     const systemPrompt =`
    
//     You are a highly skilled and expert educational assistant specializing in breaking down complex academic problems into scaffolded, didactic, step-by-step questions that maximize conceptual understanding and learning efficacy. When provided with an academic problem, follow these detailed instructions:

// Core Analysis:

// - Carefully analyze the problem to identify all fundamental underlying concepts required to fully solve it.
// - Decompose the problem into a coherent sequence of sub-questions that incrementally build comprehension.
// - Identify which sub-questions require numerical calculation and which target conceptual understanding.

// Create a step-by-step question sequence where:

// - Each question addresses exactly one fundamental concept.
// - Solving all questions provides complete understanding to solve the original problem.
// - Questions follow didactic progression (basic → advanced).
// - Later questions may require combining answers from earlier ones.
// - After solving all the questions, one can solve the original problem also.
// - Include at least one synthesis question that requires integration of multiple earlier concepts.
// - For numerical questions, break the calculation into sub-questions that lead the learner through each computational step rather than offering only theoretical formula options.

// Question and Option Design:

// - For each question, provide exactly four multiple-choice options (a–d).
// - MCQ distractors should represent common misconceptions or calculation mistakes.
// - Randomize the order of options and correct-answer positions so that correct answers are not predictably ordered.
// - Do not group correct answers or similar distractors together by index patterns.

// JSON Output:

// Return ONLY a valid JSON object with these exact fields:

// "questions": Ordered list of sub-question strings.
// "options": List of lists, each containing four option strings for the corresponding question.
// "correct_answers": List of correct option indices (0–3), one per question.
// "explanations": List of explanation strings for the correct answer to each question.
// "concept_tags": List of lists of concept identifiers or tags that each question teaches.

// Do not wrap the JSON object in code fences or add any additional text, commentary, or formatting.

// Requirements:

// The final question must be solvable using answers from all previous questions.
// Ensure the final answer maps to the original problem's solution.
// Maintain clarity, conciseness, and learner engagement throughout the sequence.
// Structure numerical sub-questions to guide step-by-step computations, making intermediate results explicit in questions.

// Example format:
// {
// "questions": ["Basic definition...", "Intermediate application...", "Synthesis question combining Q1+Q2..."],
// "options": [["Option a", "Option b", "Option c", "Option d"], [...]],
// "correct_answers": [1, 0, 2],
// "explanations": ["Explanation for question 1", "Explanation for question 2", "Explanation for question 3"],
// "concept_tags": [["Newton's First Law"], ["Force diagrams"], ["Equilibrium conditions"]]
// }
//     `;

const systemPrompt = `

You are an expert educational assistant whose purpose is to decompose any academic problem into a scaffolded, step-by-step sequence of multiple-choice sub-questions.  Your output will be strictly JSON, suitable for driving an interactive learning bot.

When given an academic question, you must:

1. Identify Core Concepts  
   - Analyze the fundamental ideas and skills required to solve the main problem.

2. Design a Progressive Question Sequence  
   - Create an ordered list of sub-questions, each targeting exactly one core concept.  
   - Ensure questions progress didactically from basic to advanced.  
   - Include at least one "synthesis" question that requires combining insights from earlier steps.  
   - Guarantee that, once all sub-questions are answered correctly, the learner can solve the original problem.

3. Generate Detailed MCQs for Each Sub-Question  
   - Provide 4 options (a–d) per question.  
   - Randomly shuffle correct answers so they are not always in the same position.  
   - Craft distractors that reflect common misconceptions or pitfalls.

4. Supply Hints and Explanations  
   - hint1: A light, guiding clue that nudges the learner without giving away the answer.  
   - hint2: A stronger, more revealing hint that short of the answer's text still points clearly at the solution.  
   - explanations: A concise rationale for why the correct option is right and why the others are wrong.  
   - conceptual_explanation: A short description of the key concept(s), formulae, or theory underlying the question.

5. Tag Concepts  
   - List the relevant curriculum or NCERT concept tags that each sub-question addresses.



Output Format (strict JSON):

{
  "questions": [
    "First sub-question text",
    "Second sub-question text",
    "...",
    "Final synthesis question text"
  ],
  "options": [
    ["Option a", "Option b", "Option c", "Option d"],
    ["Option a", "Option b", "Option c", "Option d"],
    "...",
    ["Option a", "Option b", "Option c", "Option d"]
  ],
  "correct_answers": [ index_of_correct_option_for_Q1, index_for_Q2, ..., index_for_Qn ],
  "hint1": [
    "Hint1 for Q1",
    "Hint1 for Q2",
    "...",
    "Hint1 for Qn"
  ],
  "hint2": [
    "Hint2 for Q1",
    "Hint2 for Q2",
    "...",
    "Hint2 for Qn"
  ],
  "explanations": [
    "Explanation for Q1",
    "Explanation for Q2",
    "...",
    "Explanation for Qn"
  ],
  "conceptual_explanation": [
    "Concept/theory/formula for Q1",
    "Concept/theory/formula for Q2",
    "...",
    "Concept/theory/formula for Qn"
  ],
  "concept_tags": [
    ["Tag1", "Tag2", "..."],
    ["Tag1", "Tag2", "..."],
    "...",
    ["Tag1", "Tag2", "..."]
  ]
}

`


    const response = await openai.chat.completions.create({
      model: "o4-mini",
      // model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this academic question and break it down into scaffolded learning steps as specified. Return only the JSON object.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      temperature: 1,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    console.log("Raw ChatGPT response:", content); // Debug log

    // Try to parse the JSON response with improved extraction
    let jsonData;
    try {
      // First, try to parse the content directly
      jsonData = JSON.parse(content);
    } catch (directParseError) {
      try {
        // If direct parsing fails, try to extract JSON from markdown code blocks
        const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
          jsonData = JSON.parse(codeBlockMatch[1]);
        } else {
          // Try to find JSON object in the text
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            // Clean up the JSON string - remove any trailing text after the closing brace
            let jsonString = jsonMatch[0];
            
            // Find the last closing brace to ensure we get complete JSON
            let braceCount = 0;
            let lastValidIndex = -1;
            for (let i = 0; i < jsonString.length; i++) {
              if (jsonString[i] === '{') braceCount++;
              if (jsonString[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                  lastValidIndex = i;
                  break;
                }
              }
            }
            
            if (lastValidIndex !== -1) {
              jsonString = jsonString.substring(0, lastValidIndex + 1);
            }
            
            jsonData = JSON.parse(jsonString);
          } else {
            throw new Error("No JSON object found in response");
          }
        }
      } catch (extractionError) {
        console.error("Failed to extract JSON from ChatGPT response:", extractionError);
        console.error("Response content:", content);
        return NextResponse.json(
          { 
            error: "Failed to parse response from ChatGPT. The AI response was not in the expected JSON format. Please try again.",
            details: "Response parsing failed"
          },
          { status: 500 }
        );
      }
    }

    // Validate the response format
    const requiredFields = [
      "questions",
      "options",
      "correct_answers",
      "hint1",
      "hint2",
      "explanations",
      "conceptual_explanation",
      "concept_tags",
    ];
    for (const field of requiredFields) {
      if (!jsonData[field]) {
        return NextResponse.json(
          { error: `Invalid response format: missing ${field}` },
          { status: 500 }
        );
      }
    }

    // Validate array lengths
    const numQuestions = jsonData.questions.length;
    if (
      jsonData.options.length !== numQuestions ||
      jsonData.correct_answers.length !== numQuestions ||
      jsonData.hint1.length !== numQuestions ||
      jsonData.hint2.length !== numQuestions ||
      jsonData.explanations.length !== numQuestions ||
      jsonData.conceptual_explanation.length !== numQuestions ||
      jsonData.concept_tags.length !== numQuestions
    ) {
      return NextResponse.json(
        { error: "Invalid response format: array lengths do not match" },
        { status: 500 }
      );
    }

    // Deduct one credit from the user's account
    user.credits -= 1;
    await user.save();

    return NextResponse.json({
      success: true,
      data: jsonData,
      message: "Image processed successfully",
      creditsRemaining: user.credits,
    });
  } catch (error) {
    console.error("Error processing image:", error);
    
    // Log more details about the error
    if (error.message) {
      console.error("Error message:", error.message);
    }
    if (error.stack) {
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { 
        error: "Failed to process image. Please try again with a clearer image or different question.",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
