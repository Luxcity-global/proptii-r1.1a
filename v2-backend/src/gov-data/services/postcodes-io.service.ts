import { Injectable, Logger } from '@nestjs/common';

export interface PostcodeResult {
  latitude: number;
  longitude: number;
  admin_district: string;
  lsoa: string;
  postcode?: string;
}

@Injectable()
export class PostcodesIoService {
  private readonly logger = new Logger(PostcodesIoService.name);

  /** Extract a UK postcode or outcode from any string */
  extractPostcode(input?: string | null): string | null {
    if (!input) return null;
    const fullMatch = input.match(/\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i);
    if (fullMatch) return fullMatch[1].trim();
    const outcodeMatch = input.match(/\b([A-Z]{1,2}\d[A-Z\d]?)\b/i);
    if (outcodeMatch) return outcodeMatch[1].trim();
    return null;
  }

  async getCentroid(postcode?: string | null): Promise<PostcodeResult | null> {
    if (!postcode) return null;
    try {
      const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();
      let response = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`);
      
      if (!response.ok && response.status === 404) {
        // Fallback to outcodes endpoint
        response = await fetch(`https://api.postcodes.io/outcodes/${cleanPostcode}`);
      }

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`postcodes.io returned ${response.status}`);
      }

      const data = await response.json();
      const res = data.result;
      return {
        latitude: res.latitude,
        longitude: res.longitude,
        admin_district: Array.isArray(res.admin_district) ? res.admin_district[0] : (res.admin_district || ''),
        lsoa: res.lsoa || '',
        postcode: res.postcode || res.outcode || postcode,
      };
    } catch (err: any) {
      this.logger.warn(`Failed to fetch postcode centroid for ${postcode}: ${err.message}`);
      return null;
    }
  }

  /** Reverse geocode coordinates to find the nearest UK postcode and LSOA */
  async getCentroidByCoordinates(lat: number, lng: number): Promise<PostcodeResult | null> {
    try {
      const response = await fetch(`https://api.postcodes.io/postcodes?lat=${lat}&lon=${lng}&limit=1`);
      if (!response.ok) return null;
      const data = await response.json();
      if (!data.result || !data.result.length) return null;
      const res = data.result[0];
      return {
        latitude: res.latitude,
        longitude: res.longitude,
        admin_district: Array.isArray(res.admin_district) ? res.admin_district[0] : (res.admin_district || ''),
        lsoa: res.lsoa || '',
        postcode: res.postcode || '',
      };
    } catch (err: any) {
      this.logger.warn(`Failed to reverse geocode [${lat}, ${lng}]: ${err.message}`);
      return null;
    }
  }

  /** Geocode a free-text location (e.g. "Shoreditch, London") using OSM Nominatim */
  async geocodeAddress(addressQuery: string): Promise<PostcodeResult | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=gb&limit=1&q=${encodeURIComponent(addressQuery)}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Proptii-Search-Intelligence/1.0' } });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || !data.length) return null;
      const first = data[0];
      const lat = parseFloat(first.lat);
      const lng = parseFloat(first.lon);
      if (isNaN(lat) || isNaN(lng)) return null;

      // Try to find nearest UK postcode via postcodes.io
      const nearest = await this.getCentroidByCoordinates(lat, lng);
      if (nearest) return nearest;

      return {
        latitude: lat,
        longitude: lng,
        admin_district: first.display_name?.split(',')[1]?.trim() || '',
        lsoa: '',
      };
    } catch (err: any) {
      this.logger.warn(`Geocode address failed for ${addressQuery}: ${err.message}`);
      return null;
    }
  }
}
