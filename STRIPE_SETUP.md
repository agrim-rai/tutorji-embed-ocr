# Stripe Payment Integration Setup Guide

This guide will help you set up the Stripe payment integration for the tutoring platform.

## 1. Prerequisites

- Stripe account (https://stripe.com)
- MongoDB database
- Next.js application with NextAuth configured

## 2. Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# NextAuth URL (required for Stripe redirects)
NEXTAUTH_URL=http://localhost:3000  # Change to your domain in production
```

## 3. Stripe Dashboard Configuration

### Step 1: Get API Keys
1. Log into your Stripe Dashboard
2. Go to Developers → API keys
3. Copy your Publishable key and Secret key
4. Add them to your environment variables

### Step 2: Configure Webhooks
1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. Set the endpoint URL to: `https://yourdomain.com/api/stripe/webhook`
4. Select the following events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret and add it to `STRIPE_WEBHOOK_SECRET`

## 4. Install Dependencies

The following Stripe dependencies have been added to your `package.json`:

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

## 5. Database Models

The integration includes:

### Transaction Model (`src/models/Transaction.js`)
- Tracks all payment transactions
- Links to user accounts
- Stores Stripe payment details
- Maintains audit trail

### Updated User Model
- Enhanced with credits field
- Automatic credit allocation

## 6. API Endpoints

### `/api/stripe/create-checkout-session`
- Creates secure Stripe checkout sessions
- Validates user authentication
- Includes proper metadata for webhook processing

### `/api/stripe/webhook`
- Handles Stripe webhook events
- Validates webhook signatures
- Automatically adds credits to user accounts
- Prevents duplicate processing

### `/api/user/credits`
- Returns current user credit balance
- Requires authentication

### `/api/user/transactions`
- Returns paginated transaction history
- Requires authentication

## 7. Frontend Integration

### Updated Pricing Component
- Integrated with Stripe checkout flow
- Real-time loading states
- Error handling
- User authentication checks

### Payment Success Page
- Confirms successful payments
- Shows updated credit balance
- Links to transaction history

## 8. Security Features

- ✅ Webhook signature validation
- ✅ User authentication required
- ✅ Server-side payment validation
- ✅ No client-side credit manipulation
- ✅ Encrypted payment processing
- ✅ Duplicate transaction prevention

## 9. Testing

### Test Cards (Stripe Test Mode)
- Success: `4242424242424242`
- Declined: `4000000000000002`
- Requires authentication: `4000002500003155`

### Testing Webhooks Locally
1. Install Stripe CLI: `npm install -g stripe`
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Copy the webhook signing secret to your environment variables

## 10. Production Deployment

### Before Going Live:
1. Switch to Stripe live keys
2. Update webhook endpoint URL
3. Verify SSL certificate
4. Test with real payment methods
5. Set up monitoring and logging

### Environment Variables for Production:
```bash
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
NEXTAUTH_URL=https://yourdomain.com
```

## 11. Plan Configuration

The plans are configured in `src/lib/stripe.js`:

- **Bronze**: 100 credits, ₹177/month, ₹1764/year
- **Silver**: 300 credits, ₹478/month, ₹4776/year  
- **Gold**: 1000 credits, ₹1416/month, ₹14160/year

To modify plans, update the `PLANS` object in `src/lib/stripe.js`.

## 12. Monitoring and Analytics

### Recommended Monitoring:
- Stripe Dashboard for payment analytics
- Database monitoring for transaction logs
- Error tracking for failed payments
- User credit usage analytics

### Transaction Logs
All transactions are logged in the `transactions` collection with:
- User ID
- Plan details
- Payment amounts
- Timestamps
- Stripe payment IDs

## 13. Support and Troubleshooting

### Common Issues:
1. **Webhook failures**: Check endpoint URL and signing secret
2. **Payment not completing**: Verify webhook events are configured
3. **Credits not added**: Check database connectivity and transaction logs
4. **Authentication errors**: Verify NextAuth configuration

### Debug Mode:
Enable detailed logging by checking the server console for:
- Webhook event processing
- Database operations
- Credit allocation confirmations

## 14. Additional Features

### Available for Implementation:
- Subscription management
- Refund handling
- Credit expiration
- Usage analytics
- Promotional codes
- Volume discounts

This integration provides a secure, production-ready payment system with comprehensive error handling and audit trails. 