/**
 * redis-client.ts
 *
 * Singleton ioredis client for v2-backend.
 * Shares the same REDIS_URL as proptii-search, using namespaced key prefixes:
 *   - `classify:`   — classifier response cache (24h TTL)
 *   - `throttle:`   — rate-limit buckets (managed by @nestjs/throttler)
 *   - `flags:`      — runtime flags cache (60s TTL)
 *
 * Usage:
 *   import { getRedisClient } from '../utils/redis-client';
 *   const redis = getRedisClient();
 *   await redis.set('classify:key', JSON.stringify(result), 'EX', 86400);
 */

import Redis from 'ioredis';

let client: Redis | null = null;

export function getRedisClient(): Redis {
  if (client) return client;

  const url = process.env.REDIS_URL;

  if (!url) {
    console.warn(
      '[RedisClient] REDIS_URL is not set. ' +
      'Classifier cache and throttle state will be unavailable. ' +
      'Set REDIS_URL in v2-backend/.env for local development.'
    );
    // Return a no-op stub so callers don't crash in environments without Redis.
    // All stub methods return null/0/false, matching ioredis resolved values.
    return createNoOpRedis();
  }

  client = new Redis(url, {
    lazyConnect: false,
    enableReadyCheck: true,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
      if (times > 3) {
        console.error('[RedisClient] Redis connection failed after 3 retries — giving up.');
        return null; // stop retrying
      }
      return Math.min(times * 200, 1000);
    },
  });

  client.on('connect', () => console.log('[RedisClient] Connected to Redis.'));
  client.on('error', (err) => console.error('[RedisClient] Redis error:', err.message));

  return client;
}

/**
 * Returns a lightweight no-op proxy that satisfies the Redis interface used
 * across gov-data services, preventing crashes when REDIS_URL is absent.
 */
function createNoOpRedis(): any {
  const noop = async () => null;
  return new Proxy({} as Redis, {
    get(_target, prop) {
      if (prop === 'status') return 'close';
      return noop;
    },
  });
}
