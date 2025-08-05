import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Suggestion from '@/models/Suggestion';
import mongoose from 'mongoose';

// PATCH /api/suggestions/[id] - Update a suggestion
export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid suggestion ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Define allowed fields for update
    const allowedUpdates = [
      'status', 'priority', 'isStarred', 'isArchived', 'adminNotes'
    ];
    
    // Filter body to only include allowed fields
    const updates = {};
    Object.keys(body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update the suggestion
    const suggestion = await Suggestion.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { 
        new: true, 
        runValidators: true 
      }
    );

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Suggestion updated successfully', 
        suggestion 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating suggestion:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/suggestions/[id] - Delete a suggestion
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid suggestion ID' },
        { status: 400 }
      );
    }

    // Delete the suggestion
    const suggestion = await Suggestion.findByIdAndDelete(id);

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Suggestion deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting suggestion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/suggestions/[id] - Get a specific suggestion
export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid suggestion ID' },
        { status: 400 }
      );
    }

    const suggestion = await Suggestion.findById(id);

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ suggestion }, { status: 200 });
  } catch (error) {
    console.error('Error fetching suggestion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 