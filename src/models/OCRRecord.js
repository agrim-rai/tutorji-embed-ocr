import mongoose from 'mongoose';

const OCRRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.'],
  },
  imageUrl: {
    type: String,
    required: false, // Optional since image could be base64 or file upload
  },
  imageText: {
    type: String,
    required: true,
  },
  pageName: {
    type: String,
    required: false,
    default: 'Unknown',
  },
  inputType: {
    type: String,
    enum: ['base64', 'file', 'url'],
    required: true,
  },
  metadata: {
    mimeType: String,
    fileSize: Number,
    originalFileName: String,
  },
  airesponseID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIResponse',
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

// Index for efficient queries
OCRRecordSchema.index({ userId: 1, createdAt: -1 });
OCRRecordSchema.index({ userEmail: 1 });
OCRRecordSchema.index({ pageName: 1 });

// Update the updatedAt field before saving
OCRRecordSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.OCRRecord || mongoose.model('OCRRecord', OCRRecordSchema); 