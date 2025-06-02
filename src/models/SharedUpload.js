import mongoose from 'mongoose';

const SharedUploadSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required'],
  },
  sessionId: {
    type: String,
    required: [true, 'Session ID is required'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional, for tracking who created the share
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Optional: add expiration after 90 days for shared uploads
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now
    },
    expires: 0, // This field will automatically delete documents when expiresAt is reached
  },
});

// Create index for faster lookups
SharedUploadSchema.index({ sessionId: 1 });
SharedUploadSchema.index({ createdAt: 1 });

// Check if the model is already defined to prevent overwriting during hot reloads
export default mongoose.models.SharedUpload || mongoose.model('SharedUpload', SharedUploadSchema); 