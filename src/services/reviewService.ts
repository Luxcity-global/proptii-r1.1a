import axios from 'axios';

// Get the API URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://proptii-r1-1a.onrender.com/api';

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
      // First try to submit to Google Sheets (primary method)
      await this.submitToGoogleSheets(data);
      return { success: true, method: 'google_sheets' };
    } catch (sheetsError) {
      console.error('Error submitting to Google Sheets:', sheetsError);
      
      try {
        // Fallback to API endpoint
        const response = await axios.post(`${API_BASE_URL}/reviews`, {
          ...data,
          timestamp: new Date().toISOString()
        });
        return { ...response.data, method: 'api_fallback' };
      } catch (apiError) {
        console.error('Error submitting to API:', apiError);
        
        // Last resort: store in localStorage
        this.storeInLocalStorage(data);
        return { success: true, method: 'local_storage' };
      }
    }
  }

  async submitToGoogleSheets(data: ReviewData) {
    try {
      console.log('Submitting review to Google Sheets:', import.meta.env.VITE_GOOGLE_SHEETS_API_ENDPOINT + '/submit');
      
      const response = await fetch(
        `${import.meta.env.VITE_GOOGLE_SHEETS_API_ENDPOINT}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            spreadsheetId: '1WBACyGHtXUMfD9UeCUYcBM-2McIB3UJywcYWSPwj5nk', // Review spreadsheet ID
            data: {
              timestamp: data.timestamp,
              rating: data.rating,
              feedback: data.feedback || '',
              userType: data.userType,
              source: data.source,
              userId: data.userId || 'anonymous'
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit review to Google Sheets');
      }

      return await response.json();
    } catch (error) {
      console.error('Google Sheets submission error:', error);
      throw error;
    }
  }

  storeInLocalStorage(data: ReviewData) {
    try {
      const existingReviews = JSON.parse(localStorage.getItem('pending_reviews') || '[]');
      existingReviews.push(data);
      localStorage.setItem('pending_reviews', JSON.stringify(existingReviews));
      console.log('Review stored in localStorage as fallback');
    } catch (error) {
      console.error('Error storing review in localStorage:', error);
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