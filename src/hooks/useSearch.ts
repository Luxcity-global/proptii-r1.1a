import { useState } from 'react';
import { SearchService } from '../services/SearchService';

const searchService = SearchService.getInstance();

export const useSearch = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setLoadingProgress(0);
    setResponse(null); // Clear previous results

    try {
      // Start loading progress
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) return prev; // Don't go past 90% until complete
          return Math.min(prev + 10, 90);
        });
      }, 500);

      const results = await searchService.searchProperties(query);
      
      // Complete loading and set results
      clearInterval(progressInterval);
      setLoadingProgress(100);
      
      if (!results || results.length === 0) {
        setError('No properties found matching your search criteria.');
        return;
      }

      setResponse(results);
    } catch (err) {
      const error = err as Error;
      console.error('Search error:', error);
      
      // Set a user-friendly error message
      if (error.message.includes('not available')) {
        setError('Search service is currently unavailable. Please try again later.');
      } else if (error.message.includes('No response')) {
        setError('Unable to reach search service. Please check your internet connection and try again.');
      } else {
        setError('An error occurred while searching. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setLoadingProgress(0);
    }
  };

  return {
    query,
    setQuery,
    isLoading,
    error,
    response,
    loadingProgress,
    handleSearch
  };
}; 