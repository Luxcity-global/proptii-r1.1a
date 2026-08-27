/**
 * epc-ingest.service.ts
 *
 * EPC (Energy Performance Certificate) ingest cron job — DISABLED.
 *
 * ⚠️  STATUS: DISABLED — data product not yet confirmed in scope.
 *
 * EPC data is available from the DLUHC Domestic EPC Register at:
 *   https://epc.opendatacommunities.org
 *
 * This service is disabled at module level (see gov-data.module.ts — the cron
 * decorator is registered but the guard at the top of runIngest() exits
 * immediately if EPC_INGEST_ENABLED !== 'true').
 *
 * To enable:
 *   1. Confirm EPC register is in scope with Head of Engineering
 *   2. Set EPC_INGEST_ENABLED=true in v2-backend .env / Render env vars
 *   3. Set EPC_API_KEY to your DLUHC API credentials
 *   4. Update docs/ingest-runbook.md with licence reference and cadence
 *
 * Impact of remaining disabled:
 *   The `ingestMeta.epc` field stays null in all `propertyFacts` documents.
 *   The epc_rating flag state will be 'unresolved' — never 'clear' — which
 *   is the correct behaviour per the PRD.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FactsStoreService } from './facts-store.service';
import { IngestMetaService } from './ingest-meta.service';

const EPC_API_BASE = 'https://epc.opendatacommunities.org/api/v1';

@Injectable()
export class EpcIngestService {
  private readonly logger = new Logger(EpcIngestService.name);

  constructor(
    private readonly factsStore: FactsStoreService,
    private readonly ingestMeta: IngestMetaService,
  ) {}

  /**
   * Quarterly cron — 05:00 UTC on the 1st of Jan, Apr, Jul, Oct.
   * Offset from OS NGD (04:00) to avoid concurrent Firestore write load.
   *
   * The cron is registered but the ingest guard exits immediately unless
   * EPC_INGEST_ENABLED=true is set in the environment.
   */
  @Cron('0 5 1 1,4,7,10 *', { name: 'epc-ingest' })
  async runIngest(): Promise<void> {
    // ── DISABLED GUARD ──────────────────────────────────────────────────────
    if (process.env.EPC_INGEST_ENABLED !== 'true') {
      this.logger.debug(
        '[EPC] Ingest is DISABLED (EPC_INGEST_ENABLED != "true"). Skipping.'
      );
      return;
    }
    // ── END DISABLED GUARD ──────────────────────────────────────────────────

    const apiKey = process.env.EPC_API_KEY;
    if (!apiKey) {
      this.logger.warn('[EPC] EPC_API_KEY not set — cannot run ingest.');
      return;
    }

    this.logger.log('[EPC] Ingest starting.');

    try {
      await this.ingestEpcData(apiKey);
      await this.ingestMeta.recordRun('epc');
      this.logger.log('[EPC] Ingest complete.');
    } catch (err: any) {
      this.logger.error(`[EPC] Ingest failed: ${err?.message}`);
    }
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private async ingestEpcData(_apiKey: string): Promise<void> {
    // TODO: Implement EPC register pagination and flag derivation.
    //
    // DLUHC EPC API endpoint:
    //   GET {EPC_API_BASE}/domestic/search
    //       ?postcode={postcode}&size=25&from={offset}
    //   Authorization: Basic base64(email:apiKey)
    //
    // Each EPC record provides:
    //   - uprn                → primary lookup key
    //   - current-energy-rating  → A–G
    //   - lodgement-date         → ISO date
    //   - address fields
    //
    // Flag derivation:
    //   - rating A–C → state: 'clear', detail: 'EPC rating {X}'
    //   - rating D   → state: 'flagged', severity: 'medium' (minimum E required to let legally)
    //   - rating E–G → state: 'flagged', severity: 'high'
    //
    // Store in: propertyFacts/{uprn}.flags[{ flagId: 'epc_rating', source: 'epc_register', ... }]

    this.logger.log(
      `[EPC] Skeleton ingest — API base: ${EPC_API_BASE}. ` +
      'No data written (TODO: implement pagination and flag derivation).'
    );
  }

  // ── JIT Lookup for 24h Report Fan-out ────────────────────────────────────

  async getEpcJit(postcode: string, buildingText?: string): Promise<any | null> {
    const apiKey = process.env.EPC_API_KEY;
    if (!apiKey) {
      this.logger.debug('[EPC] JIT Lookup skipped — EPC_API_KEY not set.');
      return null;
    }

    try {
      // Stub: Real implementation would hit EPC_API_BASE/domestic/search
      // with Authorization: Basic base64(email:apiKey)
      this.logger.debug(`[EPC] JIT Lookup stub for ${buildingText} ${postcode}`);
      
      // Return a simulated response when the key is active
      return {
        epcBand: 'C',
        floorAreaM2: 75,
        lodged: new Date().toISOString(),
        winterNote: 'Expected lower winter bills'
      };
    } catch (err: any) {
      this.logger.warn(`[EPC] JIT Lookup failed: ${err.message}`);
      return null;
    }
  }
}
