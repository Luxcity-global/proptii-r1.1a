/**
 * uprn-match.service.ts
 *
 * Address normalisation and UPRN matching service.
 *
 * Strategy:
 * 1. Normalise an address (PAON + SAON + Street + Postcode) to a canonical form.
 * 2. Look up the normalised postcode bucket in the local UPRN map (built from
 *    OS NGD Buildings ingest data).
 * 3. Return the best match (exact > partial > none).
 *
 * The address field format follows the HMLR Price Paid schema from the sample
 * XLSX: PAON (building number/name), SAON (sub-unit), Street, Postcode.
 *
 * IMPORTANT: This service only reads from Firestore. It never makes live calls
 * to OS NGD or HMLR APIs at request time.
 */

import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import type { MatchStatus } from '../schemas/flag.schema';

export interface NormalisedAddress {
  paon: string;   // Building number or name (primary addressable object name)
  saon: string;   // Sub-unit (secondary addressable object name) — may be empty
  street: string;
  postcode: string;
}

export interface UprnMatchResult {
  uprn: string | null;
  matchStatus: MatchStatus;
  score: number; // 0–1 confidence
}

@Injectable()
export class UprnMatchService {
  private readonly logger = new Logger(UprnMatchService.name);

  private get db(): admin.firestore.Firestore | null {
    if (!admin.apps.length) return null;
    try { return admin.firestore(); } catch { return null; }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Attempt to resolve a UPRN for the given address fields.
   * Returns { uprn: null, matchStatus: 'none' } when no match is found —
   * never throws.
   */
  async match(address: NormalisedAddress): Promise<UprnMatchResult> {
    const postcode = this.normalisePostcode(address.postcode);
    if (!postcode) {
      return { uprn: null, matchStatus: 'none', score: 0 };
    }

    try {
      const candidates = await this.fetchCandidates(postcode);
      if (!candidates.length) {
        return { uprn: null, matchStatus: 'none', score: 0 };
      }
      return this.bestMatch(address, candidates);
    } catch (err: any) {
      this.logger.warn(`UPRN match failed for postcode=${postcode}: ${err?.message}`);
      return { uprn: null, matchStatus: 'none', score: 0 };
    }
  }

  // ── Normalisation ─────────────────────────────────────────────────────────

  /**
   * Converts a free-text address line into a NormalisedAddress.
   * The HMLR Price Paid XLSX uses separate PAON/SAON/Street columns — this
   * utility handles cases where they arrive as a single concatenated string.
   */
  static normalise(raw: {
    paon?: string;
    saon?: string;
    street?: string;
    postcode?: string;
    addressLine1?: string;
    addressLine2?: string;
  }): NormalisedAddress {
    return {
      paon: UprnMatchService.cleanToken(raw.paon ?? raw.addressLine1 ?? ''),
      saon: UprnMatchService.cleanToken(raw.saon ?? raw.addressLine2 ?? ''),
      street: UprnMatchService.cleanToken(raw.street ?? ''),
      postcode: UprnMatchService.normalisePostcodeStatic(raw.postcode ?? ''),
    };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Fetches UPRN candidates for a postcode from the `uprn_index` Firestore
   * collection (populated by OsNgdIngestService). Each document is keyed by
   * normalised postcode and contains an array of { uprn, paon, saon, street }.
   */
  private async fetchCandidates(
    postcode: string,
  ): Promise<Array<{ uprn: string; paon: string; saon: string; street: string }>> {
    const db = this.db;
    if (!db) return [];
    const snap = await db.collection('uprn_index').doc(postcode).get();
    if (!snap.exists) return [];
    return (snap.data() as any)?.entries ?? [];
  }

  /**
   * Scores each candidate and returns the best.
   * Scoring:
   *   PAON exact match  → +0.5
   *   SAON exact match  → +0.2
   *   Street match      → +0.3
   * Threshold: ≥0.8 = exact, ≥0.5 = partial, <0.5 = none
   */
  private bestMatch(
    address: NormalisedAddress,
    candidates: Array<{ uprn: string; paon: string; saon: string; street: string }>,
  ): UprnMatchResult {
    let best: UprnMatchResult = { uprn: null, matchStatus: 'none', score: 0 };

    for (const c of candidates) {
      let score = 0;
      if (c.paon   && UprnMatchService.cleanToken(c.paon)   === address.paon)   score += 0.5;
      if (c.saon   && UprnMatchService.cleanToken(c.saon)   === address.saon)   score += 0.2;
      if (c.street && UprnMatchService.cleanToken(c.street) === address.street) score += 0.3;

      if (score > best.score) {
        best = {
          uprn: c.uprn,
          matchStatus: score >= 0.8 ? 'exact' : score >= 0.5 ? 'partial' : 'none',
          score,
        };
      }
    }

    return best;
  }

  private normalisePostcode(pc: string): string {
    return UprnMatchService.normalisePostcodeStatic(pc);
  }

  private static normalisePostcodeStatic(pc: string): string {
    return pc.trim().toUpperCase().replace(/\s+/g, '');
  }

  private static cleanToken(s: string): string {
    return s.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
}
