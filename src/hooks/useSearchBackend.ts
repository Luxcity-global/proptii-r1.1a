import { useState, useCallback, useEffect } from 'react';

const DEFAULT_LOCAL_SEARCH_URL = 'http://localhost:3001';
const DEFAULT_RENDER_SEARCH_URL = 'https://proptii-r1-1a-search.onrender.com';

const normalizeBackendUrl = (rawUrl: string | undefined): string => {
  if (!rawUrl) {
    return DEFAULT_LOCAL_SEARCH_URL;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return DEFAULT_LOCAL_SEARCH_URL;
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const resolveSearchBackendUrl = (): string => {
  const envUrl = import.meta.env.VITE_SEARCH_BACKEND_URL;
  if (envUrl && envUrl.trim()) {
    return normalizeBackendUrl(envUrl);
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.includes('onrender.com') || hostname.includes('proptii.com')) {
      return DEFAULT_RENDER_SEARCH_URL;
    }
  }

  return DEFAULT_LOCAL_SEARCH_URL;
};

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

export interface Property {
  title: string;
  price: string;
  location: string;
  bedrooms: string;
  propertyType: string;
  imageUrls: string[];
  agent: {
    id?: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    website?: string;
  };
  source?: string;
  description?: string;
}

export interface SearchResponse {
  properties: Property[];
  total: number;
  query: string;
  searchType: 'onthemarket' | 'internet';
}

export const useSearchBackend = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Property[]>([]);
  const [searchType, setSearchType] = useState<'onthemarket' | 'internet'>('onthemarket');

  const searchBackendUrl = resolveSearchBackendUrl();

  // Network connectivity check
  const checkNetworkConnectivity = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${searchBackendUrl}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
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

  const searchProperties = useCallback(async (searchQuery: string, type: 'onthemarket' | 'internet' = 'onthemarket') => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return [];
    }

    setIsLoading(true);
    setError(null);
    setQuery(searchQuery);
    setSearchType(type);

    try {
      let endpoint: string;
      let requestBody: any;

      if (type === 'onthemarket') {
        // Build URL using the same logic as the original frontend
        const isRental = searchQuery.toLowerCase().includes('rent') || searchQuery.toLowerCase().includes('pcm');
        const baseUrl = isRental ? 'to-rent' : 'for-sale';
        
        // Extract location from query
        const locationMatch = searchQuery.match(/in\s+([a-zA-Z\s,]+)/i);
        let location = locationMatch ? locationMatch[1].trim().toLowerCase() : '';
        location = location
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .replace(/-for|-under/g, '');
        
        // Extract price and bedroom information
        const priceMatch = searchQuery.match(/(\d+)(?:k|pcm|\s*pound)/i);
        const priceValue = priceMatch ? priceMatch[1] : '';
        const bedroomMatch = searchQuery.match(/(\d+)\s*bed/i);
        const bedrooms = bedroomMatch ? bedroomMatch[1] : '';
        
        // Build URL parameters
        const params = new URLSearchParams();
        if (bedrooms) {
          params.append('min-bedrooms', bedrooms);
          params.append('max-bedrooms', bedrooms);
        }
        if (priceValue) {
          if (isRental) {
            params.append('min-price', priceValue);
          } else {
            const price = searchQuery.toLowerCase().includes('k') 
              ? String(parseInt(priceValue) * 1000)
              : priceValue;
            params.append('max-price', price);
          }
        }
        params.append('view', 'grid');
        
        const searchUrl = `https://www.onthemarket.com/${baseUrl}/property/${location}/`;
        const finalUrl = params.toString() ? `${searchUrl}?${params.toString()}` : searchUrl;
        
        // Use the real scraping endpoint that uses Puppeteer
        endpoint = '/scrape';
        requestBody = {
          url: finalUrl
        };
      } else {
        // For internet search, use the real scrapeInternet function
        endpoint = '/scrape-internet-real';
        requestBody = {
          query: searchQuery
        };
      }

      const response = await fetch(`${searchBackendUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        // If OnTheMarket fails, try internet search as fallback
        if (type === 'onthemarket') {
          console.log('OnTheMarket search failed, trying internet search as fallback...');
          const fallbackResponse = await fetch(`${searchBackendUrl}/scrape-internet-real`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: searchQuery }),
          });
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            let fallbackResults: Property[] = [];
            if (Array.isArray(fallbackData)) {
              fallbackResults = fallbackData;
            } else if (fallbackData.properties) {
              fallbackResults = fallbackData.properties;
            }
            
            // Clean the pricing for all properties
            const cleanedResults = fallbackResults.map(property => ({
              ...property,
              price: cleanPropertyPrice(property.price)
            }));
            
            setResults(cleanedResults);
            
            // Cache the results in sessionStorage
            const cacheData = {
              results: cleanedResults,
              query: searchQuery,
              searchType: 'internet', // Update to reflect fallback
              timestamp: Date.now()
            };
            sessionStorage.setItem('searchResults', JSON.stringify(cacheData));
            
            return fallbackResults;
          }
        }
        
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle the response data
      let finalResults: Property[] = [];
      if (Array.isArray(data)) {
        finalResults = data;
      } else if (data.properties) {
        finalResults = data.properties;
      }
      
      // Clean the pricing for all properties
      const cleanedResults = finalResults.map(property => ({
        ...property,
        price: cleanPropertyPrice(property.price)
      }));
      
      setResults(cleanedResults);
      
      // Cache the results in sessionStorage
      const cacheData = {
        results: cleanedResults,
        query: searchQuery,
        searchType: type,
        timestamp: Date.now()
      };
      sessionStorage.setItem('searchResults', JSON.stringify(cacheData));
      
      return finalResults;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      
      // Provide more user-friendly error messages
      let userFriendlyError = errorMessage;
      if (errorMessage.includes('ERR_NAME_NOT_RESOLVED') || errorMessage.includes('net::')) {
        userFriendlyError = 'Network connection issue. Please check your internet connection and try again.';
      } else if (errorMessage.includes('timeout')) {
        userFriendlyError = 'Search timed out. Please try again.';
      } else if (errorMessage.includes('Internal Server Error')) {
        userFriendlyError = 'Search service temporarily unavailable. Please try again in a few moments.';
      }
      
      setError(userFriendlyError);
      setResults([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

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
