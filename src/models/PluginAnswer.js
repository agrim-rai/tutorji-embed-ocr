import mongoose from 'mongoose';

const PluginAnswerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional for anonymous users
  },
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required'],
  },
  imageId: {
    type: String,
    required: [true, 'Image ID is required'],
  },
  question: {
    type: String,
    required: false, // Auto-extracted from image
  },
  answer: {
    type: String,
    required: false, // Not required initially, only after processing
  },
  metadata: {
    type: {
      processing_time: Number,
      model_used: String,
      confidence: Number,
      image_analysis: Object,
    },
    default: {},
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing',
  },
  error_message: {
    type: String,
    default: null,
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

// Update the updatedAt field before saving
PluginAnswerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Custom validation: answer is required when status is 'completed'
PluginAnswerSchema.pre('save', function(next) {
  if (this.status === 'completed' && !this.answer) {
    const error = new Error('Answer is required when status is completed');
    return next(error);
  }
  next();
});

// Create indexes for better performance
PluginAnswerSchema.index({ userId: 1, createdAt: -1 });
PluginAnswerSchema.index({ createdAt: -1 });
PluginAnswerSchema.index({ status: 1 });

// Check if the model is already defined to prevent overwriting during hot reloads
export default mongoose.models.PluginAnswer || mongoose.model('PluginAnswer', PluginAnswerSchema); 