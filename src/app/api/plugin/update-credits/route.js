import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
// import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongoose';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  try {
    // Get session from NextAuth
    const session = await getServerSession(authOptions);
    
    // If no session, return false (not logged in)
    if (!session || !session.user?.email) {
      return NextResponse.json({ loggedIn: false }, { status: 200 });
    }

    // Connect to database
    await connectToDatabase();

    // Find user by email
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ loggedIn: false }, { status: 200 });
    }

    // Return user's credits
    return NextResponse.json({
      loggedIn: true,
      credits: user.credits || 0,
      email: session.user.email,
      name: session.user.name || null
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching user credits:', error);
    return NextResponse.json(
      { error: 'Internal server error', loggedIn: false },
      { status: 500 }
    );
  }
}

// Handle CORS for Chrome extension
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
