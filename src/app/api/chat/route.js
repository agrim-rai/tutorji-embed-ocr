// import { streamText } from 'ai';
// import { openai } from '@ai-sdk/openai';
// import { NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';
// import { 
//   getChatContext, 
//   storeChatContext, 
//   updateChatContext, 
//   generateChatId 
// } from '@/lib/redis';
// import dbConnect from '@/lib/mongoose';
// import User from '@/models/User';

// /**
//  * Chat API Route with Streaming Support
//  * 
//  * This endpoint provides streaming chat functionality using the Vercel AI SDK.
//  * Features:
//  * - Streaming AI responses in real-time
//  * - Redis-backed chat context storage
//  * - User authentication and credit management
//  * - Support for continuing conversations from previous questions
//  * - Mathematical notation support with LaTeX
//  */

// // Check if OpenAI API key is available
// const hasOpenAIKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10;

// /**
//  * POST handler for streaming chat
//  * 
//  * @param {Request} req - The incoming request with chat data
//  * @returns {Promise<Response>} Streaming response with AI-generated content
//  */
// export async function POST(req) {
//   try {
//     console.log('Chat API: Starting streaming chat execution');
    
//     // Connect to database
//     await dbConnect();
//     console.log('Chat API: Connected to MongoDB');
    
//     // Get session for authentication
//     const session = await getServerSession(authOptions);
    
//     // Check if user is authenticated
//     if (!session || !session.user || !session.user.email) {
//       console.log('Chat API: No authenticated user');
//       return NextResponse.json(
//         { error: 'Authentication required for chat' },
//         { status: 401 }
//       );
//     }
    
//     // Find user in database
//     const user = await User.findOne({ email: session.user.email });
//     if (!user) {
//       console.error('Chat API: User not found in database');
//       return NextResponse.json(
//         { error: 'User not found in database' },
//         { status: 404 }
//       );
//     }
    
//     console.log('Chat API: User found:', user.email, 'Credits:', user.credits);
    
//     // Parse request body
//     const { 
//       messages, 
//       chatId, 
//       initialQuestion, 
//       initialAnswer, 
//       initialImage 
//     } = await req.json();
    
//     // Validate request data
//     if (!messages || !Array.isArray(messages) || messages.length === 0) {
//       return NextResponse.json(
//         { error: 'Messages array is required' },
//         { status: 400 }
//       );
//     }
    
//     // Generate or use provided chat ID
//     const finalChatId = chatId || generateChatId(user._id.toString());
//     console.log('Chat API: Using chat ID:', finalChatId);
    
//     // Get existing chat context from Redis
//     let chatContext = await getChatContext(finalChatId) || [];
    
//     // If this is a new chat with initial context, set it up
//     if (chatContext.length === 0 && (initialQuestion || initialAnswer)) {
//       const contextMessages = [];
      
//       // Add initial question and answer if provided
//       if (initialQuestion) {
//         contextMessages.push({
//           role: 'user',
//           content: initialQuestion,
//           timestamp: Date.now(),
//           isInitial: true
//         });
//       }
      
//       if (initialAnswer) {
//         contextMessages.push({
//           role: 'assistant',
//           content: initialAnswer,
//           timestamp: Date.now(),
//           isInitial: true
//         });
//       }
      
//       // Store initial context in Redis
//       if (contextMessages.length > 0) {
//         await storeChatContext(finalChatId, contextMessages);
//         chatContext = contextMessages;
//       }
//     }
    
//     // Check OpenAI API availability
//     if (!hasOpenAIKey) {
//       console.log('Chat API: No OpenAI API key found');
//       return NextResponse.json(
//         { error: 'AI service not available. Please check configuration.' },
//         { status: 503 }
//       );
//     }
    
//     // Prepare system message for the AI
//     const systemMessage = {
//       role: 'system',
//       content: `You are TutorJi, an expert AI tutor specializing in JEE (Joint Entrance Examination) and NEET (National Eligibility cum Entrance Test) preparation for Physics, Chemistry, Mathematics, Biology and Zoology.

// CONVERSATION CONTEXT:
// - You are continuing a conversation that may have started with a specific question
// - Previous messages provide important context for the current conversation
// - Maintain continuity and reference previous discussions when relevant

// ACADEMIC FOCUS:
// - ONLY respond to academic questions related to JEE/NEET syllabus subjects
// - For non-academic queries, politely redirect: "I'm here to help with JEE/NEET academic questions. Please ask about Physics, Chemistry, Mathematics, Biology, or Zoology."

