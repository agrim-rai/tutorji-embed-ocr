import mongoose from 'mongoose';

const SatQuestionSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  imageId: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  aiResponse: {
    type: String,
    default: ''
  },
  questionText: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the timestamp on save
SatQuestionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Check if model already exists to prevent overwrite during hot reload
const SatQuestion = mongoose.models.SatQuestion || mongoose.model('SatQuestion', SatQuestionSchema);

export default SatQuestion; 