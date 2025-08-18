import { Property as MCPProperty } from '../property-data/PropertyDataMCP';
import { createHash } from 'crypto';

// On the Market scraper schema (from onthemarketScraper.ts)
export interface OnTheMarketProperty {
  id: string;
  title: string;
  address: string;
  price: number;
  priceUnit: string;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  description: string;
  images: string[];
  listingUrl: string;
  agent: {
    name: string;
    contact: string;
  };
  availableFrom: string;
}

// MCP Price interface
interface MCPPrice {
  amount: number;
  currency: string;
  type: 'rent' | 'sale';
  period?: 'monthly' | 'yearly';
  display: string;
}

// MCP Location interface
interface MCPLocation {
  address: string;
  city: string;
  postcode: string;
  coordinates?: [number, number];
  area?: string;
}

// MCP Image interface
interface MCPImage {
  src: string;
  alt: string;
  isPrimary: boolean;
}

// MCP Metadata interface
interface MCPMetadata {
  createdAt: string;
  lastUpdated: string;
  searchScore: number;
  viewCount: number;
  source: string;
}

// MCP Agent interface
interface MCPAgent {
  name: string;
  company: string;
  phone?: string;
  email?: string;
  photo?: string;
}

// MCP Specifications interface
interface MCPSpecifications {
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  totalArea?: number;
  parkingSpaces?: number;
  yearBuilt?: number;
}

// MCP Amenities interface
interface MCPAmenities {
  nearby: string[];
  onsite: string[];
}

/**
 * Main transformation function to convert On the Market property to MCP schema
 */
