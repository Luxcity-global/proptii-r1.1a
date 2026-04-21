import Property from '../../models/Property';
import { searchQueue } from '../../infrastructure/queue';
import { connection as redis } from '../../infrastructure/queue';

const CACHE_TTL_FRESH = 3600;  // 1 hour
const CACHE_TTL_STALE = 86400; // 24 hours

export class SearchAggregator {
  /**
   * Cache-only lookup — no background jobs triggered.
   * Used by the SSE controller, which handles live scraping itself.
   */
  async getCachedResults(query: string): Promise<any[]> {
    const cacheKey = `search:${query.toLowerCase().trim()}`;
    const metaKey  = `meta:${cacheKey}`;

    // 1. Redis cache
    const cachedData = await redis.get(cacheKey);
    const metaData   = await redis.get(metaKey);

    if (cachedData) {
      console.log(`[Aggregator] Found cached data for: ${query}`);
      const results = JSON.parse(cachedData);
      const meta    = metaData ? JSON.parse(metaData) : { timestamp: 0 };
      const age     = (Date.now() - meta.timestamp) / 1000;

      if (age < CACHE_TTL_STALE) {
        console.log(`[Cache Hit] ${age < CACHE_TTL_FRESH ? 'Fresh' : 'Stale'} results (age: ${Math.round(age)}s) for: ${query}`);
        return results;
      }
    }

    // 2. MongoDB fallback removed to prevent broad irrelevant hits
    // Historical results are now only served if they are an exact match in Redis.
    return [];
  }

  /**
   * Saves freshly-scraped results to Redis + MongoDB.
   * Called by the SSE controller after live scraping completes.
   */
  async saveResults(query: string, results: any[]): Promise<void> {
    if (results.length === 0) return;
    const cacheKey = `search:${query.toLowerCase().trim()}`;
    await this.saveToCache(cacheKey, results);
    console.log(`[Aggregator] Saved ${results.length} results to cache for: ${query}`);
  }

  /**
   * Full search used by non-SSE paths (e.g. REST fallback).
   * Checks cache → MongoDB → triggers background scrape job.
   */
  async search(query: string, filters: any = {}) {
    const cached = await this.getCachedResults(query);
    if (cached.length > 0) return cached;

    // Total miss — queue a background scrape
    console.log(`[Total Miss] Triggering background scrape for: ${query}`);
    await this.triggerRevalidation(query, filters);
    return [];
  }

  async triggerRevalidation(query: string, filters: any) {
    await searchQueue.add('revalidate', { query, filters }, {
      jobId: `revalidate-${query.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
      removeOnComplete: true,
    });
  }

  private async saveToCache(key: string, data: any, stale = false) {
    const timestamp = stale ? Date.now() - (CACHE_TTL_FRESH * 1000 + 1) : Date.now();
    await redis.set(key, JSON.stringify(data), 'EX', CACHE_TTL_STALE);
    await redis.set(`meta:${key}`, JSON.stringify({ timestamp }), 'EX', CACHE_TTL_STALE);
  }
}
