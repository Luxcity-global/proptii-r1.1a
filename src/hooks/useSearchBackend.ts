import { useState, useCallback, useEffect } from 'react';
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

export type { Property };
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
      const response = await fetch(`${searchBackendUrl}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(10000) // Increased to 10 seconds
      });
      return response.ok;
    } catch (error) {
      console.warn('Network connectivity check failed:', error);
      return false;
    }
  };

  // Load cached results on mount
  useEffect(() => {
    const cachedData = sessionStorage.getItem('searchResults');
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        // Clean the pricing for cached results as well
        const cleanedCachedResults = (parsed.results || []).map((property: Property) => ({
          ...property,
          price: cleanPropertyPrice(property.price)
        }));
        setResults(cleanedCachedResults);
        setQuery(parsed.query || '');
        setSearchType(parsed.searchType || 'onthemarket');
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
      // 1. Parallel Firestore (Proptii) search
      const firestorePromise = (async (): Promise<Property[]> => {
        try {
          const { searchProptiiProperties } = await import('../services/proptiiPropertyService');
          const proptiiResults = await searchProptiiProperties(searchQuery);
          return proptiiResults.map(property => ({
            ...property,
            price: cleanPropertyPrice(property.price)
          }));
        } catch (e) {
          console.warn('[Search] Firestore search failed:', e);
          return [];
        }
      })();

      // Update results immediately when Firestore returns
      firestorePromise.then(proptiiResults => {
        if (proptiiResults.length > 0) {
          setResults(prev => {
            const seen = new Set(prev.map(deduplicationKey));
            const unique = proptiiResults.filter(p => !seen.has(deduplicationKey(p)));
            return [...prev, ...unique];
          });
        }
      });

      // If user ONLY wants Proptii results, we stop here (wait for firestorePromise)
      if (type === 'proptii') {
        const results = await firestorePromise;
        if (results.length === 0) {
          throw new Error('No properties found on Proptii. Please try a different search.');
        }
        
        sessionStorage.setItem('searchResults', JSON.stringify({
          results,
          query: searchQuery,
          searchType: 'proptii',
          timestamp: Date.now()
        }));
        setIsLoading(false);
        return results;
      }

      // 2. SSE Scraper Search (hits proptii-search port 3001)
      const response = await fetch(`${searchBackendUrl}/api/v1/search`, {
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
              const incoming = (event.data as any[]).map((p) => ({
                ...p,
                price: cleanPropertyPrice(p.price),
                description: p.description || p.summary || p.notes || p.overview || '',
                imageUrls: p.imageUrls || p.images || [],
                url: p.url || p.listingUrl,
                latitude: typeof p.latitude === 'number' ? p.latitude : undefined,
                longitude: typeof p.longitude === 'number' ? p.longitude : undefined,
                coordinates:
                  p.coordinates ??
                  (typeof p.latitude === 'number' && typeof p.longitude === 'number'
                    ? { lat: p.latitude, lng: p.longitude }
                    : undefined),
              }));

              allScraped = [...allScraped, ...incoming];

              setResults(prev => {
                const seen = new Set(prev.map(deduplicationKey));
                const unique = incoming.filter(p => !seen.has(deduplicationKey(p)));
                return [...prev, ...unique];
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
      const proptiiResults = await firestorePromise;
      const seenKeys = new Set(proptiiResults.map(deduplicationKey));
      const uniqueScraped = allScraped.filter(p => {
        const key = deduplicationKey(p);
        if (seenKeys.has(key)) return false;
        seenKeys.add(key);
        return true;
      });
      
      const finalResults = [...proptiiResults, ...uniqueScraped];
      
      if (finalResults.length === 0) {
        throw new Error('No properties found. Please try a different search.');
      }

      sessionStorage.setItem('searchResults', JSON.stringify({
        results: finalResults,
        query: searchQuery,
        searchType: type,
        timestamp: Date.now()
      }));

      return finalResults;

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
