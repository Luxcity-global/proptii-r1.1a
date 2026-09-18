import type { PropertyTypeCategory } from '../types/filter';

/**
 * Extracts a numeric monthly price in GBP from raw scraped price strings.
 * Converts weekly pricing (£pw) to equivalent monthly (pcm = pw * 52 / 12).
 * Returns null if price is missing, unpriced, or "POA".
 */
export function extractMonthlyPrice(rawPrice: string | undefined | null): number | null {
  if (!rawPrice || typeof rawPrice !== 'string') return null;

  const lower = rawPrice.toLowerCase().trim();
  if (
    lower.includes('poa') || 
    lower.includes('price on application') || 
    lower.includes('guide price on application')
  ) {
    return null;
  }

  // Remove commas for clean regex parsing: "£2,700 pcm" -> "£2700 pcm"
  const clean = lower.replace(/,/g, '');

  // 1. Explicit pcm match (preferred): "£2700 pcm"
  const pcmMatch = clean.match(/£?(\d+(?:\.\d+)?)\s*pcm/);
  if (pcmMatch) {
    const val = parseFloat(pcmMatch[1]);
    return Number.isFinite(val) ? Math.round(val) : null;
  }

  // 2. Explicit pw match: "£623 pw"
  const pwMatch = clean.match(/£?(\d+(?:\.\d+)?)\s*pw/);
  if (pwMatch) {
    const weekly = parseFloat(pwMatch[1]);
    return Number.isFinite(weekly) ? Math.round((weekly * 52) / 12) : null;
  }

  // 3. Fallback raw numeric match: "£450000" or "1850"
  const rawMatch = clean.match(/£?(\d+(?:\.\d+)?)/);
  if (rawMatch) {
    const rawVal = parseFloat(rawMatch[1]);
    return Number.isFinite(rawVal) ? Math.round(rawVal) : null;
  }

  return null;
}

/**
 * Normalizes property bedroom count into a numeric integer.
 * Studios are represented as 0. Returns null if unknown.
 */
export function extractBedrooms(raw: string | number | undefined | null): number | null {
  if (raw === undefined || raw === null) return null;
  
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : null;
  }

  const str = String(raw).trim().toLowerCase();
  if (!str || str === 'null' || str === 'undefined' || str === '—') return null;

  if (str.includes('studio')) {
    return 0;
  }

  const match = str.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

/**
 * Categorizes property types into standardized buckets:
 * - 'studio': studio flats / bedsits
 * - 'flat': apartments, flats, maisonettes, duplexes, penthouses
 * - 'house': terraced, semi-detached, detached, townhouses, mews, cottages
 * - 'bungalow': bungalows, chalets
 */
export function categorizePropertyType(
  typeStr: string | undefined | null, 
  titleStr?: string | undefined | null
): PropertyTypeCategory {
  const type = (typeStr || '').toLowerCase().trim();
  const title = (titleStr || '').toLowerCase().trim();

  // If typeStr is specific, prioritize it; otherwise combine type + title
  const target = (type && type !== 'property' && type !== 'residential') ? type : `${type} ${title}`;

  if (target.includes('studio') || target.includes('bedsit')) {
    return 'studio';
  }
  
  if (target.includes('bungalow') || target.includes('chalet')) {
    return 'bungalow';
  }

  // Check flat / apartment / penthouse / maisonette
  if (
    target.includes('flat') ||
    target.includes('apartment') ||
    target.includes('maisonette') ||
    target.includes('duplex') ||
    target.includes('penthouse')
  ) {
    return 'flat';
  }

  if (
    /\bhouses?\b/.test(target) ||
    target.includes('terraced') ||
    target.includes('detached') ||
    target.includes('semi-detached') ||
    target.includes('townhouse') ||
    target.includes('cottage') ||
    target.includes('villa') ||
    target.includes('mews')
  ) {
    return 'house';
  }

  // If target was type and it was unclassified, check title as fallback
  if (target === type && title) {
    return categorizePropertyType('', title);
  }

  // Default for UK urban rental listings
  return 'flat';
}

/**
 * Detects furnishing status from title, description, or features text.
 */
export function extractFurnishingStatus(
  text: string | undefined | null
): 'furnished' | 'unfurnished' | 'unknown' {
  if (!text) return 'unknown';
  const lower = text.toLowerCase();

  if (
    lower.includes('unfurnished') || 
    lower.includes('un-furnished') || 
    lower.includes('not furnished')
  ) {
    return 'unfurnished';
  }

  if (
    lower.includes('furnished') || 
    lower.includes('fully furnished') || 
    lower.includes('part furnished')
  ) {
    return 'furnished';
  }

  return 'unknown';
}

/**
 * Detects whether a property mentions parking.
 */
export function hasParkingFeature(text: string | undefined | null): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return (
    lower.includes('parking') || 
    lower.includes('garage') || 
    lower.includes('allocated parking') || 
    lower.includes('driveway') ||
    lower.includes('resident permit')
  );
}

/**
 * Detects whether a property mentions outside space (balcony, terrace, garden, patio).
 */
export function hasBalconyOrGardenFeature(text: string | undefined | null): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return (
    lower.includes('balcony') || 
    lower.includes('garden') || 
    lower.includes('terrace') || 
    lower.includes('patio') ||
    lower.includes('roof terrace') ||
    lower.includes('communal garden')
  );
}

/**
 * Detects whether a property allows pets.
 * Inspects amenities array, title, and description.
 * Ensures negative phrases (e.g. "strictly no pets", "no pets allowed") return false.
 */
