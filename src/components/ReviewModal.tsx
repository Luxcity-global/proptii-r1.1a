import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: 'tenant' | 'landlord';
  userId?: string;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, userType, userId }) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleStarHover = (starRating: number) => {
    setHoveredRating(starRating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (rating <= 3 && !feedback.trim()) {
      toast.error('Please provide feedback for your rating');
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit to Google Sheets
      console.log('Submitting review to:', import.meta.env.VITE_GOOGLE_SHEETS_API_ENDPOINT + '/submit');
      const response = await fetch(
        `${import.meta.env.VITE_GOOGLE_SHEETS_API_ENDPOINT}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            spreadsheetId: '1WBACyGHtXUMfD9UeCUYcBM-2McIB3UJywcYWSPwj5nk',
            data: {
              timestamp: new Date().toISOString(),
              rating: rating,
              feedback: feedback.trim() || 'No feedback provided',
              userType: userType,
              userId: userId || 'Anonymous',
              source: 'referencing_completion'
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit review');
      }
      
      toast.success('Thank you for your feedback!');
      onClose();
      
      // Reset form
      setRating(0);
      setFeedback('');
    } catch (error) {
      console.error('Failed to submit review:', error);
      // Fallback: store in localStorage as backup
      const reviewData = {
        rating,
        feedback: feedback.trim() || 'No feedback provided',
        userType,
        timestamp: new Date().toISOString(),
        source: 'referencing_completion',
        userId: userId || 'Anonymous'
      };
      
      const existingReviews = JSON.parse(localStorage.getItem('proptii_reviews') || '[]');
      existingReviews.push(reviewData);
      localStorage.setItem('proptii_reviews', JSON.stringify(existingReviews));
      
      toast.success('Thank you for your feedback!');
      onClose();
      
      // Reset form
      setRating(0);
      setFeedback('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
    // Reset form
    setRating(0);
    setFeedback('');
  };

  if (!isOpen) return null;

  const displayRating = hoveredRating || rating;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Rate Your Experience
          </h3>
          <button
            onClick={handleSkip}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 transition-colors"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6 text-center">
            How was your experience with the referencing process?
          </p>

          {/* Star Rating */}
          <div className="flex justify-center mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => handleStarHover(star)}
                onMouseLeave={handleStarLeave}
                className="p-1 transition-transform hover:scale-110"
                disabled={isSubmitting}
              >
                <Star
                  size={32}
                  className={`transition-colors ${
                    star <= displayRating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Rating Labels */}
          <div className="text-center mb-6">
            {rating > 0 && (
              <p className="text-sm text-gray-600">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Feedback Section (only show if rating is 1-3) */}
          {rating > 0 && rating <= 3 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please tell us how we can improve:
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Your feedback helps us improve our service..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleSkip}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-[#136C9E] text-white rounded-md hover:bg-[#0F5A82] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal; 