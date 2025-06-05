import mongoose from 'mongoose';

const shareSchema = new mongoose.Schema({
  shareId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  imageUrl: {
    type: String,
    required: true,
    trim: true
  },
  summaryData: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  breakdownData: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  originalUserEmail: {
    type: String,
    required: false,
    trim: true,
    lowercase: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  }
});

// Add indexes for better query performance
shareSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired shares

const Share = mongoose.models.Share || mongoose.model('Share', shareSchema);

export default Share; 