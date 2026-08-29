import {
  extractPlaceQuery,
  extractUkOutcode,
  extractUkPostcode,
  lookupOutcodeCentroid,
  lookupPlaceCentroid,
  lookupPostcodeCentroid,
} from './postcodesIo';

export interface ReportMapCoords {
  lat: number;
  lng: number;
  source: 'postcodes.io';
}

const coordCache = new Map<string, Promise<ReportMapCoords | null>>();

function cacheKey(query: string): string {
  return query.trim().toLowerCase();
}

async function resolveUncached(query: string): Promise<ReportMapCoords | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const postcode = extractUkPostcode(trimmed);
  if (postcode) {
    const centroid = await lookupPostcodeCentroid(postcode);
    if (centroid) return { ...centroid, source: 'postcodes.io' };
  }

  const outcode = extractUkOutcode(trimmed);
  if (outcode) {
    const centroid = await lookupOutcodeCentroid(outcode);
    if (centroid) return { ...centroid, source: 'postcodes.io' };
  }

  const place = extractPlaceQuery(trimmed);
  if (place) {
    const centroid = await lookupPlaceCentroid(place);
    if (centroid) return { ...centroid, source: 'postcodes.io' };
  }

  return null;
}

/** Shared cache so Unlock diagnostic and the report map share one geocode. */
export function resolveMapCoordinates(query: string): Promise<ReportMapCoords | null> {
  const key = cacheKey(query);
  if (!key) return Promise.resolve(null);

  const existing = coordCache.get(key);
  if (existing) return existing;

  const pending = resolveUncached(query)
    .catch(() => null)
    .then((coords) => {
      if (!coords) coordCache.delete(key);
      return coords;
    });
  coordCache.set(key, pending);
  return pending;
}
