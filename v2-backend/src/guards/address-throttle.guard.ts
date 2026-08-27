/**
 * address-throttle.guard.ts
 *
 * Dedicated rate-limit guard for address/property lookup endpoints.
 *
 * Bucket: 20 requests per minute per IP address.
 * Applied to:
 *   POST /api/properties/facts       (Sprint 2.2 — batched)
 *   GET  /api/properties/:id/facts   (Sprint 3.1 — single)
 *
 * Why stricter than the generic API limit (100/min)?
 * The PRD calls this out explicitly: these endpoints can reveal private
 * individual address data via UPRN lookups. The 20/min limit is the
 * PRD-specified ceiling for address-lookup paths.
 *
 * Redis key prefix: 'throttle:address:'
 * Window: 60 seconds
 *
 * On breach: HTTP 429 with Retry-After and X-RateLimit-* headers.
 * In-memory fallback when Redis is unavailable (non-production safe).
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
const MAX_REQUESTS   = 20;
const KEY_PREFIX     = 'throttle:address:';

@Injectable()
export class AddressThrottleGuard implements CanActivate {
  private readonly logger   = new Logger(AddressThrottleGuard.name);
  private readonly memStore = new Map<string, { count: number; resetAt: number }>();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<any>();
    const ip  = this.resolveIp(req);
    const key = `${KEY_PREFIX}${ip}`;

    const { count, ttl } = await this.increment(key);

    if (count > MAX_REQUESTS) {
      this.logger.warn(
        `[AddressThrottle] IP ${ip} exceeded ${MAX_REQUESTS} req/min (count=${count})`,
      );
      throw new HttpException(
        {
          statusCode: 429,
          error:      'Too Many Requests',
          message:    `Address lookup rate limit exceeded. Maximum ${MAX_REQUESTS} requests per minute.`,
          retryAfter: ttl,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const res = context.switchToHttp().getResponse<any>();
    res.setHeader('X-RateLimit-Limit',     String(MAX_REQUESTS));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, MAX_REQUESTS - count)));
    res.setHeader('X-RateLimit-Reset',     String(Date.now() + ttl * 1000));

    return true;
  }

  private async increment(key: string): Promise<{ count: number; ttl: number }> {
    try {
      const redis = getRedisClient();
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, WINDOW_SECONDS);
      const ttl = await redis.ttl(key);
      return { count, ttl: Math.max(ttl, 1) };
    } catch {
      return this.incrementMemory(key);
    }
  }

  private incrementMemory(key: string): { count: number; ttl: number } {
    const now   = Date.now();
    const entry = this.memStore.get(key);
    if (!entry || entry.resetAt <= now) {
      const resetAt = now + WINDOW_SECONDS * 1000;
      this.memStore.set(key, { count: 1, resetAt });
      return { count: 1, ttl: WINDOW_SECONDS };
    }
    entry.count++;
    return { count: entry.count, ttl: Math.ceil((entry.resetAt - now) / 1000) };
  }

  private resolveIp(req: any): string {
    const forwarded = req.headers?.['x-forwarded-for'];
    if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
    return req.ip ?? req.connection?.remoteAddress ?? '0.0.0.0';
  }
}
