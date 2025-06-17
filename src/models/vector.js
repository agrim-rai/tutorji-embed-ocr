// models/Vector.js
import mongoose from 'mongoose';

const VectorSchema = new mongoose.Schema({
  id:       { type: String, required: true, unique: true },
  text:     { type: String, required: true },
  embedding:{ type: [Number], required: true }
}, {
  timestamps: true
});

// Avoid recompiling model upon hot reload
export default mongoose.models.Vector || mongoose.model('Vector', VectorSchema);