// RESPONSE GUIDELINES:
// 1. Use LaTeX notation for mathematical expressions:
//    - Inline math: \\( expression \\) like \\( f(x) = x^2 \\)
//    - Display math: \\[ expression \\] like \\[ \\int_0^1 x^2 dx = \\frac{1}{3} \\]
// 2. Provide clear, step-by-step explanations
// 3. Use \\boxed{answer} for final answers
// 4. No bold ** or italic * formatting
// 5. Match the language of the user's question
// 6. Be conversational but educational
// 7. Ask follow-up questions to ensure understanding
// 8. Reference previous parts of the conversation when helpful

// INTERACTION STYLE:
// - Be encouraging and supportive
// - Break down complex concepts into simpler parts
// - Offer to explain concepts in different ways if needed
// - Suggest related topics or practice problems when appropriate`
//     };
    
//     // Combine chat context with new messages
//     const allMessages = [
//       systemMessage,
//       ...chatContext.map(msg => ({
//         role: msg.role,
//         content: msg.content
//       })),
//       ...messages.map(msg => ({
//         role: msg.role,
//         content: msg.content
//       }))
//     ];
    
//     console.log('Chat API: Processing', allMessages.length, 'total messages');
    
//     // Create streaming response using Vercel AI SDK with optimized settings
//     const result = await streamText({
//       model: openai('gpt-4o-mini'),
//       messages: allMessages,
//       temperature: 0.7,
//       maxTokens: 2000,
//       stream: true,
//       // Optimize streaming performance
//       streamMode: 'text',
//     });
    
//     // Update chat context with new messages
//     const newMessages = [
//       ...messages.map(msg => ({
//         ...msg,
//         timestamp: Date.now()
//       }))
//     ];
    
//     // We'll add the AI response after the stream completes
//     // For now, store the user messages
//     await updateChatContext(finalChatId, newMessages);
    
//     // Return streaming response
//     return result.toDataStreamResponse({
//       headers: {
//         'X-Chat-ID': finalChatId,
//         'Access-Control-Expose-Headers': 'X-Chat-ID'
//       },
//       onFinish: async (completion) => {
//         try {
//           // Store the assistant's response in chat context
//           const assistantMessage = {
//             role: 'assistant',
//             content: completion.text,
//             timestamp: Date.now()
//           };
          
//           await updateChatContext(finalChatId, [assistantMessage]);
//           console.log('Chat API: Stored assistant response in context');
          
//           // Optional: Deduct credits for chat messages (you can adjust this logic)
//           // For example, deduct 1 credit for every 5 chat messages
//           const updatedContext = await getChatContext(finalChatId);
//           const userMessageCount = updatedContext?.filter(msg => msg.role === 'user' && !msg.isInitial).length || 0;
          
//           if (userMessageCount > 0 && userMessageCount % 5 === 0) {
//             if (user.credits > 0) {
//               user.credits -= 1;
//               await user.save();
//               console.log('Chat API: Deducted 1 credit for extended chat session');
//             }
//           }
//         } catch (error) {
//           console.error('Chat API: Error in onFinish callback:', error);
//         }
//       }
//     });
    
//   } catch (error) {
//     console.error('Chat API: Unhandled error:', error);
//     return NextResponse.json(
//       { error: 'Failed to process chat request: ' + error.message },
//       { status: 500 }
//     );
//   }
// }

// /**
//  * GET handler for retrieving chat context
//  * 
//  * @param {Request} req - The incoming request
//  * @returns {Promise<NextResponse>} JSON response with chat history
//  */
// export async function GET(req) {
//   try {
//     // Get session for authentication
//     const session = await getServerSession(authOptions);
    
//     if (!session || !session.user || !session.user.email) {
//       return NextResponse.json(
//         { error: 'Authentication required' },
//         { status: 401 }
//       );
//     }
    
//     // Get chat ID from query parameters
//     const { searchParams } = new URL(req.url);
//     const chatId = searchParams.get('chatId');
    
//     if (!chatId) {
//       return NextResponse.json(
//         { error: 'Chat ID is required' },
//         { status: 400 }
//       );
//     }
    
//     // Retrieve chat context
//     const chatContext = await getChatContext(chatId);
    
//     return NextResponse.json({
//       success: true,
//       chatId,
//       messages: chatContext || []
//     });
    
//   } catch (error) {
//     console.error('Chat API GET: Error retrieving chat context:', error);
//     return NextResponse.json(
//       { error: 'Failed to retrieve chat context' },
//       { status: 500 }
//     );
//   }
// } 






