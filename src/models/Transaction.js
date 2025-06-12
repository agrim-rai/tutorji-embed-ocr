import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  stripePaymentId: {
    type: String,
    required: true,
    unique: true,
  },
  stripeSessionId: {
    type: String,
    required: true,
  },
  planId: {
    type: String,
    required: true,
    enum: ['bronze', 'silver', 'gold'],
  },
  planName: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true, // Amount in smallest currency unit (paise for INR)
  },
  currency: {
    type: String,
    required: true,
    default: 'inr',
  },
  credits: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  billingPeriod: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ stripePaymentId: 1 });
TransactionSchema.index({ stripeSessionId: 1 });

// Update the updatedAt field before saving
TransactionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema); 