import { centroidMapSvgDataUrl } from './reportMapFallback';
import {
  openStreetMapFrStaticImageUrl,
  openStreetMapStaticImageUrl,
  wikimediaStaticMapUrl,
} from './postcodesIo';

export function isValidCoordinate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Static map image URLs in preference order.
 * Ends with a local SVG centroid map so the slot always renders when geocoding succeeds.
 * Google Static Maps is omitted — often blocked (ERR_CONNECTION_CLOSED) alongside OSM tiles.
 */
export function staticMapImageUrls(
  latitude: number,
  longitude: number,
  zoom = 14,
): string[] {
  return [
    wikimediaStaticMapUrl(latitude, longitude, 640, 320, zoom),
    openStreetMapStaticImageUrl(latitude, longitude, 640, 320, zoom),
    openStreetMapFrStaticImageUrl(latitude, longitude, 640, 320, zoom),
    centroidMapSvgDataUrl(latitude, longitude),
  ];
}

/** Primary static map image for stored MongoDB coordinates (no geocode). */
export function mapEmbedUrlFromCoordinates(latitude: number, longitude: number): string {
  return staticMapImageUrls(latitude, longitude)[0];
}
