import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongoose'
import OCRRecord from '@/models/OCRRecord'
import User from '@/models/User'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Helper function to fetch image from URL
async function fetchImageFromUrl(url) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const mimeType = response.headers.get('content-type') || 'image/jpeg'
    return { buffer, mimeType }
  } catch (error) {
    throw new Error(`Error fetching image from URL: ${error.message}`)
  }
}

// Helper function to validate base64 image
function validateBase64Image(base64String) {
  // Remove data URL prefix if present
  const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '')
  
  try {
    const buffer = Buffer.from(base64Data, 'base64')
    if (buffer.length === 0) {
      throw new Error('Empty base64 data')
    }
    return { buffer, base64Data }
  } catch (error) {
    throw new Error('Invalid base64 data')
  }
}

// Helper function to extract text using OpenAI Vision
async function extractTextFromImage(dataUrl) {
  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an OCR assistant. Extract all the text from the image and return it as plain text, without any commentary.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: dataUrl
              }
            }
          ]
        }
      ]
    })

    return chat.choices?.[0]?.message?.content?.trim() || ''
  } catch (error) {
    throw new Error(`OpenAI API error: ${error.message}`)
  }
}

// Main API handler
export async function POST(req) {
  try {
    await dbConnect()

    const contentType = req.headers.get('content-type') || ''
    let requestData = {}
    let inputType = ''
    let imageBuffer = null
    let mimeType = 'image/jpeg'
    let fileSize = 0
    let originalFileName = ''
    let imageUrl = ''

    // Handle different content types
    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await req.formData()
      const file = formData.get('image')
      const userId = formData.get('userId')
      const userEmail = formData.get('userEmail')
      const pageName = formData.get('pageName') || 'Unknown'

      if (!file) {
        return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
      }

      if (!userId || !userEmail) {
        return NextResponse.json({ error: 'userId and userEmail are required' }, { status: 400 })
      }

      inputType = 'file'
      const arrayBuffer = await file.arrayBuffer()
      imageBuffer = Buffer.from(arrayBuffer)
      mimeType = file.type || 'application/octet-stream'
      fileSize = file.size
      originalFileName = file.name
      
      requestData = { userId, userEmail, pageName }
    } else {
      // Handle JSON data (base64 or URL)
      const body = await req.json()
      const { base64Image, imageUrl: providedImageUrl, userId, userEmail, pageName = 'Unknown' } = body

      if (!userId || !userEmail) {
        return NextResponse.json({ error: 'userId and userEmail are required' }, { status: 400 })
      }

      requestData = { userId, userEmail, pageName }

      if (base64Image) {
        // Handle base64 image
        inputType = 'base64'
        const { buffer } = validateBase64Image(base64Image)
        imageBuffer = buffer
        fileSize = buffer.length
        
        // Extract mime type from base64 data URL if present
        const mimeMatch = base64Image.match(/^data:([^;]+);base64,/)
        if (mimeMatch) {
          mimeType = mimeMatch[1]
        }
      } else if (providedImageUrl) {
        // Handle image URL
        inputType = 'url'
        imageUrl = providedImageUrl
        const { buffer, mimeType: urlMimeType } = await fetchImageFromUrl(providedImageUrl)
        imageBuffer = buffer
        mimeType = urlMimeType
        fileSize = buffer.length
      } else {
        return NextResponse.json({ 
          error: 'Either base64Image or imageUrl must be provided' 
        }, { status: 400 })
      }
    }

    // Verify user exists
    const user = await User.findById(requestData.userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.email !== requestData.userEmail) {
      return NextResponse.json({ error: 'User email mismatch' }, { status: 400 })
    }

    // Convert image to base64 data URL for OpenAI
    const base64 = imageBuffer.toString('base64')
    const dataUrl = `data:${mimeType};base64,${base64}`

    // Extract text using OpenAI
    const extractedText = await extractTextFromImage(dataUrl)

    // Save to database
    const ocrRecord = new OCRRecord({
      userId: requestData.userId,
      userEmail: requestData.userEmail,
      imageUrl: inputType === 'url' ? imageUrl : undefined,
      imageText: extractedText,
      pageName: requestData.pageName,
      inputType,
      metadata: {
        mimeType,
        fileSize,
        originalFileName: originalFileName || undefined,
      }
    })

    await ocrRecord.save()

    return NextResponse.json({
      success: true,
      data: {
        id: ocrRecord._id,
        text: extractedText,
        inputType,
        metadata: ocrRecord.metadata,
        createdAt: ocrRecord.createdAt
      }
    })

  } catch (error) {
    console.error('OCR API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Also support GET method to retrieve OCR records
export async function GET(req) {
  try {
    await dbConnect()

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Verify user exists
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const records = await OCRRecord.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v')

    const total = await OCRRecord.countDocuments({ userId })

    return NextResponse.json({
      success: true,
      data: {
        records,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('OCR GET API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}