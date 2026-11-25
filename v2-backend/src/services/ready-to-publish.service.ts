/**
 * C1 / C2 — shared "ready to publish" check.
 * Single source of truth for publish gates (native-properties write path + FE messaging).
 *
 * Property compliance docs (gas / EICR / EPC / deposit) are always required to publish
 * into tenant search. Account verification (photo ID / proof of address) is required
 * only when runtime flag `c1_verification_gate` is on.
 */
import { Injectable, Logger, Optional } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FactsStoreService } from '../gov-data/services/facts-store.service';

export const C1_FLAG_ID = 'c1_verification_gate';

export type VerificationMissingItem =
  | 'photo_id'
  | 'proof_of_address'
  | 'gas-cert'
  | 'eicr'
  | 'epc'
  | 'deposit-protection';

export interface ReadyToPublishResult {
  ok: boolean;
  missing: VerificationMissingItem[];
  gateEnabled: boolean;
}

const PROPERTY_REQUIRED: VerificationMissingItem[] = [
  'gas-cert',
  'eicr',
  'epc',
  'deposit-protection',
];

function hasDocOfType(docs: any[], type: string): boolean {
  return docs.some((d) => String(d?.type || '').toLowerCase() === type.toLowerCase());
}

/** Exported for unit tests — EPC file + rating on doc or property. */
export function hasEpcWithRating(docs: any[], propertyLike?: any): boolean {
  const propertyRating = String(propertyLike?.epcRating || propertyLike?.rating || '').trim();
  const hasEpcDoc = docs.some((d) => String(d?.type || '').toLowerCase() === 'epc');
  if (!hasEpcDoc) return false;
  // Accept rating on the EPC document (preferred) or on the property record
  // (Property Details UI saves the dropdown to property.epcRating).
  if (propertyRating.length > 0) return true;
  return docs.some((d) => {
    if (String(d?.type || '').toLowerCase() !== 'epc') return false;
    const rating = d?.epcRating ?? d?.rating;
    return typeof rating === 'string' && rating.trim().length > 0;
  });
}

function hasDepositSatisfied(propertyLike: any, docs: any[]): boolean {
  const takes = String(propertyLike?.takesDeposit || '').toLowerCase();
  if (takes === 'no') return true;
  if (propertyLike?.depositProtectionConfirmed === true) return true;
  return hasDocOfType(docs, 'deposit-protection');
}

@Injectable()
export class ReadyToPublishService {
  private readonly logger = new Logger(ReadyToPublishService.name);

  constructor(@Optional() private readonly factsStore?: FactsStoreService) {}

  private get db() {
    if (!admin.apps.length) return null;
    try {
      return admin.firestore();
    } catch {
      return null;
    }
  }

  async isGateEnabled(): Promise<boolean> {
    const env = process.env.C1_VERIFICATION_GATE ?? process.env.FLAG_C1_VERIFICATION_GATE;
    if (env === 'true' || env === '1') return true;
    if (env === 'false' || env === '0') return false;

    if (this.factsStore?.isRuntimeFlagEnabled) {
      return this.factsStore.isRuntimeFlagEnabled(C1_FLAG_ID, false);
    }

    const db = this.db;
    if (!db) return false;
    try {
      const doc = await db.collection('runtimeFlags').doc(C1_FLAG_ID).get();
      if (!doc.exists) return false;
      return (doc.data() as any)?.enabled === true;
    } catch (err: any) {
      this.logger.warn(`[C1] flag read failed: ${err?.message || err}`);
      return false;
    }
  }

  /**
   * True when a write would make the property appear in public vacant search.
   * C2: also true when turning listingVisibility to public (unless draft/archived/private).
   */
  wouldBecomeSearchable(
    nextStatus: string | undefined | null,
    previousStatus?: string | null,
    nextVisibility?: string | null,
    previousVisibility?: string | null,
  ): boolean {
    const next = (nextStatus || '').toLowerCase();
    const nextVis =
      nextVisibility == null || nextVisibility === ''
        ? null
        : String(nextVisibility).toLowerCase();
    const prevVis =
      previousVisibility == null || previousVisibility === ''
        ? null
        : String(previousVisibility).toLowerCase();

    if (nextVis === 'private') return false;
    if (next === 'draft' || next === 'archived') return false;

    if (nextVis === 'public' && prevVis !== 'public') {
      return true;
    }

    // Legacy status-only path (unchanged for callers that omit visibility).
    if (next !== 'vacant') return false;
    if (previousStatus === undefined || previousStatus === null) return true;
    return String(previousStatus).toLowerCase() !== 'vacant';
  }

  async check(landlordId: string, propertyId?: string, propertyDocsHint?: any[]): Promise<ReadyToPublishResult> {
    const gateEnabled = await this.isGateEnabled();
    const missing: VerificationMissingItem[] = [];
    const db = this.db;

    // Property-level docs: always required to publish into tenant search.
    let propertyData: any = {};
    let docs: any[] = Array.isArray(propertyDocsHint) ? [...propertyDocsHint] : [];

    if (db && propertyId) {
      try {
        const propSnap = await db.collection('properties').doc(propertyId).get();
        if (propSnap.exists) {
          propertyData = propSnap.data() || {};
          const propDocs = propertyData?.documents;
          if (Array.isArray(propDocs)) docs = [...docs, ...propDocs];
        }
      } catch (err: any) {
        this.logger.warn(`[C1] property docs read failed: ${err?.message || err}`);
      }

      try {
        const vaultSnap = await db
          .collection('landlord_documents')
          .where('propertyId', '==', propertyId)
          .get();
        vaultSnap.docs.forEach((d) => docs.push(d.data()));
      } catch (err: any) {
        this.logger.warn(`[C1] landlord_documents read failed: ${err?.message || err}`);
      }
    }

    for (const type of PROPERTY_REQUIRED) {
      if (type === 'epc') {
        if (!hasEpcWithRating(docs, propertyData)) missing.push('epc');
      } else if (type === 'deposit-protection') {
        if (!hasDepositSatisfied(propertyData, docs)) missing.push('deposit-protection');
      } else if (!hasDocOfType(docs, type)) {
        missing.push(type);
      }
    }

    // Account-level verification only when C1 flag is on.
    if (gateEnabled) {
      let verification: any = {};
      if (db && landlordId) {
        try {
          const userSnap = await db.collection('users').doc(landlordId).get();
          verification = (userSnap.data() as any)?.verification || {};
        } catch (err: any) {
          this.logger.warn(`[C1] user verification read failed: ${err?.message || err}`);
        }
      }

      if (!verification?.photoId?.storagePath && !verification?.photoId?.submittedAt) {
        missing.push('photo_id');
      }
      if (!verification?.proofOfAddress?.storagePath && !verification?.proofOfAddress?.submittedAt) {
        missing.push('proof_of_address');
      }
    }

    return { ok: missing.length === 0, missing, gateEnabled };
  }
}
