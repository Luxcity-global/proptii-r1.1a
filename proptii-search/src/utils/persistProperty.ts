import Property from '../models/Property';

export type PersistableProperty = Record<string, unknown> & {
  url?: string;
  title?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number | string | null;
  bathrooms?: number | string | null;
};

function buildAddressLabel(property: PersistableProperty): string {
  const location = typeof property.location === 'string' ? property.location.trim() : '';
  if (location) return location;
  const title = typeof property.title === 'string' ? property.title.trim() : '';
  return title;
}

function hasCoordinates(property: PersistableProperty): boolean {
  return (
    typeof property.latitude === 'number' &&
    Number.isFinite(property.latitude) &&
    typeof property.longitude === 'number' &&
    Number.isFinite(property.longitude)
  );
}

function parseCount(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value == null || value === '') return null;
  const parsed = parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

const UK_POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/i;

/** Fast postcode centroid — avoids Google Geocoding timeouts during live search. */
async function geocodeFromPostcode(
  location: string,
): Promise<{ latitude: number; longitude: number } | null> {
  const match = location.toUpperCase().match(UK_POSTCODE);
  if (!match) return null;
  const compact = `${match[1]}${match[2]}`.replace(/\s/g, '');
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(compact)}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status?: number;
      result?: { latitude: number; longitude: number };
    };
    if (data.status !== 200 || !data.result) return null;
    return { latitude: data.result.latitude, longitude: data.result.longitude };
  } catch {
    return null;
  }
}

/**
 * Persist listing fields. Coordinates come from Mongo if already stored,
 * otherwise a postcodes.io centroid when the location contains a UK postcode.
 * Google Geocoding is not called here — 50+ parallel ingest calls time it out,
 * and the report map uses a Google Maps address embed instead.
 */
export async function persistProperty(property: PersistableProperty) {
  const sanitized: PersistableProperty = {
    ...property,
    bedrooms: parseCount(property.bedrooms),
    bathrooms: parseCount(property.bathrooms),
    scrapedAt: new Date(),
  };

  const url = typeof sanitized.url === 'string' ? sanitized.url : null;
  if (!url) return sanitized;

  let latitude = sanitized.latitude;
  let longitude = sanitized.longitude;

  if (!hasCoordinates(sanitized)) {
    try {
      const existing = await Property.findOne({ url }).select('latitude longitude').lean();
      if (existing?.latitude != null && existing?.longitude != null) {
        latitude = existing.latitude;
        longitude = existing.longitude;
      }
    } catch (error) {
      console.warn('[persistProperty] Mongo lookup skipped:', (error as Error).message);
    }

    if (latitude == null || longitude == null) {
      const coords = await geocodeFromPostcode(buildAddressLabel(sanitized));
      if (coords) {
        latitude = coords.latitude;
        longitude = coords.longitude;
      }
    }
  }

  const payload: PersistableProperty = {
    ...sanitized,
    ...(latitude != null && longitude != null ? { latitude, longitude, geocodedAt: new Date() } : {}),
  };

  try {
    await Property.findOneAndUpdate({ url }, payload, { upsert: true, returnDocument: 'after' });
  } catch (error) {
    console.warn('[persistProperty] Mongo save skipped:', (error as Error).message);
  }

  return payload;
}

export async function persistProperties(properties: PersistableProperty[]) {
  return Promise.all(properties.map((property) => persistProperty(property)));
}
