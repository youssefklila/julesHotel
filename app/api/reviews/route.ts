import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { INSERT_REVIEW, GET_ALL_REVIEWS, COUNT_ALL_REVIEWS, Review } from '@/lib/schema';

// Helper function to get the current user ID from the session
const getCurrentUserId = (request: NextRequest): string | null => {
  // This is a placeholder - you'll need to implement proper session handling
  // For now, we'll return null and handle it in the route handlers
  return null;
};

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['overallRating', 'services'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Set default values for optional fields
    const reviewData = {
      fullName: body.fullName || 'Anonymous',
      nationality: body.nationality || 'Not specified',
      age: body.age || null,
      roomNumber: body.roomNumber || 'N/A',
      overallRating: body.overallRating,
      recommend: body.recommend === true,
      visitAgain: body.visitAgain === true,
      services: body.services,
      suggestions: body.suggestions || null,
      createdBy: getCurrentUserId(request) || '00000000-0000-0000-0000-000000000001' // Fallback to admin user
    };

    // Insert the review into the database
    const result = await query(INSERT_REVIEW, [
      reviewData.fullName,
      reviewData.nationality,
      reviewData.age,
      reviewData.roomNumber,
      reviewData.overallRating,
      reviewData.recommend,
      reviewData.visitAgain,
      JSON.stringify(reviewData.services),
      reviewData.suggestions,
      reviewData.createdBy
    ]);

    if (!result || result.length === 0) {
      throw new Error('Failed to insert review');
    }

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}

// GET /api/reviews - Get all reviews with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    // Get paginated reviews from the database
    const reviews = await query(GET_ALL_REVIEWS, [limit, offset]);
    
    // Get total count for pagination
    const countResult = await query(COUNT_ALL_REVIEWS);
    const total = parseInt(countResult[0]?.total || '0', 10);
    
    return NextResponse.json({
      data: reviews || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
