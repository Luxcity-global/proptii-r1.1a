import { Property as MCPProperty } from '../mcp/property-data/PropertyDataMCP';

// Openrent scraper schema (from openrentScraper.ts)
export interface OpenrentProperty {
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
 * Main transformation function to convert Openrent property to MCP schema
 */
export function transformOpenrentToMCP(openrentProperty: OpenrentProperty): MCPProperty {
  try {
    const transformed: MCPProperty = {
      id: openrentProperty.id,
      title: openrentProperty.title,
      price: normalizePrice(openrentProperty.price, openrentProperty.priceUnit),
      location: extractLocation(openrentProperty.address),
      specifications: normalizeSpecifications(openrentProperty),
      features: extractFeatures(openrentProperty.description),
      description: openrentProperty.description,
      images: enhanceImages(openrentProperty.images),
      agent: enhanceAgent(openrentProperty.agent),
      amenities: {
        nearby: [],
        onsite: []
      },
      status: 'available',
      metadata: generateMetadata('openrent'),
      contactUrl: openrentProperty.listingUrl,
      propertyUrl: openrentProperty.listingUrl
    };

    // Validate the transformed data
    const validationResult = validateTransformedProperty(transformed);
    if (!validationResult.isValid) {
      console.warn(`⚠️ Validation warnings for property ${openrentProperty.id}:`, validationResult.warnings);
    }

    return transformed;
  } catch (error) {
    console.error(`❌ Error transforming property ${openrentProperty.id}:`, error);
    throw new Error(`Failed to transform Openrent property: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Normalize price data to MCP format
 */
export function normalizePrice(price: number, unit: string): MCPPrice {
  const normalizedUnit = unit.toLowerCase();
  // MCP only allows 'monthly' or 'yearly'. Convert 'pw' to 'monthly' (approximate) for now.
  let period: 'monthly' | 'yearly' = 'monthly';
  if (normalizedUnit === 'pa') period = 'yearly';
  // If 'pw', convert to monthly (multiply by 52/12, rounded)
  let amount = price;
  let display = `£${price.toLocaleString()} ${unit}`;
  if (normalizedUnit === 'pw') {
    amount = Math.round(price * 52 / 12);
    display = `£${price.toLocaleString()} pw (~£${amount}/pcm)`;
  }
  if (normalizedUnit === 'pa') {
    display = `£${price.toLocaleString()} pa`;
  }
  if (normalizedUnit === 'pcm') {
    display = `£${price.toLocaleString()} pcm`;
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
    coordinates: undefined, // Use undefined instead of null
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
    /York/i,
    /Canterbury/i
  ];

  for (const pattern of cityPatterns) {
    const match = address.match(pattern);
    if (match) {
      return match[0];
    }
  }

  // Try to extract from postcode area
  const postcode = extractPostcode(address);
  if (postcode) {
    // Extract first part of postcode (area code)
    const areaCode = postcode.split(' ')[0];
    return areaCode;
  }

  return null;
}

/**
 * Extract area/district from address
 */
export function extractArea(address: string): string | null {
  // Remove postcode and common suffixes
  let cleanAddress = address.replace(/[A-Z]{1,2}[0-9][A-Z0-9]?\s*[0-9][A-Z]{2}/i, '').trim();
  cleanAddress = cleanAddress.replace(/,\s*$/, ''); // Remove trailing comma
  
  // Extract last part before postcode as area
  const parts = cleanAddress.split(',').map(part => part.trim()).filter(part => part.length > 0);
  return parts.length > 0 ? parts[parts.length - 1] : null;
}

/**
 * Normalize property specifications
 */
export function normalizeSpecifications(openrentProperty: OpenrentProperty): MCPSpecifications {
  return {
    bedrooms: openrentProperty.bedrooms,
    bathrooms: openrentProperty.bathrooms,
    propertyType: normalizePropertyType(openrentProperty.propertyType),
    totalArea: undefined, // Use undefined instead of null
    parkingSpaces: undefined,
    yearBuilt: undefined
  };
}

/**
 * Normalize property type to standard format
 */
export function normalizePropertyType(propertyType: string): string {
  const type = propertyType.toLowerCase().trim();
  
  // Map common variations to standard types
  const typeMap: { [key: string]: string } = {
    'flat': 'Flat',
    'apartment': 'Flat',
    'studio': 'Studio',
    'studio flat': 'Studio',
    '1 bed flat': '1 Bedroom Flat',
    '2 bed flat': '2 Bedroom Flat',
    '3 bed flat': '3 Bedroom Flat',
    '1 bedroom flat': '1 Bedroom Flat',
    '2 bedroom flat': '2 Bedroom Flat',
    '3 bedroom flat': '3 Bedroom Flat',
    'house': 'House',
    'detached house': 'Detached House',
    'semi-detached house': 'Semi-Detached House',
    'terraced house': 'Terraced House',
    'penthouse': 'Penthouse',
    'maisonette': 'Maisonette',
    'bungalow': 'Bungalow',
    'room': 'Room',
    'shared room': 'Room',
    'room in shared flat': 'Room',
    'room in shared house': 'Room'
  };

  return typeMap[type] || propertyType || 'Unknown';
}

/**
 * Extract features from property description
 */
export function extractFeatures(description: string): string[] {
  if (!description) return [];

  const features: string[] = [];
  const lowerDesc = description.toLowerCase();

  // Common property features to look for
  const featurePatterns = [
    { pattern: /furnished/i, feature: 'Furnished' },
    { pattern: /unfurnished/i, feature: 'Unfurnished' },
    { pattern: /parking/i, feature: 'Parking' },
    { pattern: /garden/i, feature: 'Garden' },
    { pattern: /balcony/i, feature: 'Balcony' },
    { pattern: /terrace/i, feature: 'Terrace' },
    { pattern: /central heating/i, feature: 'Central Heating' },
    { pattern: /double glazing/i, feature: 'Double Glazing' },
    { pattern: /en-suite/i, feature: 'En-suite' },
    { pattern: /ensuite/i, feature: 'En-suite' },
    { pattern: /lift/i, feature: 'Lift' },
    { pattern: /elevator/i, feature: 'Lift' },
    { pattern: /concierge/i, feature: 'Concierge' },
    { pattern: /gym/i, feature: 'Gym' },
    { pattern: /swimming pool/i, feature: 'Swimming Pool' },
    { pattern: /secure entry/i, feature: 'Secure Entry' },
    { pattern: /cctv/i, feature: 'CCTV' },
    { pattern: /bills included/i, feature: 'Bills Included' },
    { pattern: /no bills/i, feature: 'Bills Excluded' },
    { pattern: /pet friendly/i, feature: 'Pet Friendly' },
    { pattern: /no pets/i, feature: 'No Pets' },
    { pattern: /student friendly/i, feature: 'Student Friendly' },
    { pattern: /professionals only/i, feature: 'Professionals Only' }
  ];

  for (const { pattern, feature } of featurePatterns) {
    if (pattern.test(lowerDesc) && !features.includes(feature)) {
      features.push(feature);
    }
  }

  return features;
}

/**
 * Enhance images with alt text and primary image detection
 */
export function enhanceImages(images: string[]): MCPImage[] {
  if (!images || images.length === 0) return [];

  return images.map((src, index) => {
    // Normalize image URLs
    let normalizedSrc = src.startsWith('//') ? `https:${src}` : src;
    
    // Ensure protocol is present
    if (normalizedSrc.startsWith('http://') || normalizedSrc.startsWith('https://')) {
      // URL is already complete
    } else if (normalizedSrc.startsWith('/')) {
      // Relative URL - assume https
      normalizedSrc = `https://www.openrent.co.uk${normalizedSrc}`;
    } else {
      // Assume it's a relative URL
      normalizedSrc = `https://www.openrent.co.uk/${normalizedSrc}`;
    }
    
    // Generate meaningful alt text based on position
    const altTexts = [
      'Main property view',
      'Living room',
      'Kitchen',
      'Bedroom',
      'Bathroom',
      'Exterior view',
      'Garden or outdoor space',
      'Additional property view'
    ];
    
    const alt = index < altTexts.length ? altTexts[index] : `Property image ${index + 1}`;
    
    return {
      src: normalizedSrc,
      alt,
      isPrimary: index === 0 // First image is primary
    };
  });
}

