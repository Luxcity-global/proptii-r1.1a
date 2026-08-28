import { extractUkPostcode } from './postcodesIo';
import type { StreamingReportAddress } from '../types/streamingReport';

export interface ReportAddressInput {
  display: string;
  street?: string | null;
  postcode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  coordinates?: { lat: number; lng: number } | null;
}

/** Build POST /api/properties/report address payload from a listing. */
export function buildStreamingReportAddress(input: ReportAddressInput): StreamingReportAddress {
  const display = input.display.trim();
  const postcode =
    (input.postcode || '').trim() || extractUkPostcode(display) || '';

  let lat = input.coordinates?.lat ?? input.latitude;
  let lng = input.coordinates?.lng ?? input.longitude;
  if (typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)) {
    return {
      display,
      street: input.street?.trim() || undefined,
      postcode: postcode || '',
      coordinates: { lat, lng },
    };
  }

  return {
    display,
    street: input.street?.trim() || undefined,
    postcode: postcode || '',
  };
}

/** Prefer portal URL for listingId when the handover API expects it. */
export function resolveReportListingId(property: {
  url?: string | null;
  listingId?: string | null;
  id?: string | null;
}): string {
  const url = property.url?.trim();
  if (url && /^https?:\/\//i.test(url)) return url;
  if (property.listingId?.trim()) return property.listingId.trim();
  if (property.id?.trim()) return property.id.trim();
  return '';
}
