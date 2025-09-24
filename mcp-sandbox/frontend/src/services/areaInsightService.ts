import type { AreaInsight } from '../types/areaInsight';

export interface AreaInsightServiceOptions {
  location: string;
  propertyType?: string;
  bedrooms?: number;
}

class AreaInsightService {
  private cache = new Map<string, { data: AreaInsight; timestamp: number }>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  /**
   * Fetch area insights for a given location using real property data only
   * With retry logic and graceful degradation
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

    // Retry logic for resilience
    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔍 [AREA-INSIGHT] Fetching area insight from backend API (attempt ${attempt}/${maxRetries})`);
        const realData = await this.fetchFromAPI(options);
        if (realData) {
          this.setCache(cacheKey, realData);
          console.log('✅ [AREA-INSIGHT] Successfully fetched and cached area insight');
          return realData;
        }
        console.log('⚠️ [AREA-INSIGHT] No area insight data available from API');
        return null;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`⚠️ [AREA-INSIGHT] Attempt ${attempt} failed:`, lastError.message);
        
        // If this is the last attempt, don't retry
        if (attempt === maxRetries) {
          break;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s delays
        console.log(`⏳ [AREA-INSIGHT] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.error('❌ [AREA-INSIGHT] All attempts failed, area insights unavailable:', lastError?.message);
    return null; // Graceful degradation - app continues without insights
  }

  /**
   * Fetch area insights from backend API
   */
  private async fetchFromAPI(options: AreaInsightServiceOptions): Promise<AreaInsight | null> {
    const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL + '/api/mcp' || 'http://localhost:3002/api/mcp';
    
    try {
      console.log('🌐 [AREA-INSIGHT] Calling backend API:', `${API_BASE_URL}/area-insights`);
      console.log('📤 [AREA-INSIGHT] Request payload:', options);
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${API_BASE_URL}/area-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('📊 [AREA-INSIGHT] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [AREA-INSIGHT] API error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [AREA-INSIGHT] API response received:', data);

      if (data.success && data.data?.areaInsight) {
        return data.data.areaInsight;
      } else {
        console.warn('⚠️ [AREA-INSIGHT] No area insight in response:', data);
        return null;
      }
    } catch (error) {
      console.error('❌ [AREA-INSIGHT] API call failed:', error);
      throw error;
    }
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