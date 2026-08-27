/**
 * os-ngd-ingest.service.ts
 *
 * OS NGD (National Geographic Database) Buildings ingest cron job.
 *
 * Data source: Ordnance Survey NGD Features API — Buildings collection
 *   https://api.os.uk/features/ngd/ofa/v1/collections/bld-fts-buildingpart/items
 *
 * Cadence:         Quarterly (Jan, Apr, Jul, Oct — 04:00 UTC on the 1st)
 * Stale threshold: 95 days
 * See:             docs/ingest-runbook.md — OS NGD section
 *
 * What this service does:
 *   1. Iterates all OS NGD building footprint pages for the coverage area
 *   2. Extracts UPRN, PAON, SAON, street, postcode from each GeoJSON feature
 *   3. Batch-writes postcode-keyed entries into the `uprn_index` Firestore
 *      collection — read by UprnMatchService at request time
 *   4. Upserts an `os_ngd_building_match` flag into `propertyFacts/{uprn}`
 *      for every resolved building
 *   5. Calls IngestMetaService.recordRun('os_ngd') on success
 *
 * Environment variables:
 *   OS_NGD_API_KEY  — OS Data Hub API key (required; job skips if absent)
 *   OS_NGD_API_URL  — defaults to https://api.os.uk/features/ngd/ofa/v1
 *
 * Abort safety:
 *   AbortController is wired to onModuleDestroy so a clean shutdown during
 *   a long ingest does not leave running = true permanently.
 *
 * Firestore writes:
 *   uprn_index/{postcode}            — { entries: UprnIndexEntry[] }
 *   propertyFacts/{uprn}             — upserted via FactsStoreService
 */

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as admin from 'firebase-admin';
import { FactsStoreService } from './facts-store.service';
import { IngestMetaService } from './ingest-meta.service';
import type { Flag } from '../schemas/flag.schema';

// ─── Constants ────────────────────────────────────────────────────────────────

const OS_NGD_API_URL =
  process.env.OS_NGD_API_URL ?? 'https://api.os.uk/features/ngd/ofa/v1';

/** Features API collection name for building parts */
const COLLECTION = 'bld-fts-buildingpart';

/** How many features to fetch per API page (OS NGD max is 100) */
const PAGE_SIZE = 100;

/**
 * Firestore batch write limit. Firestore max is 500 ops per batch;
 * we use 400 to leave headroom for uprn_index merges within the same batch.
 */
const FIRESTORE_BATCH_SIZE = 400;

// ─── Types ────────────────────────────────────────────────────────────────────

/** One entry in the uprn_index/{postcode} document. */
export interface UprnIndexEntry {
  uprn:     string;
  paon:     string;  // building number / name
  saon:     string;  // sub-unit (flat, floor, etc.) — may be empty
  street:   string;
  postcode: string;
}

/** Shape of a single OS NGD Buildings GeoJSON feature's properties. */
interface OsNgdFeatureProperties {
  uprn?:     string | number;
  toid?:     string;          // OS persistent object identifier
  /** Different field names observed across OS NGD API versions */
  paon?: string; pao?: string; paotext?: string;
  saon?: string; sao?: string; saotext?: string;
  street_description?: string; street?: string;
  postcode?: string; postcode_locator?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class OsNgdIngestService implements OnModuleDestroy {
  private readonly logger = new Logger(OsNgdIngestService.name);
  private running = false;
  private abortController: AbortController | null = null;

  constructor(
    private readonly factsStore: FactsStoreService,
    private readonly ingestMeta: IngestMetaService,
  ) {}

  onModuleDestroy() {
    this.abortController?.abort();
  }

  // ── Cron ──────────────────────────────────────────────────────────────────

  /**
   * Quarterly cron — 04:00 UTC on the 1st of Jan, Apr, Jul, Oct.
   * Offset from HMLR (03:00) to avoid concurrent ingest load on Firestore.
   */
  @Cron('0 4 1 1,4,7,10 *', { name: 'os-ngd-ingest' })
  async runIngest(): Promise<void> {
    if (this.running) {
      this.logger.warn('[OS NGD] Previous ingest run still in progress — skipping.');
      return;
    }

    const apiKey = process.env.OS_NGD_API_KEY;
    if (!apiKey) {
      this.logger.warn(
        '[OS NGD] OS_NGD_API_KEY not set — skipping ingest. ' +
        'Register at https://osdatahub.os.uk, set the env var, and redeploy.',
      );
      return;
    }

    this.running = true;
    this.abortController = new AbortController();
    const startedAt = Date.now();

    this.logger.log('[OS NGD] Ingest starting.');

    try {
      const stats = await this.ingestBuildings(apiKey, this.abortController.signal);
      await this.ingestMeta.recordRun('os_ngd');
      this.logger.log(
        `[OS NGD] Ingest complete in ${Date.now() - startedAt}ms. ` +
        `Features fetched: ${stats.fetched}, UPRN index entries written: ${stats.indexed}, ` +
        `propertyFacts flags upserted: ${stats.flagged}.`,
      );
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        this.logger.warn('[OS NGD] Ingest aborted (module shutdown).');
      } else {
        this.logger.error(`[OS NGD] Ingest failed: ${err?.message}`);
      }
    } finally {
      this.running = false;
      this.abortController = null;
    }
  }

