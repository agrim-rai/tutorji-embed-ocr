import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'

export const config = {
    runtime: 'nodejs' 
  };

// Helper function to store new question in vector database and ada-store
async function storeNewQuestion(text, imageBase64) {
  const baseUrl = process.env.NEXTAUTH_URL || `http://localhost:3000`
  
  try {
    // Generate a unique ID for the new question
    const newAdaId = new mongoose.Types.ObjectId().toString()
    
    // Step 1: Store text in vector database (only if text exists)
    if (text && text.trim().length > 0) {
      const vectorStoreResponse = await fetch(`${baseUrl}/api/vectors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: newAdaId,
          text: text,
        }),
      })
      
      if (!vectorStoreResponse.ok) {
        console.error('Failed to store in vector database:', await vectorStoreResponse.text())
        throw new Error('Failed to store text in vector database')
      }
    }
    
    // Step 2: Store image in ada-store
    const adaStoreResponse = await fetch(`${baseUrl}/api/ada-store`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        adaId: newAdaId,
        imageBase64: imageBase64,
      }),
    })
    
    if (!adaStoreResponse.ok) {
      console.error('Failed to store in ada-store:', await adaStoreResponse.text())
      throw new Error('Failed to store image in ada-store')
    }
    
    console.log('Successfully stored new question with Ada ID:', newAdaId)
    return newAdaId
    
  } catch (error) {
    console.error('Error storing new question:', error)
    throw new Error(`Failed to store new question: ${error.message}`)
  }
}

export async function POST(req) {
  try {
    await dbConnect()
    
    // Get form data from the request
    const formData = await req.formData()
    const image = formData.get('image')
    const userEmail = formData.get('userEmail')
    const pageName = formData.get('pageName') || 'combiner'

    if (!image || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: image, userEmail' },
        { status: 400 }
      )
    }

    console.log('Starting combiner workflow...')
    
    // First, find or create the user to get a valid userId
    let user = await User.findOne({ email: userEmail })
    if (!user) {
      // Create a test user if not found
      user = new User({
        name: 'Test User',
        email: userEmail,
        credits: 100, // Give some credits for testing
      })
      await user.save()
      console.log('Created test user:', user._id)
    }

    const userId = user._id.toString()
    
    // STEP 1: Send image to OCR
    console.log('Step 1: Performing OCR...')
    const ocrFormData = new FormData()
    ocrFormData.append('image', image)
    ocrFormData.append('userId', userId)
    ocrFormData.append('userEmail', userEmail)
    ocrFormData.append('pageName', pageName)

    const baseUrl = process.env.NEXTAUTH_URL || `http://localhost:3000`
    const ocrResponse = await fetch(`${baseUrl}/api/ocr`, {
      method: 'POST',
      body: ocrFormData,
    })

    if (!ocrResponse.ok) {
      const errorData = await ocrResponse.text()
      console.error('OCR Error Details:', errorData)
      throw new Error(`OCR failed: ${ocrResponse.statusText}`)
    }

    const ocrResult = await ocrResponse.json()
    const extractedText = ocrResult.data.text
    console.log('OCR completed. Extracted text length:', extractedText?.length || 0)

    // Convert uploaded image to base64 for storage and comparison
    const imageBuffer = await image.arrayBuffer()
    const userImageBase64 = `data:${image.type};base64,${Buffer.from(imageBuffer).toString('base64')}`

    if (!extractedText || extractedText.trim().length === 0) {
      // Even with no text, we should store the image for potential future use
      const newAdaId = await storeNewQuestion('', userImageBase64)
      
      return NextResponse.json(
        { 
          success: true,
          result: newAdaId,
          reason: 'No text could be extracted from the image - stored as new question',
          details: { 
            extractedText: extractedText || '',
            newQuestionStored: true,
            newAdaId
          }
        }
      )
    }

    // STEP 2: Send text to vectors API to get top match
    console.log('Step 2: Searching for similar content...')
    const vectorsUrl = new URL(`${baseUrl}/api/vectors`)
    vectorsUrl.searchParams.append('q', extractedText)
    vectorsUrl.searchParams.append('k', '1')

    const vectorsResponse = await fetch(vectorsUrl)
    if (!vectorsResponse.ok) {
      throw new Error(`Vectors search failed: ${vectorsResponse.statusText}`)
    }

    const vectorsResult = await vectorsResponse.json()
    const topResult = vectorsResult.topResult
    console.log('Vector search completed. Top result score:', topResult?.score || 0)

    if (!topResult || topResult.score < 0.7) {
      // Store new question since no similar content found
      const newAdaId = await storeNewQuestion(extractedText, userImageBase64)
      
      return NextResponse.json(
        { 
          success: true,
          result: newAdaId,
          reason: 'No similar content found in database (similarity score too low) - stored as new question',
          details: { 
            extractedText,
            topResult,
            searchScore: topResult?.score || 0,
            threshold: 0.7,
            newQuestionStored: true,
            newAdaId
          }
        }
      )
    }

    // STEP 3: Get image from database using ada ID
    console.log('Step 3: Retrieving stored image...')
    const adaStoreUrl = new URL(`${baseUrl}/api/ada-store`)
    adaStoreUrl.searchParams.append('adaId', topResult.id)

    const adaStoreResponse = await fetch(adaStoreUrl)
    if (!adaStoreResponse.ok) {
      // Store new question since no image found for existing Ada ID
      const newAdaId = await storeNewQuestion(extractedText, userImageBase64)
      
      return NextResponse.json(
        { 
          success: true,
          result: newAdaId,
          reason: 'No image found for the matching content in ada-store - stored as new question',
          details: { 
            extractedText,
            topResult,
            adaId: topResult.id,
            newQuestionStored: true,
            newAdaId
          }
        }
      )
    }

    const adaStoreResult = await adaStoreResponse.json()
    const storedImageBase64 = adaStoreResult.data.imageBase64
    console.log('Stored image retrieved successfully')

    // STEP 4: Check if image contains diagram
    console.log('Step 4: Checking for diagrams...')
    const diagramFormData = new FormData()
    diagramFormData.append('file', image)

    const diagramResponse = await fetch(`${baseUrl}/api/diagram-check`, {
      method: 'POST',
      body: diagramFormData,
    })

    if (!diagramResponse.ok) {
      throw new Error(`Diagram check failed: ${diagramResponse.statusText}`)
    }

    const diagramResult = await diagramResponse.json()
    const isDiagram = diagramResult.response === "true"
    console.log('Diagram check completed. Is diagram:', isDiagram)

    if (isDiagram) {
      // STEP 5A: If diagram, compare images directly
      console.log('Step 5A: Comparing images (diagram detected)...')
      const imageCompareResponse = await fetch(`${baseUrl}/api/compare-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topResultId: topResult.id,
          userImageBase64: userImageBase64,
        }),
      })

      if (!imageCompareResponse.ok) {
        throw new Error(`Image comparison failed: ${imageCompareResponse.statusText}`)
      }

      const imageCompareResult = await imageCompareResponse.json()
      console.log('Image comparison completed. Are same:', imageCompareResult.comparison.areSame)

      if (imageCompareResult.comparison.areSame) {
        return NextResponse.json({
          success: true,
          result: topResult.id,
          reason: 'Matching diagram found in database',
          details: {
            extractedText,
            topResult,
            isDiagram,
            imageComparison: imageCompareResult.comparison
          }
        })
      } else {
        // NEW QUESTION - Store in database
        const newAdaId = await storeNewQuestion(extractedText, userImageBase64)
        
        return NextResponse.json({
          success: true,
          result: newAdaId,
          reason: 'Similar content found but different diagram - stored as new question',
          details: {
            extractedText,
            topResult,
            isDiagram,
            imageComparison: imageCompareResult.comparison,
            newQuestionStored: true,
            newAdaId
          }
        })
      }
    } else {
      // STEP 5B: If not diagram, compare texts first
      console.log('Step 5B: Comparing texts (no diagram detected)...')
      const textCompareResponse = await fetch(`${baseUrl}/api/compare-texts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text1: extractedText,
          text2: topResult.text,
        }),
      })

      if (!textCompareResponse.ok) {
        throw new Error(`Text comparison failed: ${textCompareResponse.statusText}`)
      }

      const textCompareResult = await textCompareResponse.json()
      console.log('Text comparison completed. Are same:', textCompareResult.comparison.areSame)

      if (textCompareResult.comparison.areSame) {
        // STEP 6: If texts are same, compare images
        console.log('Step 6: Comparing images (texts matched)...')
        const imageCompareResponse = await fetch(`${baseUrl}/api/compare-images`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topResultId: topResult.id,
            userImageBase64: userImageBase64,
          }),
        })

        if (!imageCompareResponse.ok) {
          throw new Error(`Image comparison failed: ${imageCompareResponse.statusText}`)
        }

        const imageCompareResult = await imageCompareResponse.json()
        console.log('Final image comparison completed. Are same:', imageCompareResult.comparison.areSame)

        if (imageCompareResult.comparison.areSame) {
          return NextResponse.json({
            success: true,
            result: topResult.id,
            reason: 'Matching content and image found in database',
            details: {
              extractedText,
              topResult,
              isDiagram,
              textComparison: textCompareResult.comparison,
              imageComparison: imageCompareResult.comparison
            }
          })
        } else {
          // NEW QUESTION - Store in database
          const newAdaId = await storeNewQuestion(extractedText, userImageBase64)
          
          return NextResponse.json({
            success: true,
            result: newAdaId,
            reason: 'Texts match but images are different - stored as new question',
            details: {
              extractedText,
              topResult,
              isDiagram,
              textComparison: textCompareResult.comparison,
              imageComparison: imageCompareResult.comparison,
              newQuestionStored: true,
              newAdaId
            }
          })
        }
      } else {
        // NEW QUESTION - Store in database
        const newAdaId = await storeNewQuestion(extractedText, userImageBase64)
        
        return NextResponse.json({
          success: true,
          result: newAdaId,
          reason: 'Text content is different from existing questions - stored as new question',
          details: {
            extractedText,
            topResult,
            isDiagram,
            textComparison: textCompareResult.comparison,
            newQuestionStored: true,
            newAdaId
          }
        })
      }
    }

  } catch (error) {
    console.error('Combiner API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