export function transformOnTheMarketToMCP(onTheMarketProperty: OnTheMarketProperty): MCPProperty {
  try {
    // Generate a unique ID based on the listing URL
    const uniqueId = generateUniqueId(onTheMarketProperty.listingUrl);
    
    const transformed: MCPProperty = {
      id: uniqueId,
      title: onTheMarketProperty.title,
      price: normalizePrice(onTheMarketProperty.price, onTheMarketProperty.priceUnit),
      location: extractLocation(onTheMarketProperty.address),
      specifications: normalizeSpecifications(onTheMarketProperty),
      features: extractFeatures(onTheMarketProperty.description),
      description: onTheMarketProperty.description,
      images: enhanceImages(onTheMarketProperty.images),
      agent: enhanceAgent(onTheMarketProperty.agent),
      amenities: {
        nearby: [],
        onsite: []
      },
      status: 'available',
      metadata: generateMetadata('On the Market'),
      contactUrl: onTheMarketProperty.listingUrl,
      propertyUrl: onTheMarketProperty.listingUrl
    };

    // Validate the transformed data
    const validationResult = validateTransformedProperty(transformed);
    if (!validationResult.isValid) {
      console.warn(`⚠️ [ON_THE_MARKET] Validation warnings for property ${uniqueId}:`, validationResult.warnings);
    }

    return transformed;
  } catch (error) {
    console.error(`❌ [ON_THE_MARKET] Error transforming property ${onTheMarketProperty.id}:`, error);
    throw new Error(`Failed to transform On the Market property: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a unique ID by hashing the property URL
 */
export function generateUniqueId(url: string): string {
  const hash = createHash('md5').update(url).digest('hex');
  return `otm_${hash.substring(0, 12)}`;
}

/**
 * Normalize price data to MCP format
 */
export function normalizePrice(price: number, unit: string): MCPPrice {
  const normalizedUnit = unit.toLowerCase();
  let period: 'monthly' | 'yearly' = 'monthly';
  let amount = price;
  let type: 'rent' | 'sale' = 'rent';
  let display = `£${price.toLocaleString()} ${unit}`;

  switch (normalizedUnit) {
    case 'pw':
      // Convert per week to per month (multiply by 52/12, rounded)
      amount = Math.round(price * 52 / 12);
      period = 'monthly';
      display = `£${price.toLocaleString()} pw (~£${amount}/pcm)`;
      break;
    
    case 'pcm':
      period = 'monthly';
      display = `£${price.toLocaleString()} pcm`;
      break;
    
    case 'pppw':
      // Per person per week - convert to approximate monthly per person
      amount = Math.round(price * 52 / 12);
      period = 'monthly';
      display = `£${price.toLocaleString()} pppw (~£${amount}/person pcm)`;
      break;
    
    case 'pa':
      period = 'yearly';
      display = `£${price.toLocaleString()} pa`;
      break;
    
    case 'total':
    default:
      // For sale properties or unspecified units
      if (price > 100000) {
        // Likely a sale price
        type = 'sale';
        display = `£${price.toLocaleString()}`;
      } else {
        // Assume rental
        period = 'monthly';
        display = `£${price.toLocaleString()} pcm`;
      }
      break;
  }

  return {
    amount,
    currency: 'GBP',
    type,
    period,
    display
  };
}

/**
 * Extract and normalize location data
 */
export function extractLocation(address: string): MCPLocation {
  const postcode = extractPostcode(address);
  const city = extractCity(address);
  const area = extractArea(address);

  return {
    address: address.trim(),
    city: city || 'Unknown',
    postcode: postcode || '',
    coordinates: undefined,
    area: area || ''
  };
}

/**
 * Extract UK postcode from address using regex
 */
export function extractPostcode(address: string): string | null {
  // UK postcode pattern: AA9A 9AA, A9A 9AA, A9 9AA, A99 9AA, AA9 9AA, AA99 9AA
  const postcodeRegex = /[A-Z]{1,2}[0-9][A-Z0-9]?\s*[0-9][A-Z]{2}/i;
  const match = address.match(postcodeRegex);
  return match ? match[0].toUpperCase() : null;
}

/**
 * Extract city from address
 */
export function extractCity(address: string): string | null {
  // Common UK city patterns
  const cityPatterns = [
    /London/i, /Manchester/i, /Birmingham/i, /Liverpool/i, /Leeds/i, /Sheffield/i,
    /Bristol/i, /Glasgow/i, /Edinburgh/i, /Cardiff/i, /Belfast/i, /Newcastle/i,
    /Nottingham/i, /Southampton/i, /Oxford/i, /Cambridge/i, /Brighton/i, /Bath/i,
    /York/i, /Reading/i, /Portsmouth/i, /Preston/i, /Coventry/i, /Leicester/i,
    /Sunderland/i, /Hull/i, /Bradford/i, /Wolverhampton/i, /Plymouth/i,
    /Stoke/i, /Derby/i, /Swansea/i, /Dundee/i, /Aberdeen/i, /Inverness/i
  ];

  for (const pattern of cityPatterns) {
    const match = address.match(pattern);
    if (match) {
      return match[0];
    }
  }

  // Try to extract city from common address patterns
  const parts = address.split(',');
  if (parts.length >= 2) {
    // Often the city is the second-to-last part
    const possibleCity = parts[parts.length - 2].trim();
    if (possibleCity.length > 2 && possibleCity.length < 30) {
      return possibleCity;
    }
  }

  return null;
}

/**
 * Extract area from address (usually the first part before the first comma)
 */
export function extractArea(address: string): string | null {
  const parts = address.split(',');
  if (parts.length > 1) {
    const area = parts[0].trim();
    // Check if it looks like an area name (not just a street number)
    if (area.length > 3 && !/^\d+\s/.test(area)) {
      return area;
    }
  }
  return null;
}

/**
 * Normalize specifications to MCP format
 */
export function normalizeSpecifications(onTheMarketProperty: OnTheMarketProperty): MCPSpecifications {
  return {
    bedrooms: onTheMarketProperty.bedrooms || 0,
    bathrooms: onTheMarketProperty.bathrooms || 0,
    propertyType: normalizePropertyType(onTheMarketProperty.propertyType),
    totalArea: undefined,
    parkingSpaces: undefined,
    yearBuilt: undefined
  };
}

/**
 * Normalize property type to consistent format
 */
export function normalizePropertyType(propertyType: string): string {
  if (!propertyType) return 'Unknown';
  
  const normalized = propertyType.toLowerCase().trim();
  
  // Map various property type formats to standard ones
  const typeMapping: { [key: string]: string } = {
    'flat': 'Flat',
    'apartment': 'Apartment',
    'studio': 'Studio',
    'house': 'House',
    'terraced house': 'Terraced House',
    'detached house': 'Detached House',
    'semi-detached house': 'Semi-Detached House',
    'end of terrace': 'End of Terrace',
    'maisonette': 'Maisonette',
    'bungalow': 'Bungalow',
    'penthouse': 'Penthouse',
    'cottage': 'Cottage',
    'townhouse': 'Townhouse'
  };

  // Check for exact matches first
  if (typeMapping[normalized]) {
    return typeMapping[normalized];
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(typeMapping)) {
    if (normalized.includes(key)) {
      return value;
    }
  }

  // Capitalize first letter if no mapping found
  return propertyType.charAt(0).toUpperCase() + propertyType.slice(1).toLowerCase();
}

/**
 * Extract features from description text
 */
export function extractFeatures(description: string): string[] {
  if (!description) return [];

  const features: string[] = [];
  const text = description.toLowerCase();

  // Define feature keywords to look for
  const featureKeywords = [
    'parking', 'garage', 'garden', 'balcony', 'terrace', 'patio',
    'furnished', 'unfurnished', 'part furnished', 'dishwasher', 'washing machine',
    'central heating', 'double glazing', 'gym', 'concierge', 'lift', 'elevator',
    'air conditioning', 'fireplace', 'wood floors', 'hardwood floors',
    'en suite', 'walk-in wardrobe', 'fitted kitchen', 'modern kitchen',
    'recently renovated', 'newly refurbished', 'period features',
    'high ceilings', 'bright', 'spacious', 'quiet', 'secure',
    'swimming pool', 'communal garden', 'roof terrace', 'city views',
    'river views', 'park views', 'tube station', 'train station',
    'near shops', 'near transport', 'zone 1', 'zone 2', 'zone 3'
  ];

  for (const keyword of featureKeywords) {
    if (text.includes(keyword)) {
      // Capitalize first letter for display
      const feature = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      if (!features.includes(feature)) {
        features.push(feature);
      }
    }
  }

  return features.slice(0, 10); // Limit to first 10 features
}

/**
 * Enhance images with MCP format requirements
 */
export function enhanceImages(images: string[]): MCPImage[] {
  if (!images || images.length === 0) {
    return [];
  }

  return images.map((imageSrc, index) => {
    // Ensure absolute URLs
    let src = imageSrc;
    if (!src.startsWith('http')) {
      src = src.startsWith('/') ? `https://www.onthemarket.com${src}` : src;
    }

    return {
      src,
      alt: `Property image ${index + 1}`,
      isPrimary: index === 0 // First image is primary
    };
  }).slice(0, 20); // Limit to 20 images max
}

