/**
 * Query Parser for Property Search
 * Extracts location, bedroom count, and property type from natural language queries
 */

export interface ParsedQuery {
  location: string;
  bedrooms?: number;
  propertyType?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  originalQuery: string;
}

/**
 * Parse a search query to extract structured parameters
 * Examples:
 * - "2 bedroom flat in dartford" → {location: "dartford", bedrooms: 2, propertyType: "flat"}
 * - "3 bed house london under 2000" → {location: "london", bedrooms: 3, propertyType: "house", priceRange: {max: 2000}}
 */
export function parseSearchQuery(query: string): ParsedQuery {
  const lowerQuery = query.toLowerCase().trim();
  const originalQuery = query.trim();
  
  // Initialize result
  const result: ParsedQuery = {
    location: '',
    originalQuery
  };

  // Extract bedroom count
  const bedroomPatterns = [
    /(\d+)\s*bedroom?/i,
    /(\d+)\s*bed/i,
    /(\d+)\s*br/i
  ];
  
  for (const pattern of bedroomPatterns) {
    const match = lowerQuery.match(pattern);
    if (match) {
      result.bedrooms = parseInt(match[1], 10);
      break;
    }
  }

  // Extract property type
  const propertyTypes = [
    'flat', 'apartment', 'house', 'bungalow', 'studio', 'maisonette', 'penthouse', 'cottage'
  ];
  
  for (const type of propertyTypes) {
    if (lowerQuery.includes(type)) {
      result.propertyType = type;
      break;
    }
  }

  // Extract location (after "in" or common location indicators)
  const locationPatterns = [
    /in\s+([a-zA-Z\s]+?)(?:\s+under|\s+for|\s+at|\s*$)/i,
    /near\s+([a-zA-Z\s]+?)(?:\s+under|\s+for|\s+at|\s*$)/i,
    /around\s+([a-zA-Z\s]+?)(?:\s+under|\s+for|\s+at|\s*$)/i,
    /(\b(?:london|manchester|birmingham|leeds|sheffield|bradford|edinburgh|glasgow|cardiff|belfast|dartford|bromley|croydon|greenwich|lewisham|southwark|tower hamlets|hackney|islington|camden|westminster|kensington|chelsea|hammersmith|fulham|wandsworth|lambeth|kingston|richmond|hounslow|ealing|brent|harrow|hillingdon|harrow|barnet|enfield|waltham forest|redbridge|havering|barking|newham|bexley)\b)/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = lowerQuery.match(pattern);
    if (match) {
      result.location = match[1].trim();
      break;
    }
  }

  // Extract price range
  const pricePatterns = [
    /under\s*£?(\d+)/i,
    /over\s*£?(\d+)/i,
    /between\s*£?(\d+)\s*and\s*£?(\d+)/i,
    /£?(\d+)\s*-\s*£?(\d+)/i
  ];
  
  for (const pattern of pricePatterns) {
    const match = lowerQuery.match(pattern);
    if (match) {
      if (pattern.source.includes('under')) {
        result.priceRange = { max: parseInt(match[1], 10) };
      } else if (pattern.source.includes('over')) {
        result.priceRange = { min: parseInt(match[1], 10) };
      } else if (pattern.source.includes('between') || pattern.source.includes('-')) {
        result.priceRange = { 
          min: parseInt(match[1], 10), 
          max: parseInt(match[2], 10) 
        };
      }
      break;
    }
  }

  // Fallback location detection if no explicit location found
  if (!result.location) {
    // Check for common UK cities/areas in the query
    const commonLocations = [
      'london', 'manchester', 'birmingham', 'leeds', 'sheffield', 'bradford',
      'edinburgh', 'glasgow', 'cardiff', 'belfast', 'dartford', 'bromley',
      'croydon', 'greenwich', 'lewisham', 'southwark', 'tower hamlets',
      'hackney', 'islington', 'camden', 'westminster', 'kensington',
      'chelsea', 'hammersmith', 'fulham', 'wandsworth', 'lambeth',
      'kingston', 'richmond', 'hounslow', 'ealing', 'brent', 'harrow',
      'hillingdon', 'barnet', 'enfield', 'waltham forest', 'redbridge',
      'havering', 'barking', 'newham', 'bexley'
    ];
    
    for (const location of commonLocations) {
      if (lowerQuery.includes(location)) {
        result.location = location;
        break;
      }
    }
  }

  // Default to London if no location found
  if (!result.location) {
    result.location = 'london';
  }

  return result;
}

/**
 * Build Openrent URL based on parsed query parameters
 */
export function buildOpenrentUrl(parsedQuery: ParsedQuery): string {
  const { location, bedrooms, propertyType } = parsedQuery;
  
  // Base URL structure
  let url = `https://www.openrent.co.uk/properties-to-rent/${location}`;
  
  // Add query parameters
  const params = new URLSearchParams();
  
  if (bedrooms) {
    params.append('bedrooms', bedrooms.toString());
  }
  
  if (propertyType) {
    // Map property types to Openrent's expected values
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
    
    const mappedType = typeMapping[propertyType];
    if (mappedType) {
      params.append('propertyType', mappedType);
    }
  }
  
  // Add price range if specified
  if (parsedQuery.priceRange) {
    if (parsedQuery.priceRange.max) {
      params.append('maxPrice', parsedQuery.priceRange.max.toString());
    }
    if (parsedQuery.priceRange.min) {
      params.append('minPrice', parsedQuery.priceRange.min.toString());
    }
  }
  
  // Add parameters to URL if any exist
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  return url;
}

/**
 * Test the query parser with various examples
 */
export function testQueryParser(): void {
  const testQueries = [
    "2 bedroom flat in dartford",
    "3 bed house london under 2000",
    "1 bedroom apartment in islington",
    "studio flat near camden",
    "4 bedroom house between 3000 and 5000",
    "2 bed flat",
    "house in manchester"
  ];
  
  console.log("🧪 Testing Query Parser:");
  console.log("=" .repeat(50));
  
  for (const query of testQueries) {
    const parsed = parseSearchQuery(query);
    const url = buildOpenrentUrl(parsed);
    
    console.log(`Query: "${query}"`);
    console.log(`Parsed:`, parsed);
    console.log(`URL: ${url}`);
    console.log("-".repeat(30));
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testQueryParser();
} 