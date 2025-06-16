import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import adaAndImage from "@/models/adaAndImage.js";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

/**
 * POST /api/ada-store
 * body: { adaId, imageBase64 }
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const { adaId, imageBase64 } = await request.json();
    
    if (!adaId || !imageBase64) {
      return NextResponse.json(
        { error: "Missing adaId or imageBase64" },
        { status: 400 }
      );
    }

    // Check if adaId already exists
    const existingDoc = await adaAndImage.findOne({ ada: adaId });
    if (existingDoc) {
      // Update existing document
      existingDoc.image = imageBase64;
      await existingDoc.save();
      return NextResponse.json({ 
        success: true, 
        message: "Updated existing Ada-Image mapping",
        adaId 
      });
    }

    // Create new document
    const newDoc = new adaAndImage({
      ada: adaId,
      image: imageBase64,
    });

    await newDoc.save();
    
    return NextResponse.json({ 
      success: true, 
      message: "Ada-Image mapping created successfully",
      adaId 
    });
  } catch (error) {
    console.error("POST /api/ada-store error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ada-store?adaId=...
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const url = new URL(request.url);
    const adaId = url.searchParams.get("adaId");
    
    if (!adaId) {
      return NextResponse.json(
        { error: "Missing adaId parameter" },
        { status: 400 }
      );
    }

    const doc = await adaAndImage.findOne({ ada: adaId });
    
    if (!doc) {
      return NextResponse.json(
        { error: "Ada-Image mapping not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        adaId: doc.ada,
        imageBase64: doc.image,
        createdAt: doc.createdAt
      }
    });
  } catch (error) {
    console.error("GET /api/ada-store error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



