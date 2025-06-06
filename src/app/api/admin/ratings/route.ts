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

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build filter query
    const filter: any = {};
    
    if (searchParams.get('dateFrom')) {
      filter.createdAt = { $gte: new Date(searchParams.get('dateFrom')!) };
    }
    
    if (searchParams.get('dateTo')) {
      filter.createdAt = { 
        ...filter.createdAt, 
        $lte: new Date(searchParams.get('dateTo')!) 
      };
    }
    
    if (searchParams.get('ratingType')) {
      filter.ratingType = searchParams.get('ratingType');
    }
    
    if (searchParams.get('minRating')) {
      filter.rating = { $gte: parseInt(searchParams.get('minRating')!) };
    }
    
    if (searchParams.get('maxRating')) {
      filter.rating = { 
        ...filter.rating, 
        $lte: parseInt(searchParams.get('maxRating')!) 
      };
    }
    
    if (searchParams.get('imageUrl')) {
      filter.imageUrl = { $regex: searchParams.get('imageUrl'), $options: 'i' };
    }
    
    if (searchParams.get('userEmail')) {
      filter.userEmail = { $regex: searchParams.get('userEmail'), $options: 'i' };
    }

    // Fetch ratings with pagination
    const ratings = await Rating.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Generate comprehensive statistics
    const stats = await generateStats(filter);

    return NextResponse.json({
      ratings: ratings.map(rating => ({
        ...rating,
        id: (rating._id as any).toString(),
        ratingLabel: getRatingLabel(rating.rating)
      })),
      stats,
      pagination: {
        page,
        limit,
        total: await Rating.countDocuments(filter)
      }
    });

  } catch (error) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    );
  }
}

async function generateStats(filter: any) {
  const totalRatings = await Rating.countDocuments(filter);
  
  // Average rating
  const avgResult = await Rating.aggregate([
    { $match: filter },
    { $group: { _id: null, averageRating: { $avg: '$rating' } } }
  ]);
  const averageRating = avgResult[0]?.averageRating || 0;

  // Rating distribution
  const ratingDistribution = await Rating.aggregate([
    { $match: filter },
    { 
      $group: { 
        _id: '$rating', 
        count: { $sum: 1 } 
      } 
    },
    { $sort: { _id: 1 } }
  ]);

  const distributionWithPercentage = ratingDistribution.map(item => ({
    rating: item._id,
    count: item.count,
    percentage: totalRatings > 0 ? (item.count / totalRatings) * 100 : 0
  }));

  // Fill missing ratings (1-5) with 0 count
  const completeDistribution = [];
  for (let i = 1; i <= 5; i++) {
    const existing = distributionWithPercentage.find(item => item.rating === i);
    completeDistribution.push(existing || { rating: i, count: 0, percentage: 0 });
  }

  // Ratings by type
  const ratingsByType = await Rating.aggregate([
    { $match: filter },
    { 
      $group: { 
        _id: '$ratingType', 
        count: { $sum: 1 },
        averageRating: { $avg: '$rating' }
      } 
    }
  ]);

  const typeStats = ratingsByType.map(item => ({
    type: item._id,
    count: item.count,
    averageRating: item.averageRating
  }));

  // Daily ratings trend (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyRatings = await Rating.aggregate([
    { 
      $match: { 
        ...filter,
        createdAt: { $gte: thirtyDaysAgo }
      } 
    },
    {
      $group: {
        _id: { 
          $dateToString: { 
            format: '%Y-%m-%d', 
            date: '$createdAt' 
          } 
        },
        count: { $sum: 1 },
        averageRating: { $avg: '$rating' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const dailyStats = dailyRatings.map(item => ({
    date: item._id,
    count: item.count,
    averageRating: item.averageRating
  }));

  // Top rated images
  const topRatedImages = await Rating.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$imageUrl',
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 }
      }
    },
    { $match: { totalRatings: { $gte: 2 } } }, // At least 2 ratings
    { $sort: { averageRating: -1, totalRatings: -1 } },
    { $limit: 10 }
  ]);

  const topImages = topRatedImages.map(item => ({
    imageUrl: item._id,
    averageRating: item.averageRating,
    totalRatings: item.totalRatings
  }));

  return {
    totalRatings,
    averageRating,
    ratingDistribution: completeDistribution,
    ratingsByType: typeStats,
    dailyRatings: dailyStats,
    topRatedImages: topImages
  };
}

function getRatingLabel(rating: number): string {
  const labels = {
    1: 'Poor',
    2: 'Fair', 
    3: 'Good',
    4: 'Great',
    5: 'Excellent'
  };
  return labels[rating as keyof typeof labels] || 'Unknown';
} 