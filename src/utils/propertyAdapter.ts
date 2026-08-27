import { Property as ScrapedProperty } from '../types/property';

// Target interface expected by ListingDetailsModal
export interface ModalProperty {
  id: string;
  title: string;
  price: number;
  type: 'rent' | 'sale';
  bedrooms: number;
  bathrooms: number;
  location: {
    address: string;
    city: string;
    postcode: string;
    coordinates: [number, number];
  };
  images: {
    src: string;
    alt: string;
    loading: string;
    sizes: string;
  }[];
  features: string[];
  description: string;
  agent: {
    name: string;
    company: string;
    phone: string;
    email: string;
  };
  amenities: {
    schools: number;
    transport: string[];
    shops: string[];
  };
  phone?: string;
  landlordId?: string;
  createdAt: string;
  updatedAt: string;
  isAvailableNow?: boolean;
}

/**
 * Extracts a valid UK Postcode from a location string or description using a standard Regex.
 */
function extractPostcode(locationStr: string, descriptionStr?: string): string {
  const regex = /[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}/i;
  
  if (locationStr) {
    const match = locationStr.match(regex);
    if (match) return match[0].toUpperCase();
  }
  
  if (descriptionStr) {
    const match = descriptionStr.match(regex);
    if (match) return match[0].toUpperCase();
  }
  
  return '';
}

/**
 * Cleans a price string (e.g. "£1,200 pcm") into a clean number (e.g. 1200)
 */
function parsePrice(priceStr: string | number): number {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr) return 0;
  // Strip everything except digits and decimal point
  const cleanStr = priceStr.replace(/[^\d.]/g, '');
  return parseFloat(cleanStr) || 0;
}

/**
 * Parses bedrooms or bathrooms to a number
 */
function parseCount(count: string | number | undefined, fallback: number = 1): number {
  if (typeof count === 'number') return count;
  if (!count) return fallback;
  const parsed = parseInt(count.toString().replace(/[^\d]/g, ''), 10);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Adapts a Scraped Property (or Native Property from API) into the rich ModalProperty format
 */
export function mapScrapedToNative(property: ScrapedProperty): ModalProperty {
  const extractedPostcode = extractPostcode(property.location, property.description) || property.postcode || '';
  
  // Provide a safe placeholder if no images exist
  const placeholderImage = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800';
  const rawImages = property.imageUrls && property.imageUrls.length > 0 ? property.imageUrls : [placeholderImage];
  
  const mappedImages = rawImages.map((url, i) => ({
    src: url,
    alt: `${property.title} - Image ${i + 1}`,
    loading: i === 0 ? 'eager' : 'lazy',
    sizes: '100vw'
  }));

  return {
    id: property.id || property.url || `scraped-${Date.now()}`,
    title: property.title || 'Unknown Property',
    price: parsePrice(property.price),
    type: 'rent', // Assuming rent for scraped context based on search
    bedrooms: parseCount(property.bedrooms, 1),
    bathrooms: parseCount(property.bathrooms, 1),
    location: {
      address: property.location || 'Unknown Address',
      city: property.city || property.town || property.location?.split(',')[0] || '',
      postcode: extractedPostcode,
      coordinates: property.coordinates ? [property.coordinates.lat, property.coordinates.lng] : [0, 0]
    },
    images: mappedImages,
    features: [],
    description: property.description || `This beautiful ${property.propertyType || 'property'} offers ${property.bedrooms || 1} bedrooms and is located in the desirable area of ${property.location}.`,
    agent: {
      name: property.agent?.name || 'External Agent',
      company: property.agent?.company || property.source || 'External Agency',
      phone: property.agent?.phone || '',
      email: property.agent?.email || ''
    },
    amenities: {
      schools: 0,
      transport: property.amenities || [],
      shops: []
    },
    phone: property.agent?.phone,
    landlordId: property.landlordId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isAvailableNow: true
  };
}
