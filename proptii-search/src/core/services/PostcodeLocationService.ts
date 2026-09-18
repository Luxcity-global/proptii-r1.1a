import { connection as redis } from '../../infrastructure/queue';

export interface ResolvedLocation {
  query: string;
  displayName: string;
  postcode?: string;
  outcode?: string;
  adminDistrict?: string;
  region?: string;
  coordinates: { lat: number; lng: number };
  rightmoveLocationId: string;
  otmLocationSlug: string;
}

// Fallback dictionary for instant offline lookup or network timeout
const STATIC_LOCATION_IDS: Record<string, string> = {
  london: 'REGION^87490',
  manchester: 'REGION^904',
  birmingham: 'REGION^162',
  leeds: 'REGION^787',
  bristol: 'REGION^219',
  edinburgh: 'REGION^475',
  glasgow: 'REGION^550',
  liverpool: 'REGION^796',
  sheffield: 'REGION^1259',
  nottingham: 'REGION^981',
  newcastle: 'REGION^953',
  brighton: 'REGION^245',
  cambridge: 'REGION^274',
  oxford: 'REGION^1035',
  bath: 'REGION^115',
  cardiff: 'REGION^285',
  belfast: 'REGION^131',
  southampton: 'REGION^1287',
  reading: 'REGION^1139',
  york: 'REGION^1489',
  'canary wharf': 'REGION^70384',
  canary: 'REGION^70384',
  docklands: 'REGION^70384',
  islington: 'REGION^87508',
  camden: 'REGION^87500',
  hackney: 'REGION^87506',
  kensington: 'REGION^87510',
  chelsea: 'REGION^87510',
  westminster: 'REGION^87532',
  greenwich: 'REGION^87504',
  shoreditch: 'REGION^85398',
  stratford: 'REGION^85408',
  brixton: 'REGION^85246',
  clapham: 'REGION^85262',
  wandsworth: 'REGION^87530',
  richmond: 'REGION^87522',
  wimbledon: 'REGION^85458',
  hammersmith: 'REGION^87507',
  fulham: 'REGION^87507',
  southwark: 'REGION^87526',
  lambeth: 'REGION^87514',
  lewisham: 'REGION^87515',
  croydon: 'REGION^87501',
  ealing: 'REGION^87502',
  enfield: 'REGION^87503',
  barnet: 'REGION^87494',
  haringey: 'REGION^87509',
  harrow: 'REGION^87511',
  havering: 'REGION^87512',
  brent: 'REGION^87498',
  bromley: 'REGION^87499',
  bexley: 'REGION^87496',
  kingston: 'REGION^87513',
  hillingdon: 'REGION^87516',
  hounslow: 'REGION^87517',
  merton: 'REGION^87520',
  newham: 'REGION^87521',
  redbridge: 'REGION^87523',
  sutton: 'REGION^87528',
  'tower hamlets': 'REGION^87529',
  'waltham forest': 'REGION^87531',
  angel: 'REGION^87508',
  paddington: 'REGION^85362',
  marylebone: 'REGION^85348',
  mayfair: 'REGION^85350',
  soho: 'REGION^85400',
  vauxhall: 'REGION^85438',
  bermondsey: 'REGION^85236',
  battersea: 'REGION^85230',
  putney: 'REGION^85376',
  'notting hill': 'REGION^85358',
  hampstead: 'REGION^85304',
  highgate: 'REGION^85310',

  // Key London Outcodes (Instant Zero-Latency Hits)
  e14: 'OUTCODE^749',
  sw10: 'OUTCODE^2496',
  sw1: 'OUTCODE^2430',
  sw3: 'OUTCODE^2448',
  sw7: 'OUTCODE^2477',
  w1: 'OUTCODE^2830',
  w2: 'OUTCODE^2848',
  w8: 'OUTCODE^2884',
  w11: 'OUTCODE^2897',
  w14: 'OUTCODE^2905',
  wc1: 'OUTCODE^2945',
  wc2: 'OUTCODE^2955',
  ec1: 'OUTCODE^794',
  ec2: 'OUTCODE^804',
  ec3: 'OUTCODE^814',
  ec4: 'OUTCODE^824',
  e1: 'OUTCODE^690',
  e2: 'OUTCODE^700',
  e3: 'OUTCODE^710',
  e8: 'OUTCODE^720',
  e9: 'OUTCODE^725',
  e20: 'OUTCODE^3100',
  n1: 'OUTCODE^1610',
  nw1: 'OUTCODE^1865',
  nw3: 'OUTCODE^1885',
  nw8: 'OUTCODE^1910',
  se1: 'OUTCODE^2175',
  se10: 'OUTCODE^2220',
  se16: 'OUTCODE^2250',
};

