export interface GeocodingResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  confidence: number;
}

export interface GeocodingError {
  message: string;
  code: string;
}

interface CachedGeocodingResult {
  data: GeocodingResult;
  timestamp: number;
}

class GeocodingService {
  private cache = new Map<string, CachedGeocodingResult>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private geocoder: google.maps.Geocoder | null = null;

  /**
   * Initialize the geocoder with Google Maps API
   */
  async initializeGeocoder(): Promise<void> {
    if (this.geocoder) return;

    try {
      // Import the Google Maps loader to ensure API is loaded
      const googleMapsLoader = await import('../utils/googleMapsLoader');
      
      // Ensure Google Maps API is loaded
      await googleMapsLoader.default.loadGoogleMaps();
      
      // Wait for Google Maps API to be fully available
      await new Promise<void>((resolve, reject) => {
        const checkGoogleMaps = () => {
          if (window.google && 
              window.google.maps && 
              window.google.maps.Geocoder &&
              typeof window.google.maps.Geocoder === 'function') {
            try {
              this.geocoder = new window.google.maps.Geocoder();
              console.log('✅ [GEOCODING] Geocoder initialized successfully');
              resolve();
            } catch (error) {
              console.error('❌ [GEOCODING] Failed to create Geocoder instance:', error);
              reject(error);
            }
          } else {
            console.log('⏳ [GEOCODING] Waiting for Google Maps API to be fully loaded...');
            setTimeout(checkGoogleMaps, 100);
          }
        };
        checkGoogleMaps();
      });
    } catch (error) {
      console.error('❌ [GEOCODING] Failed to initialize geocoder:', error);
      throw error;
    }
  }

  /**
   * Geocode an address to coordinates
   */
  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    if (!address || !address.trim()) {
      return null;
    }

    const cleanAddress = address.trim();
    const cacheKey = cleanAddress.toLowerCase();

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('✅ [GEOCODING] Cache hit for:', cleanAddress);
      return cached;
    }

    try {
      await this.initializeGeocoder();

      if (!this.geocoder) {
        throw new Error('Geocoder not initialized');
      }

      console.log('🔍 [GEOCODING] Geocoding address:', cleanAddress);

      const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        this.geocoder!.geocode(
          { address: cleanAddress },
          (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results) {
              resolve(results);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          }
        );
      });

      if (result.length === 0) {
        console.log('⚠️ [GEOCODING] No results found for:', cleanAddress);
        return null;
      }

      const bestResult = result[0];
      const location = bestResult.geometry.location;

      const geocodingResult: GeocodingResult = {
        lat: location.lat(),
        lng: location.lng(),
        formattedAddress: bestResult.formatted_address,
        confidence: this.calculateConfidence(bestResult)
      };

      // Cache the result
      this.setCache(cacheKey, geocodingResult);

      console.log('✅ [GEOCODING] Successfully geocoded:', cleanAddress, '→', geocodingResult);
      return geocodingResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Handle specific geocoding errors more gracefully
      if (errorMessage.includes('ZERO_RESULTS')) {
        console.log('⚠️ [GEOCODING] No results found for address:', cleanAddress);
      } else if (errorMessage.includes('OVER_QUERY_LIMIT')) {
        console.warn('⚠️ [GEOCODING] Query limit exceeded, please try again later');
      } else if (errorMessage.includes('REQUEST_DENIED')) {
        console.error('❌ [GEOCODING] Request denied - check API key');
      } else {
        console.error('❌ [GEOCODING] Error geocoding address:', cleanAddress, errorMessage);
      }
      
      return null;
    }
  }

  /**
   * Batch geocode multiple addresses
   */
  async geocodeAddresses(addresses: string[]): Promise<Map<string, GeocodingResult>> {
    const results = new Map<string, GeocodingResult>();
    const uniqueAddresses = [...new Set(addresses.filter(addr => addr && addr.trim()))];

    console.log(`🗺️ [GEOCODING] Batch geocoding ${uniqueAddresses.length} addresses`);

    // Process in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < uniqueAddresses.length; i += batchSize) {
      const batch = uniqueAddresses.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (address) => {
        const result = await this.geocodeAddress(address);
        return { address, result };
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(({ address, result }) => {
        if (result) {
          results.set(address, result);
        }
      });

      // Add delay between batches to respect rate limits
      if (i + batchSize < uniqueAddresses.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`✅ [GEOCODING] Batch geocoding completed: ${results.size}/${uniqueAddresses.length} successful`);
    return results;
  }

  /**
   * Calculate confidence score for geocoding result
   */
  private calculateConfidence(result: google.maps.GeocoderResult): number {
    const types = result.types || [];
    const geometry = result.geometry;

    let confidence = 0.5; // Base confidence

    // Higher confidence for exact matches
    if (types.includes('street_address')) confidence += 0.3;
    if (types.includes('premise')) confidence += 0.2;
    if (types.includes('subpremise')) confidence += 0.1;

    // Location type confidence
    if (geometry.location_type === google.maps.GeocoderLocationType.ROOFTOP) {
      confidence += 0.2;
    } else if (geometry.location_type === google.maps.GeocoderLocationType.RANGE_INTERPOLATED) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Get cached result
   */
  private getFromCache(cacheKey: string): GeocodingResult | null {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cache entry
   */
  private setCache(cacheKey: string, data: GeocodingResult): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ [GEOCODING] Cache cleared');
  }

  /**
   * Clean expired cache entries for memory management
   */
  cleanExpiredCache(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 [GEOCODING] Cleaned ${cleanedCount} expired cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

export default new GeocodingService();
