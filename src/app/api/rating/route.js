import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Rating from '@/models/Rating';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/rating
 * Submit a rating for a step breakdown experience
 */
export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    const { rating, imageUrl, ratingType = 'breakdown_experience' } = body;

    // Validate required fields
    if (!rating || !imageUrl) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rating and image URL are required' 
        },
        { status: 400 }
      );
    }

    // Validate rating value
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rating must be an integer between 1 and 5' 
        },
        { status: 400 }
      );
    }

    // Get user session (if available)
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email || null;

    // Get user agent and IP for analytics
    const userAgent = request.headers.get('user-agent') || '';
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(/, /)[0] : 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Connect to database
    await dbConnect();

    // Check if user already rated this image (prevent duplicate ratings)
    if (userEmail) {
      const existingRating = await Rating.findOne({ userEmail, imageUrl });
      if (existingRating) {
        // Update existing rating instead of creating new one
        existingRating.rating = rating;
        existingRating.ratingType = ratingType;
        existingRating.userAgent = userAgent;
        existingRating.ipAddress = ipAddress;
        existingRating.updatedAt = new Date();
        
        await existingRating.save();
        
        return NextResponse.json({
          success: true,
          message: 'Rating updated successfully',
          data: {
            ratingId: existingRating.id,
            rating: existingRating.rating,
            ratingLabel: existingRating.ratingLabel,
            updated: true
          }
        });
      }
    }

    // Create new rating
    const newRating = new Rating({
      userEmail,
      imageUrl,
      rating,
      ratingType,
      userAgent,
      ipAddress
    });

    await newRating.save();

    // Get average rating for this image
    const averageData = await Rating.getAverageRating(imageUrl);

    return NextResponse.json({
      success: true,
      message: 'Thank you for your rating!',
      data: {
        ratingId: newRating.id,
        rating: newRating.rating,
        ratingLabel: newRating.ratingLabel,
        imageStats: {
          averageRating: Math.round(averageData.averageRating * 10) / 10,
          totalRatings: averageData.totalRatings
        }
      }
    });

  } catch (error) {
    console.error('Rating submission error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to submit rating. Please try again.' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rating?imageUrl=...
 * Get rating statistics for an image
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('imageUrl');

    if (!imageUrl) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Image URL is required' 
        },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Get average rating and stats
    const averageData = await Rating.getAverageRating(imageUrl);
    
    // Get rating distribution
    const distribution = await Rating.aggregate([
      { $match: { imageUrl } },
      { 
        $group: { 
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format distribution for easy use
    const ratingDistribution = {};
    for (let i = 1; i <= 5; i++) {
      ratingDistribution[i] = 0;
    }
    distribution.forEach(item => {
      ratingDistribution[item._id] = item.count;
    });

    return NextResponse.json({
      success: true,
      data: {
        averageRating: Math.round(averageData.averageRating * 10) / 10,
        totalRatings: averageData.totalRatings,
        distribution: ratingDistribution
      }
    });

  } catch (error) {
    console.error('Rating fetch error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch rating data' 
      },
      { status: 500 }
    );
  }
} 