// Well-known UK districts/neighbourhoods mapped to their primary Outcodes
const DISTRICT_TO_OUTCODE: Record<string, string> = {
  'canary wharf': 'E14',
  canary: 'E14',
  docklands: 'E14',
  shoreditch: 'E1',
  soho: 'W1',
  mayfair: 'W1',
  marylebone: 'NW1',
  paddington: 'W2',
  vauxhall: 'SW8',
  battersea: 'SW11',
  putney: 'SW15',
  brixton: 'SW2',
  clapham: 'SW4',
  wimbledon: 'SW19',
  angel: 'N1',
  islington: 'N1',
  camden: 'NW1',
  hackney: 'E8',
  greenwich: 'SE10',
  stratford: 'E20',
  'notting hill': 'W11',
  nottinghill: 'W11',
  hampstead: 'NW3',
  highgate: 'N6',
  bermondsey: 'SE1',
  fulham: 'SW6',
  hammersmith: 'W6',
  chelsea: 'SW3',
  kensington: 'W8',
  westminster: 'SW1',
  richmond: 'TW9',
};

// Standard UK postcode regex: Outcode (1-2 letters + 1-2 alphanumeric) + optional Incode (1 digit + 2 letters)
const UK_FULL_POSTCODE_REGEX = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/i;
const UK_OUTCODE_REGEX = /\b([A-Z]{1,2}\d[A-Z\d]?)\b/i;

// Words commonly occurring in search queries that should not be mistaken for outcodes or place names
const NON_LOCATION_WORDS = new Set([
  'in', 'at', 'near', 'around', 'rent', 'rental', 'sale', 'buy', 'to', 'for', 'pcm',
  'pw', 'flat', 'flats', 'apartment', 'apartments', 'house', 'houses', 'studio',
  'studios', 'bed', 'beds', 'bedroom', 'bedrooms', 'under', 'max', 'min', 'price',
  'budget', 'property', 'properties', 'from', 'with', 'parking', 'balcony', 'garden',
  'luxury', 'modern', 'cheap', 'furnished', 'unfurnished'
]);

const CACHE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
const MEMORY_CACHE = new Map<string, ResolvedLocation>();

export class PostcodeLocationService {
  /**
   * Resolves any UK query or filter into coordinates, administrative metadata,
   * Rightmove identifier, and OnTheMarket slug.
   */
  async resolve(query: string, filters: Record<string, any> = {}): Promise<ResolvedLocation> {
    const rawTarget = (filters.location || this.extractLocationString(query)).trim();
    const cacheKey = rawTarget.toLowerCase().replace(/\s+/g, ' ');

    // 1. Check in-memory LRU cache
    if (MEMORY_CACHE.has(cacheKey)) {
      return MEMORY_CACHE.get(cacheKey)!;
    }

    // 2. Check Redis cache
    try {
      const redisCached = await redis.get(`postcode:loc:${cacheKey}`).catch(() => null);
      if (redisCached) {
        const parsed: ResolvedLocation = JSON.parse(redisCached);
        MEMORY_CACHE.set(cacheKey, parsed);
        return parsed;
      }
    } catch {
      // Redis offline fallback
    }

    // 3. Parse input into Postcode, Outcode, or Place Name
    const parsedTarget = this.parseTarget(rawTarget);
    let resolved: ResolvedLocation;

    if (parsedTarget.type === 'full_postcode') {
      resolved = await this.resolveFullPostcode(parsedTarget.value, rawTarget);
    } else if (parsedTarget.type === 'outcode') {
      resolved = await this.resolveOutcode(parsedTarget.value, rawTarget);
    } else {
      resolved = await this.resolvePlace(parsedTarget.value, rawTarget);
    }

    // 4. Cache resolved location in memory & Redis
    MEMORY_CACHE.set(cacheKey, resolved);
    if (MEMORY_CACHE.size > 1000) {
      // Evict oldest entry
      const firstKey = MEMORY_CACHE.keys().next().value;
      if (firstKey) MEMORY_CACHE.delete(firstKey);
    }

    try {
      await redis.set(`postcode:loc:${cacheKey}`, JSON.stringify(resolved), 'EX', CACHE_TTL_SECONDS).catch(() => null);
    } catch {
      // Redis offline fallback
    }

    return resolved;
  }

