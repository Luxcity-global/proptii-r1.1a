import { useState, useCallback, useEffect } from 'react';
import { getResolvedApiBaseUrl } from '../config/apiBaseUrl';
import { resolveSearchBackendUrl } from '../utils/searchBackendUrl';

// Function to clean up property pricing - remove "Tenancy Info" and keep only pcm pricing
const cleanPropertyPrice = (price: string): string => {
  if (!price || typeof price !== 'string') {
    return price || '';
  }
  
  // Remove "Tenancy info" text
  let cleanedPrice = price.replace(/Tenancy info£?/gi, '');
  
  // Remove pw pricing - match patterns like "(£375 pw)" or " (£375 pw)"
  cleanedPrice = cleanedPrice.replace(/\s*\(£[\d,]+\s*pw\)/gi, '');
  
  // Extract only the pcm pricing
  const pcmMatch = cleanedPrice.match(/£[\d,]+ pcm/i);
  if (pcmMatch) {
    return pcmMatch[0];
  }
  
  // If no pcm found, try to add pound sign if missing
  if (cleanedPrice.trim()) {
    const trimmedPrice = cleanedPrice.trim();
    // If it doesn't start with £, add it
    if (!trimmedPrice.startsWith('£')) {
      // Check if it's a number or contains numbers
      if (/\d/.test(trimmedPrice)) {
        return `£${trimmedPrice}`;
      }
    }
    return trimmedPrice;
  }
  
  return cleanedPrice.trim();
};

import { Property, SearchResponse } from '../types/property';

