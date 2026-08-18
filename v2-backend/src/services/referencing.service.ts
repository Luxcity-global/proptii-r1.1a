import { Injectable, NotFoundException, Logger } from '@nestjs/common';import * as admin from 'firebase-admin';
import { randomUUID } from 'crypto';
import { EmailService } from './email.service';

@Injectable()
export class ReferencingService {
  private readonly logger = new Logger(ReferencingService.name);

  constructor(private readonly emailService: EmailService) {}

  private get db() {
    if (!admin.apps.length) return null;
    try {
      return admin.firestore();
    } catch {
      return null;
    }
  }

  private get collection() {
    const db = this.db;
    return db ? db.collection('referencing') : null;
  }

  private get filesCollection() {
    const db = this.db;
    return db ? db.collection('referencing_files') : null;
  }

  private get chunksCollection() {
    const db = this.db;
    return db ? db.collection('referencing_chunks') : null;
  }

  /**
   * Recursively finds large strings (>800KB), chunks them into referencing_chunks,
   * and replaces them with a chunk marker.
   */
  private async storeLargeStrings(obj: any): Promise<any> {
    const CHUNK_SIZE = 800000;
    const col = this.chunksCollection;
    if (!col || !obj) return obj;

    if (Array.isArray(obj)) {
      return Promise.all(obj.map(item => this.storeLargeStrings(item)));
    }

    if (typeof obj === 'object' && obj.constructor === Object) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value === undefined) continue;

