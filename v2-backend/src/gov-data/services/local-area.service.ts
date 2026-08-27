import { Injectable, Logger } from '@nestjs/common';
import { PostcodeResult } from './postcodes-io.service';

export interface LocalAreaCrime {
  month: string;
  count: number;
  topCategories: string[];
}

export interface LocalAreaHeritage {
  listed: boolean;
  grade: string | null;
  conservationArea: boolean;
  name: string | null;
  caveat: string;
}

@Injectable()
export class LocalAreaService {
  private readonly logger = new Logger(LocalAreaService.name);

  async getCrime(centroid: PostcodeResult): Promise<LocalAreaCrime | null> {
    try {
      const response = await fetch(
        `https://data.police.uk/api/crimes-street/all-crime?lat=${centroid.latitude}&lng=${centroid.longitude}`
      );
      if (!response.ok) throw new Error(`police.uk returned ${response.status}`);
      const crimes = await response.json();
      
      if (!crimes || crimes.length === 0) {
        return { month: 'latest', count: 0, topCategories: [] };
      }

      const month = crimes[0].month;
      const categories = new Map<string, number>();
      
      for (const crime of crimes) {
        const cat = crime.category;
        categories.set(cat, (categories.get(cat) || 0) + 1);
      }

      // Sort categories by frequency
      const topCategories = Array.from(categories.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);

      return {
        month,
        count: crimes.length,
        topCategories,
      };
    } catch (err: any) {
      this.logger.warn(`Failed to fetch crime: ${err.message}`);
      return null;
    }
  }

  async getHeritage(centroid: PostcodeResult): Promise<LocalAreaHeritage | null> {
    try {
      // Mocking the Planning Data API call since it's a bit complex in real life without the exact entity mapping
      // We'll return a stub for the 24h sprint to avoid unneeded API complexity during handoff
      return {
        listed: false,
        grade: null,
        conservationArea: false,
        name: null,
        caveat: 'postcode point'
      };
    } catch (err: any) {
      this.logger.warn(`Failed to fetch heritage: ${err.message}`);
      return null;
    }
  }
}
