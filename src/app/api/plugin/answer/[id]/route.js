import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import PluginAnswer from '@/models/PluginAnswer';
import mongoose from 'mongoose';

export async function GET(request, { params }) {
  // Add CORS headers for Chrome extension support
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  };

  try {
    // Await params to fix Next.js 15+ requirement
    const { id } = await params;
    
    // Connect to database
    await dbConnect();
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`[PLUGIN-API] Invalid ID format: ${id}`);
      return NextResponse.json(
        { error: 'Invalid answer ID format' },
        { status: 400, headers: { ...corsHeaders, 'Cache-Control': 'no-cache, no-store, must-revalidate' } }
      );
    }
    
    // Find the plugin answer with fresh data
    const pluginAnswer = await PluginAnswer.findById(id).lean();
    
    if (!pluginAnswer) {
      console.log(`[PLUGIN-API] Answer not found for ID: ${id}`);
      return NextResponse.json(
        { error: 'Answer not found' },
        { status: 404, headers: { ...corsHeaders, 'Cache-Control': 'no-cache, no-store, must-revalidate' } }
      );
    }

    // Check for timeout threshold (extended to 180 seconds)
    const currentTime = new Date();
    const createdTime = new Date(pluginAnswer.createdAt);
    const timeDifference = (currentTime - createdTime) / 1000; // in seconds

    const TIMEOUT_THRESHOLD = 180; // 3 minutes

    // If exceeded threshold and still processing, mark as timeout
    if (timeDifference > TIMEOUT_THRESHOLD && pluginAnswer.status === 'processing') {
      console.log(`[PLUGIN-API] ${id.slice(-8)}: Timeout after ${timeDifference.toFixed(1)}s`);
      
      // Update the record to timeout status
      await PluginAnswer.findByIdAndUpdate(id, {
        status: 'timeout',
        error_message: 'Processing timeout: The AI took too long to respond. Please try again.',
        updatedAt: new Date()
      });

      return NextResponse.json({
        success: false,
        answer: {
          ...pluginAnswer,
          status: 'timeout',
          error_message: 'Processing timeout: The AI took too long to respond. Please try again.',
          timeoutAfter: Math.floor(timeDifference)
        },
        error: 'Processing timeout',
        message: 'The AI analysis took too long (over 3 minutes). Please try uploading your image again.',
        shouldRetry: true
      }, {
        status: 408, // Request Timeout
        headers: { 
          ...corsHeaders, 
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    // Calculate processing progress and time (scale to new threshold)
    const progressPercentage = Math.min((timeDifference / TIMEOUT_THRESHOLD) * 100, 95); // Max 95% until completed
    const estimatedTimeRemaining = Math.max(TIMEOUT_THRESHOLD - timeDifference, 0);

    // Generate thinking messages based on processing time
    const getThinkingMessage = (seconds) => {
      if (seconds < 10) return "Analyzing your image...";
      if (seconds < 20) return "Reading the mathematical content...";
      if (seconds < 40) return "Processing equations and formulas...";
      if (seconds < 80) return "Generating step-by-step solution...";
      if (seconds < 120) return "Finalizing the detailed explanation...";
      return "Almost done, putting finishing touches...";
    };

    // Generate animated dots for thinking effect
    const thinkingDots = ".".repeat((Math.floor(timeDifference) % 3) + 1);
    
    console.log(`[PLUGIN-API] ${id.slice(-8)}: ${pluginAnswer.status} ${pluginAnswer.answer ? '✓' : '⧗'} (${timeDifference.toFixed(1)}s)`);
    
    // If still processing, return enhanced loading state
    if (pluginAnswer.status === 'processing') {
      return NextResponse.json({
        success: true,
        answer: {
          ...pluginAnswer,
          processingTime: Math.floor(timeDifference),
          progress: Math.floor(progressPercentage),
          estimatedTimeRemaining: Math.floor(estimatedTimeRemaining),
          thinkingMessage: getThinkingMessage(timeDifference) + thinkingDots,
          isThinking: true
        },
        loading: true,
        message: `AI is working on your solution... ${Math.floor(progressPercentage)}% complete`
      }, {
        status: 202, // Accepted - still processing
        headers: { 
          ...corsHeaders, 
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }
    
    // If completed, failed, or timeout - return the final result
    return NextResponse.json({
      success: pluginAnswer.status === 'completed',
      answer: {
        ...pluginAnswer,
        processingTime: Math.floor(timeDifference),
        isThinking: false
      },
      loading: false,
      message: pluginAnswer.status === 'completed' ? 'Solution ready!' : 
               pluginAnswer.status === 'failed' ? 'Processing failed' :
               'Request timed out'
    }, {
      status: pluginAnswer.status === 'completed' ? 200 : 
              pluginAnswer.status === 'failed' ? 500 : 408,
      headers: { 
        ...corsHeaders, 
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error(`[PLUGIN-API] Error: ${error.message}`);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch answer: ' + error.message,
        loading: false,
        shouldRetry: true
      },
      { status: 500, headers: { ...corsHeaders, 'Cache-Control': 'no-cache, no-store, must-revalidate' } }
    );
  }
}

// Add OPTIONS handler for preflight requests
export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
} 