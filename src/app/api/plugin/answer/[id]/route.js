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
    
    console.log(`[PLUGIN-API] ${id.slice(-8)}: ${pluginAnswer.status} ${pluginAnswer.answer ? '✓' : '⧗'}`);
    
    return NextResponse.json({
      success: true,
      answer: pluginAnswer
    }, {
      status: 200,
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
      { error: 'Failed to fetch answer: ' + error.message },
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