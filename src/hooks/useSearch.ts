import { useState, useCallback, useEffect } from 'react';
import { SearchService } from '../services/SearchService';
import { LocalStorageService } from '../services/LocalStorageService';

interface SearchState {
  suggestions: string[];
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
  retryCount: number;
  response: any[] | null;
  query: string;
}

export const useSearch = () => {
  const [state, setState] = useState<SearchState>({
    suggestions: [],
    isLoading: false,
    error: null,
    isOffline: false,
    retryCount: 0,
    response: null,
    query: ''
  });

  const localStorageService = LocalStorageService.getInstance();
  const searchService = SearchService.getInstance();

  const setQuery = useCallback((newQuery: string) => {
    setState(prev => ({ ...prev, query: newQuery }));
  }, []);

  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOffline: false }));
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOffline: true }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setState(prev => ({ ...prev, isOffline: !navigator.onLine }));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add abort controllers for cancellation
  let suggestionsAbortController: AbortController | null = null;
  let searchAbortController: AbortController | null = null;

  const getSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      const defaultSuggestions = localStorageService.getDefaultSuggestions();
      setState(prev => ({ ...prev, suggestions: defaultSuggestions, error: null }));
      return defaultSuggestions;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    // Cancel previous request
    if (suggestionsAbortController) {
      suggestionsAbortController.abort();
    }
    suggestionsAbortController = new AbortController();

    try {
      const suggestions = await searchService.getSuggestions(query, { signal: suggestionsAbortController.signal });
      setState(prev => ({
        ...prev,
        suggestions,
        isLoading: false,
        error: null,
        retryCount: 0
      }));
      return suggestions;
    } catch (error) {
      if (error.name === 'AbortError') return; // Ignore aborted requests
      // If offline or error, try to get cached suggestions
      const cachedSuggestions = localStorageService.get<string[]>(`suggestions_${query}`);
      if (cachedSuggestions) {
        setState(prev => ({
          ...prev,
          suggestions: cachedSuggestions,
          isLoading: false,
          error: null,
          retryCount: 0
        }));
        return cachedSuggestions;
      } else {
        setState(prev => ({
          ...prev,
          suggestions: [],
          isLoading: false,
          error: typeof error === 'string' ? error : (error instanceof Error ? error.message : 'Failed to get suggestions'),
          retryCount: prev.retryCount + 1
        }));
      }
    }
  }, [searchService]);

  const searchProperties = useCallback(async (query: string) => {
    if (!query.trim()) {
      throw new Error('Please enter a search query');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    // Cancel previous request
    if (searchAbortController) {
      searchAbortController.abort();
    }
    searchAbortController = new AbortController();

    try {
      const results = await searchService.searchProperties(query, { signal: searchAbortController.signal });
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        retryCount: 0,
        response: results
      }));
      return results;
    } catch (error) {
      if (error.name === 'AbortError') return; // Ignore aborted requests
      // If offline or error, try to get cached results
      const cachedResults = localStorageService.get<any[]>(`search_${query}`);
      if (cachedResults) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
          retryCount: 0,
          response: cachedResults
        }));
        return cachedResults;
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: typeof error === 'string' ? error : (error instanceof Error ? error.message : 'Failed to search properties'),
        retryCount: prev.retryCount + 1,
        response: null
      }));
      throw typeof error === 'string' ? error : (error instanceof Error ? error.message : 'Failed to search properties');
    }
  }, [searchService]);

  const retry = useCallback(() => {
    setState(prev => ({ ...prev, error: null, retryCount: 0 }));
  }, []);

  const handleSearch = useCallback(async () => {
    return searchProperties(state.query);
  }, [state.query, searchProperties]);

  // --- Saved Searches & History ---
  const saveSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    const historyKey = 'search_history';
    let history = localStorageService.get<string[]>(historyKey) || [];
    // Remove duplicates and keep most recent first
    history = [query, ...history.filter(q => q !== query)].slice(0, 10);
    localStorageService.set(historyKey, history);
  }, [localStorageService]);

  const getSearchHistory = useCallback((): string[] => {
    return localStorageService.get<string[]>('search_history') || [];
  }, [localStorageService]);

  return {
    ...state,
    getSuggestions,
    searchProperties,
    retry,
    setQuery,
    handleSearch,
    saveSearch,
    getSearchHistory
  };
}; 