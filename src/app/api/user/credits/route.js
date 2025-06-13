import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import dbConnect from '@/lib/mongoose';

export async function GET() {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Connect to database and get user
    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      credits: user.credits || 0,
      name: user.name,
      email: user.email,
      updatedAt: user.updatedAt
    });

  } catch (error) {
    console.error('Error fetching user credits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Connect to database
    await dbConnect();

    // Parse request body
    const { amount, description = 'Manual credit addition' } = await request.json();
    
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount - must be a positive number' },
        { status: 400 }
      );
    }

    // Find user and add credits
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const oldCredits = user.credits || 0;
    const newCredits = oldCredits + amount;

    // Update user credits
    user.credits = newCredits;
    user.updatedAt = new Date();
    await user.save();

    // Create transaction record
    try {
      const transaction = new Transaction({
        userId: user._id,
        userEmail: user.email,
        transactionId: Transaction.generateTransactionId(),
        type: 'bonus',
        creditsBefore: oldCredits,
        creditsAfter: newCredits,
        creditsChanged: amount,
        source: 'manual_adjustment',
        description: description,
        status: 'completed',
      });
      await transaction.save();
    } catch (transactionError) {
      console.error('Error creating transaction record:', transactionError);
      // Don't fail the main operation if transaction logging fails
    }

    return NextResponse.json({
      success: true,
      credits: newCredits,
      message: `Successfully added ${amount} credit(s)`
    });

  } catch (error) {
    console.error('Error adding user credits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Connect to database
    await dbConnect();

    // Parse request body
    const { amount, description = 'Credit usage' } = await request.json();
    
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount - must be a positive number' },
        { status: 400 }
      );
    }

    // Find user and deduct credits
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const oldCredits = user.credits || 0;

    // Check if user has enough credits
    if (oldCredits < amount) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 400 }
      );
    }

    const newCredits = oldCredits - amount;

    // Deduct credits
    user.credits = newCredits;
    user.updatedAt = new Date();
    await user.save();

    // Create transaction record
    try {
      const transaction = new Transaction({
        userId: user._id,
        userEmail: user.email,
        transactionId: Transaction.generateTransactionId(),
        type: 'credit_usage',
        creditsBefore: oldCredits,
        creditsAfter: newCredits,
        creditsChanged: -amount,
        source: 'usage',
        description: description,
        status: 'completed',
      });
      await transaction.save();
    } catch (transactionError) {
      console.error('Error creating transaction record:', transactionError);
      // Don't fail the main operation if transaction logging fails
    }

    return NextResponse.json({
      success: true,
      credits: newCredits,
      message: `Successfully deducted ${amount} credit(s)`
    });

  } catch (error) {
    console.error('Error deducting user credits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 