        if (typeof value === 'string' && value.length > CHUNK_SIZE && value.startsWith('data:')) {
          const groupId = `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const numChunks = Math.ceil(value.length / CHUNK_SIZE);
          const chunkPromises = [];
          for (let i = 0; i < numChunks; i++) {
            chunkPromises.push(
              col.doc(`${groupId}_${i}`).set({
                groupId,
                index: i,
                total: numChunks,
                data: value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
              })
            );
          }
          await Promise.all(chunkPromises);
          result[key] = `__CHUNKED__:${groupId}`;
        } else {
          result[key] = await this.storeLargeStrings(value);
        }
      }
      return result;
    }

    return obj;
  }

  /**
   * Recursively finds chunk markers and reconstructs the large strings from Firestore.
   */
  private async restoreLargeStrings(obj: any): Promise<any> {
    const col = this.chunksCollection;
    if (!col || !obj) return obj;

    if (Array.isArray(obj)) {
      return Promise.all(obj.map(item => this.restoreLargeStrings(item)));
    }

    if (typeof obj === 'object' && obj.constructor === Object) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value === undefined) continue;

        if (typeof value === 'string' && value.startsWith('__CHUNKED__:')) {
          const groupId = value.replace('__CHUNKED__:', '');
          const snapshot = await col.where('groupId', '==', groupId).get();
          if (!snapshot.empty) {
            const chunks = snapshot.docs.map(d => d.data());
            chunks.sort((a, b) => a.index - b.index);
            result[key] = chunks.map(c => c.data).join('');
          } else {
            result[key] = value;
          }
        } else {
          result[key] = await this.restoreLargeStrings(value);
        }
      }
      return result;
    }

    return obj;
  }

  async getFormData(userId: string) {
    const col = this.collection;
    if (!col) return {};

    try {
      const doc = await col.doc(userId).get();
      if (!doc.exists) {
        return {};
      }
      const data = doc.data() || {};
      return await this.restoreLargeStrings(data);
    } catch (err: any) {
      this.logger.warn(`Failed to get referencing data for ${userId}: ${err?.message || err}`);
      return {};
    }
  }

  async saveSectionData(userId: string, section: string, data: any) {
    const col = this.collection;
    const payload = {
      userId,
      [section]: data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!col) return payload;

    try {
      const safePayload = await this.storeLargeStrings(payload);
      await col.doc(userId).set(safePayload, { merge: true });
      return { success: true, section, data };
    } catch (err: any) {
      this.logger.warn(`Failed to save referencing section ${section}: ${err?.message || err}`);
      return { success: true, section, data };
    }
  }

  async saveFormData(formId: string, data: any) {
    const col = this.collection;
    if (!col) return { success: true };

    try {
      const payload = {
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      const safePayload = await this.storeLargeStrings(payload);
      await col.doc(formId).set(safePayload, { merge: true });
      return { success: true };
    } catch (err: any) {
      this.logger.warn(`Failed to save referencing form ${formId}: ${err?.message || err}`);
      return { success: false, error: err?.message };
    }
  }

  async submitApplication(userId: string, formData: any) {
    const col = this.collection;
    const payload = {
      userId,
      ...formData,
      status: 'submitted',
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!col) return payload;

    try {
      await col.doc(userId).set(payload, { merge: true });
      return { success: true, message: 'Application submitted successfully', status: 'submitted' };
    } catch (err: any) {
      this.logger.warn(`Failed to submit referencing application for ${userId}: ${err?.message || err}`);
      return { success: true, message: 'Application submitted successfully', status: 'submitted' };
    }
  }

  async getReferencingStatusByEmail(email: string) {
    const col = this.collection;
    if (!col) return { status: 'none' };

    try {
      const snapshot = await col.where('email', '==', email.toLowerCase().trim()).limit(1).get();
      if (snapshot.empty) return { status: 'none' };
      const data = snapshot.docs[0].data();
      return { status: data.status || 'draft', submissionId: snapshot.docs[0].id };
    } catch {
      return { status: 'none' };
    }
  }

  async getUserFiles(userId: string) {
    const col = this.filesCollection;
    if (!col) return [];

    try {
      const snapshot = await col.where('userId', '==', userId).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch {
      return [];
    }
  }

  async saveUserFile(userId: string, fileData: any) {
    const col = this.filesCollection;
    const docId = `${userId}_${Date.now()}`;
    const payload = {
      id: docId,
      userId,
      ...fileData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!col) return payload;

    try {
      await col.doc(docId).set(payload);
      return payload;
    } catch {
      return payload;
    }
  }

  async deleteUserFile(userId: string, fileId: string) {
    const col = this.filesCollection;
    if (!col) return { success: true };

    try {
      await col.doc(fileId).delete();
      return { success: true };
    } catch {
      return { success: true };
    }
  }

  private get sharesCollection() {
    const db = this.db;
    return db ? db.collection('referencing_shares') : null;
  }

  async shareReferencingPassport(userId: string, shareData: any) {
    const col = this.sharesCollection;
    const db = this.db;

    const shareId   = `share_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const viewToken  = randomUUID();
    const claimToken = randomUUID();
    const expiresAt  = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    const recipientEmail = (shareData.recipientEmail || '').toLowerCase().trim();

    // Resolve tenant's display name from users collection
    let tenantName = shareData.tenantName || '';
    let tenantEmail = shareData.tenantEmail || '';
    if (db && !tenantName) {
      try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const u = userDoc.data() as any;
          tenantName  = u.name || u.displayName || u.email || '';
          tenantEmail = u.email || '';
        }
      } catch { /* non-blocking */ }
    }

    // Check whether the recipient already has a Proptii account
    let hasAccount = false;
    if (db && recipientEmail) {
      try {
        const usersSnap = await db.collection('users')
          .where('email', '==', recipientEmail)
          .limit(1)
          .get();
        hasAccount = !usersSnap.empty;
      } catch { /* non-blocking — default to false (guest email) */ }
    }

    const payload = {
      id: shareId,
      userId,
      tenantName,
      tenantEmail,
      recipientName:  shareData.recipientName  || '',
      recipientEmail,
      recipientPhone: shareData.recipientPhone || '',
      recipientRole:  shareData.recipientRole  || 'agent',
      agencyName:     shareData.agencyName     || '',
      propertyAddress: shareData.propertyAddress || '',
      notes:           shareData.notes          || '',
      viewToken,
      claimToken,
      expiresAt,
      hasAccount,
      status:    'sent',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (col) {
      try {
        await col.doc(shareId).set(payload);
      } catch (err: any) {
        this.logger.warn(`Failed to save referencing share for ${userId}: ${err?.message || err}`);
      }
    }

    // Fire email notification asynchronously — never block the API response
    this.emailService.sendReferencingShareNotification({
      recipientEmail,
      recipientName:  shareData.recipientName || '',
      tenantName,
      propertyAddress: shareData.propertyAddress || '',
      notes:           shareData.notes || '',
      viewToken,
      claimToken,
      expiresAt,
      hasAccount,
    }).catch(err => {
      this.logger.error(`Referencing share email failed: ${err?.message || err}`);
    });

    const shareOut = { ...payload, id: shareId, createdAt: new Date().toISOString() };
    return { success: true, share: shareOut, viewToken, claimToken, expiresAt };
  }

  // ── Public passport lookup by viewToken ──────────────────────────────────

  async getPublicPassportByToken(viewToken: string) {
    const col = this.sharesCollection;
    if (!col) return null;

    try {
      const snap = await col.where('viewToken', '==', viewToken).limit(1).get();
      if (snap.empty) return null;

      const shareDoc  = snap.docs[0];
      const shareData = shareDoc.data() as any;

      // Check expiry
      if (shareData.expiresAt && new Date(shareData.expiresAt) < new Date()) {
        return { expired: true };
      }

      // Mark as viewed (fire-and-forget)
      if (shareData.status === 'sent') {
        shareDoc.ref.set({ status: 'viewed', updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true }).catch(() => {});
      }

      // Fetch the tenant's form data — strip base64 blobs to keep payload small
      const formData = await this.getFormData(shareData.userId).catch(() => ({})) as any;
      const safeFormData = this.stripBlobs(formData);

      return {
        expired: false,
        share: {
          id: shareDoc.id,
          tenantName:     shareData.tenantName,
          recipientName:  shareData.recipientName,
          propertyAddress: shareData.propertyAddress,
          notes:          shareData.notes,
          status:         shareData.status === 'sent' ? 'viewed' : shareData.status,
          expiresAt:      shareData.expiresAt,
          claimToken:     shareData.claimToken,
        },
        formData: safeFormData,
      };
    } catch (err: any) {
      this.logger.warn(`getPublicPassportByToken error: ${err?.message || err}`);
      return null;
    }
  }

  /** Recursively strip out base64 data: strings so the public endpoint stays lean */
  private stripBlobs(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(i => this.stripBlobs(i));
    const out: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string' && v.startsWith('data:')) {
        out[k] = '[document uploaded]';
      } else {
        out[k] = this.stripBlobs(v);
      }
    }
    return out;
  }

  // ── Claim token validation (pre-signup, public) ──────────────────────────

  async validateClaimToken(claimToken: string) {
    const col = this.sharesCollection;
    if (!col) return { valid: false };
    try {
      const snap = await col.where('claimToken', '==', claimToken).limit(1).get();
      if (snap.empty) return { valid: false };
      const d = snap.docs[0].data() as any;
      if (d.expiresAt && new Date(d.expiresAt) < new Date()) return { valid: false, expired: true };
      if (d.claimedBy) return { valid: false, alreadyClaimed: true };
      return {
        valid: true,
        tenantName:     d.tenantName     || '',
        recipientName:  d.recipientName  || '',
        propertyAddress: d.propertyAddress || '',
        expiresAt:      d.expiresAt      || '',
        shareId:        snap.docs[0].id,
      };
    } catch (err: any) {
      this.logger.warn(`validateClaimToken error: ${err?.message || err}`);
      return { valid: false };
    }
  }

  // ── Claim the share (post-signup, authenticated landlord) ─────────────────

  async claimShare(claimToken: string, landlordId: string, landlordEmail: string) {
    const col = this.sharesCollection;
    const db  = this.db;
    if (!col || !db) return { success: false, error: 'Service unavailable' };

    try {
      const snap = await col.where('claimToken', '==', claimToken).limit(1).get();
      if (snap.empty) return { success: false, error: 'Invalid claim token' };

      const shareDoc  = snap.docs[0];
      const shareData = shareDoc.data() as any;

      if (shareData.expiresAt && new Date(shareData.expiresAt) < new Date()) {
        return { success: false, error: 'This invitation has expired' };
      }
      if (shareData.claimedBy) return { success: false, error: 'Already claimed' };

      // Mark share claimed
      await shareDoc.ref.set({
        claimedBy:    landlordId,
        claimedEmail: landlordEmail,
        status:       'claimed',
        claimedAt:    admin.firestore.FieldValue.serverTimestamp(),
        updatedAt:    admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      // Set landlord role if not already set
      await db.collection('users').doc(landlordId).set({
        uid:   landlordId,
        email: landlordEmail,
        role:  'landlord',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      // Get-or-create a conversation so the landlord lands in their inbox
      const tenantId      = shareData.userId;
      const propertyTitle = shareData.propertyAddress || 'Rental Application';
      let conversationId  = '';

      const convCol = db.collection('conversations');
      const existing = await convCol
        .where('tenantId',   '==', tenantId)
        .where('landlordId', '==', landlordId)
        .limit(1)
        .get();

      if (!existing.empty) {
        conversationId = existing.docs[0].id;
      } else {
        conversationId = randomUUID();
        await convCol.doc(conversationId).set({
          id:            conversationId,
          tenantId,
          landlordId,
          propertyTitle,
          tenantName:    shareData.tenantName  || '',
          createdAt:     new Date().toISOString(),
          updatedAt:     new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
          isDeleted:     false,
          fromReferencing: true,
        });
      }

      return {
        success: true,
        conversationId,
        tenantName:     shareData.tenantName || '',
        propertyAddress: shareData.propertyAddress || '',
      };
    } catch (err: any) {
      this.logger.warn(`claimShare error: ${err?.message || err}`);
      return { success: false, error: err?.message || 'Failed to claim share' };
    }
  }

  async getReferencingShares(userId: string) {    const col = this.sharesCollection;
    if (!col) return { success: true, data: [] };

    try {
      const snapshot = await col.where('userId', '==', userId).get();
      const shares = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt || new Date().toISOString(),
        };
      });
      return { success: true, data: shares };
    } catch (err: any) {
      this.logger.warn(`Failed to fetch referencing shares for ${userId}: ${err?.message || err}`);
      return { success: true, data: [] };
    }
  }

  async deleteReferencingShare(userId: string, shareId: string) {
    const col = this.sharesCollection;
    if (!col) return { success: true };

    try {
      await col.doc(shareId).delete();
      return { success: true };
    } catch (err: any) {
      this.logger.warn(`Failed to delete referencing share ${shareId}: ${err?.message || err}`);
      return { success: true };
    }
  }

  /** Returns all referencing passports shared WITH a given email address (landlord inbox) */
  async getReceivedReferencings(recipientEmail: string) {
    const col = this.sharesCollection;
    if (!col || !recipientEmail) return { success: true, data: [] };

    try {
      const snap = await col
        .where('recipientEmail', '==', recipientEmail.toLowerCase().trim())
        .get();

      const shares = snap.docs.map(doc => {
        const d = doc.data() as any;
        return {
          id:              doc.id,
          tenantName:      d.tenantName      || '',
          tenantEmail:     d.tenantEmail     || '',
          propertyAddress: d.propertyAddress || '',
          notes:           d.notes           || '',
          recipientRole:   d.recipientRole   || 'landlord',
          status:          d.status          || 'sent',
          viewToken:       d.viewToken       || '',
          claimToken:      d.claimToken      || '',
          expiresAt:       d.expiresAt       || '',
          claimedBy:       d.claimedBy       || null,
          createdAt:       d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt || new Date().toISOString(),
        };
      });

      return { success: true, data: shares.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) };
    } catch (err: any) {
      this.logger.warn(`getReceivedReferencings error for ${recipientEmail}: ${err?.message || err}`);
      return { success: true, data: [] };
    }
  }
}
