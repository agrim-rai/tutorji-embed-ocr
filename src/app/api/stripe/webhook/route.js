import { NextResponse } from 'next/server';
import { stripe, validateWebhookSignature } from '@/lib/stripe';
import connectDB from '@/lib/mongoose';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function POST(request) {
  try {
    // 1. Get the raw body and signature
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // 2. Validate webhook signature
    let event;
    try {
      event = validateWebhookSignature(body, signature);
    } catch (error) {
      console.error('Webhook signature validation failed:', error.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // 3. Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session) {
  try {
    await connectDB();

    const { 
      id: sessionId,
      metadata,
      amount_total,
      currency,
      payment_intent,
      customer_email 
    } = session;

    // Extract metadata
    const { 
      userId, 
      planId, 
      planName, 
      credits, 
      billingPeriod,
      userEmail 
    } = metadata;

    console.log('Processing checkout session completed:', {
      sessionId,
      userId,
      planId,
      credits,
      amount_total
    });

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      console.error(`User not found: ${userId}`);
      return;
    }

    // Check if transaction already exists
    const existingTransaction = await Transaction.findOne({ 
      stripeSessionId: sessionId 
    });

    if (existingTransaction) {
      console.log(`Transaction already processed: ${sessionId}`);
      return;
    }

    // Create transaction record
    const transaction = new Transaction({
      userId: userId,
      stripePaymentId: payment_intent,
      stripeSessionId: sessionId,
      planId: planId,
      planName: planName,
      amount: amount_total,
      currency: currency,
      credits: parseInt(credits),
      paymentStatus: 'completed',
      billingPeriod: billingPeriod,
      metadata: metadata,
    });

    await transaction.save();

    // Add credits to user
    const creditsToAdd = parseInt(credits);
    user.credits = (user.credits || 0) + creditsToAdd;
    await user.save();

    console.log(`Successfully added ${creditsToAdd} credits to user ${userId}. New balance: ${user.credits}`);

  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    throw error;
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    await connectDB();

    // Update transaction status if needed
    const transaction = await Transaction.findOne({ 
      stripePaymentId: paymentIntent.id 
    });

    if (transaction && transaction.paymentStatus !== 'completed') {
      transaction.paymentStatus = 'completed';
      await transaction.save();
      console.log(`Updated transaction status to completed: ${paymentIntent.id}`);
    }

  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
    throw error;
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  try {
    await connectDB();

    // Update transaction status
    const transaction = await Transaction.findOne({ 
      stripePaymentId: paymentIntent.id 
    });

    if (transaction) {
      transaction.paymentStatus = 'failed';
      await transaction.save();
      console.log(`Updated transaction status to failed: ${paymentIntent.id}`);
    }

  } catch (error) {
    console.error('Error handling payment intent failed:', error);
    throw error;
  }
} 