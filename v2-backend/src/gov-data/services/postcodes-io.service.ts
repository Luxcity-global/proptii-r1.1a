import { Injectable, Logger } from '@nestjs/common';

export interface PostcodeResult {
  latitude: number;
  longitude: number;
  admin_district: string;
  lsoa: string;
}

@Injectable()
export class PostcodesIoService {
  private readonly logger = new Logger(PostcodesIoService.name);
  // Optional: In a real app we'd inject Redis here for 24h cache

  async getCentroid(postcode: string): Promise<PostcodeResult | null> {
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
        admin_district: Array.isArray(res.admin_district) ? res.admin_district[0] : res.admin_district,
        lsoa: res.lsoa || '',
      };
    } catch (err: any) {
      this.logger.warn(`Failed to fetch postcode centroid: ${err.message}`);
      return null;
    }
  }
}