/**
 * Enhance agent information to MCP format
 */
export function enhanceAgent(agent: { name: string; contact: string }): MCPAgent {
  const agentName = agent.name || 'On the Market';
  const phone = agent.contact || '';

  return {
    name: agentName,
    company: agentName.includes('On the Market') ? 'On the Market' : agentName,
    phone: phone || undefined,
    email: undefined,
    photo: undefined
  };
}

/**
 * Generate metadata for the property
 */
export function generateMetadata(source: string): MCPMetadata {
  const now = new Date().toISOString();
  
  return {
    createdAt: now,
    lastUpdated: now,
    searchScore: 0.8, // Default score
    viewCount: 0,
    source: source
  };
}

/**
 * Validate transformed property for completeness and correctness
 */
export function validateTransformedProperty(property: MCPProperty): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  let isValid = true;

  // Required field validations
  if (!property.id) {
    warnings.push('Missing property ID');
    isValid = false;
  }
  
  if (!property.title || property.title.length < 5) {
    warnings.push('Title too short or missing');
  }

  if (!property.location.address) {
    warnings.push('Missing address');
    isValid = false;
  }

  if (property.price.amount <= 0) {
    warnings.push('Invalid price amount');
  }

  if (property.specifications.bedrooms < 0) {
    warnings.push('Invalid bedroom count');
  }

  if (!property.propertyUrl) {
    warnings.push('Missing property URL');
    isValid = false;
  }

  // Data quality validations
  if (property.images.length === 0) {
    warnings.push('No images available');
  }

  if (!property.description || property.description.length < 20) {
    warnings.push('Description too short or missing');
  }

  if (property.location.city === 'Unknown') {
    warnings.push('Could not determine city from address');
  }

  if (!property.location.postcode) {
    warnings.push('No postcode extracted from address');
  }

  return { isValid, warnings };
}

/**
 * Transform multiple On the Market properties to MCP format
 */
export function transformOnTheMarketProperties(properties: OnTheMarketProperty[]): MCPProperty[] {
  const transformedProperties: MCPProperty[] = [];
  const failedTransformations: string[] = [];

  for (const property of properties) {
    try {
      const transformed = transformOnTheMarketToMCP(property);
      transformedProperties.push(transformed);
    } catch (error) {
      console.error(`❌ [ON_THE_MARKET] Failed to transform property ${property.id}:`, error);
      failedTransformations.push(property.id);
    }
  }

  console.log(`✅ [ON_THE_MARKET] Transformed ${transformedProperties.length}/${properties.length} properties`);
  if (failedTransformations.length > 0) {
    console.log(`❌ [ON_THE_MARKET] Failed transformations:`, failedTransformations);
  }

  return transformedProperties;
}

/**
 * Get transformation statistics
 */
export function getTransformationStats(original: OnTheMarketProperty[], transformed: MCPProperty[]): {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  averagePrice: number;
  propertyTypes: { [key: string]: number };
  cities: { [key: string]: number };
} {
  const total = original.length;
  const successful = transformed.length;
  const failed = total - successful;
  const successRate = total > 0 ? (successful / total) * 100 : 0;
  
  // Calculate average price
  const totalPrice = transformed.reduce((sum, prop) => sum + prop.price.amount, 0);
  const averagePrice = transformed.length > 0 ? Math.round(totalPrice / transformed.length) : 0;
  
  // Count property types
  const propertyTypes: { [key: string]: number } = {};
  transformed.forEach(prop => {
    const type = prop.specifications.propertyType;
    propertyTypes[type] = (propertyTypes[type] || 0) + 1;
  });
  
  // Count cities
  const cities: { [key: string]: number } = {};
  transformed.forEach(prop => {
    const city = prop.location.city;
    cities[city] = (cities[city] || 0) + 1;
  });
  
  return {
    total,
    successful,
    failed,
    successRate: Math.round(successRate * 100) / 100,
    averagePrice,
    propertyTypes,
    cities
  };
} 