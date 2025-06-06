import mongoose from 'mongoose';

const RatingSchema = new mongoose.Schema({
  // User information
  userEmail: {
    type: String,
    required: false, // Allow anonymous ratings
    index: true
  },
  
  // Image/session information
  imageUrl: {
    type: String,
    required: true,
    index: true
  },
  
  sessionId: {
    type: String,
    required: false,
    index: true
  },
  
  // Rating data
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: function(v) {
        return Number.isInteger(v) && v >= 1 && v <= 5;
      },
      message: 'Rating must be an integer between 1 and 5'
    }
  },
  
  // Additional context
  ratingType: {
    type: String,
    default: 'breakdown_experience',
    enum: ['breakdown_experience', 'interactive_learning', 'overall']
  },
  
  // Device/browser info for analytics
  userAgent: {
    type: String,
    required: false
  },
  
  ipAddress: {
    type: String,
    required: false
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // Automatically handle createdAt and updatedAt
  collection: 'ratings'
});

// Compound indexes for efficient queries
RatingSchema.index({ userEmail: 1, imageUrl: 1 });
RatingSchema.index({ imageUrl: 1, createdAt: -1 });
RatingSchema.index({ rating: 1, createdAt: -1 });

// Virtual for rating label
RatingSchema.virtual('ratingLabel').get(function() {
  const labels = {
    1: 'Poor',
    2: 'Fair', 
    3: 'Good',
    4: 'Great',
    5: 'Excellent'
  };
  return labels[this.rating] || 'Unknown';
});

// Static method to get average rating for an image
RatingSchema.statics.getAverageRating = async function(imageUrl) {
  const result = await this.aggregate([
    { $match: { imageUrl } },
    { 
      $group: { 
        _id: '$imageUrl',
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 }
      }
    }
  ]);
  
  return result.length > 0 ? result[0] : { averageRating: 0, totalRatings: 0 };
};

// Static method to check if user already rated an image
RatingSchema.statics.hasUserRated = async function(userEmail, imageUrl) {
  if (!userEmail) return false;
  
  const existing = await this.findOne({ userEmail, imageUrl });
  return !!existing;
};

// Update the updatedAt field before saving
RatingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Ensure virtual fields are serialized
RatingSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.models.Rating || mongoose.model('Rating', RatingSchema); 