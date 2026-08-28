/**
 * facts-store.service.ts
 *
 * Firestore read/write service for the `propertyFacts` collection.
 *
 * Key design rules (enforced here, not in controllers):
 *   - NEVER fabricate a 'clear' state — absent = 'unresolved'
 *   - Reads are keyed by UPRN first, listing_id as fallback
 *   - All writes go through upsert (merge: true) — never full-replace
 *   - No live external calls — this is Firestore only
 */

import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import type { PropertyFactsDoc, Flag, IngestMeta } from '../schemas/flag.schema';

export const PROPERTY_FACTS_COLLECTION = 'propertyFacts';
export const RUNTIME_FLAGS_COLLECTION  = 'runtimeFlags';

@Injectable()
export class FactsStoreService {
  private readonly logger = new Logger(FactsStoreService.name);

  private get db(): admin.firestore.Firestore | null {
    if (!admin.apps.length) return null;
    try { return admin.firestore(); } catch { return null; }
  }

  private get col(): admin.firestore.CollectionReference | null {
    const db = this.db;
    return db ? db.collection(PROPERTY_FACTS_COLLECTION) : null;
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  /**
   * Fetches a PropertyFactsDoc by UPRN (preferred) or listing_id (fallback).
   * Returns null — never throws — so callers can treat missing = unresolved.
   */
  async getByUprn(uprn: string): Promise<PropertyFactsDoc | null> {
    return this.safeRead(uprn);
  }

  async getByListingId(listingId: string): Promise<PropertyFactsDoc | null> {
    const col = this.col;
    if (!col) return null;
    try {
      // 1. Direct doc ID lookup (fastest & no composite index required)
      const direct = await this.safeRead(encodeURIComponent(listingId)) || await this.safeRead(listingId);
      if (direct) return direct;

      // 2. Query by listing_id field
      const snap = await col
        .where('listing_id', '==', listingId)
        .limit(1)
        .get();
      if (snap.empty) return null;
      return this.deserialise(snap.docs[0].data());
    } catch (err: any) {
      this.logger.warn(`getByListingId failed for ${listingId}: ${err?.message}`);
      return null;
    }
  }

  /**
   * Batch read — returns a Map keyed by whichever ID was used to look up.
   * Missing keys are NOT inserted (callers must treat absence as unresolved).
   */
  async getBatch(
    listingIds: string[],
    uprns: string[],
  ): Promise<Map<string, PropertyFactsDoc>> {
    const result = new Map<string, PropertyFactsDoc>();
    const col = this.col;
    if (!col) return result;

    await Promise.all([
      ...uprns.map(async (uprn) => {
        const doc = await this.safeRead(uprn);
        if (doc) result.set(uprn, doc);
      }),
      ...listingIds.map(async (id) => {
        if (result.has(id)) return; // already found via UPRN
        const doc = await this.getByListingId(id);
        if (doc) result.set(id, doc);
      }),
    ]);

    return result;
  }

  // ── Write ─────────────────────────────────────────────────────────────────

  /**
   * Upserts a PropertyFactsDoc. Uses merge: true to avoid race conditions
   * between concurrent ingest jobs writing different sources.
   *
   * @param key  UPRN string (preferred) or listing_id
   * @param data Partial document to merge into the existing record
   */
  async upsert(key: string, data: Partial<PropertyFactsDoc>): Promise<void> {
    const col = this.col;
    if (!col) {
      this.logger.warn('upsert: Firestore unavailable — skipping write');
      return;
    }
    try {
      const payload = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await col.doc(encodeURIComponent(key)).set(payload, { merge: true });
    } catch (err: any) {
      this.logger.error(`upsert failed for key=${key}: ${err?.message}`);
    }
  }

  /**
   * Appends or replaces a single flag within a PropertyFactsDoc.
   * Matches on flagId + source — if found, replaces in-place; otherwise appends.
   */
  async upsertFlag(key: string, flag: Flag): Promise<void> {
    const existing = await this.safeRead(key);
    const flags: Flag[] = existing?.flags ?? [];

    const idx = flags.findIndex(
      (f) => f.flagId === flag.flagId && f.source === flag.source,
    );
    if (idx >= 0) {
      flags[idx] = flag;
    } else {
      flags.push(flag);
    }

    await this.upsert(key, { flags });
  }

  /**
   * Updates only the `ingestMeta` field for a specific source.
   * Used by ingest cron jobs to record their last run timestamp.
   */
  async updateIngestMeta(
    key: string,
    source: keyof IngestMeta,
    meta: IngestMeta[keyof IngestMeta],
  ): Promise<void> {
    const col = this.col;
    if (!col) return;
    try {
      await col.doc(key).set(
        { ingestMeta: { [source]: meta }, updatedAt: new Date().toISOString() },
        { merge: true },
      );
    } catch (err: any) {
      this.logger.warn(`updateIngestMeta failed for ${key}: ${err?.message}`);
    }
  }

  // ── Runtime flags ─────────────────────────────────────────────────────────

  /**
   * Checks the `runtimeFlags/gov_data_layer` document.
   * Returns true (enabled) if the document exists and `enabled === true`.
   * Defaults to true when the document is missing (safe for initial deploy).
   */
  async isGovDataLayerEnabled(): Promise<boolean> {
    const db = this.db;
    if (!db) return false;
    try {
      const doc = await db
        .collection(RUNTIME_FLAGS_COLLECTION)
        .doc('gov_data_layer')
        .get();
      if (!doc.exists) return true; // default on
      return (doc.data() as any)?.enabled !== false;
    } catch {
      return true; // fail open — don't suppress the feature on a Firestore hiccup
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async safeRead(docId: string): Promise<PropertyFactsDoc | null> {
    const col = this.col;
    if (!col) return null;
    try {
      const snap = await col.doc(docId).get();
      if (!snap.exists) return null;
      return this.deserialise(snap.data());
    } catch (err: any) {
      this.logger.warn(`safeRead failed for ${docId}: ${err?.message}`);
      return null;
    }
  }

  /**
   * Converts Firestore Timestamp fields to ISO strings.
   * Firestore admin SDK returns Timestamps as objects with `.toDate()`.
   */
  private deserialise(data: any): PropertyFactsDoc {
    const toIso = (v: any) =>
      v?.toDate ? v.toDate().toISOString() : v ?? new Date(0).toISOString();

    return {
      uprn:         data.uprn         ?? null,
      listing_id:   data.listing_id   ?? null,
      title_number: data.title_number ?? null,
      matchStatus:  data.matchStatus  ?? 'none',
      flags: (data.flags ?? []).map((f: any) => ({
        ...f,
        ingestedAt: toIso(f.ingestedAt),
      })),
      ingestMeta: {
        hmlr:       data.ingestMeta?.hmlr       ? { ...data.ingestMeta.hmlr,       lastIngestAt: toIso(data.ingestMeta.hmlr.lastIngestAt) }       : null,
        os_ngd:     data.ingestMeta?.os_ngd     ? { ...data.ingestMeta.os_ngd,     lastIngestAt: toIso(data.ingestMeta.os_ngd.lastIngestAt) }     : null,
        epc:        data.ingestMeta?.epc        ? { ...data.ingestMeta.epc,        lastIngestAt: toIso(data.ingestMeta.epc.lastIngestAt) }        : null,
        compliance: data.ingestMeta?.compliance ? { lastUpdatedAt: toIso(data.ingestMeta.compliance.lastUpdatedAt) } : null,
      },
      updatedAt: toIso(data.updatedAt),
    };
  }
}