// // at top-level
// import { redis } from '@/lib/redis'
// import dbConnect from '@/lib/mongoose'
// import User from '@/models/User'
// import { streamText } from 'ai'
// import { openai } from '@ai-sdk/openai'
// import { NextResponse } from 'next/server'
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/lib/auth'
// export const runtime = 'nodejs'  // or 'edge' if you rewrite to edge-compatible libs

// // Persist DB connection
// await dbConnect()

// export async function POST(req) {
//   // 1) Validate & auth early:
//   const session = await getServerSession(authOptions)
//   if (!session?.user?.email) 
//     return NextResponse.json({ error: 'Auth required' }, { status: 401 })

//   // 2) Load user
//   const user = await User.findOne({ email: session.user.email })
//   if (!user) 
//     return NextResponse.json({ error: 'User not found' }, { status: 404 })

//   // 3) Parse body & validate messages
//   const { messages, chatId, initialQuestion, initialAnswer } = await req.json()
//   if (!Array.isArray(messages) || !messages.length)
//     return NextResponse.json({ error: 'No messages' }, { status: 400 })

//   // 4) Determine finalChatId
//   const finalChatId = chatId || `chat:${user._id}`

//   // 5) Fetch only the last 10 messages from Redis
//   let chatContext = await redis.lrange(finalChatId, -20, -1) // returns JSON strings
//   chatContext = chatContext.map(msg => JSON.parse(msg))

//   // 6) If new & initial context provided, prepend it
//   if (chatContext.length === 0 && (initialQuestion || initialAnswer)) {
//     const initial = []
//     if (initialQuestion) initial.push({ role: 'user', content: initialQuestion })
//     if (initialAnswer)  initial.push({ role: 'assistant', content: initialAnswer })
//     chatContext = initial
//     // store them
//     const multi = redis.multi()
//     initial.forEach(m => multi.rpush(finalChatId, JSON.stringify(m)))
//     await multi.exec()
//   }

//   // 7) Build LLM payload
//   const systemMessage = { role: 'system', content: `You are TutorJi, an expert AI tutor specializing in JEE (Joint Entrance Examination) and NEET (National Eligibility cum Entrance Test) preparation for Physics, Chemistry, Mathematics, Biology and Zoology.

//     // CONVERSATION CONTEXT:
//     // - You are continuing a conversation that may have started with a specific question
//     // - Previous messages provide important context for the current conversation
//     // - Maintain continuity and reference previous discussions when relevant
    
//     // ACADEMIC FOCUS:
//     // - ONLY respond to academic questions related to JEE/NEET syllabus subjects
//     // - For non-academic queries, politely redirect: "I'm here to help with JEE/NEET academic questions. Please ask about Physics, Chemistry, Mathematics, Biology, or Zoology."
    
//     // RESPONSE GUIDELINES:
//     // 1. Use LaTeX notation for mathematical expressions:
//     //    - Inline math: \\( expression \\) like \\( f(x) = x^2 \\)
//     //    - Display math: \\[ expression \\] like \\[ \\int_0^1 x^2 dx = \\frac{1}{3} \\]
//     // 2. Provide clear, step-by-step explanations
//     // 3. Use \\boxed{answer} for final answers
//     // 4. No bold ** or italic * formatting
//     // 5. Match the language of the user's question
//     // 6. Be conversational but educational
//     // 7. Ask follow-up questions to ensure understanding
//     // 8. Reference previous parts of the conversation when helpful
    
//     // INTERACTION STYLE:
//     // - Be encouraging and supportive
//     // - Break down complex concepts into simpler parts
//     // - Offer to explain concepts in different ways if needed
//     // - Suggest related topics or practice problems when appropriate`

//   }
//   const allMessages = [
//     systemMessage,
//     ...chatContext,
//     ...messages
//   ]

//   // 8) Stream!
//   const response = await streamText({
//     model: openai('gpt-3.5-turbo'),  // faster stream
//     messages: allMessages,
//     maxTokens: 1000,
//     temperature: 0.7,
//     stream: true,
//   })

//   // 9) Quickly append user msgs (pipe them into Redis)
//   const pipe = redis.multi()
//   messages.forEach(m =>
//     pipe.rpush(finalChatId, JSON.stringify({ ...m, timestamp: Date.now() }))
//   )
//   // Trim to last 50 entries
//   pipe.ltrim(finalChatId, -50, -1)
//   await pipe.exec()

