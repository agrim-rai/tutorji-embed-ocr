import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
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
  userName: {
    type: String,
    required: true,
  },

  // Payment Details
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
  razorpayPaymentId: {
    type: String,
    sparse: true, // Allows null values but ensures uniqueness when present
  },
  razorpaySignature: {
    type: String,
  },

  // Transaction Information
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  credits: {
    type: Number,
    required: true,
  },
  planType: {
    type: String,
    enum: ['bronze', 'silver', 'gold'],
    required: true,
  },

  // Payment Status
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'cancelled'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    default: 'razorpay',
  },

  // Verification
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationAttempts: {
    type: Number,
    default: 0,
  },

  // Error Handling
  errorMessage: {
    type: String,
  },
  failureReason: {
    type: String,
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },

  // Metadata
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  receipt: {
    type: String,
  },
});

// Indexes for better query performance
PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ razorpayPaymentId: 1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ userEmail: 1, createdAt: -1 });

// Update the updatedAt field before saving
PaymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for payment duration
PaymentSchema.virtual('duration').get(function() {
  if (this.completedAt) {
    return this.completedAt - this.createdAt;
  }
  return null;
});

// Static method to get payment statistics
PaymentSchema.statics.getPaymentStats = async function(userId) {
  return await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalCredits: { $sum: '$credits' }
      }
    }
  ]);
};

// Instance method to mark payment as successful
PaymentSchema.methods.markSuccess = function(paymentId, signature) {
  this.status = 'success';
  this.razorpayPaymentId = paymentId;
  this.razorpaySignature = signature;
  this.isVerified = true;
  this.completedAt = new Date();
  return this.save();
};

// Instance method to mark payment as failed
PaymentSchema.methods.markFailed = function(errorMessage, failureReason) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  this.failureReason = failureReason;
  this.completedAt = new Date();
  return this.save();
};

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema); 