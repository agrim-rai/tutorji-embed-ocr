import mongoose from 'mongoose';

const SuggestionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxLength: [100, 'Name must be less than 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.'],
    trim: true,
  },
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    enum: [
      'Feature Request',
      'Bug Report',
      'User Experience',
      'Performance',
      'Content Quality',
      'Mobile App',
      'Accessibility',
      'Integration',
      'General Feedback',
      'Other'
    ],
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxLength: [1000, 'Message must be less than 1000 characters'],
  },
  status: {
    type: String,
    enum: ['new', 'under-review', 'planned', 'in-progress', 'completed', 'rejected'],
    default: 'new',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  isStarred: {
    type: Boolean,
    default: false,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  adminNotes: {
    type: String,
    trim: true,
    maxLength: [1000, 'Admin notes must be less than 1000 characters'],
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

// Update the updatedAt field on save
SuggestionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Check if the model is already defined to prevent overwriting during hot reloads
export default mongoose.models.Suggestion || mongoose.model('Suggestion', SuggestionSchema); 