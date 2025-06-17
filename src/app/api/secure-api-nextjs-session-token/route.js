/**
 * Secure API Endpoint
 * 
 * This API can only be accessed by:
 * 1. Server-to-server calls (localhost/same origin)
 * 2. Authenticated users whose emails are in the external whitelist
 * 
 * The whitelist is fetched from: https://raw.githubusercontent.com/imagrim/cdn/refs/heads/main/apiaccess.json
 * 
 * @route /api/secure-api
 * @access Restricted (server or whitelisted emails only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

const WHITELIST_URL = 'https://raw.githubusercontent.com/imagrim/cdn/refs/heads/main/apiaccess.json';

export const config = {
    runtime: 'nodejs' 
};

/**
 * Fetches the allowed emails from the external whitelist
 * @returns {Promise<string[]>} Array of allowed email addresses
 */
async function fetchWhitelist() {
  try {
    const response = await fetch(WHITELIST_URL, {
      // Add cache control to ensure we get fresh data
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch whitelist: HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data.allowedEmails?.map(email => email.toLowerCase()) || [];
  } catch (error) {
    console.error('Error fetching whitelist:', error);
    throw new Error('Unable to verify access permissions');
  }
}

/**
 * Checks if the request is coming from the server itself
 * @param {NextRequest} request - The incoming request
 * @returns {boolean} True if request is from server
 */
function isServerRequest(request) {
  const host = request.headers.get('host');
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // Check if request is from localhost or same origin

  // TODO: Remove this after testing
  // const isLocalhost = host?.includes('localhost') || host?.includes('127.0.0.1');
  const isLocalhost = false
  const isSameOrigin = origin && referer && new URL(referer).origin === origin;
  
  return isLocalhost || isSameOrigin;
}

/**
 * Validates if the user has access to this API
 * @param {NextRequest} request - The incoming request
 * @returns {Promise<{authorized: boolean, reason?: string, userEmail?: string}>}
 */
async function validateAccess(request) {
  try {
    // Check if it's a server request first
    if (isServerRequest(request)) {
      return { 
        authorized: true, 
        reason: 'Server request' 
      };
    }
    
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return { 
        authorized: false, 
        reason: 'No authenticated session found' 
      };
    }
    
    const userEmail = session.user.email.toLowerCase();
    
    // Fetch the whitelist
    const allowedEmails = await fetchWhitelist();
    
    if (allowedEmails.includes(userEmail)) {
      return { 
        authorized: true, 
        reason: 'Whitelisted email',
        userEmail 
      };
    }
    
    return { 
      authorized: false, 
      reason: `Email ${userEmail} not in whitelist` 
    };
    
  } catch (error) {
    console.error('Access validation error:', error);
    return { 
      authorized: false, 
      reason: 'Access validation failed' 
    };
  }
}

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

/**
 * GET handler for the secure API
 */
export async function GET(request) {
  try {
    // Validate access
    const accessResult = await validateAccess(request);
    
    if (!accessResult.authorized) {
      console.warn(`Unauthorized access attempt: ${accessResult.reason}`);
      return NextResponse.json(
        { 
          error: 'Unauthorized', 
          message: 'Access denied. This API is restricted to authorized users only.',
          reason: accessResult.reason 
        },
        { status: 403 }
      );
    }
    
    // Log successful access
    console.log(`Secure API accessed: ${accessResult.reason}${accessResult.userEmail ? ` (${accessResult.userEmail})` : ''}`);
    
    // Your secure API logic goes here
    const responseData = {
      message: 'Welcome to the secure API!',
      timestamp: new Date().toISOString(),
      accessType: accessResult.reason,
      userEmail: accessResult.userEmail || null,
      data: {
        // Add your sensitive data here
        secretMessage: 'This is only visible to authorized users',
        serverInfo: {
          environment: process.env.NODE_ENV,
          version: '1.0.0'
        }
      }
    };
    
    return NextResponse.json(responseData, { status: 200 });
    
  } catch (error) {
    console.error('Secure API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'An error occurred while processing your request' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler for the secure API - Core Combiner Functionality
 */
export async function POST(request) {
  try {
    // Validate access first
    const accessResult = await validateAccess(request);
    
    if (!accessResult.authorized) {
      console.warn(`Unauthorized POST attempt: ${accessResult.reason}`);
      return NextResponse.json(
        { 
          error: 'Unauthorized', 
          message: 'Access denied. This API is restricted to authorized users only.',
          reason: accessResult.reason 
        },
        { status: 403 }
      );
    }

    await dbConnect()
    
    // Get form data from the request
    const formData = await request.formData()
    const image = formData.get('image')
    const userEmail = formData.get('userEmail') || accessResult.userEmail
    const pageName = formData.get('pageName') || 'secure-api'

    if (!image || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: image, userEmail' },
        { status: 400 }
      )
    }

    console.log('Starting secure combiner workflow...')
    
    // First, find or create the user to get a valid userId
    let user = await User.findOne({ email: userEmail })
    if (!user) {
      // Create a test user if not found
      user = new User({
        name: 'Secure API User',
        email: userEmail,
        credits: 100, // Give some credits for testing
      })
      await user.save()
      console.log('Created secure API user:', user._id)
    }

    const userId = user._id.toString()
    
    // Convert uploaded image to base64 for internal API calls and storage
    const imageBuffer = await image.arrayBuffer()
    const userImageBase64 = `data:${image.type};base64,${Buffer.from(imageBuffer).toString('base64')}`
    
    // STEP 1: Send image to OCR (using base64 instead of FormData)
    console.log('Step 1: Performing OCR...')
    const baseUrl = process.env.NEXTAUTH_URL || `http://localhost:3000`
    const ocrResponse = await fetch(`${baseUrl}/api/ocr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Image: userImageBase64,
        userId: userId,
        userEmail: userEmail,
        pageName: pageName,
      }),
    })

    if (!ocrResponse.ok) {
      const errorData = await ocrResponse.text()
      console.error('OCR Error Details:', errorData)
      throw new Error(`OCR failed: ${ocrResponse.statusText}`)
    }

    const ocrResult = await ocrResponse.json()
    const extractedText = ocrResult.data.text
    console.log('OCR completed. Extracted text length:', extractedText?.length || 0)

    if (!extractedText || extractedText.trim().length === 0) {
      // Even with no text, we should store the image for potential future use
      const newAdaId = await storeNewQuestion('', userImageBase64)
      
      return NextResponse.json(
        { 
          success: true,
          result: newAdaId,
          reason: 'No text could be extracted from the image - stored as new question',
          accessType: accessResult.reason,
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
          accessType: accessResult.reason,
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
          accessType: accessResult.reason,
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
    const diagramResponse = await fetch(`${baseUrl}/api/diagram-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Image: userImageBase64,
      }),
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
          accessType: accessResult.reason,
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
          accessType: accessResult.reason,
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
            accessType: accessResult.reason,
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
            accessType: accessResult.reason,
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
          accessType: accessResult.reason,
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
    console.error('Secure API POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'An error occurred while processing your request',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * Handle unsupported HTTP methods
 */
export async function PUT() {
  return NextResponse.json(
    { error: 'Method Not Allowed', message: 'PUT method is not supported' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method Not Allowed', message: 'DELETE method is not supported' },
    { status: 405 }
  );
}