import apiService from './api';

interface ReviewData {
  rating: number;
  feedback?: string;
  userType: 'tenant' | 'landlord';
  timestamp: string;
  source: string;
  userId?: string;
}

class ReviewService {
  async submitReview(data: ReviewData) {
    try {
      const response = await apiService.post('/reviews', {
        ...data,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  }

  async getReviews(filters?: { userType?: string; rating?: number; source?: string }) {
    try {
      const response = await apiService.get('/reviews', filters);
      return response.data;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  }

  async getReviewStats() {
    try {
      const response = await apiService.get('/reviews/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching review stats:', error);
      throw error;
    }
  }
}

export default new ReviewService(); 