import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },

  // Transaction Details
  transactionId: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ['credit_purchase', 'credit_usage', 'refund', 'bonus', 'adjustment'],
    required: true,
  },
  
  // Amount and Credits
  creditsBefore: {
    type: Number,
    required: true,
  },
  creditsAfter: {
    type: Number,
    required: true,
  },
  creditsChanged: {
    type: Number,
    required: true,
  },
  
  // Related Payment (if applicable)
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  },
  orderId: {
    type: String,
  },
  
  // Transaction Source
  source: {
    type: String,
    enum: ['payment', 'manual_adjustment', 'refund', 'bonus', 'usage'],
    required: true,
  },
  
  // Description and Metadata
  description: {
    type: String,
    required: true,
  },
  metadata: {
    planType: String,
    amount: Number,
    currency: String,
    adminUserId: mongoose.Schema.Types.ObjectId,
    reason: String,
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'reversed'],
    default: 'completed',
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  processedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for better query performance
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ transactionId: 1 });
TransactionSchema.index({ type: 1, createdAt: -1 });
TransactionSchema.index({ paymentId: 1 });
TransactionSchema.index({ status: 1 });

// Static method to generate unique transaction ID
TransactionSchema.statics.generateTransactionId = function() {
  return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
};

// Static method to create credit purchase transaction
TransactionSchema.statics.createCreditPurchase = async function(userId, userEmail, credits, paymentId, orderId, planType, amount) {
  const User = mongoose.model('User');
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const transactionId = this.generateTransactionId();
  
  const transaction = new this({
    userId,
    userEmail,
    transactionId,
    type: 'credit_purchase',
    creditsBefore: user.credits,
    creditsAfter: user.credits + credits,
    creditsChanged: credits,
    paymentId,
    orderId,
    source: 'payment',
    description: `Purchased ${credits} credits via ${planType} plan`,
    metadata: {
      planType,
      amount,
      currency: 'INR',
    },
    status: 'completed',
  });
  
  return await transaction.save();
};

// Static method to create credit usage transaction
TransactionSchema.statics.createCreditUsage = async function(userId, userEmail, creditsUsed, description, metadata = {}) {
  const User = mongoose.model('User');
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  if (user.credits < creditsUsed) {
    throw new Error('Insufficient credits');
  }
  
  const transactionId = this.generateTransactionId();
  
  const transaction = new this({
    userId,
    userEmail,
    transactionId,
    type: 'credit_usage',
    creditsBefore: user.credits,
    creditsAfter: user.credits - creditsUsed,
    creditsChanged: -creditsUsed,
    source: 'usage',
    description,
    metadata,
    status: 'completed',
  });
  
  return await transaction.save();
};

// Static method to get user transaction history
TransactionSchema.statics.getUserTransactionHistory = async function(userId, limit = 50, skip = 0) {
  return await this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('paymentId')
    .exec();
};

// Static method to get user credit summary
TransactionSchema.statics.getUserCreditSummary = async function(userId) {
  const summary = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$type',
        totalCredits: { $sum: '$creditsChanged' },
        transactionCount: { $sum: 1 },
        lastTransaction: { $max: '$createdAt' }
      }
    }
  ]);
  
  return summary;
};

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema); 