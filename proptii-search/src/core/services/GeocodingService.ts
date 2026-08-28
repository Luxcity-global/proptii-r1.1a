import axios from 'axios';

export type GeocodeResult = {
  latitude: number;
  longitude: number;
};

/**
 * Geocode an address once at property ingest (Google Geocoding API).
 * Requires GOOGLE_MAPS_API_KEY in proptii-search/.env with Geocoding API enabled.
 */
export class GeocodingService {
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey =
      process.env.GOOGLE_MAPS_API_KEY?.trim() ||
      process.env.GOOGLE_MAP_API_KEY?.trim() ||
      process.env.GOOGLE_API_KEY?.trim() ||
      process.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    const query = address.trim();
    if (!this.apiKey || !query) return null;

    try {
      const { data } = await axios.get<{
        status: string;
        results?: Array<{ geometry: { location: { lat: number; lng: number } } }>;
      }>('https://maps.googleapis.com/maps/api/geocode/json', {
        params: { address: query, key: this.apiKey, region: 'uk' },
        timeout: 8000,
      });

      if (data.status !== 'OK' || !data.results?.[0]) return null;

      const { lat, lng } = data.results[0].geometry.location;
      return { latitude: lat, longitude: lng };
    } catch (error) {
      console.warn('[GeocodingService] Geocode failed:', (error as Error).message);
      return null;
    }
  }
}