//   // 10) On finish: persist assistant reply
//   return response.toDataStreamResponse({
//     onFinish: async (completion) => {
//       await redis.rpush(
//         finalChatId,
//         JSON.stringify({ role: 'assistant', content: completion.text, timestamp: Date.now() })
//       )
//       // you can also deduct credits here…
//     },
//     headers: {
//       'X-Chat-ID': finalChatId,
//       'Access-Control-Expose-Headers': 'X-Chat-ID'
//     }
//   })
// }







// pages/api/chat/stream.js  (or app/api/chat/route.js)
import { redis, getChatMessages, appendChatMessages } from '@/lib/redis'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

export const runtime = 'nodejs'   // or 'edge' with edge‐compatible libs

// Ensure Mongo connects once at cold start
await dbConnect()

export async function POST(req) {
  // 1) AUTH EARLY
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // 2) Load user
  const user = await User.findOne({ email: session.user.email })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // 3) Parse + validate
  const { messages, chatId, initialQuestion, initialAnswer } = await req.json()
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
  }

  // 4) Build a unique chat key
  const finalChatId = chatId || `chat-${user._id}-${Date.now()}`

  // 5) Retrieve only the last 20 messages
  let chatContext = await getChatMessages(finalChatId, 20)

  // 6) If brand‐new & you passed an initial Q/A, prepend once
  if (chatContext.length === 0 && (initialQuestion || initialAnswer)) {
    const initMsgs = []
    if (initialQuestion) initMsgs.push({ role: 'user', content: initialQuestion, timestamp: Date.now(), isInitial: true })
    if (initialAnswer)   initMsgs.push({ role: 'assistant', content: initialAnswer, timestamp: Date.now(), isInitial: true })
    chatContext = initMsgs
    await appendChatMessages(finalChatId, initMsgs, 50)
  }

  // 7) Prepare system prompt & merge
  const systemMessage = { role: 'system', content: `You are TutorJi, an expert AI tutor specializing in JEE (Joint Entrance Examination) and NEET (National Eligibility cum Entrance Test) preparation for Physics, Chemistry, Mathematics, Biology and Zoology.

    // CONVERSATION CONTEXT:
    // - You are continuing a conversation that may have started with a specific question
    // - Previous messages provide important context for the current conversation
    // - Maintain continuity and reference previous discussions when relevant
    
    // ACADEMIC FOCUS:
    // - ONLY respond to academic questions related to JEE/NEET syllabus subjects
    // - For non-academic queries, politely redirect: "I'm here to help with JEE/NEET academic questions. Please ask about Physics, Chemistry, Mathematics, Biology, or Zoology."
    
    // RESPONSE GUIDELINES:
    // 1. Use LaTeX notation for mathematical expressions:
    //    - Inline math: \\( expression \\) like \\( f(x) = x^2 \\)
    //    - Display math: \\[ expression \\] like \\[ \\int_0^1 x^2 dx = \\frac{1}{3} \\]
    // 2. Provide clear, step-by-step explanations
    // 3. Use \\boxed{answer} for final answers
    // 4. No bold ** or italic * formatting
    // 5. No heading or subheading, #, ##, ###, etc.
    // 6. Match the language of the user's question
    // 7. Be conversational but educational
    // 8. Ask follow-up questions to ensure understanding
    // 9. Reference previous parts of the conversation when helpful
    
    // INTERACTION STYLE:
    // - Be encouraging and supportive
    // - Break down complex concepts into simpler parts
    // - Offer to explain concepts in different ways if needed
    // - Suggest related topics or practice problems when appropriate` }
  const allMessages = [systemMessage, ...chatContext, ...messages]

  // gpt-4o-mini stream
  // const result = await streamText({
  //   model: openai('gpt-4o-mini'),
  //   messages: allMessages,
  //   temperature: 0.7,
  //   maxTokens: 1000,
  //   stream: true,
  // })

  // o4-mini stream
  const result = await streamText({
    model: openai('o4-mini'),
    messages: allMessages,
    stream: true
  })


  // 9) Immediately append just the user’s turn(s)
  const userMsgs = messages.map(m => ({ ...m, timestamp: Date.now() }))
  await appendChatMessages(finalChatId, userMsgs, 50)

  // 10) Return the stream and onFinish append the assistant’s reply
  return result.toDataStreamResponse({
    headers: {
      'X-Chat-ID': finalChatId,
      'Access-Control-Expose-Headers': 'X-Chat-ID'
    },
    onFinish: async (completion) => {
      const assistantMsg = { role: 'assistant', content: completion.text, timestamp: Date.now() }
      await appendChatMessages(finalChatId, [assistantMsg], 50)

      // … optionally deduct credits …
    }
  })
}