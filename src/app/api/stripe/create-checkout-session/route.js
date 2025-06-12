import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { stripe, getPlanDetails } from '@/lib/stripe';
import connectDB from '@/lib/mongoose';
import User from '@/models/User';

export async function POST(request) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const { planId, billingPeriod } = await request.json();

    if (!planId || !billingPeriod) {
      return NextResponse.json(
        { error: 'Plan ID and billing period are required' },
        { status: 400 }
      );
    }

    // 3. Validate plan details
    let planDetails;
    try {
      planDetails = getPlanDetails(planId, billingPeriod);
    } catch (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // 4. Connect to database and get user
    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 5. Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: planDetails.currency,
            product_data: {
              name: `${planDetails.name} Plan - ${billingPeriod.charAt(0).toUpperCase() + billingPeriod.slice(1)}`,
              description: `${planDetails.description} - ${planDetails.credits} credits`,
              images: [], // Add your product images here if needed
            },
            unit_amount: planDetails.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: user._id.toString(),
        planId: planDetails.id,
        planName: planDetails.name,
        credits: planDetails.credits.toString(),
        billingPeriod: billingPeriod,
        userEmail: user.email,
      },
      success_url: `${process.env.NEXTAUTH_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pro?canceled=true`,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes expiry
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 