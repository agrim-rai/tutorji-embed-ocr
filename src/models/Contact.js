import mongoose from 'mongoose';

const ContactSchema = new mongoose.Schema({
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
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    enum: [
      'General Inquiry',
      'Technical Support',
      'Account Issue',
      'Billing Question',
      'Feature Request',
      'Bug Report',
      'Partnership',
      'Press & Media',
      'Other'
    ],
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxLength: [2000, 'Message must be less than 2000 characters'],
  },
  phone: {
    type: String,
    trim: true,
    maxLength: [20, 'Phone number must be less than 20 characters'],
  },
  company: {
    type: String,
    trim: true,
    maxLength: [100, 'Company name must be less than 100 characters'],
  },
  isUrgent: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved'],
    default: 'pending',
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
  notes: {
    type: String,
    trim: true,
    maxLength: [1000, 'Notes must be less than 1000 characters'],
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
ContactSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Check if the model is already defined to prevent overwriting during hot reloads
export default mongoose.models.Contact || mongoose.model('Contact', ContactSchema); 