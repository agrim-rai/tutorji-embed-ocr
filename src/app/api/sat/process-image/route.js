import { NextResponse } from "next/server";
import OpenAI from "openai";
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
        { error: 'Authentication required to process SAT images' },
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

    let imageUrl;
    const contentType = request.headers.get('content-type');

    // Handle both FormData (file upload) and JSON (existing image URL) requests
    if (contentType && contentType.includes('multipart/form-data')) {
      // Handle file upload
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
      imageUrl = `data:${mimeType};base64,${base64Image}`;
    } else {
      // Handle JSON request with existing image URL
      const data = await request.json();
      if (!data.imageUrl) {
        return NextResponse.json({ error: "No image URL provided" }, { status: 400 });
      }
      imageUrl = data.imageUrl;
    }

const systemPrompt = `

You are an expert SAT preparation assistant whose purpose is to decompose any SAT question into a scaffolded, step-by-step sequence of multiple-choice sub-questions. Your output will be strictly JSON, suitable for driving an interactive SAT learning bot.

When given a SAT question (Math, Reading, Writing, or any SAT section), you must:

1. Identify Core SAT Skills & Concepts  
   - Analyze the fundamental SAT skills and knowledge required to solve the main problem.
   - Focus on SAT-specific strategies, formulas, and reasoning patterns.

2. Design a Progressive SAT Question Sequence  
   - Create an ordered list of sub-questions, each targeting exactly one core SAT concept or skill.
   - Ensure questions progress didactically from basic SAT concepts to advanced problem-solving.
   - Include at least one "synthesis" question that requires combining insights from earlier steps.
   - Guarantee that, once all sub-questions are answered correctly, the learner can solve the original SAT problem.
   - Focus on SAT test-taking strategies where applicable.

3. Generate Detailed MCQs for Each Sub-Question  
   - Provide 4 options (A–D) per question in authentic SAT style.
   - Randomly distribute correct answers across positions (not always A or B).
   - Craft distractors that reflect common SAT test-taking mistakes and misconceptions.
   - Use SAT-appropriate language and difficulty level.

4. Supply SAT-Focused Hints and Explanations  
   - hint1: A strategic hint that nudges toward SAT-specific approaches without revealing the answer.
   - hint2: A stronger hint that points clearly at the SAT strategy or concept needed.
   - explanations: A concise rationale explaining the correct SAT approach and why other options are wrong.
   - conceptual_explanation: A focused explanation of the SAT concept, formula, or strategy underlying the question.

5. Tag SAT-Specific Concepts  
   - List relevant SAT skill areas and concept tags that each sub-question addresses.
   - Use SAT-specific terminology (e.g., "Algebra", "Geometry", "Data Analysis", "Reading Comprehension", "Grammar & Usage").

Focus Areas by SAT Section:
- **Math**: Algebra, Advanced Math, Problem Solving & Data Analysis, Geometry & Trigonometry
- **Reading**: Reading Comprehension, Vocabulary in Context, Command of Evidence, Analysis
- **Writing**: Grammar & Usage, Rhetorical Skills, Language Use, Editing in Context

Output Format (strict JSON):

{
  "questions": [
    "First SAT sub-question text",
    "Second SAT sub-question text",
    "...",
    "Final synthesis SAT question text"
  ],
  "options": [
    ["Option A", "Option B", "Option C", "Option D"],
    ["Option A", "Option B", "Option C", "Option D"],
    "...",
    ["Option A", "Option B", "Option C", "Option D"]
  ],
  "correct_answers": [ index_of_correct_option_for_Q1, index_for_Q2, ..., index_for_Qn ],
  "hint1": [
    "SAT strategy hint for Q1",
    "SAT strategy hint for Q2",
    "...",
    "SAT strategy hint for Qn"
  ],
  "hint2": [
    "Stronger SAT hint for Q1",
    "Stronger SAT hint for Q2",
    "...",
    "Stronger SAT hint for Qn"
  ],
  "explanations": [
    "SAT-focused explanation for Q1",
    "SAT-focused explanation for Q2",
    "...",
    "SAT-focused explanation for Qn"
  ],
  "conceptual_explanation": [
    "SAT concept/strategy for Q1",
    "SAT concept/strategy for Q2",
    "...",
    "SAT concept/strategy for Qn"
  ],
  "concept_tags": [
    ["SAT Tag1", "SAT Tag2", "..."],
    ["SAT Tag1", "SAT Tag2", "..."],
    "...",
    ["SAT Tag1", "SAT Tag2", "..."]
  ]
}

`

    const response = await openai.chat.completions.create({
      model: "o4-mini",
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
              text: "Please analyze this SAT question and break it down into scaffolded learning steps as specified. Focus on SAT-specific skills and strategies. Return only the JSON object.",
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      temperature: 1,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    console.log("Raw SAT ChatGPT response:", content);

    // Parse the JSON response
    let jsonData;
    try {
      jsonData = JSON.parse(content);
    } catch (directParseError) {
      try {
        const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
          jsonData = JSON.parse(codeBlockMatch[1]);
        } else {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            let jsonString = jsonMatch[0];
            
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
            throw new Error("No valid JSON found in response");
          }
        }
      } catch (secondParseError) {
        console.error("Failed to parse SAT JSON response:", secondParseError);
        console.error("Content was:", content);
        return NextResponse.json(
          { error: "Failed to parse SAT AI response" },
          { status: 500 }
        );
      }
    }

    // Validate the response structure for SAT questions
    const requiredFields = ['questions', 'options', 'correct_answers', 'hint1', 'hint2', 'explanations', 'conceptual_explanation', 'concept_tags'];
    
    for (const field of requiredFields) {
      if (!jsonData[field] || !Array.isArray(jsonData[field])) {
        return NextResponse.json(
          { error: `Invalid SAT response structure: missing or invalid ${field}` },
          { status: 500 }
        );
      }
    }

    // Validate that all arrays have the same length
    const questionCount = jsonData.questions.length;
    for (const field of requiredFields) {
      if (jsonData[field].length !== questionCount) {
        return NextResponse.json(
          { error: `Inconsistent SAT data: ${field} array length doesn't match questions` },
          { status: 500 }
        );
      }
    }

    // Validate that each question has exactly 4 options
    for (let i = 0; i < jsonData.options.length; i++) {
      if (!Array.isArray(jsonData.options[i]) || jsonData.options[i].length !== 4) {
        return NextResponse.json(
          { error: `SAT question ${i + 1} must have exactly 4 options (A, B, C, D)` },
          { status: 500 }
        );
      }
    }

    // Validate correct answers are in range 0-3
    for (let i = 0; i < jsonData.correct_answers.length; i++) {
      const answer = jsonData.correct_answers[i];
      if (typeof answer !== 'number' || answer < 0 || answer > 3) {
        return NextResponse.json(
          { error: `Invalid correct answer for SAT question ${i + 1}: must be 0, 1, 2, or 3` },
          { status: 500 }
        );
      }
    }

    // Deduct one credit for successful processing
    user.credits -= 1;
    await user.save();

    return NextResponse.json({
      success: true,
      data: jsonData,
      creditsRemaining: user.credits,
      message: "SAT question processed successfully"
    });

  } catch (error) {
    console.error("Error processing SAT image:", error);
    return NextResponse.json(
      { error: "Failed to process SAT image" },
      { status: 500 }
    );
  }
} 