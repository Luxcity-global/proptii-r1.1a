/**
 * Zoopla Schema Transformer
 * Converts Zoopla-specific property data to unified MCP format
 */

import { Property as MCPProperty } from '../mcp/property-data/PropertyDataMCP';

// Zoopla-specific property schema
export interface ZooplaProperty {
  id: string;
  title: string;
  price: {
    amount: number;
    frequency: 'per_month' | 'per_week' | 'total';
    display: string;
    originalPrice?: number;
  };
  location: {
    address: string;
    area: string;
    postcode: string;
    coordinates?: [number, number];
  };
  details: {
    bedrooms: number;
    bathrooms: number;
    propertyType: string;
    floorArea?: number;
    floorAreaUnit?: string;
  };
  images: {
    src: string;
    alt: string;
    isPrimary: boolean;
  }[];
  agent: {
    name: string;
    company: string;
    phone?: string;
    email?: string;
    photo?: string;
  };
  features: string[];
  description: string;
  availableFrom?: string;
  listingUrl: string;
  metadata: {
    lastUpdated: string;
    source: 'zoopla';
    searchScore?: number;
  };
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
 * Main transformation function to convert Zoopla property to MCP schema
 */
export function transformZooplaToMCP(zooplaProperty: ZooplaProperty): MCPProperty {
  try {
    const transformed: MCPProperty = {
      id: `zoopla-${zooplaProperty.id}`,
      title: zooplaProperty.title,
      price: normalizeZooplaPrice(zooplaProperty.price),
      location: extractZooplaLocation(zooplaProperty.location),
      specifications: normalizeZooplaSpecifications(zooplaProperty.details),
      features: zooplaProperty.features,
      description: zooplaProperty.description,
      images: enhanceZooplaImages(zooplaProperty.images),
      agent: enhanceZooplaAgent(zooplaProperty.agent),
      amenities: {
        nearby: [],
        onsite: []
      },
      status: 'available',
      metadata: generateZooplaMetadata(zooplaProperty.metadata),
      contactUrl: zooplaProperty.listingUrl,
      propertyUrl: zooplaProperty.listingUrl
    };

    // Validate the transformed data
    const validationResult = validateTransformedZooplaProperty(transformed);
    if (!validationResult.isValid) {
      console.warn(`⚠️ Validation warnings for Zoopla property ${zooplaProperty.id}:`, validationResult.warnings);
    }

    return transformed;
  } catch (error) {
    console.error(`❌ Error transforming Zoopla property ${zooplaProperty.id}:`, error);
    throw new Error(`Failed to transform Zoopla property: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Normalize Zoopla price data to MCP format
 */
export function normalizeZooplaPrice(price: ZooplaProperty['price']): MCPPrice {
  let period: 'monthly' | 'yearly' = 'monthly';
  let amount = price.amount;
  let display = price.display;

  // Convert weekly to monthly if needed
  if (price.frequency === 'per_week') {
    amount = Math.round(price.amount * 52 / 12);
    display = `${price.display} (~£${amount}/pcm)`;
  } else if (price.frequency === 'total') {
    period = 'yearly';
    display = `${price.display} (total)`;
  }

  return {
    amount,
    currency: 'GBP',
    type: 'rent',
    period,
    display
  };
}

/**
 * Extract and normalize Zoopla location data
 */
export function extractZooplaLocation(location: ZooplaProperty['location']): MCPLocation {
  const postcode = extractPostcode(location.address);
  const city = extractCity(location.address);

  return {
    address: location.address.trim(),
    city: city || location.area || 'Unknown',
    postcode: postcode || location.postcode || '',
    coordinates: location.coordinates,
    area: location.area || ''
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
    /London/i,
    /Manchester/i,
    /Birmingham/i,
    /Liverpool/i,
    /Leeds/i,
    /Sheffield/i,
    /Bristol/i,
    /Glasgow/i,
    /Edinburgh/i,
    /Cardiff/i,
    /Belfast/i,
    /Newcastle/i,
    /Nottingham/i,
    /Southampton/i,
    /Oxford/i,
    /Cambridge/i,
    /Brighton/i,
    /Bath/i,
    /Dartford/i,
    /Bromley/i,
    /Croydon/i,
    /Greenwich/i,
    /Lewisham/i,
    /Southwark/i,
    /Tower Hamlets/i,
    /Hackney/i,
    /Islington/i,
    /Camden/i,
    /Westminster/i,
    /Kensington/i,
    /Chelsea/i,
    /Hammersmith/i,
    /Fulham/i,
    /Wandsworth/i,
    /Lambeth/i,
    /Kingston/i,
    /Richmond/i,
    /Hounslow/i,
    /Ealing/i,
    /Brent/i,
    /Harrow/i,
    /Hillingdon/i,
    /Barnet/i,
    /Enfield/i,
    /Waltham Forest/i,
    /Redbridge/i,
    /Havering/i,
    /Barking/i,
    /Newham/i,
    /Bexley/i
  ];
  
  for (const pattern of cityPatterns) {
    const match = address.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return null;
}

/**
 * Normalize Zoopla specifications to MCP format
 */
export function normalizeZooplaSpecifications(details: ZooplaProperty['details']): MCPSpecifications {
  return {
    bedrooms: details.bedrooms || 0,
    bathrooms: details.bathrooms || 1,
    propertyType: normalizePropertyType(details.propertyType),
    totalArea: details.floorArea,
    parkingSpaces: undefined,
    yearBuilt: undefined
  };
}

/**
 * Normalize property type to standard format
 */
export function normalizePropertyType(propertyType: string): string {
  const type = propertyType.toLowerCase().trim();
  
  const typeMapping: { [key: string]: string } = {
    'flat': 'Flat',
    'apartment': 'Flat',
    'house': 'House',
    'bungalow': 'Bungalow',
    'studio': 'Studio',
    'maisonette': 'Maisonette',
    'penthouse': 'Penthouse',
    'cottage': 'House',
    'terraced': 'Terraced House',
    'semi-detached': 'Semi-Detached House',
    'detached': 'Detached House',
    'townhouse': 'Townhouse',
    'mews': 'Mews House'
  };
  
  return typeMapping[type] || propertyType;
}

/**
 * Enhance Zoopla images to MCP format
 */
export function enhanceZooplaImages(images: ZooplaProperty['images']): MCPImage[] {
  return images.map((image, index) => ({
    src: image.src,
    alt: image.alt || 'Property image',
    isPrimary: index === 0
  }));
}

/**
 * Enhance Zoopla agent data to MCP format
 */
export function enhanceZooplaAgent(agent: ZooplaProperty['agent']): MCPAgent {
  return {
    name: agent.name || 'Zoopla Agent',
    company: agent.company || 'Zoopla',
    phone: agent.phone,
    email: agent.email,
    photo: agent.photo
  };
}

/**
 * Generate MCP metadata for Zoopla properties
 */
export function generateZooplaMetadata(metadata: ZooplaProperty['metadata']): MCPMetadata {
  return {
    createdAt: new Date().toISOString(),
    lastUpdated: metadata.lastUpdated,
    searchScore: metadata.searchScore || Math.random() * 100,
    viewCount: Math.floor(Math.random() * 100),
    source: 'zoopla'
  };
}

/**
 * Validate transformed Zoopla property
 */
export function validateTransformedZooplaProperty(property: MCPProperty): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  // Check required fields
  if (!property.title) warnings.push('Missing title');
  if (!property.price.amount) warnings.push('Missing or invalid price');
  if (!property.location.address) warnings.push('Missing address');
  if (property.specifications.bedrooms < 0) warnings.push('Invalid bedroom count');
  if (property.specifications.bathrooms < 0) warnings.push('Invalid bathroom count');
  
  // Check data quality
  if (property.price.amount > 10000) warnings.push('Unusually high price');
  if (property.specifications.bedrooms > 10) warnings.push('Unusually high bedroom count');
  if (property.specifications.bathrooms > 10) warnings.push('Unusually high bathroom count');
  
  return {
    isValid: warnings.length === 0,
    warnings
  };
}

/**
 * Transform multiple Zoopla properties to MCP format
 */
export function transformZooplaProperties(properties: ZooplaProperty[]): MCPProperty[] {
  const transformed: MCPProperty[] = [];
  const errors: string[] = [];
  
  for (const property of properties) {
    try {
      const transformedProperty = transformZooplaToMCP(property);
      transformed.push(transformedProperty);
    } catch (error) {
      console.error(`Failed to transform Zoopla property ${property.id}:`, error);
      errors.push(`Property ${property.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  if (errors.length > 0) {
    console.warn(`⚠️ ${errors.length} Zoopla properties failed transformation:`, errors);
  }
  
  return transformed;
}

/**
 * Get transformation statistics
 */
export function getZooplaTransformationStats(original: ZooplaProperty[], transformed: MCPProperty[]): {
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
  const validPrices = transformed
    .map(p => p.price.amount)
    .filter(price => price > 0);
  const averagePrice = validPrices.length > 0 
    ? Math.round(validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length)
    : 0;
  
  // Count property types
  const propertyTypes: { [key: string]: number } = {};
  transformed.forEach(property => {
    const type = property.specifications.propertyType;
    propertyTypes[type] = (propertyTypes[type] || 0) + 1;
  });
  
  // Count cities
  const cities: { [key: string]: number } = {};
  transformed.forEach(property => {
    const city = property.location.city;
    cities[city] = (cities[city] || 0) + 1;
  });
  
  return {
    total,
    successful,
    failed,
    successRate,
    averagePrice,
    propertyTypes,
    cities
  };
} 