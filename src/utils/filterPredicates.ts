import type { Property } from '../types/property';
import type { PropertyTypeCategory, SortOption } from '../types/filter';
import { 
  extractMonthlyPrice, 
  extractBedrooms, 
  categorizePropertyType,
  extractFurnishingStatus,
  hasParkingFeature,
  hasBalconyOrGardenFeature,
  hasPetFriendlyFeature,
  extractPetPolicy,
  type PetPolicy,
  hasBillsIncludedFeature,
  extractListingDateEpoch
} from './propertyParsers';

/**
 * Checks if a property matches the requested min and max price window (in GBP pcm).
 */
export function matchPrice(
  property: Property,
  minPrice: number | null,
  maxPrice: number | null
): boolean {
  const numericMin = minPrice !== null && minPrice !== undefined ? Number(minPrice) : null;
  const numericMax = maxPrice !== null && maxPrice !== undefined ? Number(maxPrice) : null;

  if (numericMin === null && numericMax === null) return true;

  const price = extractMonthlyPrice(property.price);
  if (price === null) {
    // If a price filter is actively set, omit unpriced / POA listings
    return false;
  }

  if (numericMin !== null && price < numericMin) return false;
  if (numericMax !== null && price > numericMax) return false;

  return true;
}

/**
 * Checks if a property matches the requested bedroom filter.
 * When `bedrooms === 'any'`, matches all.
 * When an array is passed, e.g. `[1, 2]`:
 * - Studio is represented as `0`.
 * - If `4` is in the list, it acts as "4+" (matches >= 4).
 * Falls back to extracting bedrooms from title and description if property.bedrooms is omitted.
 */
export function matchBedrooms(
  property: Property,
  selectedBedrooms: (number | string)[] | 'any'
): boolean {
  if (selectedBedrooms === 'any' || !Array.isArray(selectedBedrooms) || selectedBedrooms.length === 0) {
    return true;
  }

  // 1. Primary: structured bedrooms field
  let beds = extractBedrooms(property.bedrooms);

  // 2. Resilient Fallback: title and description (common in scraped portals)
  if (beds === null && property.title) {
    beds = extractBedrooms(property.title);
  }
  if (beds === null && property.description) {
    beds = extractBedrooms(property.description);
  }
  // 3. Fallback for Studio: if propertyType indicates studio, treat as 0 beds
  if (beds === null && categorizePropertyType(property.propertyType, property.title) === 'studio') {
    beds = 0;
  }

  if (beds === null) return false;

  return selectedBedrooms.some((sel) => {
    const target = typeof sel === 'string' ? parseInt(sel, 10) : sel;
    if (isNaN(target)) return false;
    if (target === 0) {
      return beds === 0 || categorizePropertyType(property.propertyType, property.title) === 'studio';
    }
    if (target >= 4) {
      return beds >= 4;
    }
    return beds === target;
  });
}

/**
 * Checks if a property matches any of the selected property types.
 * Empty array = no filter applied (matches all).
 */
export function matchPropertyType(
  property: Property,
  selectedTypes: PropertyTypeCategory[]
): boolean {
  if (!selectedTypes || selectedTypes.length === 0) return true;

  const category = categorizePropertyType(property.propertyType, property.title);
  if (selectedTypes.includes(category)) return true;

  // Harmonized studio matching: if selectedTypes includes 'studio' and listing is 0 bedrooms
  if (selectedTypes.includes('studio')) {
    const beds = extractBedrooms(property.bedrooms) ?? (property.title ? extractBedrooms(property.title) : null);
    if (beds === 0) return true;
  }

  return false;
}

/**
 * Checks if a property matches free-text keywords across title, location, description, and amenities.
 */
export function matchKeywords(property: Property, keywords: string): boolean {
  const trimmed = keywords.trim().toLowerCase();
  if (!trimmed) return true;

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  const haystack = [
    property.title,
    property.location,
    property.description,
    property.propertyType,
    ...(property.amenities || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return tokens.every((token) => haystack.includes(token));
}

/**
 * Comparator function to sort properties based on user preference.
 */
export function sortProperties(a: Property, b: Property, sortBy: SortOption): number {
  if (sortBy === 'recommended') {
    return 0; // Maintain original scraper rank
  }

  if (sortBy === 'price_asc' || sortBy === 'price_desc') {
    const priceA = extractMonthlyPrice(a.price) ?? (sortBy === 'price_asc' ? Infinity : -Infinity);
    const priceB = extractMonthlyPrice(b.price) ?? (sortBy === 'price_asc' ? Infinity : -Infinity);
    return sortBy === 'price_asc' ? priceA - priceB : priceB - priceA;
  }

  if (sortBy === 'beds_desc') {
    const bedsA = extractBedrooms(a.bedrooms) ?? -1;
    const bedsB = extractBedrooms(b.bedrooms) ?? -1;
    return bedsB - bedsA;
  }

  if (sortBy === 'newest') {
    const epochA = extractListingDateEpoch(a.publishedOn, a.addedOrReduced);
    const epochB = extractListingDateEpoch(b.publishedOn, b.addedOrReduced);
    return epochB - epochA;
  }

  return 0;
}

/**
 * Checks if a property matches the furnishing preference.
 */
export function matchFurnishing(
  property: Property,
  furnishing: 'furnished' | 'unfurnished' | 'any'
): boolean {
  if (!furnishing || furnishing === 'any') return true;

  const combinedText = [
    property.title,
    property.description,
    property.propertyType,
    ...(property.amenities || []),
  ].filter(Boolean).join(' ');

  const status = extractFurnishingStatus(combinedText);
  if (status === 'unknown') return true; // Don't aggressively drop properties if unstated
  return status === furnishing;
}

/**
 * Checks if a property offers parking.
 */
export function matchParking(property: Property, required: boolean): boolean {
  if (!required) return true;
  const combinedText = [
    property.title,
    property.description,
    property.propertyType,
    ...(property.amenities || []),
  ].filter(Boolean).join(' ');

  return hasParkingFeature(combinedText);
}

/**
 * Checks if a property offers a balcony, garden, or terrace.
 */
export function matchBalconyOrGarden(property: Property, required: boolean): boolean {
  if (!required) return true;
  const combinedText = [
    property.title,
    property.description,
    property.propertyType,
    ...(property.amenities || []),
  ].filter(Boolean).join(' ');

  return hasBalconyOrGardenFeature(combinedText);
}

/**
 * Checks if a property is pet-friendly.
 * - If required is false, matches all.
 * - If required is true:
 *   - listings explicitly forbidding pets ('forbidden') are ALWAYS rejected.
 *   - listings explicitly allowing pets ('allowed') are ALWAYS accepted.
 *   - unstated listings ('unknown') are accepted if allowUnconfirmed is true, else rejected.
 */
export function matchPetFriendly(
  property: Property,
  required: boolean,
  allowUnconfirmed: boolean = false
): boolean {
  if (!required) return true;
  const combinedText = [
    property.title,
    property.description,
    property.propertyType,
  ].filter(Boolean).join(' ');

  const policy = extractPetPolicy(combinedText, property.amenities);
  if (policy === 'forbidden') return false;
  if (policy === 'allowed') return true;
  return allowUnconfirmed;
}

/**
 * Checks if a property includes bills.
 */
export function matchBillsIncluded(property: Property, required: boolean): boolean {
  if (!required) return true;
  const combinedText = [
    property.title,
    property.description,
    property.propertyType,
  ].filter(Boolean).join(' ');

  return hasBillsIncludedFeature(combinedText, property.amenities);
}

