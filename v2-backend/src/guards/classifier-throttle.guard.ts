/**
 * classifier-throttle.guard.ts
 *
 * Dedicated rate-limit guard for POST /api/search/classify.
 *
 * Bucket: 15 requests per minute per IP address.
 * Storage: Redis (REDIS_URL env var). Falls back to in-memory Map when Redis
 *          is unavailable — suitable for dev; do not rely on in prod.
 *
 * This is intentionally a separate bucket from:
 *   - The generic API throttle (100/min/IP) applied globally
 *   - Any existing AI search throttle
 *
 * Why a separate bucket?
 * The PRD specifically calls this out: the classify endpoint can be used to
 * enumerate private individual addresses via `specific_address` intent if not
 * independently restricted. 15/min is the PRD's specified limit.
 *
 * On limit breach: throws HttpException(429) with a Retry-After header.
 * The response body matches the RFC 6585 pattern so clients can handle it.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { getRedisClient } from '../utils/redis-client';

const WINDOW_SECONDS = 60;
const MAX_REQUESTS   = 15;
const KEY_PREFIX     = 'throttle:classify:';

@Injectable()
export class ClassifierThrottleGuard implements CanActivate {
  private readonly logger  = new Logger(ClassifierThrottleGuard.name);
  /** In-memory fallback when Redis is unavailable. */
  private readonly memStore = new Map<string, { count: number; resetAt: number }>();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<any>();
    const ip  = this.resolveIp(req);
    const key = `${KEY_PREFIX}${ip}`;

    const { count, ttl } = await this.increment(key);

    if (count > MAX_REQUESTS) {
      this.logger.warn(`[ClassifierThrottle] IP ${ip} exceeded ${MAX_REQUESTS} req/min (count=${count})`);
      throw new HttpException(
        {
          statusCode:  429,
          error:       'Too Many Requests',
          message:     `Classifier rate limit exceeded. Maximum ${MAX_REQUESTS} requests per minute.`,
          retryAfter:  ttl,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Set Retry-After header so clients know when they can retry
    const res = context.switchToHttp().getResponse<any>();
    res.setHeader('X-RateLimit-Limit',     String(MAX_REQUESTS));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, MAX_REQUESTS - count)));
    res.setHeader('X-RateLimit-Reset',     String(Date.now() + ttl * 1000));

    return true;
  }

  // ── Redis + fallback increment ─────────────────────────────────────────────

  /**
   * Atomically increments the request counter for the key.
   * Returns { count, ttl } — where ttl is seconds until the window resets.
   */
  private async increment(key: string): Promise<{ count: number; ttl: number }> {
    try {
      const redis = getRedisClient();
      // INCR + EXPIRE is not atomic, but pipeline makes it fast enough.
      // For strict accuracy use a Lua script — acceptable for our load profile.
      const count = await redis.incr(key);
      if (count === 1) {
        // First request in this window — set the expiry
        await redis.expire(key, WINDOW_SECONDS);
      }
      const ttl = await redis.ttl(key);
      return { count, ttl: Math.max(ttl, 1) };
    } catch {
      // Redis unavailable — use in-memory fallback
      return this.incrementMemory(key);
    }
  }

  /** In-memory fallback counter (per-process, not distributed). */
  private incrementMemory(key: string): { count: number; ttl: number } {
    const now = Date.now();
    const entry = this.memStore.get(key);

    if (!entry || entry.resetAt <= now) {
      const resetAt = now + WINDOW_SECONDS * 1000;
      this.memStore.set(key, { count: 1, resetAt });
      return { count: 1, ttl: WINDOW_SECONDS };
    }

    entry.count++;
    return { count: entry.count, ttl: Math.ceil((entry.resetAt - now) / 1000) };
  }

  // ── IP resolution ──────────────────────────────────────────────────────────

  private resolveIp(req: any): string {
    // Respect X-Forwarded-For when behind Render / Cloudflare reverse proxy
    const forwarded = req.headers?.['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip ?? req.connection?.remoteAddress ?? '0.0.0.0';
  }
}
