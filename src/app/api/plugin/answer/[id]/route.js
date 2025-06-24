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
    
    console.log('Plugin Answer API: Fetching answer for ID:', id);
    
    // Connect to database
    await dbConnect();
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid answer ID format' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Find the plugin answer
    const pluginAnswer = await PluginAnswer.findById(id);
    
    if (!pluginAnswer) {
      return NextResponse.json(
        { error: 'Answer not found' },
        { status: 404, headers: corsHeaders }
      );
    }
    
    console.log('Plugin Answer API: Found answer:', pluginAnswer._id);
    
    return NextResponse.json({
      success: true,
      answer: pluginAnswer
    }, {
      status: 200,
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('Plugin Answer API: Error fetching answer:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch answer: ' + error.message },
      { status: 500, headers: corsHeaders }
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