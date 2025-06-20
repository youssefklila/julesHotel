import { query } from '../db';
import { 
  Review, 
  INSERT_REVIEW, 
  GET_ALL_REVIEWS, 
  GET_REVIEW_BY_ID,
  COUNT_ALL_REVIEWS
} from '../schema';

export class ReviewService {
  static async createReview(review: Omit<Review, 'id' | 'submittedAt'>, createdBy: string): Promise<Review> {
    const result = await query<Review>(INSERT_REVIEW, [
      review.fullName,
      review.nationality,
      review.age,
      review.roomNumber,
      review.overallRating,
      review.recommend,
      review.visitAgain,
      review.services,
      review.suggestions || null,
      createdBy
    ]);
    
    return result[0];
  }

  static async getAllReviews(limit: number = 10, offset: number = 0): Promise<{ reviews: Review[], total: number }> {
    const [reviews, countResult] = await Promise.all([
      query<Review>(GET_ALL_REVIEWS, [limit, offset]),
      query<{ total: string }>(COUNT_ALL_REVIEWS, [])
    ]);
    
    return {
      reviews,
      total: parseInt(countResult[0]?.total || '0', 10)
    };
  }

  static async getReviewById(id: string): Promise<Review | null> {
    const result = await query<Review>(GET_REVIEW_BY_ID, [id]);
    return result[0] || null;
  }
}