export const useSearchBackend = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Property[]>([]);
  const [searchType, setSearchType] = useState<'onthemarket' | 'internet' | 'proptii'>('onthemarket');

  const searchBackendUrl = resolveSearchBackendUrl();

  // Network connectivity check
  const checkNetworkConnectivity = async (): Promise<boolean> => {
    try {
      const fetchUrl = `${searchBackendUrl}/health`;
      const response = await fetch(fetchUrl, { 
        method: 'GET',
        signal: AbortSignal.timeout(10000) // Increased to 10 seconds
      });
      return response.ok;
    } catch (error) {
      console.warn('Network connectivity check failed:', error);
      return false;
    }
  };

  // Load cached results on mount — expire after 10 minutes
  useEffect(() => {
    const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
    const cachedData = sessionStorage.getItem('searchResults');
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        const age = Date.now() - (parsed.timestamp ?? 0);
        if (parsed.results && parsed.results.length > 0 && age < CACHE_TTL_MS) {
          // Clean the pricing for cached results as well
          const cleanedCachedResults = parsed.results.map((property: Property) => ({
            ...property,
            price: cleanPropertyPrice(property.price)
          }));
          const native = cleanedCachedResults.filter((p: Property) => p.source === 'native');
          const scraped = cleanedCachedResults.filter((p: Property) => p.source !== 'native');
          setResults([...native, ...scraped]);
          setQuery(parsed.query || '');
          setSearchType(parsed.searchType || 'onthemarket');
        } else {
          // Cache expired or empty — clear it
          sessionStorage.removeItem('searchResults');
        }
      } catch (error) {
        console.error('Error parsing cached search results:', error);
        sessionStorage.removeItem('searchResults');
      }
    }
  }, []);

  const searchProperties = useCallback(async (searchQuery: string, type: 'onthemarket' | 'internet' | 'proptii' = 'onthemarket') => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return [];
    }

    setIsLoading(true);
    setError(null);
    setQuery(searchQuery);
    setSearchType(type);
    setResults([]); // Clear previous results for fresh search

    const deduplicationKey = (p: Property) =>
      `${p.title?.toLowerCase().trim()}|${p.location?.toLowerCase().trim()}`;

    try {
      // 1. Parallel native (Proptii-hosted) property search via API
      // Tries /api/properties/search first (AppController alias), then
      // /api/native-properties/search (direct controller route) as fallback.
      const nativeApiPromise = (async (): Promise<Property[]> => {
        const apiBase = getResolvedApiBaseUrl().replace(/\/api$/, '');
        const primaryUrl = `${apiBase}/api/properties/search?q=${encodeURIComponent(searchQuery)}&limit=50`;
        const fallbackUrl = `${apiBase}/api/native-properties/search?q=${encodeURIComponent(searchQuery)}&limit=50`;

        const tryFetch = async (url: string): Promise<Property[]> => {
          const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
          if (!res.ok) return [];
          const data = await res.json();
          return ((data.results ?? []) as any[]).map(p => ({
            ...p,
            source: p.source ?? 'native',
            price: cleanPropertyPrice(p.price ?? ''),
          }));
        };

        try {
          const primaryResults = await tryFetch(primaryUrl);
          if (primaryResults.length > 0) return primaryResults;
          // Primary returned empty — try the direct route
          return await tryFetch(fallbackUrl);
        } catch (e) {
          console.warn('[Search] Primary native search failed, trying fallback:', e);
          try {
            return await tryFetch(fallbackUrl);
          } catch (e2) {
            console.warn('[Search] Native API search failed on both routes:', e2);
            return [];
          }
        }
      })();

      // Update results immediately when native API returns
      nativeApiPromise.then(nativeResults => {
        if (nativeResults.length > 0) {
          setResults(prev => {
            const seen = new Set(prev.map(deduplicationKey));
            const unique = nativeResults.filter(p => !seen.has(deduplicationKey(p)));
            const combined = [...prev, ...unique];
            const native = combined.filter(p => p.source === 'native');
            const scraped = combined.filter(p => p.source !== 'native');
            return [...native, ...scraped];
          });
        }
      });

      // If user ONLY wants Proptii results, wait for native API only
      if (type === 'proptii') {
        const results = await nativeApiPromise;
        if (results.length === 0) {
          throw new Error('No properties found on Proptii. Please try a different search.');
        }
        sessionStorage.setItem('searchResults', JSON.stringify({
          results, query: searchQuery, searchType: 'proptii', timestamp: Date.now()
        }));
        setIsLoading(false);
        return results;
      }

      // 2. SSE Scraper Search (hits proptii-search)
      // Ensure we don't have double slashes
      const endpoint = '/api/v1/search';
      const fetchUrl = `${searchBackendUrl}${endpoint}`;
      
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, filters: {} }),
        signal: AbortSignal.timeout(120000) // Increased to 120 seconds for slow scraper streams
      });

      if (!response.ok) {
        throw new Error(`Scraper responded with ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('ReadableStream not supported by browser');

      const decoder = new TextDecoder();
      let buffer = '';
      let allScraped: Property[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          try {
            const event = JSON.parse(trimmed.slice(6));
            
            if (event.type === 'initial' || event.type === 'results') {
              const incoming = (event.data as any[]).map(p => ({
                ...p,
                price: cleanPropertyPrice(p.price)
              }));

              allScraped = [...allScraped, ...incoming];

              setResults(prev => {
                const seen = new Set(prev.map(deduplicationKey));
                const unique = incoming.filter(p => !seen.has(deduplicationKey(p)));
                const combined = [...prev, ...unique];
                const native = combined.filter(p => p.source === 'native');
                const scraped = combined.filter(p => p.source !== 'native');
                return [...native, ...scraped];
              });
            } else if (event.type === 'done') {
              // Scraper is finished
            }
          } catch (e) {
            console.error('Error parsing SSE event:', e);
          }
        }
      }

      // Final merge for cache
      const nativeResults = await nativeApiPromise;
      const seenKeys = new Set(nativeResults.map(deduplicationKey));
      const uniqueScraped = allScraped.filter(p => {
        const key = deduplicationKey(p);
        if (seenKeys.has(key)) return false;
        seenKeys.add(key);
        return true;
      });
      
      const finalResults = [...nativeResults, ...uniqueScraped];
      const finalNative = finalResults.filter(p => p.source === 'native');
      const finalScraped = finalResults.filter(p => p.source !== 'native');
      const sortedFinalResults = [...finalNative, ...finalScraped];
      
      if (sortedFinalResults.length === 0) {
        throw new Error('No properties found. Please try a different search.');
      }

      sessionStorage.setItem('searchResults', JSON.stringify({
        results: sortedFinalResults,
        query: searchQuery,
        searchType: type,
        timestamp: Date.now()
      }));

      return sortedFinalResults;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      
      // Provide user-friendly error messages
      let userFriendlyError = errorMessage;
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
        userFriendlyError = 'Network connection issue. Please ensure the search service is running.';
      } else if (errorMessage.includes('timeout')) {
        userFriendlyError = 'Search timed out. Please try again.';
      }
      
      setError(userFriendlyError);
      // We don't necessarily clear results if we have Firestore results but scraper failed
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [searchBackendUrl]);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    setQuery('');
    // Clear cached results
    sessionStorage.removeItem('searchResults');
  }, []);

  const clearCache = useCallback(() => {
    sessionStorage.removeItem('searchResults');
  }, []);

  const retry = useCallback(() => {
    if (query) {
      searchProperties(query, searchType);
    }
  }, [query, searchType, searchProperties]);

  return {
    query,
    setQuery,
    isLoading,
    error,
    results,
    searchType,
    setSearchType,
    searchProperties,
    clearResults,
    clearCache,
    retry,
  };
};
