/**
 * proptiiPropertyService.ts
 *
 * Fetches Proptii-native properties exclusively through the v2-backend REST API.
 *
 * Previously this file queried Firestore directly (getDocs, getDoc) which bypassed
 * auth, rate limiting, and server-side access control. All reads now go through:
 *   GET /api/native-properties/search?q=<query>   — natural language search
 *   GET /api/native-properties                    — full list (vacant)
 *
 * The backend already normalises Firestore documents and resolves agent info
 * server-side, so the complex `transformProperty` / `landlordUserService` lookup
 * chain is no longer needed in the frontend.
 */

import { Property } from '../types/property';
import { getResolvedApiBaseUrl } from '../config/apiBaseUrl';
import { getAccessTokenForApiRequest } from './msalAccessToken';

/** Resolve the correct base URL at call-time (env may change without page reload). */
function apiBase(): string {
  return getResolvedApiBaseUrl(); // already includes /api suffix
}

async function authHeaders(): Promise<HeadersInit> {
  try {
    const token = await getAccessTokenForApiRequest();
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {
    // Unauthenticated search is allowed
  }
  return {};
}

/**
 * Map the backend's normalized property shape to the frontend Property type.
 * The backend returns the shape defined in `normaliseForSearch()` in
 * native-properties.controller.ts.
 */
function mapApiProperty(raw: any): Property {
  return {
    id: raw.id,
    title: raw.title || `${raw.propertyType || 'Property'} in ${raw.location}`,
    price: raw.price ? String(raw.price) : '—',
    location: raw.location || raw.street || '',
    bedrooms: raw.bedrooms !== undefined ? String(raw.bedrooms) : undefined,
    bathrooms: raw.bathrooms !== undefined ? String(raw.bathrooms) : '',
    squareFootage: raw.squareFootage ? String(raw.squareFootage) : '',
    propertyType: raw.propertyType || raw.type || 'Property',
    description: raw.description || '',
    imageUrls: Array.isArray(raw.imageUrls) ? raw.imageUrls : [],
    amenities: Array.isArray(raw.amenities) ? raw.amenities : [],
    agent: raw.agent || {
      id: raw.landlordId || '',
      name: 'Proptii Property',
      email: 'info@proptii.com',
      phone: '',
      company: 'Proptii',
    },
    source: 'proptii',
    street: raw.street || raw.location || '',
    city: raw.city || '',
    postcode: raw.postcode || '',
    status: raw.status || 'vacant',
  } as Property & {
    street?: string;
    city?: string;
    postcode?: string;
    amenities?: string[];
    bathrooms?: string;
    squareFootage?: string;
    status?: string;
  };
}

/**
 * Search Proptii-native properties using the v2-backend search endpoint.
 * Replaces the previous direct Firestore `getDocs(collection(db,'properties'))` call.
 */
export async function searchProptiiProperties(searchQuery: string): Promise<Property[]> {
  try {
    console.log('🚀 [ProptiiProperty] Searching via REST API, query:', searchQuery);
    const headers = await authHeaders();
    const q = encodeURIComponent(searchQuery.trim());
    const url = `${apiBase()}/native-properties/search?q=${q}&status=vacant&limit=100`;
    const res = await fetch(url, { headers });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`[ProptiiProperty] Search API responded with ${res.status}: ${text}`);
    }

    const json = await res.json();
    const results: any[] = json.results || json.data || json || [];

    if (!Array.isArray(results)) {
      console.warn('[ProptiiProperty] Unexpected search response shape:', json);
      return [];
    }

    const properties = results.map(mapApiProperty);
    console.log(`✅ [ProptiiProperty] Search returned ${properties.length} properties`);
    return properties;
  } catch (error) {
    console.error('[ProptiiProperty] Error searching properties via REST API:', error);
    throw new Error('Failed to search Proptii properties');
  }
}

/**
 * Get all available (vacant) Proptii-native properties.
 * Replaces the previous direct Firestore `getDocs(query(collection(db,'properties'), where('status','==','vacant')))`.
 */
export async function getAllProptiiProperties(): Promise<Property[]> {
  try {
    console.log('🚀 [ProptiiProperty] Fetching all properties via REST API...');
    const headers = await authHeaders();
    const url = `${apiBase()}/native-properties?status=vacant`;
    const res = await fetch(url, { headers });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`[ProptiiProperty] List API responded with ${res.status}: ${text}`);
    }

    const json = await res.json();
    // The list endpoint returns the raw array or wraps it
    const results: any[] = Array.isArray(json) ? json : (json.data || json.properties || json.results || []);

    if (!Array.isArray(results)) {
      console.warn('[ProptiiProperty] Unexpected list response shape:', json);
      return [];
    }

    const properties = results
      .filter((p: any) => {
        const s = (p.status || '').toLowerCase();
        return !s || s === 'vacant';
      })
      .map(mapApiProperty);

    console.log(`✅ [ProptiiProperty] Fetched ${properties.length} available properties`);
    return properties;
  } catch (error) {
    console.error('[ProptiiProperty] Error fetching all properties via REST API:', error);
    throw new Error('Failed to fetch Proptii properties');
  }
}
