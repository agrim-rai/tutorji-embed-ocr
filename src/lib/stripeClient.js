import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with publishable key
let stripePromise;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// Helper function to handle checkout redirect
export const redirectToCheckout = async (sessionId) => {
  const stripe = await getStripe();
  
  if (!stripe) {
    throw new Error('Stripe failed to initialize');
  }

  const { error } = await stripe.redirectToCheckout({
    sessionId: sessionId,
  });

  if (error) {
    throw new Error(error.message);
  }
};

// Helper function to create checkout session and redirect
export const initiateCheckout = async (planId, billingPeriod) => {
  try {
    // Create checkout session
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId,
        billingPeriod,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    const { sessionId, url } = await response.json();

    // Redirect to Stripe Checkout
    if (url) {
      window.location.href = url;
    } else {
      await redirectToCheckout(sessionId);
    }

  } catch (error) {
    console.error('Checkout error:', error);
    throw error;
  }
}; 