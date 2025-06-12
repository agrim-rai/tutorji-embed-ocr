import Stripe from 'stripe';

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: false,
});

// Plan configurations with Indian pricing
export const PLANS = {
  bronze: {
    id: 'bronze',
    name: 'Bronze',
    description: 'For students who are just starting out and testing their waters',
    credits: 100,
    monthly: {
      price: 17700, // ₹177 in paise
      currency: 'inr',
    },
    yearly: {
      price: 176400, // ₹147 * 12 = ₹1764 in paise
      currency: 'inr',
    },
  },
  silver: {
    id: 'silver',
    name: 'Silver',
    description: 'For students who are serious about their preparation',
    credits: 300,
    monthly: {
      price: 47800, // ₹478 in paise
      currency: 'inr',
    },
    yearly: {
      price: 477600, // ₹398 * 12 = ₹4776 in paise
      currency: 'inr',
    },
  },
  gold: {
    id: 'gold',
    name: 'Gold',
    description: 'For serious students preparing for competitive exams',
    credits: 1000,
    monthly: {
      price: 141600, // ₹1416 in paise
      currency: 'inr',
    },
    yearly: {
      price: 1416000, // ₹1180 * 12 = ₹14160 in paise
      currency: 'inr',
    },
  },
};

// Helper function to validate webhook signature
export function validateWebhookSignature(body, signature) {
  try {
    return stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }
}

// Helper function to format amount from paise to rupees
export function formatAmount(amountInPaise) {
  return (amountInPaise / 100).toFixed(2);
}

// Helper function to get plan details
export function getPlanDetails(planId, billingPeriod) {
  const plan = PLANS[planId];
  if (!plan) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }
  
  if (!plan[billingPeriod]) {
    throw new Error(`Invalid billing period: ${billingPeriod}`);
  }
  
  return {
    ...plan,
    price: plan[billingPeriod].price,
    currency: plan[billingPeriod].currency,
    billingPeriod,
  };
} 