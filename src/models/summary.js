import mongoose from 'mongoose';

const summarySchema = new mongoose.Schema({
  useremail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  imageurl: {
    type: String,
    required: true,
    trim: true
  },
  jsonoutput: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add index for better query performance
summarySchema.index({ useremail: 1, createdAt: -1 });

const Summary = mongoose.models.Summary || mongoose.model('Summary', summarySchema);

export default Summary;