/**
 * Enhance agent information
 */
export function enhanceAgent(agent: { name: string; contact: string }): MCPAgent {
  return {
    name: agent.name || 'Unknown',
    company: 'OpenRent',
    phone: agent.contact || undefined,
    email: undefined, // Not available in search results
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
    searchScore: Math.random() * 100, // Will be calculated by search algorithm
    viewCount: 0, // Will be tracked by analytics
    source: source
  };
}

/**
 * Validate transformed property data
 */
export function validateTransformedProperty(property: MCPProperty): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Check required fields
  if (!property.id) warnings.push('Missing property ID');
  if (!property.title) warnings.push('Missing property title');
  if (!property.price?.amount) warnings.push('Missing or invalid price');
  if (!property.location?.address) warnings.push('Missing address');
  if (property.specifications.bedrooms < 0) warnings.push('Invalid bedroom count');
  if (property.specifications.bathrooms < 0) warnings.push('Invalid bathroom count');

  // Check data quality
  if (property.price?.amount > 10000) warnings.push('Unusually high price - may need verification');
  if (property.specifications.bedrooms > 10) warnings.push('Unusually high bedroom count - may need verification');
  if (property.specifications.bathrooms > 10) warnings.push('Unusually high bathroom count - may need verification');

  // Check for missing optional but important data
  if (!property.images || property.images.length === 0) warnings.push('No images available');
  if (!property.description) warnings.push('No description available');
  if (!property.location.postcode) warnings.push('No postcode available');

  return {
    isValid: warnings.length === 0,
    warnings
  };
}

