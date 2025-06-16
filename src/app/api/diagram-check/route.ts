import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // parse multipart/form-data
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided under key "file"' },
        { status: 400 }
      )
    }

    // read the file into a Base64 data URI
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const mime = file.type || 'application/octet-stream'
    const base64 = buffer.toString('base64')
    const dataUri = `data:${mime};base64,${base64}`

    // send to OpenAI
    const chat = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a service that only answers true or false (no extra text).',
        },
        {
          role: 'user',
          content:
            'Here is an image in data URI format:\n\n' +
            dataUri +
            '\n\n' +
            'Question: Does this image contain any figure, drawing, diagram, or chart? Reply ONLY "true" or "false".',
        },
      ],
      temperature: 0,
    })

    const reply = chat.choices?.[0]?.message?.content?.trim().toLowerCase()
    const isDiagram = reply === 'true'

    // return a pure boolean JSON body
    return NextResponse.json({ response: isDiagram ? "true" : "false" })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json(
      { error: e.message || 'Unknown error' },
      { status: 500 }
    )
  }
}