  // ── Core ingest logic ─────────────────────────────────────────────────────

  /**
   * Pages through the OS NGD Buildings collection and writes results to
   * Firestore. Returns a stats object for the completion log line.
   */
  private async ingestBuildings(
    apiKey: string,
    signal: AbortSignal,
  ): Promise<{ fetched: number; indexed: number; flagged: number }> {
    const db = admin.apps.length ? admin.firestore() : null;
    if (!db) {
      this.logger.warn('[OS NGD] Firestore unavailable — aborting ingest.');
      return { fetched: 0, indexed: 0, flagged: 0 };
    }

    let offset = 0;
    let totalFetched = 0;
    let totalIndexed = 0;
    let totalFlagged = 0;

    // Accumulate entries per postcode before writing to Firestore so we can
    // batch-merge them rather than doing a read-modify-write per building.
    const postcodeBuffer = new Map<string, UprnIndexEntry[]>();
    const flagBuffer: Array<{ uprn: string; flag: Flag }> = [];

    while (true) {
      if (signal.aborted) {
        this.logger.warn('[OS NGD] Abort signal received — stopping pagination.');
        break;
      }

      // ── Fetch one page ───────────────────────────────────────────────────
      const url =
        `${OS_NGD_API_URL}/collections/${COLLECTION}/items` +
        `?key=${apiKey}&limit=${PAGE_SIZE}&offset=${offset}`;

      let features: OsNgdFeatureProperties[];
      try {
        features = await this.fetchPage(url, signal);
      } catch (err: any) {
        if (err?.name === 'AbortError') throw err;
        this.logger.error(`[OS NGD] Page fetch failed at offset=${offset}: ${err?.message}`);
        // Non-fatal: log and stop pagination so partial data is still written
        break;
      }

      if (!features.length) {
        // Empty page = end of dataset
        break;
      }

      totalFetched += features.length;

      // ── Parse features into index entries and flags ───────────────────────
      for (const props of features) {
        const entry = this.parseFeature(props);
        if (!entry) continue;

        // Buffer by postcode for batch uprn_index write
        if (!postcodeBuffer.has(entry.postcode)) {
          postcodeBuffer.set(entry.postcode, []);
        }
        postcodeBuffer.get(entry.postcode)!.push(entry);
        totalIndexed++;

        // Buffer flag for propertyFacts write
        flagBuffer.push({
          uprn: entry.uprn,
          flag: {
            flagId:       'os_ngd_building_match',
            source:       'os_ngd',
            cadence:      'batch',
            state:        'clear',  // building confirmed to exist in OS NGD
            baseSeverity: 'info',
            detail:       `Building confirmed in OS NGD Buildings dataset (UPRN ${entry.uprn}).`,
            ingestedAt:   new Date().toISOString(),
            sourceRef:    null,
          },
        });
        totalFlagged++;
      }

      // ── Flush buffers to Firestore when they reach batch threshold ────────
      if (flagBuffer.length >= FIRESTORE_BATCH_SIZE) {
        await this.flushUprnIndex(db, postcodeBuffer, signal);
        await this.flushFlags(flagBuffer, signal);
        postcodeBuffer.clear();
        flagBuffer.length = 0;
      }

      this.logger.debug(`[OS NGD] Fetched ${totalFetched} features so far (offset=${offset}).`);
      offset += features.length;

      // If we got fewer features than the page size, we've reached the end
      if (features.length < PAGE_SIZE) break;
    }

    // ── Final flush for anything remaining in the buffers ─────────────────
    if (postcodeBuffer.size > 0) {
      await this.flushUprnIndex(db, postcodeBuffer, signal);
    }
    if (flagBuffer.length > 0) {
      await this.flushFlags(flagBuffer, signal);
    }

    return { fetched: totalFetched, indexed: totalIndexed, flagged: totalFlagged };
  }

  // ── API fetching ──────────────────────────────────────────────────────────

