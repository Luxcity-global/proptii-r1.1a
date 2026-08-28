/** Browser Maps key — set VITE_GOOGLE_MAPS_API_KEY in .env (same GCP project as search). */
export function getGoogleMapsApiKey(): string {
  const fromEnv = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  // Fallback matches SearchResults until env is configured.
  return 'AIzaSyChXxNp1xBJtJB9pC5WxWoZw3__7nT3djU';
}

/** Embed API key from env only — empty means fall back to OpenStreetMap. */
function embedApiKeyFromEnv(): string {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() || '';
}

export function googleMapsEmbedPlaceUrl(query: string): string | null {
  const key = embedApiKeyFromEnv() || getGoogleMapsApiKey();
  const q = query.trim();
  if (!key || !q) return null;
  return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${encodeURIComponent(q)}&zoom=15`;
}

export function googleMapsEmbedViewUrl(latitude: number, longitude: number): string | null {
  const key = embedApiKeyFromEnv();
  if (!key) return null;
  return `https://www.google.com/maps/embed/v1/view?key=${encodeURIComponent(key)}&center=${latitude},${longitude}&zoom=15`;
}

/** Static map image — one request, no nested iframe JS bundle. */
export function googleMapsStaticImageUrl(
  latitude: number,
  longitude: number,
  width = 640,
  height = 320,
  zoom = 14,
): string | null {
  const key = getGoogleMapsApiKey();
  if (!key) return null;
  const center = `${latitude},${longitude}`;
  const marker = `color:0x136C9E|${latitude},${longitude}`;
  const params = new URLSearchParams({
    center,
    zoom: String(zoom),
    size: `${width}x${height}`,
    scale: '2',
    markers: marker,
    key,
  });
  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}