/**
 * Transform multiple Openrent properties to MCP format
 */
export function transformOpenrentProperties(properties: OpenrentProperty[]): MCPProperty[] {
  const transformed: MCPProperty[] = [];
  const errors: string[] = [];

  for (const property of properties) {
    try {
      const transformedProperty = transformOpenrentToMCP(property);
      transformed.push(transformedProperty);
    } catch (error) {
      const errorMsg = `Failed to transform property ${property.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error(errorMsg);
    }
  }

  if (errors.length > 0) {
    console.warn(`⚠️ ${errors.length} properties failed to transform:`, errors);
  }

  console.log(`✅ Successfully transformed ${transformed.length}/${properties.length} properties`);
  return transformed;
}

/**
 * Get transformation statistics
 */
export function getTransformationStats(original: OpenrentProperty[], transformed: MCPProperty[]): {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  averagePrice: number;
  propertyTypes: { [key: string]: number };
  cities: { [key: string]: number };
} {
  const successful = transformed.length;
  const failed = original.length - successful;
  const successRate = (successful / original.length) * 100;

  const prices = transformed.map(p => p.price.amount).filter(p => p > 0);
  const averagePrice = prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;

  const propertyTypes: { [key: string]: number } = {};
  const cities: { [key: string]: number } = {};

  transformed.forEach(property => {
    const type = property.specifications.propertyType;
    const city = property.location.city;
    
    propertyTypes[type] = (propertyTypes[type] || 0) + 1;
    cities[city] = (cities[city] || 0) + 1;
  });

  return {
    total: original.length,
    successful,
    failed,
    successRate,
    averagePrice: Math.round(averagePrice),
    propertyTypes,
    cities
  };
}

// Export types for use in other modules
export type { MCPPrice, MCPLocation, MCPImage, MCPMetadata, MCPAgent, MCPSpecifications, MCPAmenities }; 