  /**
   * Fetches one page of OS NGD GeoJSON FeatureCollection and returns the
   * `properties` object from each Feature.
   */
  private async fetchPage(
    url: string,
    signal: AbortSignal,
  ): Promise<OsNgdFeatureProperties[]> {
    const response = await fetch(url, {
      signal,
      headers: {
        'Accept':     'application/geo+json',
        'User-Agent': 'Proptii/R1.4 ingest-service',
      },
    });

    if (!response.ok) {
      throw new Error(`OS NGD API returned HTTP ${response.status} for ${url}`);
    }

    const body = await response.json() as any;

    // OS NGD returns a GeoJSON FeatureCollection
    const features: any[] = body?.features ?? [];
    return features
      .map((f: any) => f?.properties ?? {})
      .filter(Boolean);
  }

  // ── Feature parsing ───────────────────────────────────────────────────────

  /**
   * Extracts a normalised UprnIndexEntry from one OS NGD feature's properties.
   * Returns null if the UPRN or postcode is missing — those features cannot
   * be used for address matching.
   *
   * OS NGD field names are not perfectly stable across API versions; this
   * method tries multiple aliases for each logical field.
   */
  private parseFeature(props: OsNgdFeatureProperties): UprnIndexEntry | null {
    const uprn = String(props.uprn ?? '').trim();
    const postcode = this.normalisePostcode(
      props.postcode ?? props.postcode_locator ?? '',
    );

    if (!uprn || !postcode) return null;

    const paon   = this.cleanToken(props.paon   ?? props.pao   ?? props.paotext   ?? '');
    const saon   = this.cleanToken(props.saon   ?? props.sao   ?? props.saotext   ?? '');
    const street = this.cleanToken(props.street_description ?? props.street ?? '');

    return { uprn, paon, saon, street, postcode };
  }

  // ── Firestore flush helpers ───────────────────────────────────────────────

  /**
   * Writes all buffered postcode → UprnIndexEntry[] mappings into the
   * `uprn_index` Firestore collection using merge semantics.
   *
   * Document key: normalised postcode (e.g. "SW1A1AA")
   * Document shape: { entries: UprnIndexEntry[], updatedAt: string }
   *
   * Merge strategy: we replace the entire `entries` array on each ingest
   * because OS NGD is a full quarterly snapshot — stale UPRNs must be removed.
   */
  private async flushUprnIndex(
    db: admin.firestore.Firestore,
    buffer: Map<string, UprnIndexEntry[]>,
    signal: AbortSignal,
  ): Promise<void> {
    if (!buffer.size || signal.aborted) return;

    const col = db.collection('uprn_index');
    const updatedAt = new Date().toISOString();

    // Split into Firestore batch chunks (max 500 ops each)
    const entries = Array.from(buffer.entries());
    for (let i = 0; i < entries.length; i += FIRESTORE_BATCH_SIZE) {
      if (signal.aborted) return;
      const chunk = entries.slice(i, i + FIRESTORE_BATCH_SIZE);
      const batch = db.batch();
      for (const [postcode, uprnEntries] of chunk) {
        batch.set(col.doc(postcode), { entries: uprnEntries, updatedAt }, { merge: false });
      }
      try {
        await batch.commit();
      } catch (err: any) {
        this.logger.error(`[OS NGD] uprn_index batch write failed: ${err?.message}`);
      }
    }
  }

  /**
   * Upserts `os_ngd_building_match` flags into `propertyFacts/{uprn}`.
   * Uses FactsStoreService.upsertFlag() which handles merge-safe writes.
   */
  private async flushFlags(
    buffer: Array<{ uprn: string; flag: Flag }>,
    signal: AbortSignal,
  ): Promise<void> {
    for (const { uprn, flag } of buffer) {
      if (signal.aborted) return;
      try {
        await this.factsStore.upsertFlag(uprn, flag);
      } catch (err: any) {
        // Non-fatal — log and continue; missing flags are 'unresolved', not corrupted
        this.logger.warn(`[OS NGD] upsertFlag failed for UPRN ${uprn}: ${err?.message}`);
      }
    }
  }

  // ── Normalisation helpers ─────────────────────────────────────────────────

  /** Strips spaces and uppercases a postcode, e.g. "sw1a 1aa" → "SW1A1AA" */
  private normalisePostcode(pc: string): string {
    return pc.trim().toUpperCase().replace(/\s+/g, '');
  }

  /**
   * Strips non-alphanumeric characters and uppercases address tokens so
   * they can be compared consistently with UprnMatchService.cleanToken().
   */
  private cleanToken(s: string): string {
    return s.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
}
