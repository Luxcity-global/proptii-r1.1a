const UK_POSTCODE_RE = /\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i;

export function extractUkPostcode(text: string): string | null {
  const match = text.toUpperCase().match(UK_POSTCODE_RE);
  if (!match?.[1]) return null;
  return match[1].replace(/\s+/g, ' ').trim();
}

export function extractUkOutcode(text: string): string | null {
  const full = extractUkPostcode(text);
  if (full) return full.split(' ')[0];
  const match = text.toUpperCase().match(/\b([A-Z]{1,2}\d[A-Z\d]?)\s*$/);
  return match?.[1] ?? null;
}

/** Last comma-separated token — usually the town/city when no postcode is present. */
export function extractPlaceQuery(text: string): string | null {
  const parts = text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const last = parts[parts.length - 1];
  if (!last) return null;
  if (extractUkPostcode(last) || extractUkOutcode(last)) {
    return parts.length > 1 ? parts[parts.length - 2] : null;
  }
  return last;
}

/** OpenStreetMap iframe — loads MapLibre tiles client-side (often blocked or slow). */
export function openStreetMapEmbedUrl(latitude: number, longitude: number, delta = 0.008): string {
  const minLat = latitude - delta;
  const maxLat = latitude + delta;
  const minLng = longitude - delta;
  const maxLng = longitude + delta;
  const bbox = `${minLng},${minLat},${maxLng},${maxLat}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${latitude},${longitude}`)}`;
}

/** Single pre-rendered OSM image — avoids tile.openstreetmap.org fetch storms in iframes. */
export function openStreetMapStaticImageUrl(
  latitude: number,
  longitude: number,
  width = 640,
  height = 320,
  zoom = 14,
): string {
  const center = `${latitude},${longitude}`;
  const params = new URLSearchParams({
    center,
    zoom: String(zoom),
    size: `${width}x${height}`,
  });
  return `https://staticmap.openstreetmap.de/staticmap.php?${params.toString()}`;
}

/** Wikimedia OSM static image — separate CDN from tile.openstreetmap.org. */
export function wikimediaStaticMapUrl(
  latitude: number,
  longitude: number,
  width = 640,
  height = 320,
  zoom = 14,
): string {
  return `https://maps.wikimedia.org/img/osm-intl,${zoom},${latitude},${longitude},${width}x${height}.png`;
}

/** OpenStreetMap France static image — alternate OSM static host. */
export function openStreetMapFrStaticImageUrl(
  latitude: number,
  longitude: number,
  width = 640,
  height = 320,
  zoom = 14,
): string {
  const center = `${latitude},${longitude}`;
  const params = new URLSearchParams({
    center,
    zoom: String(zoom),
    size: `${width}x${height}`,
  });
  return `https://static-map.openstreetmap.fr/staticmap.php?${params.toString()}`;
}

export async function lookupPostcodeCentroid(
  postcode: string,
): Promise<{ lat: number; lng: number } | null> {
  const compact = postcode.replace(/\s/g, '');
  if (!compact) return null;

  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(compact)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status?: number;
      result?: { latitude?: number; longitude?: number };
    };
    const lat = data.result?.latitude;
    const lng = data.result?.longitude;
    if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }
    return { lat, lng };
  } catch {
    return null;
  }
}

async function lookupJsonCentroid(
  url: string,
  pick: (data: Record<string, unknown>) => { lat: number; lng: number } | null,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    return pick(data);
  } catch {
    return null;
  }
}

function asLatLng(lat: unknown, lng: unknown): { lat: number; lng: number } | null {
  if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  return { lat, lng };
}

export async function lookupOutcodeCentroid(outcode: string): Promise<{ lat: number; lng: number } | null> {
  const compact = outcode.replace(/\s/g, '').toUpperCase();
  if (!compact) return null;
  return lookupJsonCentroid(
    `https://api.postcodes.io/outcodes/${encodeURIComponent(compact)}`,
    (data) => {
      const result = data.result as { latitude?: number; longitude?: number } | undefined;
      return asLatLng(result?.latitude, result?.longitude);
    },
  );
}

export async function lookupPlaceCentroid(place: string): Promise<{ lat: number; lng: number } | null> {
  const query = place.trim();
  if (!query) return null;
  return lookupJsonCentroid(
    `https://api.postcodes.io/places?q=${encodeURIComponent(query)}`,
    (data) => {
      const results = Array.isArray(data.result) ? data.result : [];
      const preferred =
        results.find((row) => {
          const item = row as { name_1?: string; local_type?: string };
          return (
            item.local_type === 'City' &&
            (item.name_1 || '').toLowerCase() === query.toLowerCase()
          );
        }) || results[0];
      const hit = preferred as { latitude?: number; longitude?: number } | undefined;
      return asLatLng(hit?.latitude, hit?.longitude);
    },
  );
}
