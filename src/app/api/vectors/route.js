// // src/app/api/vectors/route.js
// import { NextResponse } from "next/server";
// import OpenAI from "openai";
// import { vectorStore } from "./store.js";

// const openai = new OpenAI();  
// // by default it reads process.env.OPENAI_API_KEY

// /**
//  * POST /api/vectors
//  * body: { id, text }
//  */
// export async function POST(request) {
//   try {
//     const { id, text } = await request.json();
//     if (id == null || !text) {
//       return NextResponse.json(
//         { error: "Missing id or text" },
//         { status: 400 }
//       );
//     }

//     // fetch ada embedding
//     const emRes = await openai.embeddings.create({
//       model: "text-embedding-ada-002",
//       input: text,
//     });
//     let emb = emRes.data[0].embedding;  // note structure in v4+

//     // normalize to unit length (cosine)
//     const len = Math.hypot(...emb);
//     emb = emb.map((x) => x / len);

//     // store
//     vectorStore.push({ id, text, embedding: emb });
//     return NextResponse.json({ success: true });
//   } catch (error) {
//     console.error("POST /api/vectors error", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// /**
//  * GET /api/vectors?q=…&k=…
//  */
// export async function GET(request) {
//   try {
//     const url = new URL(request.url);
//     const q = url.searchParams.get("q");
//     const k = parseInt(url.searchParams.get("k") || "5", 10);

//     if (!q) {
//       return NextResponse.json(
//         { error: "Missing query parameter `q`" },
//         { status: 400 }
//       );
//     }

//     // embed query
//     const emRes = await openai.embeddings.create({
//       model: "text-embedding-ada-002",
//       input: q,
//     });
//     let qemb = emRes.data[0].embedding;
//     const qlen = Math.hypot(...qemb);
//     qemb = qemb.map((x) => x / qlen);

//     // cosine similarity
//     const sims = vectorStore.map((doc) => {
//       const score = doc.embedding.reduce(
//         (sum, v, i) => sum + v * qemb[i],
//         0
//       );
//       return { id: doc.id, text: doc.text, score };
//     });

//     sims.sort((a, b) => b.score - a.score);
    
//     // Get the top result
//     const topResult = sims.length > 0 ? sims[0] : null;
    
//     return NextResponse.json({ 
//       results: sims.slice(0, k),
//       topResult: topResult
//     });
//   } catch (error) {
//     console.error("GET /api/vectors error", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// src/app/api/vectors/route.js
import { NextResponse } from 'next/server';
import OpenAI         from 'openai';
import { addVector, getAllVectors } from './store.js';

const openai = new OpenAI();  // reads process.env.OPENAI_API_KEY

/**
 * POST /api/vectors
 * body: { id: string, text: string }
 */
export async function POST(request) {
  try {
    const { id, text } = await request.json();
    if (!id || !text) {
      return NextResponse.json(
        { error: 'Missing id or text' },
        { status: 400 }
      );
    }

    // 1) get embedding
    const emRes = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text
    });
    let emb = emRes.data[0].embedding;

    // 2) normalize
    const norm = Math.hypot(...emb);
    emb = emb.map((x) => x / norm);

    // 3) persist
    await addVector({ id, text, embedding: emb });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/vectors error', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/vectors?q=…&k=…
 */
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('q');
    const k = parseInt(url.searchParams.get('k') || '5', 10);

    if (!q) {
      return NextResponse.json(
        { error: 'Missing query parameter `q`' },
        { status: 400 }
      );
    }

    // 1) embed the query
    const emRes = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: q
    });
    let qemb = emRes.data[0].embedding;
    const qnorm = Math.hypot(...qemb);
    qemb = qemb.map((x) => x / qnorm);

    // 2) load all stored vectors
    const docs = await getAllVectors();

    // 3) compute cosine similarities
    const sims = docs
      .map((doc) => {
        const score = doc.embedding.reduce(
          (sum, v, i) => sum + v * qemb[i],
          0
        );
        return { id: doc.id, text: doc.text, score };
      })
      .sort((a, b) => b.score - a.score);

    return NextResponse.json({
      results:   sims.slice(0, k),
      topResult: sims[0] || null
    });
  } catch (err) {
    console.error('GET /api/vectors error', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}