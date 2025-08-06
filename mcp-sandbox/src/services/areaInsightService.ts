import { AreaInsight } from '../types/areaInsight';
import { PropertyDataMCP, Property } from '../mcp/property-data/PropertyDataMCP';

export interface AreaInsightRequest {
  location: string;
  propertyType?: string;
  bedrooms?: number;
  useRealData?: boolean;
}

export interface AreaInsightServiceOptions {
  useRealData?: boolean;
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
   * Fetch area insights for a given location using real property data
   */
  async getAreaInsight(options: AreaInsightServiceOptions): Promise<AreaInsight | null> {
    const { location, useRealData = false, propertyType, bedrooms } = options;
    
    // Create a unique cache key that includes search context
    const cacheKey = `${location.toLowerCase().trim()}_${propertyType || 'any'}_${bedrooms || 'any'}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('✅ [AREA-INSIGHT] Cache hit for:', cacheKey);
      return cached;
    }

    try {
      if (useRealData) {
        console.log('🔍 [AREA-INSIGHT] Fetching real data from property MCP');
        const realData = await this.generateAreaInsightFromRealData(location, propertyType, bedrooms);
        if (realData) {
          this.setCache(cacheKey, realData);
          return realData;
        }
        console.log('⚠️ [AREA-INSIGHT] Real data not available, falling back to dynamic generation');
      }

      // Generate dynamic area insight based on location
      const dynamicData = await this.generateDynamicAreaInsight(location, propertyType, bedrooms);
      
      if (dynamicData) {
        this.setCache(cacheKey, dynamicData);
        return dynamicData;
      }

      return null;
    } catch (error) {
      console.error('❌ [AREA-INSIGHT] Error fetching area insight:', error);
      // Fallback to dynamic generation on error
      const dynamicData = await this.generateDynamicAreaInsight(location, propertyType, bedrooms);
      if (dynamicData) {
        this.setCache(cacheKey, dynamicData);
        return dynamicData;
      }
      return null;
    }
  }

  /**
   * Generate area insights from real property data
   */
  private async generateAreaInsightFromRealData(location: string, propertyType?: string, bedrooms?: number): Promise<AreaInsight | null> {
    try {
      console.log('🏠 [AREA-INSIGHT] Fetching real property data for:', location);
      
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

      // Calculate average rent from real properties
      const rentProperties = properties.filter(p => p.price.type === 'rent');
      const averageRent = rentProperties.length > 0 
        ? rentProperties.reduce((sum, p) => sum + p.price.amount, 0) / rentProperties.length
        : 0;

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
   * Generate dynamic area insight when real data is not available
   */
  private async generateDynamicAreaInsight(location: string, propertyType?: string, bedrooms?: number): Promise<AreaInsight | null> {
    try {
      console.log('🎯 [AREA-INSIGHT] Generating dynamic area insight for:', location);
      
      // Calculate dynamic rent based on location and property type
      const baseRent = this.calculateDynamicRent(location, propertyType, bedrooms);
      
      // Generate dynamic amenities based on location
      const amenities = this.generateDynamicAmenities(location);
      
      // Generate transport info based on location
      const transport = this.generateDynamicTransport(location);
      
      // Generate market trends
      const marketTrends = this.generateDynamicMarketTrends(location);
      
      // Generate neighborhood info
      const neighborhoodInfo = this.generateDynamicNeighborhoodInfo(location);

      const areaInsight: AreaInsight = {
        location: location,
        averageRent: {
          amount: baseRent,
          currency: 'GBP',
          propertyType: propertyType || '1-BR',
          period: 'monthly'
        },
        amenities: amenities,
        transport: transport,
        marketTrends: marketTrends,
        neighborhoodInfo: neighborhoodInfo
      };

      console.log('✅ [AREA-INSIGHT] Generated dynamic area insight for:', location);
      return areaInsight;
    } catch (error) {
      console.error('❌ [AREA-INSIGHT] Error generating dynamic area insight:', error);
      return null;
    }
  }

  /**
   * Calculate dynamic rent based on location and property characteristics
   */
  private calculateDynamicRent(location: string, propertyType?: string, bedrooms?: number): number {
    const normalizedLocation = location.toLowerCase().trim();
    
    // Base rent by region (GBP per month)
    const regionRentRanges: { [key: string]: { min: number; max: number } } = {
      'london': { min: 1800, max: 4500 },
      'manchester': { min: 800, max: 2000 },
      'birmingham': { min: 700, max: 1800 },
      'leeds': { min: 700, max: 1700 },
      'liverpool': { min: 600, max: 1500 },
      'sheffield': { min: 600, max: 1400 },
      'edinburgh': { min: 900, max: 2200 },
      'glasgow': { min: 700, max: 1800 },
      'bristol': { min: 900, max: 2200 },
      'cardiff': { min: 700, max: 1700 },
      'newcastle': { min: 600, max: 1500 },
      'nottingham': { min: 600, max: 1500 },
      'leicester': { min: 600, max: 1500 },
      'cambridge': { min: 1200, max: 2800 },
      'oxford': { min: 1100, max: 2600 },
      'brighton': { min: 900, max: 2200 },
      'bath': { min: 800, max: 2000 },
      'york': { min: 700, max: 1700 },
      'canterbury': { min: 700, max: 1700 }
    };

    // Find matching region
    let baseRent = 1000; // Default
    for (const [region, range] of Object.entries(regionRentRanges)) {
      if (normalizedLocation.includes(region)) {
        baseRent = Math.floor((range.min + range.max) / 2);
        break;
      }
    }

    // Adjust for property type and bedrooms
    if (propertyType === '2-BR' || bedrooms === 2) baseRent *= 1.3;
    if (propertyType === '3-BR' || bedrooms === 3) baseRent *= 1.6;
    if (propertyType === '4-BR' || bedrooms === 4) baseRent *= 2.0;

    // Add some variation based on location string
    const variation = (normalizedLocation.length % 20) / 100; // 0-20% variation
    baseRent = Math.round(baseRent * (1 + variation));

    return baseRent;
  }

  /**
   * Generate dynamic amenities based on location
   */
  private generateDynamicAmenities(location: string): Array<{ category: string; items: string[] }> {
    const normalizedLocation = location.toLowerCase().trim();
    
    const amenities = [
      {
        category: 'Dining & Entertainment',
        items: ['Local restaurants', 'Pubs and bars', 'Cafes and coffee shops', 'Takeaway options']
      },
      {
        category: 'Shopping',
        items: ['Local shops', 'Supermarkets', 'Convenience stores', 'Shopping centers']
      },
      {
        category: 'Transport',
        items: ['Bus stops', 'Train stations', 'Cycle routes', 'Parking facilities']
      },
      {
        category: 'Health & Fitness',
        items: ['GP surgeries', 'Pharmacies', 'Gyms and fitness centers', 'Parks and green spaces']
      }
    ];

    // Add location-specific amenities
    if (normalizedLocation.includes('london')) {
      amenities.push({
        category: 'Culture & Arts',
        items: ['Museums and galleries', 'Theaters and cinemas', 'Historical landmarks', 'Art exhibitions']
      });
    } else if (normalizedLocation.includes('manchester')) {
      amenities.push({
        category: 'Sports & Entertainment',
        items: ['Sports venues', 'Music venues', 'Entertainment complexes', 'Cultural centers']
      });
    } else if (normalizedLocation.includes('birmingham')) {
      amenities.push({
        category: 'Shopping & Culture',
        items: ['Shopping centers', 'Cultural venues', 'Entertainment options', 'Historical sites']
      });
    }

    return amenities;
  }

  /**
   * Generate dynamic transport information
   */
  private generateDynamicTransport(location: string): Array<{ type: string; details: string }> {
    const normalizedLocation = location.toLowerCase().trim();
    
    const transport = [
      {
        type: 'Buses',
        details: 'Regular bus services connecting to local areas and city center'
      },
      {
        type: 'Rail',
        details: 'Train connections to nearby cities and towns'
      },
      {
        type: 'Cycling',
        details: 'Cycle routes and bike-sharing schemes available'
      }
    ];

    // Add location-specific transport
    if (normalizedLocation.includes('london')) {
      transport.unshift({
        type: 'Underground',
        details: 'Extensive Tube network with multiple lines serving the area'
      });
    } else if (normalizedLocation.includes('manchester')) {
      transport.unshift({
        type: 'Tram',
        details: 'Metrolink tram system connecting to city center and suburbs'
      });
    } else if (normalizedLocation.includes('birmingham')) {
      transport.unshift({
        type: 'Tram',
        details: 'Midland Metro tram system serving key areas'
      });
    }

    return transport;
  }

  /**
   * Generate dynamic market trends
   */
  private generateDynamicMarketTrends(location: string): { trend: "rising" | "stable" | "declining"; percentage: number; description: string } {
    const normalizedLocation = location.toLowerCase().trim();
    
    // Generate trends based on location characteristics
    if (normalizedLocation.includes('london')) {
      return {
        trend: 'rising',
        percentage: 4.2,
        description: 'Strong rental market with steady growth in property values'
      };
    } else if (normalizedLocation.includes('manchester') || normalizedLocation.includes('birmingham')) {
      return {
        trend: 'stable',
        percentage: 2.8,
        description: 'Stable rental market with moderate growth potential'
      };
    } else {
      return {
        trend: 'stable',
        percentage: 2.1,
        description: 'Balanced rental market with steady demand'
      };
    }
  }

  /**
   * Generate dynamic neighborhood information
   */
  private generateDynamicNeighborhoodInfo(location: string): { description: string; highlights: string[] } {
    const normalizedLocation = location.toLowerCase().trim();
    
    if (normalizedLocation.includes('london')) {
      return {
        description: 'London offers diverse neighborhoods with excellent transport links and amenities.',
        highlights: [
          'Excellent transport connectivity',
          'Diverse cultural scene',
          'Strong employment opportunities',
          'World-class amenities and services'
        ]
      };
    } else if (normalizedLocation.includes('manchester')) {
      return {
        description: 'Manchester combines industrial heritage with modern development and affordable living.',
        highlights: [
          'Growing tech and media sectors',
          'Rich cultural heritage',
          'Affordable cost of living',
          'Excellent transport links'
        ]
      };
    } else if (normalizedLocation.includes('birmingham')) {
      return {
        description: 'Birmingham offers excellent value for money with strong transport connections.',
        highlights: [
          'Major business and conference center',
          'Excellent transport connectivity',
          'Affordable housing market',
          'Diverse cultural scene'
        ]
      };
    } else {
      return {
        description: `${location} offers a great balance of amenities, transport links, and quality of life.`,
        highlights: [
          'Good transport connections',
          'Local amenities and services',
          'Community-focused environment',
          'Balanced cost of living'
        ]
      };
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