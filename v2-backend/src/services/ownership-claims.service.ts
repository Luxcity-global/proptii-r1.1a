/**
 * H4 — duplicate address claims.
 * Second landlord claiming the same match key gets claimInReview; incumbent live
 * listings are never auto-unpublished. Claimants never see each other's PII.
 */
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { buildAddressMatchKey } from '../utils/address-match-key';
import { sendEmail } from '../utils/resend';

export const OWNERSHIP_CLAIMS_COLLECTION = 'ownership_claims';

export const DEEPER_CHECK_DOC_TYPES = [
  'title_register',
  'title_plan',
  'deeds',
  'lease',
  'company_docs',
  'proof_of_address',
  'probate',
  'trust_deed',
  'joint_owners_consent',
] as const;

export type DeeperCheckDocType = (typeof DEEPER_CHECK_DOC_TYPES)[number];

export type ClaimCaseStatus =
  | 'open'
  | 'docs_requested'
  | 'accepted_claimant'
  | 'accepted_incumbent'
  | 'closed';

@Injectable()
export class OwnershipClaimsService {
  private readonly logger = new Logger(OwnershipClaimsService.name);

  private get db() {
    if (!admin.apps.length) return null;
    try {
      return admin.firestore();
    } catch {
      return null;
    }
  }

  computeMatchKey(propertyLike: {
    address?: string;
    postcode?: string;
    uprn?: string;
    city?: string;
  }): string {
    return buildAddressMatchKey(propertyLike);
  }

