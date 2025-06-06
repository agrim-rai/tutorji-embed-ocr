import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Rating from '@/models/Rating';

// Database connection
async function connectDB() {
  if (mongoose.connections[0].readyState) {
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const filters = await request.json();

    // Build filter query from request body
    const filter: any = {};
    
    if (filters.dateFrom) {
      filter.createdAt = { $gte: new Date(filters.dateFrom) };
    }
    
    if (filters.dateTo) {
      filter.createdAt = { 
        ...filter.createdAt, 
        $lte: new Date(filters.dateTo) 
      };
    }
    
    if (filters.ratingType) {
      filter.ratingType = filters.ratingType;
    }
    
    if (filters.minRating) {
      filter.rating = { $gte: parseInt(filters.minRating) };
    }
    
    if (filters.maxRating) {
      filter.rating = { 
        ...filter.rating, 
        $lte: parseInt(filters.maxRating) 
      };
    }
    
    if (filters.imageUrl) {
      filter.imageUrl = { $regex: filters.imageUrl, $options: 'i' };
    }
    
    if (filters.userEmail) {
      filter.userEmail = { $regex: filters.userEmail, $options: 'i' };
    }

    // Fetch all matching ratings
    const ratings = await Rating.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Convert to CSV
    const csvData = convertToCSV(ratings);

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="ratings-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Error exporting ratings:', error);
    return NextResponse.json(
      { error: 'Failed to export ratings' },
      { status: 500 }
    );
  }
}

function convertToCSV(ratings: any[]): string {
  if (ratings.length === 0) {
    return 'No data available for export';
  }

  // CSV Headers
  const headers = [
    'ID',
    'User Email',
    'Image URL',
    'Session ID',
    'Rating',
    'Rating Label',
    'Rating Type',
    'User Agent',
    'IP Address',
    'Created At',
    'Updated At'
  ];

  // Helper function to escape CSV values
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    
    const stringValue = String(value);
    
    // If the value contains comma, newline, or double quote, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  };

  // Helper function to get rating label
  const getRatingLabel = (rating: number): string => {
    const labels = {
      1: 'Poor',
      2: 'Fair', 
      3: 'Good',
      4: 'Great',
      5: 'Excellent'
    };
    return labels[rating as keyof typeof labels] || 'Unknown';
  };

  // Create CSV rows
  const rows = ratings.map(rating => [
    escapeCSV(rating._id),
    escapeCSV(rating.userEmail || ''),
    escapeCSV(rating.imageUrl),
    escapeCSV(rating.sessionId || ''),
    escapeCSV(rating.rating),
    escapeCSV(getRatingLabel(rating.rating)),
    escapeCSV(rating.ratingType),
    escapeCSV(rating.userAgent || ''),
    escapeCSV(rating.ipAddress || ''),
    escapeCSV(new Date(rating.createdAt).toISOString()),
    escapeCSV(new Date(rating.updatedAt).toISOString())
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
} 