  /**
   * Extracts location substring from human queries like:
   * "2 bed flat in E14 9GE under 3000" -> "E14 9GE"
   * "apartments in Canary Wharf with parking" -> "Canary Wharf"
   * "SW10" -> "SW10"
   */
  extractLocationString(query: string): string {
    const q = query.trim();
    if (!q) return 'London';

    // 1. Check for full UK postcode anywhere in the query
    const fullPostcodeMatch = q.match(UK_FULL_POSTCODE_REGEX);
    if (fullPostcodeMatch) {
      return fullPostcodeMatch[0].toUpperCase();
    }

    // 2. Check for location after "in", "around", "near", "at"
    const prepMatch = q.match(/\b(?:in|around|near|at)\s+([a-z0-9\s-]+?)(?:\s+(?:under|for|max|min|from|between|with|pcm|pw|£)\b|\s*$)/i);
    if (prepMatch && prepMatch[1]) {
      const candidate = prepMatch[1].replace(/^(?:in|around|near|at)\s+/i, '').trim();
      if (candidate.length > 0) return candidate;
    }

    // 3. Check for standalone outcode token
    const tokens = q.split(/\s+/);
    for (const token of tokens) {
      const upper = token.toUpperCase();
      if (UK_OUTCODE_REGEX.test(upper) && !NON_LOCATION_WORDS.has(token.toLowerCase()) && !/^\d+$/.test(token)) {
        return upper;
      }
    }

    // 4. Clean tokens removing filter keywords
    const cleaned = tokens
      .filter(t => !NON_LOCATION_WORDS.has(t.toLowerCase()) && !/^\d+$/.test(t) && !t.startsWith('£'))
      .join(' ')
      .trim();

    return cleaned || 'London';
  }

  private parseTarget(rawTarget: string): { type: 'full_postcode' | 'outcode' | 'place'; value: string } {
    let cleaned = rawTarget.trim();
    cleaned = cleaned.replace(/^(?:in|around|near|at)\s+/i, '').trim();

    const fullMatch = cleaned.match(UK_FULL_POSTCODE_REGEX);
    if (fullMatch) {
      return { type: 'full_postcode', value: fullMatch[0].toUpperCase() };
    }

    const outcodeMatch = cleaned.match(UK_OUTCODE_REGEX);
    // If the entire cleaned target is 2-4 chars matching an outcode, or starts with an outcode
    if (outcodeMatch && (cleaned.length <= 4 || cleaned.toUpperCase() === outcodeMatch[1].toUpperCase())) {
      return { type: 'outcode', value: outcodeMatch[1].toUpperCase() };
    }

    return { type: 'place', value: cleaned };
  }

