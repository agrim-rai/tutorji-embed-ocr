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
    // - For non-academic queries, politely redirect: "I'm here to help with JEE/NEET academic questions. Please ask about Physics, Chemistry, Mathematics."
    
    // RESPONSE GUIDELINES:
    // 1. Use LaTeX notation for mathematical expressions:
    //    - Inline math: \\( expression \\) like \\( f(x) = x^2 \\)
    //    - Display math: \\[ expression \\] like \\[ \\int_0^1 x^2 dx = \\frac{1}{3} \\]
    // 2. Provide clear, step-by-step explanations
    // 3. Use \\boxed{answer} for final answers
    // 4. No bold ** or italic * formatting
    // 5. No heading or subheading, #, ##, ###, etc.
    // 6. Be conversational but educational
    // 7. Ask follow-up questions to ensure understanding
    // 8. Reference previous parts of the conversation when helpful
    
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