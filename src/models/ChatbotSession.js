import mongoose from 'mongoose';

// Clear existing model to avoid conflicts
if (mongoose.models.ChatbotSession) {
  delete mongoose.models.ChatbotSession;
}

const ChatbotSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
  },
  jsonData: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Optional: add expiration after 30 days
  expiresAt: {
    type: Date,
    default: Date.now,
    expires: 2592000, // 30 days in seconds
  },
}, { strict: false });

export default mongoose.model('ChatbotSession', ChatbotSessionSchema); 