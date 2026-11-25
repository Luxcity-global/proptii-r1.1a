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
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { FactsStoreService } from '../gov-data/services/facts-store.service';
import { getRedisClient } from '../utils/redis-client';

export class FlagsResponseDto {
  @ApiProperty({ description: 'Whether the government data layer is enabled' })
  gov_data_layer: boolean;

  @ApiProperty({ description: 'Whether C1 soft verification gate is enforced on publish' })
  c1_verification_gate: boolean;
}

export interface FlagsResponse {
  gov_data_layer: boolean;
  c1_verification_gate: boolean;
}

const FLAGS_CACHE_KEY = 'flags:runtime_bundle_v3';
const FLAGS_CACHE_TTL = 60; // seconds — propagation window after a Firestore flip

/** Env override for C1 — same contract as ReadyToPublishService.isGateEnabled(). */
function c1GateFromEnv(): boolean | null {
  const env = process.env.C1_VERIFICATION_GATE ?? process.env.FLAG_C1_VERIFICATION_GATE;
  if (env === 'true' || env === '1') return true;
  if (env === 'false' || env === '0') return false;
  return null;
}

@ApiTags('Runtime Flags')
@Controller()
export class FlagsController {
  private readonly logger = new Logger(FlagsController.name);

  constructor(private readonly factsStore: FactsStoreService) {}

  /**
   * GET /api/flags
   *
   * Response: { "gov_data_layer": true, "c1_verification_gate": false }
   *
   * Always HTTP 200. gov_data_layer fails open (default true).
   * c1_verification_gate fails closed (default false) so current publish behaviour is preserved.
   * Local/staging: `C1_VERIFICATION_GATE=true|false` overrides Firestore + Redis cache
   * so FE Publish disable stays in sync with server enforcement.
   */
  @Get('flags')
  @ApiOperation({ summary: 'Get runtime feature flags (zero-deploy kill-switches)' })
  @ApiResponse({ status: 200, type: FlagsResponseDto, description: 'Runtime flags state' })
  async getFlags(): Promise<FlagsResponse> {
    const c1Env = c1GateFromEnv();

    const cached = await this.getCached();
    if (cached) {
      const payload =
        c1Env === null ? cached : { ...cached, c1_verification_gate: c1Env };
      this.logger.debug(`[Flags] Cache hit → ${JSON.stringify(payload)}`);
      return payload;
    }

    const [gov, c1Firestore] = await Promise.all([
      this.factsStore.isGovDataLayerEnabled(),
      this.factsStore.isRuntimeFlagEnabled('c1_verification_gate', false),
    ]);
    const payload: FlagsResponse = {
      gov_data_layer: gov,
      c1_verification_gate: c1Env ?? c1Firestore,
    };
    this.logger.log(`[Flags] Firestore/env read → ${JSON.stringify(payload)}`);
    await this.setCached(payload);
    return payload;
  }

  private async getCached(): Promise<FlagsResponse | null> {
    try {
      const redis = getRedisClient();
      const raw = await redis.get(FLAGS_CACHE_KEY);
      if (raw === null) return null;
      const parsed = JSON.parse(raw);
      if (typeof parsed?.gov_data_layer === 'boolean' && typeof parsed?.c1_verification_gate === 'boolean') {
        return parsed as FlagsResponse;
      }
      return null;
    } catch {
      return null;
    }
  }

  private async setCached(value: FlagsResponse): Promise<void> {
    try {
      const redis = getRedisClient();
      await redis.set(FLAGS_CACHE_KEY, JSON.stringify(value), 'EX', FLAGS_CACHE_TTL);
    } catch {
      // non-fatal
    }
  }
}