  /**
   * On create/update: if another landlord already has this key, open/reuse a case
   * and mark the newcomer property claimInReview. Never flips incumbent visibility.
   */
  async detectAndHoldNewcomer(opts: {
    propertyId: string;
    landlordId: string;
    address?: string;
    postcode?: string;
    city?: string;
    uprn?: string | null;
    ownerEmail?: string;
  }): Promise<{ claimInReview: boolean; claimCaseId?: string; addressMatchKey: string }> {
    const addressMatchKey = this.computeMatchKey({
      address: opts.address,
      postcode: opts.postcode,
      city: opts.city,
      uprn: opts.uprn || undefined,
    });
    const db = this.db;
    if (!db || !addressMatchKey || addressMatchKey.endsWith(':-:-:-')) {
      return { claimInReview: false, addressMatchKey };
    }

    const propsSnap = await db
      .collection('properties')
      .where('addressMatchKey', '==', addressMatchKey)
      .limit(25)
      .get();

    const others = propsSnap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .filter((p) => p.id !== opts.propertyId)
      .filter((p) => {
        const owner = String(p.landlordId || p.userId || '');
        return owner && owner !== opts.landlordId;
      });

    if (!others.length) {
      return { claimInReview: false, addressMatchKey };
    }

    const incumbent = others.find((p) => p.listingVisibility === 'public') || others[0];
    const caseId = await this.openOrReuseCase({
      addressMatchKey,
      addressDisplay: opts.address || incumbent.address || '',
      postcode: opts.postcode || incumbent.postcode || '',
      incumbentPropertyId: incumbent.id,
      incumbentLandlordId: String(incumbent.landlordId || incumbent.userId),
      claimantPropertyId: opts.propertyId,
      claimantLandlordId: opts.landlordId,
      claimantEmail: opts.ownerEmail,
    });

    await db.collection('properties').doc(opts.propertyId).set(
      {
        addressMatchKey,
        claimInReview: true,
        claimCaseId: caseId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return { claimInReview: true, claimCaseId: caseId, addressMatchKey };
  }

  private async openOrReuseCase(input: {
    addressMatchKey: string;
    addressDisplay: string;
    postcode: string;
    incumbentPropertyId: string;
    incumbentLandlordId: string;
    claimantPropertyId: string;
    claimantLandlordId: string;
    claimantEmail?: string;
  }): Promise<string> {
    const db = this.db!;
    const existing = await db
      .collection(OWNERSHIP_CLAIMS_COLLECTION)
      .where('claimantPropertyId', '==', input.claimantPropertyId)
      .limit(5)
      .get();
    const open = existing.docs.find((d) => {
      const st = String((d.data() as any)?.status || '');
      return st === 'open' || st === 'docs_requested';
    });
    if (open) return open.id;

    const ref = db.collection(OWNERSHIP_CLAIMS_COLLECTION).doc();
    await ref.set({
      id: ref.id,
      ...input,
      status: 'open' as ClaimCaseStatus,
      requestedDocs: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    void this.notifyClaimant(
      input.claimantEmail,
      'Your Proptii listing is on hold pending ownership checks',
      `We've detected another account already listing a matching address. Your listing stays private while we complete deeper ownership checks. Case ID: ${ref.id}`,
    );

    return ref.id;
  }

  /** Block publish for newcomer while claim is in review. */
  async assertCanPublish(propertyId: string): Promise<void> {
    const db = this.db;
    if (!db) return;
    const snap = await db.collection('properties').doc(propertyId).get();
    if (!snap.exists) return;
    const data = snap.data() as any;
    if (data?.claimInReview === true) {
      throw new BadRequestException({
        message: 'Publishing is on hold while an ownership claim is under review.',
        code: 'H4_CLAIM_IN_REVIEW',
        claimCaseId: data.claimCaseId || null,
      });
    }
  }

  /** Landlord-safe view — never includes the other claimant's identity. */
  async getMyCaseForProperty(landlordId: string, propertyId: string) {
    const db = this.db;
    if (!db) throw new NotFoundException('Case store unavailable');
    const prop = await db.collection('properties').doc(propertyId).get();
    if (!prop.exists) throw new NotFoundException('Property not found');
    const pdata = prop.data() as any;
    const owner = String(pdata.landlordId || pdata.userId || '');
    if (owner !== landlordId) throw new NotFoundException('Property not found');

    const caseId = pdata.claimCaseId;
    if (!caseId) {
      return {
        claimInReview: Boolean(pdata.claimInReview),
        status: pdata.claimInReview ? 'open' : null,
        requestedDocs: [] as string[],
        claimCaseId: null,
      };
    }

    const cSnap = await db.collection(OWNERSHIP_CLAIMS_COLLECTION).doc(caseId).get();
    if (!cSnap.exists) {
      return {
        claimInReview: Boolean(pdata.claimInReview),
        status: null,
        requestedDocs: [],
        claimCaseId: caseId,
      };
    }
    const c = cSnap.data() as any;
    const role =
      c.claimantLandlordId === landlordId
        ? 'claimant'
        : c.incumbentLandlordId === landlordId
          ? 'incumbent'
          : 'unknown';

    return {
      claimInReview: Boolean(pdata.claimInReview),
      claimCaseId: caseId,
      status: c.status as ClaimCaseStatus,
      requestedDocs: Array.isArray(c.requestedDocs) ? c.requestedDocs : [],
      role,
      // Intentionally omit other party's ids/emails/docs
    };
  }

  async listOpenCasesForStaff() {
    const db = this.db;
    if (!db) return [];
    // Avoid composite indexes: fetch recent cases and filter open statuses in memory.
    const snap = await db.collection(OWNERSHIP_CLAIMS_COLLECTION).limit(150).get();
    return snap.docs
      .map((d) => {
        const c = d.data() as any;
        return {
          id: d.id,
          addressDisplay: c.addressDisplay,
          postcode: c.postcode,
          status: c.status,
          requestedDocs: c.requestedDocs || [],
          incumbentPropertyId: c.incumbentPropertyId,
          claimantPropertyId: c.claimantPropertyId,
          createdAt: c.createdAt?.toDate?.()?.toISOString?.() || c.createdAt || null,
        };
      })
      .filter((c) => c.status === 'open' || c.status === 'docs_requested');
  }

  async requestDocuments(caseId: string, docs: string[], staffEmail: string) {
    const allowed = new Set<string>(DEEPER_CHECK_DOC_TYPES);
    const requestedDocs = [...new Set(docs.map((d) => String(d)))].filter((d) => allowed.has(d));
    if (!requestedDocs.length) {
      throw new BadRequestException('Select at least one allowed document type');
    }
    const db = this.db;
    if (!db) throw new NotFoundException('Case store unavailable');
    const ref = db.collection(OWNERSHIP_CLAIMS_COLLECTION).doc(caseId);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundException('Case not found');
    const c = snap.data() as any;
    await ref.update({
      requestedDocs,
      status: 'docs_requested',
      lastStaffEmail: staffEmail,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const claimant = await this.lookupUserEmail(c.claimantLandlordId);
    void this.notifyClaimant(
      claimant,
      'Additional ownership documents requested',
      `Staff have requested: ${requestedDocs.join(', ')}. Upload these from your property documents area. Case ID: ${caseId}`,
    );

    return { ok: true, requestedDocs };
  }

  async closeCase(
    caseId: string,
    outcome: 'accepted_claimant' | 'accepted_incumbent' | 'closed',
    note: string | undefined,
    staffEmail: string,
  ) {
    const db = this.db;
    if (!db) throw new NotFoundException('Case store unavailable');
    const ref = db.collection(OWNERSHIP_CLAIMS_COLLECTION).doc(caseId);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundException('Case not found');
    const c = snap.data() as any;

    await ref.update({
      status: outcome,
      outcomeNote: note || null,
      closedBy: staffEmail,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      closedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Incumbent live listing is never auto-unpublished.
    // accepted_claimant / closed → clear newcomer hold; accepted_incumbent → keep hold.
    if (c.claimantPropertyId) {
      const clearHold = outcome === 'accepted_claimant' || outcome === 'closed';
      await db.collection('properties').doc(c.claimantPropertyId).set(
        {
          claimInReview: !clearHold,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    const claimant = await this.lookupUserEmail(c.claimantLandlordId);
    void this.notifyClaimant(
      claimant,
      'Ownership claim update',
      `Your ownership claim case ${caseId} was updated to: ${outcome}.${note ? ` Note: ${note}` : ''}`,
    );

    return { ok: true, status: outcome };
  }

  private async lookupUserEmail(uid: string): Promise<string | undefined> {
    const db = this.db;
    if (!db || !uid) return undefined;
    try {
      const snap = await db.collection('users').doc(uid).get();
      return (snap.data() as any)?.email || undefined;
    } catch {
      return undefined;
    }
  }

  private async notifyClaimant(email: string | undefined, subject: string, body: string) {
    if (!email) return;
    try {
      await sendEmail({
        to: email,
        subject,
        html: `<p>${body}</p><p>This message does not include details of any other account.</p>`,
      });
    } catch (err: any) {
      this.logger.warn(`[H4] email failed: ${err?.message || err}`);
    }
  }
}
