/**
 * flags.controller.ts
 *
 * Sprint 2.1 — GET /api/flags
 *
 * The zero-deploy rollback mechanism for all R1.4 behaviour.
 *
 * ─── What this endpoint does ─────────────────────────────────────────────────
 *
 * Reads the `runtimeFlags/gov_data_layer` document from Firestore and returns
 * its `enabled` value as a boolean.
 *
 * The frontend polls this endpoint (or checks it on page load) before rendering
 * any R1.4 UI elements — property facts panels, the compliance report, the lens
 * output. If `gov_data_layer: false`, the frontend reverts to pre-R1.4 behaviour
 * with no code change and no redeploy.
 *
 * ─── PRD constraint ──────────────────────────────────────────────────────────
 *
 * "Flipping runtimeFlags/gov_data_layer.enabled = false in Firestore must revert
 *  all R1.4 behaviour within the Redis TTL (60s). No code change. No redeploy."
 *
 * ─── Implementation notes ────────────────────────────────────────────────────
 *
 * `isGovDataLayerEnabled()` already exists in FactsStoreService (Sprint 1.1).
 * This controller is the HTTP surface that exposes it.
 *
 * Response is cached in Redis for 60 seconds (see redis-client.ts: 'flags:' prefix)
 * so that a Firestore flip propagates within 1 minute without hammering Firestore
 * on every page load.
 *
 * Auth: public — no guard. The frontend must be able to read this without a token
 * because it controls pre-auth UI paths (the search bar, property cards).
 *
 * HTTP method: GET (read-only, cacheable, idempotent).
 *
 * ─── How to trigger a rollback ───────────────────────────────────────────────
 *
 * 1. Open Firestore Console → runtimeFlags → gov_data_layer
 * 2. Set `enabled` to `false`
 * 3. Wait up to 60 seconds (Redis cache TTL)
 * 4. All R1.4 features revert — no deploy, no code change
 *
 * To re-enable: set `enabled` back to `true`. Default when doc is absent: true.
 */

import { Controller, Get, Logger } from '@nestjs/common';
import { FactsStoreService } from '../gov-data/services/facts-store.service';
import { getRedisClient } from '../utils/redis-client';

// Response type — deliberately minimal (not a flag collection, just one toggle)
export interface FlagsResponse {
  /**
   * Whether the R1.4 government data layer is active.
   * false = all R1.4 endpoints should be treated as unavailable by the frontend.
   */
  gov_data_layer: boolean;
}

const FLAGS_CACHE_KEY = 'flags:gov_data_layer';
const FLAGS_CACHE_TTL = 60; // seconds — propagation window after a Firestore flip

@Controller()
export class FlagsController {
  private readonly logger = new Logger(FlagsController.name);

  constructor(private readonly factsStore: FactsStoreService) {}

  /**
   * GET /api/flags
   *
   * Returns the current state of all R1.4 runtime feature flags.
   *
   * Response: { "gov_data_layer": true }
   *
   * Always HTTP 200. On Firestore error, defaults to true (fail-open)
   * to avoid a Firestore outage looking like a deliberate rollback.
   */
  @Get('flags')
  async getFlags(): Promise<FlagsResponse> {
    // ── 1. Check Redis cache (60s TTL) ────────────────────────────────────────
    const cached = await this.getCached();
    if (cached !== null) {
      this.logger.debug(`[Flags] Cache hit → gov_data_layer=${cached}`);
      return { gov_data_layer: cached };
    }

    // ── 2. Read from Firestore ────────────────────────────────────────────────
    const enabled = await this.factsStore.isGovDataLayerEnabled();
    this.logger.log(`[Flags] Firestore read → gov_data_layer=${enabled}`);

    // ── 3. Write to Redis cache ───────────────────────────────────────────────
    await this.setCached(enabled);

    return { gov_data_layer: enabled };
  }

  // ── Redis helpers ──────────────────────────────────────────────────────────

  private async getCached(): Promise<boolean | null> {
    try {
      const redis = getRedisClient();
      const raw = await redis.get(FLAGS_CACHE_KEY);
      if (raw === null) return null;
      return raw === 'true';
    } catch {
      return null; // cache miss on error — fall through to Firestore
    }
  }

  private async setCached(value: boolean): Promise<void> {
    try {
      const redis = getRedisClient();
      await redis.set(FLAGS_CACHE_KEY, String(value), 'EX', FLAGS_CACHE_TTL);
    } catch {
      // non-fatal — Firestore read already succeeded
    }
  }
}
