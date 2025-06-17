// src/app/api/vectors/store.js
// in-memory store
// export const vectorStore = []; 


// src/app/api/vectors/store.js
import dbConnect from '@/lib/mongoose';
import Vector    from '@/models/vector';

export async function addVector({ id, text, embedding }) {
  // ensure connection
  await dbConnect();

  // upsert by id so new calls overwrite the same id
  return Vector.findOneAndUpdate(
    { id },
    { text, embedding },
    { upsert: true, new: true }
  );
}

export async function getAllVectors() {
  await dbConnect();
  // return only id, text, embedding
  return Vector
    .find({}, { _id: 0, id: 1, text: 1, embedding: 1 })
    .lean();
}