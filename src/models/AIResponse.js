import mongoose from 'mongoose';

const AIResponseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  heading: {
    type: String,
    default: null,
  },
  imageId: {
    type: String,
    default: null,
  },
  imageUrl: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Check if the model is already defined to prevent overwriting during hot reloads
export default mongoose.models.AIResponse || mongoose.model('AIResponse', AIResponseSchema); 