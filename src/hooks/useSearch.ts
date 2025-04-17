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

    try {
      // Simulate loading progress
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const results = await searchService.searchProperties(query);
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setResponse(results);
    } catch (err) {
      setError('Failed to fetch search results. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
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