  /**
   * Resolves a full UK postcode (e.g. "E14 9GE", "SW10 9EL")
   */
  private async resolveFullPostcode(postcode: string, originalQuery: string): Promise<ResolvedLocation> {
    const formattedPostcode = postcode.replace(/\s+/g, '');
    let lat = 51.5074;
    let lng = -0.1278;
    let outcode = postcode.split(' ')[0];
    let district = 'London';
    let region = 'London';

    try {
      const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(formattedPostcode)}`, {
        headers: { 'User-Agent': 'ProptiiSearch/1.0' },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 200 && data.result) {
          const r = data.result;
          lat = r.latitude || lat;
          lng = r.longitude || lng;
          outcode = r.outcode || outcode;
          district = r.admin_district || district;
          region = r.region || district;
        }
      }
    } catch (e: any) {
      console.warn(`[PostcodeLocationService] postcodes.io lookup failed for "${postcode}":`, e?.message || e);
    }

    // Resolve Rightmove ID and OTM slug
    const rightmoveLocationId = await this.resolveRightmoveIdentifier(outcode || postcode, district);
    const otmLocationSlug = outcode ? outcode.toLowerCase() : this.slugify(district);

    return {
      query: originalQuery,
      displayName: `${postcode} (${district})`,
      postcode,
      outcode,
      adminDistrict: district,
      region,
      coordinates: { lat, lng },
      rightmoveLocationId,
      otmLocationSlug,
    };
  }

  /**
   * Resolves a UK Outcode (e.g. "E14", "SW10", "NW1", "M1")
   */
  private async resolveOutcode(outcode: string, originalQuery: string): Promise<ResolvedLocation> {
    const cleanOutcode = outcode.toUpperCase().trim();
    let lat = 51.5074;
    let lng = -0.1278;
    let district = 'London';

    try {
      const res = await fetch(`https://api.postcodes.io/outcodes/${encodeURIComponent(cleanOutcode)}`, {
        headers: { 'User-Agent': 'ProptiiSearch/1.0' },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 200 && data.result) {
          const r = data.result;
          lat = r.latitude || lat;
          lng = r.longitude || lng;
          district = (r.admin_district && r.admin_district[0]) ? r.admin_district[0] : district;
        }
      }
    } catch (e: any) {
      console.warn(`[PostcodeLocationService] postcodes.io outcode lookup failed for "${cleanOutcode}":`, e?.message || e);
    }

    const rightmoveLocationId = await this.resolveRightmoveIdentifier(cleanOutcode, district);
    const otmLocationSlug = cleanOutcode.toLowerCase();

    return {
      query: originalQuery,
      displayName: `${cleanOutcode} (${district})`,
      outcode: cleanOutcode,
      adminDistrict: district,
      coordinates: { lat, lng },
      rightmoveLocationId,
      otmLocationSlug,
    };
  }

  /**
   * Resolves a place name or London borough (e.g. "Canary Wharf", "Richmond", "Manchester")
   */
  private async resolvePlace(place: string, originalQuery: string): Promise<ResolvedLocation> {
    const cleanPlace = place.trim();
    let lat = 51.5074;
    let lng = -0.1278;
    let outcode: string | undefined;
    let district = cleanPlace;
    let region: string | undefined;

    const mappedOutcode = DISTRICT_TO_OUTCODE[cleanPlace.toLowerCase()] || 
                          DISTRICT_TO_OUTCODE[cleanPlace.toLowerCase().replace(/\s+/g, '')];

    if (mappedOutcode) {
      outcode = mappedOutcode;
      const outcodeRes = await this.resolveOutcode(mappedOutcode, originalQuery);
      lat = outcodeRes.coordinates.lat;
      lng = outcodeRes.coordinates.lng;
      district = outcodeRes.adminDistrict || district;
    } else {
      // Check postcodes.io places endpoint
      try {
        const res = await fetch(`https://api.postcodes.io/places?q=${encodeURIComponent(cleanPlace)}`, {
          headers: { 'User-Agent': 'ProptiiSearch/1.0' },
          signal: AbortSignal.timeout(6000),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.status === 200 && Array.isArray(data.result) && data.result.length > 0) {
            // Find closest match or first result
            const top = data.result[0];
            lat = top.latitude || lat;
            lng = top.longitude || lng;
            outcode = top.outcode || undefined;
            district = top.district_borough || top.county_unitary || top.name_1 || district;
            region = top.region || undefined;
          }
        }
      } catch (e: any) {
        console.warn(`[PostcodeLocationService] postcodes.io places lookup failed for "${cleanPlace}":`, e?.message || e);
      }
    }

    const rightmoveLocationId = await this.resolveRightmoveIdentifier(cleanPlace, district);
    const otmLocationSlug = outcode ? outcode.toLowerCase() : this.slugify(cleanPlace);

    return {
      query: originalQuery,
      displayName: district !== cleanPlace ? `${cleanPlace}, ${district}` : cleanPlace,
      outcode,
      adminDistrict: district,
      region,
      coordinates: { lat, lng },
      rightmoveLocationId,
      otmLocationSlug,
    };
  }

  /**
   * Resolves Rightmove locationIdentifier using dynamic typeahead API with static fallback
   */
  async resolveRightmoveIdentifier(term: string, fallbackDistrict?: string): Promise<string> {
    const lower = term.toLowerCase().trim();

    // 1. Check static known IDs first for instant hit
    if (STATIC_LOCATION_IDS[lower]) {
      return STATIC_LOCATION_IDS[lower];
    }
    const lowerNoSpaces = lower.replace(/\s+/g, '');
    if (STATIC_LOCATION_IDS[lowerNoSpaces]) {
      return STATIC_LOCATION_IDS[lowerNoSpaces];
    }

    // 2. Query Rightmove TypeAhead API
    try {
      const res = await fetch(`https://los.rightmove.co.uk/typeahead?query=${encodeURIComponent(term)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Referer': 'https://www.rightmove.co.uk/',
          'Accept': 'application/json, text/plain, */*',
        },
        signal: AbortSignal.timeout(2000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.matches && Array.isArray(data.matches) && data.matches.length > 0) {
          // Prefer OUTCODE, REGION, or POSTCODE matches
          const match = data.matches.find((m: any) => m.type === 'OUTCODE') ||
                        data.matches.find((m: any) => m.type === 'REGION') ||
                        data.matches.find((m: any) => m.type === 'POSTCODE') ||
                        data.matches[0];

          if (match && match.type && match.id) {
            return `${match.type}^${match.id}`;
          }
        }
      }
    } catch (err: any) {
      console.warn(`[PostcodeLocationService] Rightmove typeahead failed for "${term}":`, err?.message || err);
    }

    // 3. Fallback to fallbackDistrict if available
    if (fallbackDistrict) {
      const districtLower = fallbackDistrict.toLowerCase().trim();
      if (STATIC_LOCATION_IDS[districtLower]) {
        return STATIC_LOCATION_IDS[districtLower];
      }
    }

    // 4. Default to London
    return 'REGION^87490';
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

export const postcodeLocationService = new PostcodeLocationService();