export function hasPetFriendlyFeature(
  text: string | undefined | null,
  amenities?: string[] | null
): boolean {
  // 1. Check amenities array
  if (Array.isArray(amenities)) {
    for (const am of amenities) {
      const lowerAm = (typeof am === 'string' ? am : (am as any)?.description || (am as any)?.title || '').toLowerCase();
      if (
        /\b(pet|pets|dog|dogs|cat|cats|animal)\b/i.test(lowerAm) &&
        !/\b(no\s+pets?|not\s+allowed|forbidden)\b/i.test(lowerAm)
      ) {
        return true;
      }
    }
  }

  if (!text) return false;
  const lower = text.toLowerCase();

  // Explicit negatives take precedence
  if (
    /\b(no\s+pets?|pets?\s+not\s+allowed|pets?\s+strictly\s+forbidden|not\s+suitable\s+for\s+pets?|strictly\s+no\s+pets?|sorry\s*,?\s*no\s+(pets?|dogs?|cats?))\b/i.test(lower)
  ) {
    return false;
  }

  // Positive mentions
  return (
    /\b(pet[- ]friendly|dog[- ]friendly|cat[- ]friendly|animals?\s+welcome)\b/i.test(lower) ||
    /\b(pets?|dogs?|cats?|animals?)\s+(welcome|allowed|considered|accepted|permitted)\b/i.test(lower)
  );
}

/**
 * Detects whether all or key bills are included in rent.
 */
export function hasBillsIncludedFeature(
  text: string | undefined | null,
  amenities?: string[] | null
): boolean {
  if (Array.isArray(amenities)) {
    for (const am of amenities) {
      const lowerAm = (typeof am === 'string' ? am : (am as any)?.description || (am as any)?.title || '').toLowerCase();
      if (/\b(bills?\s+(inc|inclusive|included)|all\s+bills|utilities\s+included)\b/i.test(lowerAm)) {
        return true;
      }
    }
  }

  if (!text) return false;
  const lower = text.toLowerCase();
  return (
    /\b(bills?\s+(inc|inclusive|included)|all\s+bills\s+(inc|inclusive|included)|utilities\s+included|utility\s+bills\s+(covered|included)|gas\s+and\s+elec(tric)?\s+included)\b/i.test(lower) ||
    /\b(includes?|including)\s+(all\s+bills|utility\s+bills|electricity|utilities|water)\b/i.test(lower)
  );
}

/**
 * Detects whether a property mentions being close to a station/tube/transport links.
 */
export function hasStationNearbyFeature(
  text: string | undefined | null,
  amenities?: string[] | null
): boolean {
  if (Array.isArray(amenities)) {
    for (const am of amenities) {
      const lowerAm = (typeof am === 'string' ? am : (am as any)?.description || (am as any)?.title || '').toLowerCase();
      if (/\b(station|underground|tube|dlr|overground|crossrail|elizabeth line|metro|train)\b/i.test(lowerAm)) {
        return true;
      }
    }
  }

  if (!text) return false;
  const lower = text.toLowerCase();
  return (
    /\b(near|close to|walking distance to|minutes to|min walk to|walk to|opposite|adjacent to)\s+([a-z\s]+)?(station|tube|underground|train|dlr|overground)\b/i.test(lower) ||
    /\b([0-9]+)\s*(mins?|minutes?)\s*(walk)?\s*(to)?\s*([a-z\s]+)?(station|tube)\b/i.test(lower) ||
    /\b(great|excellent)\s+transport\s+links\b/i.test(lower)
  );
}

/**
 * Detects whether a property mentions an on-site gym or fitness facilities.
 */
export function hasGymFeature(
  text: string | undefined | null,
  amenities?: string[] | null
): boolean {
  if (Array.isArray(amenities)) {
    for (const am of amenities) {
      const lowerAm = (typeof am === 'string' ? am : (am as any)?.description || (am as any)?.title || '').toLowerCase();
      if (/\b(gym|fitness|gymnasium|workout)\b/i.test(lowerAm)) {
        return true;
      }
    }
  }

  if (!text) return false;
  const lower = text.toLowerCase();
  return /\b(gym|gymnasium|fitness suite|fitness centre|residents'? gym|on-?site gym)\b/i.test(lower);
}

/**
 * Detects whether a property mentions a concierge or porter service.
 */
export function hasConciergeFeature(
  text: string | undefined | null,
  amenities?: string[] | null
): boolean {
  if (Array.isArray(amenities)) {
    for (const am of amenities) {
      const lowerAm = (typeof am === 'string' ? am : (am as any)?.description || (am as any)?.title || '').toLowerCase();
      if (/\b(concierge|porter)\b/i.test(lowerAm)) {
        return true;
      }
    }
  }

  if (!text) return false;
  const lower = text.toLowerCase();
  return /\b(concierge|porter|24[- ]?hour concierge|24hr concierge|day concierge)\b/i.test(lower);
}

/**
 * Extracts a comparable timestamp (epoch ms) from a listing's publishedOn, addedOrReduced, or date string.
 * Returns 0 if missing.
 */
export function extractListingDateEpoch(
  publishedOn?: string | null,
  addedOrReduced?: string | null
): number {
  if (publishedOn) {
    const t = Date.parse(publishedOn);
    if (!isNaN(t)) return t;
  }

  if (addedOrReduced) {
    const lower = addedOrReduced.toLowerCase();
    const now = Date.now();
    if (lower.includes('today') || lower.includes('hour')) return now;
    if (lower.includes('yesterday')) return now - 86400000;
    const daysMatch = lower.match(/(\d+)\s*days?\s*ago/);
    if (daysMatch) return now - parseInt(daysMatch[1], 10) * 86400000;
    const dateMatch = addedOrReduced.match(/\b(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})\b/);
    if (dateMatch) {
      const parsed = Date.parse(`${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`);
      if (!isNaN(parsed)) return parsed;
    }
  }

  return 0;
}

