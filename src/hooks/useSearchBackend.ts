import { useState, useCallback, useEffect } from 'react';

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
  
  // If no pcm found, return the cleaned price
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
    name: string;
    email: string;
    website?: string;
  };
  source?: string;
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

  const searchBackendUrl = 'http://localhost:3001'; // Search backend URL

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
        
        endpoint = '/scrape';
        requestBody = {
          url: finalUrl
        };
      } else {
        // For internet search
        endpoint = '/scrape-internet';
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
      setError(errorMessage);
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
