/**
 * hmlr-ingest.service.ts
 *
 * HMLR (HM Land Registry) ingest cron job — STUBBED.
 *
 * ⚠️  STATUS: STUBBED (stubbed: true on all flags)
 *
 * The HMLR licensed title/covenants data product is NOT yet in hand.
 * The sample file `01 Sample PP HMLR Data (1).xlsx` contains Price Paid data
 * only — this must NOT be used to derive covenant flags (see implementation
 * plan, critical finding section).
 *
 * This service is intentionally inert until the licensed product arrives.
 * When it does:
 *   1. Remove the STUBBED guard at the top of runIngest()
 *   2. Set the HMLR_LICENSED_DATA_PATH env var to the ingested dataset
 *   3. Update IngestMetaService cadence from 'STUBBED' to 'monthly'
 *
 * DoD gates that must pass before removing the stub:
 *   - Licensed product licence reference recorded in docs/ingest-runbook.md
 *   - Schema validated against actual title register format (not Price Paid)
 *   - Backend lead sign-off in PR review
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { Flag } from '../schemas/flag.schema';
import { FactsStoreService } from './facts-store.service';
import { IngestMetaService } from './ingest-meta.service';

@Injectable()
export class HmlrIngestService {
  private readonly logger = new Logger(HmlrIngestService.name);

  /**
   * STUBBED flag emitted for every property.
   * The state is 'unresolved', not 'flagged', because we have no actual data.
   * Downstream: the lens engine will see stubbed=true and may suppress display.
   */
  static readonly STUB_FLAG: Omit<Flag, 'ingestedAt'> = {
    flagId:       'covenant_restriction',
    source:       'hmlr',
    cadence:      'batch',
    state:        'unresolved',
    baseSeverity: 'high',
    detail:       null,
    sourceRef:    null,
    stubbed:      true,
  };

  constructor(
    private readonly factsStore: FactsStoreService,
    private readonly ingestMeta: IngestMetaService,
  ) {}

  /**
   * Scheduled HMLR ingest. Runs daily at 03:00 UTC.
   * Currently a no-op — see module-level docstring.
   */
  @Cron('0 3 * * *', { name: 'hmlr-ingest' })
  async runIngest(): Promise<void> {
    // ── STUBBED GUARD ───────────────────────────────────────────────────────
    // Remove this block only when the licensed HMLR title/covenants product
    // has been received and the runbook updated.
    this.logger.warn(
      '[HMLR] Ingest is STUBBED — licensed product not yet in hand. ' +
      'Skipping run. All covenant flags remain unresolved.'
    );
    return;
    // ── END STUBBED GUARD ───────────────────────────────────────────────────

    // Future implementation will:
    // 1. Read the licensed HMLR title register dataset
    // 2. Parse title numbers and restrictive covenant fields
    // 3. Match title numbers to UPRNs via UprnMatchService
    // 4. Upsert covenant_restriction flags per property
    // 5. Call this.ingestMeta.recordRun('hmlr', cadence, staleAfterDays)
  }

  /**
   * Returns the stub flag for a given property key, with the current timestamp.
   * Used by FactsStoreService.upsertFlag() when pre-populating the store before
   * real HMLR data is available.
   */
  stubFlagFor(_propertyKey: string): Flag {
    return {
      ...HmlrIngestService.STUB_FLAG,
      ingestedAt: new Date().toISOString(),
    };
  }
}
