import mongoose from 'mongoose';

const breakdownSchema = new mongoose.Schema({
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
breakdownSchema.index({ useremail: 1, createdAt: -1 });

const Breakdown = mongoose.models.Breakdown || mongoose.model('Breakdown', breakdownSchema);

export default Breakdown;
