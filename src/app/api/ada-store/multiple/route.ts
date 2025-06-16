import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import adaAndImage from "@/models/adaAndImage.js";
import { NextResponse, NextRequest } from "next/server";

/**
 * GET /api/ada-store/multiple?adaIds=id1,id2,id3
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const url = new URL(request.url);
    const adaIdsParam = url.searchParams.get("adaIds");
    
    if (!adaIdsParam) {
      return NextResponse.json(
        { error: "Missing adaIds parameter" },
        { status: 400 }
      );
    }

    const adaIds = adaIdsParam.split(',').map(id => id.trim());
    const docs = await adaAndImage.find({ ada: { $in: adaIds } });
    
    const result = docs.map(doc => ({
      adaId: doc.ada,
      imageBase64: doc.image,
      createdAt: doc.createdAt
    }));

    return NextResponse.json({ 
      success: true, 
      data: result
    });
  } catch (error) {
    console.error("GET /api/ada-store/multiple error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 