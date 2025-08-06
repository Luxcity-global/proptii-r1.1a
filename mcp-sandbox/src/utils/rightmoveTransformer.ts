import { Property } from '../mcp/property-data/PropertyDataMCP';
import { RightmoveRawProperty } from '../scrapers/rightmoveScraper';
import crypto from 'crypto';

export function transformRightmoveToMCP(raw: RightmoveRawProperty): Property {
  // Generate a unique ID by hashing the listing URL
  const id = crypto.createHash('md5').update(raw.listingUrl).digest('hex');

  // Parse price and unit
  let price = 0;
  let priceUnit = 'total';
  const priceMatch = raw.price.match(/£([\d,]+)\s*(pcm|pw|pa)?/i);
  if (priceMatch) {
    price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
    if (priceMatch[2]) priceUnit = priceMatch[2].toLowerCase();
  }

  // Parse bedrooms
  let bedrooms = 0;
  const bedMatch = raw.bedrooms.match(/(\d+)/);
  if (bedMatch) bedrooms = parseInt(bedMatch[1], 10);

  // Normalize images
  const images = raw.imageUrl ? [{ src: raw.imageUrl, alt: raw.title, isPrimary: true }] : [];

  // Agent
  const agent = {
    name: raw.agentName || 'Rightmove',
    company: raw.agentName || 'Rightmove',
    photo: raw.agentLogoUrl || '',
  };

  // MCP Property schema
  const property: Property = {
    id,
    title: raw.title,
    price: {
      amount: price,
      currency: 'GBP',
      type: 'rent', // Assume rent for now; can be improved
      period: priceUnit === 'pa' ? 'yearly' : 'monthly',
      display: raw.price,
    },
    location: {
      address: raw.address,
      city: '',
      postcode: '',
      coordinates: undefined,
      area: '',
    },
    specifications: {
      bedrooms,
      bathrooms: 0,
      propertyType: raw.propertyType,
      totalArea: undefined,
      parkingSpaces: undefined,
      yearBuilt: undefined,
    },
    features: [],
    description: '',
    images,
    agent,
    amenities: {
      nearby: [],
      onsite: [],
    },
    status: 'available',
    metadata: {
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      searchScore: 0,
      viewCount: 0,
      source: 'Rightmove',
    },
    contactUrl: raw.listingUrl,
    propertyUrl: raw.listingUrl,
  };

  return property;
}

export function transformRightmoveProperties(raws: RightmoveRawProperty[]): Property[] {
  return raws.map(transformRightmoveToMCP);
} 