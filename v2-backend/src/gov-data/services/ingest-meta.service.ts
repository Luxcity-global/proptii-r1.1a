/**
 * ingest-meta.service.ts
 *
 * Tracks ingest cadence and staleness for each data source.
 * Used by ingest cron jobs to record their last run and by monitoring
 * to detect stale data.
 *
 * Staleness thresholds (per implementation plan):
 *   HMLR    — monthly   → stale after 35 days (buffer for delays)
 *   OS NGD  — quarterly → stale after 95 days
 *   EPC     — quarterly → stale after 185 days (6 months)
 */

import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import type { IngestMeta, IngestSource } from '../schemas/flag.schema';

export type IngestSourceKey = 'hmlr' | 'os_ngd' | 'epc';

const STALE_AFTER_DAYS: Record<IngestSourceKey, number> = {
  hmlr:   35,
  os_ngd: 95,
  epc:    185,
};

const CADENCE_LABEL: Record<IngestSourceKey, string> = {
  hmlr:   'monthly',
  os_ngd: 'quarterly',
  epc:    'quarterly',
};

const META_COLLECTION = 'ingestMeta';

@Injectable()
export class IngestMetaService {
  private readonly logger = new Logger(IngestMetaService.name);

  private get db(): admin.firestore.Firestore | null {
    if (!admin.apps.length) return null;
    try { return admin.firestore(); } catch { return null; }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Called by an ingest service after a successful run.
   * Writes the run record to `ingestMeta/{source}` in Firestore.
   */
  async recordRun(source: IngestSourceKey): Promise<void> {
    const db = this.db;
    if (!db) return;

    const now = new Date().toISOString();
    const meta: IngestSource = {
      cadence:       CADENCE_LABEL[source],
      lastIngestAt:  now,
      staleAfterDays: STALE_AFTER_DAYS[source],
    };

    try {
      await db.collection(META_COLLECTION).doc(source).set(
        { ...meta, updatedAt: now },
        { merge: true },
      );
      this.logger.log(`[${source}] ingest meta recorded — lastIngestAt=${now}`);
    } catch (err: any) {
      this.logger.warn(`recordRun failed for source=${source}: ${err?.message}`);
    }
  }

  /**
   * Returns the IngestMeta entry for a given source, or null if never run.
   */
  async getMeta(source: IngestSourceKey): Promise<IngestSource | null> {
    const db = this.db;
    if (!db) return null;
    try {
      const snap = await db.collection(META_COLLECTION).doc(source).get();
      if (!snap.exists) return null;
      return snap.data() as IngestSource;
    } catch {
      return null;
    }
  }

  /**
   * Returns true if the source's last ingest is older than its staleAfterDays
   * threshold. Used by monitoring / observability tooling.
   * Returns true (stale) when no ingest has ever run — fail-safe.
   */
  async isStale(source: IngestSourceKey): Promise<boolean> {
    const meta = await this.getMeta(source);
    if (!meta?.lastIngestAt) return true; // never run = stale

    const lastRun = new Date(meta.lastIngestAt).getTime();
    const threshold = (meta.staleAfterDays ?? STALE_AFTER_DAYS[source]) * 86_400_000;
    return Date.now() - lastRun > threshold;
  }

  /**
   * Returns a summary of all three sources' staleness status.
   * Useful for a health endpoint.
   */
  async getStalenessReport(): Promise<
    Record<IngestSourceKey, { stale: boolean; lastIngestAt: string | null }>
  > {
    const sources: IngestSourceKey[] = ['hmlr', 'os_ngd', 'epc'];
    const entries = await Promise.all(
      sources.map(async (src) => {
        const meta = await this.getMeta(src);
        const stale = await this.isStale(src);
        return [src, { stale, lastIngestAt: meta?.lastIngestAt ?? null }] as const;
      }),
    );
    return Object.fromEntries(entries) as Record<
      IngestSourceKey,
      { stale: boolean; lastIngestAt: string | null }
    >;
  }

  /**
   * Builds an IngestMeta object from the current Firestore state.
   * Used by FactsStoreService when composing a full PropertyFactsDoc.
   */
  async buildIngestMeta(): Promise<IngestMeta> {
    const [hmlr, os_ngd, epc] = await Promise.all([
      this.getMeta('hmlr'),
      this.getMeta('os_ngd'),
      this.getMeta('epc'),
    ]);
    return { hmlr, os_ngd, epc, compliance: null };
  }
}
