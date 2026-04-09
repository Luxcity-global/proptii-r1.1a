import axios from 'axios';
import { PRIMARY_API_BASE_URL } from '../utils/apiEndpoints';

// Get the API URL from environment variables
const API_BASE_URL = PRIMARY_API_BASE_URL;

console.log('Review Service using API URL:', API_BASE_URL);

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
      const response = await axios.post(`${API_BASE_URL}/reviews`, {
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
      const response = await axios.get(`${API_BASE_URL}/reviews`, {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  }

  async getReviewStats() {
    try {
      const response = await axios.get(`${API_BASE_URL}/reviews/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching review stats:', error);
      throw error;
    }
  }
}

export default new ReviewService(); 