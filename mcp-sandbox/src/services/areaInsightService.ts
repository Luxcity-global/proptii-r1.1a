import { AreaInsight } from '../types/areaInsight';
import { PropertyDataMCP, Property } from '../mcp/property-data/PropertyDataMCP';

export interface AreaInsightRequest {
  location: string;
  propertyType?: string;
  bedrooms?: number;
}

export interface AreaInsightServiceOptions {
  location: string;
  propertyType?: string;
  bedrooms?: number;
}

class AreaInsightService {
  private cache = new Map<string, { data: AreaInsight; timestamp: number }>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private propertyMCP: PropertyDataMCP;

  constructor() {
    this.propertyMCP = new PropertyDataMCP();
  }

  /**
   * Fetch area insights for a given location using real property data only
   */
  async getAreaInsight(options: AreaInsightServiceOptions): Promise<AreaInsight | null> {
    const { location, propertyType, bedrooms } = options;
    
    // Create a unique cache key that includes search context
    const cacheKey = `${location.toLowerCase().trim()}_${propertyType || 'any'}_${bedrooms || 'any'}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('✅ [AREA-INSIGHT] Cache hit for:', cacheKey);
      return cached;
    }

    try {
      console.log('🔍 [AREA-INSIGHT] Fetching real property data for:', location);
      
      // Get real property data from the MCP
      const properties = await this.propertyMCP.searchProperties(location, {
        propertyType,
        bedrooms
      }, true);

      if (!properties || properties.length === 0) {
        console.log('⚠️ [AREA-INSIGHT] No real properties found for:', location);
        return null;
      }

      console.log(`📊 [AREA-INSIGHT] Found ${properties.length} real properties for analysis`);

      // Generate area insight from real property data
      const areaInsight = await this.generateAreaInsightFromRealData(location, properties, propertyType, bedrooms);
      
      if (areaInsight) {
        this.setCache(cacheKey, areaInsight);
        return areaInsight;
      }

      return null;
    } catch (error) {
      console.error('❌ [AREA-INSIGHT] Error fetching area insight:', error);
      return null;
    }
  }

  /**
   * Generate area insights from real property data only
   */
  private async generateAreaInsightFromRealData(
    location: string, 
    properties: Property[], 
    propertyType?: string, 
    bedrooms?: number
  ): Promise<AreaInsight | null> {
    try {
      console.log('🏠 [AREA-INSIGHT] Analyzing real property data for:', location);

      if (!properties || properties.length === 0) {
        console.log('⚠️ [AREA-INSIGHT] No properties to analyze');
        return null;
      }

      // Calculate average rent from real properties
      const rentProperties = properties.filter(p => p.price.type === 'rent');
      const averageRent = rentProperties.length > 0 
        ? rentProperties.reduce((sum, p) => sum + p.price.amount, 0) / rentProperties.length
        : 0;

      if (averageRent === 0) {
        console.log('⚠️ [AREA-INSIGHT] No rental properties found for analysis');
        return null;
      }

      // Extract unique amenities from properties
      const allAmenities = properties.flatMap(p => p.amenities?.nearby || []);
      const uniqueAmenities = [...new Set(allAmenities)].slice(0, 12);

      // Group amenities by category
      const amenitiesByCategory = this.categorizeAmenities(uniqueAmenities);

      // Extract transport information from property descriptions
      const transportInfo = this.extractTransportInfo(properties);

      // Calculate market trends based on property data
      const marketTrends = this.calculateMarketTrends(properties);

      // Generate neighborhood info from property data
      const neighborhoodInfo = this.generateNeighborhoodInfo(properties, location);

      const areaInsight: AreaInsight = {
        location: location,
        averageRent: {
          amount: Math.round(averageRent),
          currency: 'GBP',
          propertyType: propertyType || this.getMostCommonPropertyType(properties),
          period: 'monthly'
        },
        amenities: amenitiesByCategory,
        transport: transportInfo,
        marketTrends: marketTrends,
        neighborhoodInfo: neighborhoodInfo
      };

      console.log('✅ [AREA-INSIGHT] Generated real area insight:', {
        location: areaInsight.location,
        averageRent: areaInsight.averageRent.amount,
        amenitiesCount: areaInsight.amenities.length,
        transportCount: areaInsight.transport.length
      });

      return areaInsight;
    } catch (error) {
      console.error('❌ [AREA-INSIGHT] Error generating real area insight:', error);
      return null;
    }
  }

  /**
   * Categorize amenities into groups
   */
  private categorizeAmenities(amenities: string[]): Array<{ category: string; items: string[] }> {
    const categories: { [key: string]: string[] } = {
      'Dining': [],
      'Shopping': [],
      'Transport': [],
      'Health & Fitness': [],
      'Entertainment': [],
      'Education': [],
      'Other': []
    };

    amenities.forEach(amenity => {
      const lowerAmenity = amenity.toLowerCase();
      if (lowerAmenity.includes('restaurant') || lowerAmenity.includes('cafe') || lowerAmenity.includes('pub')) {
        categories['Dining'].push(amenity);
      } else if (lowerAmenity.includes('shop') || lowerAmenity.includes('store') || lowerAmenity.includes('market')) {
        categories['Shopping'].push(amenity);
      } else if (lowerAmenity.includes('station') || lowerAmenity.includes('bus') || lowerAmenity.includes('train')) {
        categories['Transport'].push(amenity);
      } else if (lowerAmenity.includes('gym') || lowerAmenity.includes('park') || lowerAmenity.includes('surgery')) {
        categories['Health & Fitness'].push(amenity);
      } else if (lowerAmenity.includes('cinema') || lowerAmenity.includes('theater') || lowerAmenity.includes('museum')) {
        categories['Entertainment'].push(amenity);
      } else if (lowerAmenity.includes('school') || lowerAmenity.includes('university') || lowerAmenity.includes('college')) {
        categories['Education'].push(amenity);
      } else {
        categories['Other'].push(amenity);
      }
    });

    return Object.entries(categories)
      .filter(([_, items]) => items.length > 0)
      .map(([category, items]) => ({ category, items }));
  }

  /**
   * Extract transport information from property data
   */
  private extractTransportInfo(properties: Property[]): Array<{ type: string; details: string }> {
    const transportTypes = new Set<string>();
    const transportDetails: { [key: string]: string } = {};

    properties.forEach(property => {
      const description = property.description.toLowerCase();
      const features = property.features.map(f => f.toLowerCase());

      if (description.includes('tube') || description.includes('underground')) {
        transportTypes.add('Underground');
        transportDetails['Underground'] = 'Nearby Tube station with excellent connectivity';
      }
      if (description.includes('train') || description.includes('railway')) {
        transportTypes.add('Rail');
        transportDetails['Rail'] = 'Train station within walking distance';
      }
      if (description.includes('bus')) {
        transportTypes.add('Buses');
        transportDetails['Buses'] = 'Regular bus services to local areas';
      }
      if (description.includes('tram')) {
        transportTypes.add('Tram');
        transportDetails['Tram'] = 'Tram system serving the area';
      }
    });

    return Array.from(transportTypes).map(type => ({
      type,
      details: transportDetails[type] || `${type} services available nearby`
    }));
  }

  /**
   * Calculate market trends from property data
   */
  private calculateMarketTrends(properties: Property[]): { trend: "rising" | "stable" | "declining"; percentage: number; description: string } {
    if (properties.length === 0) {
      return {
        trend: 'stable',
        percentage: 2.0,
        description: 'Market data available for analysis'
      };
    }

    // Simple trend calculation based on property prices
    const prices = properties.map(p => p.price.amount).filter(p => p > 0);
    if (prices.length === 0) {
      return {
        trend: 'stable',
        percentage: 2.0,
        description: 'Market data available for analysis'
      };
    }

    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const recentProperties = properties.slice(0, Math.min(5, properties.length));
    const recentAvgPrice = recentProperties
      .map(p => p.price.amount)
      .filter(p => p > 0)
      .reduce((sum, price) => sum + price, 0) / recentProperties.length;

    const priceChange = ((recentAvgPrice - avgPrice) / avgPrice) * 100;

    if (priceChange > 5) {
      return {
        trend: 'rising',
        percentage: Math.abs(priceChange),
        description: 'Rental prices showing positive growth trend'
      };
    } else if (priceChange < -5) {
      return {
        trend: 'declining',
        percentage: Math.abs(priceChange),
        description: 'Rental prices showing downward trend'
      };
    } else {
      return {
        trend: 'stable',
        percentage: Math.abs(priceChange),
        description: 'Rental market remains stable'
      };
    }
  }

  /**
   * Generate neighborhood info from property data
   */
  private generateNeighborhoodInfo(properties: Property[], location: string): { description: string; highlights: string[] } {
    const highlights: string[] = [];
    
    // Analyze property features to generate highlights
    const allFeatures = properties.flatMap(p => p.features);
    const featureCounts: { [key: string]: number } = {};
    
    allFeatures.forEach(feature => {
      const key = feature.toLowerCase();
      featureCounts[key] = (featureCounts[key] || 0) + 1;
    });

    // Generate highlights based on common features
    if (featureCounts['garden'] > properties.length * 0.3) highlights.push('Green spaces and gardens');
    if (featureCounts['parking'] > properties.length * 0.2) highlights.push('Good parking availability');
    if (featureCounts['modern'] > properties.length * 0.2) highlights.push('Modern properties available');
    if (featureCounts['central'] > properties.length * 0.2) highlights.push('Central location benefits');

    return {
      description: `${location} offers a diverse range of properties with good amenities and transport links.`,
      highlights: highlights.length > 0 ? highlights : [
        'Good transport connectivity',
        'Local amenities available',
        'Diverse property options',
        'Community-focused area'
      ]
    };
  }

  /**
   * Get most common property type from properties
   */
  private getMostCommonPropertyType(properties: Property[]): string {
    const typeCounts: { [key: string]: number } = {};
    
    properties.forEach(property => {
      const type = property.specifications.propertyType;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const mostCommon = Object.entries(typeCounts)
      .sort(([,a], [,b]) => b - a)[0];

    return mostCommon ? mostCommon[0] : '1-BR';
  }

  /**
   * Get data from cache if it's still valid
   */
  private getFromCache(cacheKey: string): AreaInsight | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.data;
  }

  /**
   * Store data in cache
   */
  private setCache(cacheKey: string, data: AreaInsight): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache for a specific location or all cache
   */
  clearCache(cacheKey?: string): void {
    if (cacheKey) {
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const areaInsightService = new AreaInsightService(); 