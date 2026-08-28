import { getGoogleMapsApiKey, googleMapsEmbedPlaceUrl } from '../config/googleMaps';
import { staticMapImageUrls } from './reportMapEmbed';
import { resolveMapCoordinates } from './reportMapCoords';

/**
 * Prefer the listing street address, then the backend embed query.
 * Marketing titles (`A READY TO MOVE INTO HOME...`) must not be used as map queries.
 */
export function resolveMapQuery(
  embedQuery?: string | null,
  addressFallback?: string | null,
): string {
  return (embedQuery || '').trim() || (addressFallback || '').trim();
}

/**
 * Official Maps Embed API place URL (includes the address query).
 * Do not use maps.google.com `output=embed` — that URL is refused in iframes.
 */
export function mapsEmbedSrc(embedQuery: string | null | undefined): string | null {
  const query = (embedQuery || '').trim();
  if (!query) return null;
  return googleMapsEmbedPlaceUrl(query);
}

/** Start geocode during Unlock diagnostic so the report map is ready. */
export function prefetchReportMap(query: string): void {
  const trimmed = query.trim();
  if (!trimmed) return;
  void resolveMapCoordinates(trimmed);
}

export interface WarmupReportMapOptions {
  /** Minimum time on the diagnostic screen so the map can load (ms). */
  minMs?: number;
  /** Maximum time to wait before opening the report anyway (ms). */
  maxMs?: number;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function preloadMapImage(url: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !url || timeoutMs <= 0) {
      resolve(false);
      return;
    }

    if (url.startsWith('data:image/')) {
      resolve(true);
      return;
    }

    const img = new Image();
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };

    const timer = window.setTimeout(() => finish(false), timeoutMs);
    img.onload = () => {
      window.clearTimeout(timer);
      finish(true);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      finish(false);
    };
    img.referrerPolicy = 'no-referrer-when-downgrade';
    img.src = url;
  });
}

async function preloadStaticMapImages(urls: string[], deadlineMs: number): Promise<boolean> {
  for (const url of urls) {
    const remaining = deadlineMs - Date.now();
    if (remaining <= 0) return false;
    const ok = await preloadMapImage(url, remaining);
    if (ok) return true;
  }
  return false;
}

/**
 * Geocode + preload static map image while the diagnostic overlay is visible.
 * Keeps the loading screen up for at least `minMs` so the map can render.
 */
export async function warmupReportMap(
  query: string,
  { minMs = 3200, maxMs = 7000 }: WarmupReportMapOptions = {},
): Promise<void> {
  const trimmed = query.trim();
  const started = Date.now();
  const deadline = started + maxMs;

  const mapWork = (async () => {
    if (!trimmed) return;
    const coords = await resolveMapCoordinates(trimmed);
    if (!coords) return;
    await preloadStaticMapImages(staticMapImageUrls(coords.lat, coords.lng), deadline);
  })();

  await Promise.race([
    Promise.all([delay(minMs), mapWork]),
    delay(maxMs),
  ]);
}

const MAPS_SCRIPT_ID = 'google-maps-script';

/** Load Maps JavaScript API — shared by search results and the report map. */
export function loadGoogleMapsScript(): Promise<typeof google.maps> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps is not available'));
  }
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  const key = getGoogleMapsApiKey();
  const src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;

  return new Promise((resolve, reject) => {
    const onReady = () => {
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error('Google Maps failed to load'));
    };

    const existing = document.getElementById(MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.google?.maps) {
        onReady();
        return;
      }
      existing.addEventListener('load', onReady, { once: true });
      existing.addEventListener('error', () => reject(new Error('Google Maps failed to load')), {
        once: true,
      });
      const poll = window.setInterval(() => {
        if (window.google?.maps) {
          window.clearInterval(poll);
          onReady();
        }
      }, 50);
      window.setTimeout(() => {
        window.clearInterval(poll);
        if (!window.google?.maps) reject(new Error('Google Maps failed to load'));
      }, 8000);
      return;
    }

    const script = document.createElement('script');
    script.id = MAPS_SCRIPT_ID;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = onReady;
    script.onerror = () => reject(new Error('Google Maps failed to load'));
    document.head.appendChild(script);
  });
}
