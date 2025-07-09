/**
 * Zoopla Query Parser
 * Builds Zoopla-specific URLs for property searches
 */

import { ParsedQuery } from '../utils/queryParser';

/**
 * Build Zoopla URL based on parsed query parameters
 */
export function buildZooplaUrl(parsedQuery: ParsedQuery, page: number = 1): string {
  const { location, bedrooms, propertyType, priceRange } = parsedQuery;
  
  // Base URL structure - normalize location
  const normalizedLocation = location.toLowerCase().replace(/\s+/g, '-');
  let url = `https://www.zoopla.co.uk/to-rent/${normalizedLocation}`;
  
  // Add query parameters
  const params = new URLSearchParams();
  
  // Bedroom filter
  if (bedrooms) {
    params.append('beds_min', bedrooms.toString());
  }
  
  // Price range filters
  if (priceRange) {
    if (priceRange.max) {
      params.append('price_max', priceRange.max.toString());
    }
    if (priceRange.min) {
      params.append('price_min', priceRange.min.toString());
    }
  }
  
  // Property type filter
  if (propertyType) {
    const typeMapping: { [key: string]: string } = {
      'flat': 'flat',
      'apartment': 'flat',
      'house': 'house',
      'bungalow': 'bungalow',
      'studio': 'studio',
      'maisonette': 'maisonette',
      'penthouse': 'penthouse',
      'cottage': 'house'
    };
    
    const mappedType = typeMapping[propertyType.toLowerCase()];
    if (mappedType) {
      params.append('property_type', mappedType);
    }
  }
  
  // Pagination
  if (page > 1) {
    params.append('pn', page.toString());
  }
  
  // Add sorting (newest first)
  params.append('results_sort', 'newest_listings');
  
  // Add parameters to URL if any exist
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  return url;
}

/**
 * Build Zoopla sale URL (for future use)
 */
export function buildZooplaSaleUrl(parsedQuery: ParsedQuery, page: number = 1): string {
  const { location, bedrooms, propertyType, priceRange } = parsedQuery;
  
  // Base URL structure for sales
  const normalizedLocation = location.toLowerCase().replace(/\s+/g, '-');
  let url = `https://www.zoopla.co.uk/for-sale/${normalizedLocation}`;
  
  // Add query parameters
  const params = new URLSearchParams();
  
  // Bedroom filter
  if (bedrooms) {
    params.append('beds_min', bedrooms.toString());
  }
  
  // Price range filters
  if (priceRange) {
    if (priceRange.max) {
      params.append('price_max', priceRange.max.toString());
    }
    if (priceRange.min) {
      params.append('price_min', priceRange.min.toString());
    }
  }
  
  // Property type filter
  if (propertyType) {
    const typeMapping: { [key: string]: string } = {
      'flat': 'flat',
      'apartment': 'flat',
      'house': 'house',
      'bungalow': 'bungalow',
      'studio': 'studio',
      'maisonette': 'maisonette',
      'penthouse': 'penthouse',
      'cottage': 'house'
    };
    
    const mappedType = typeMapping[propertyType.toLowerCase()];
    if (mappedType) {
      params.append('property_type', mappedType);
    }
  }
  
  // Pagination
  if (page > 1) {
    params.append('pn', page.toString());
  }
  
  // Add sorting (newest first)
  params.append('results_sort', 'newest_listings');
  
  // Add parameters to URL if any exist
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  return url;
}

/**
 * Extract listing ID from Zoopla URL
 */
export function extractListingIdFromUrl(url: string): string | null {
  // Pattern: /to-rent/details/{id}/
  const match = url.match(/\/to-rent\/details\/([^\/]+)\//);
  return match ? match[1] : null;
}

/**
 * Build individual listing URL
 */
export function buildListingUrl(listingId: string): string {
  return `https://www.zoopla.co.uk/to-rent/details/${listingId}/`;
}

/**
 * Test the Zoopla URL builder with various examples
 */
export function testZooplaUrlBuilder(): void {
  const testCases = [
    {
      query: { originalQuery: '2 bedroom flat in London under 2000', location: 'London', bedrooms: 2, propertyType: 'flat', priceRange: { max: 2000 } },
      expected: 'https://www.zoopla.co.uk/to-rent/london?beds_min=2&price_max=2000&property_type=flat&results_sort=newest_listings'
    },
    {
      query: { originalQuery: '3 bedroom house in Manchester', location: 'Manchester', bedrooms: 3, propertyType: 'house' },
      expected: 'https://www.zoopla.co.uk/to-rent/manchester?beds_min=3&property_type=house&results_sort=newest_listings'
    },
    {
      query: { originalQuery: 'property in Birmingham between 1000 and 3000', location: 'Birmingham', priceRange: { min: 1000, max: 3000 } },
      expected: 'https://www.zoopla.co.uk/to-rent/birmingham?price_min=1000&price_max=3000&results_sort=newest_listings'
    }
  ];
  
  console.log('🧪 Testing Zoopla URL Builder:');
  console.log('=' .repeat(50));
  
  testCases.forEach((testCase, index) => {
    const result = buildZooplaUrl(testCase.query);
    const passed = result === testCase.expected;
    
    console.log(`Test ${index + 1}: ${passed ? '✅' : '❌'}`);
    console.log(`Input:`, testCase.query);
    console.log(`Expected: ${testCase.expected}`);
    console.log(`Actual: ${result}`);
    console.log('');
  });
}

/**
 * Validate Zoopla URL format
 */
export function validateZooplaUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'www.zoopla.co.uk' && 
           (urlObj.pathname.includes('/to-rent/') || urlObj.pathname.includes('/for-sale/'));
  } catch {
    return false;
  }
} 