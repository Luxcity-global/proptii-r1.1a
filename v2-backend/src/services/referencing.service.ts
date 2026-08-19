import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { randomUUID } from 'crypto';
import { EmailService } from './email.service';
import {
  uploadBase64ToStorage,
  uploadBufferToStorage,
  deleteFromStorage,
  isBase64DataUri,
} from '../utils/firebase-storage';

// ─── File field names per section ────────────────────────────────────────────
// These are the keys inside each section payload that may contain a base64
// data URI. When found they are lifted out, uploaded to Firebase Storage,
// and replaced with a { url, storagePath, contentType, size } object so
// Firestore only ever stores small metadata, never raw bytes.

const SECTION_FILE_FIELDS: Record<string, string[]> = {
  identity:    ['identityProof'],
  employment:  ['proofDocument'],
  residential: ['proofDocument'],
  financial:   ['proofOfIncomeDocument'],
  guarantor:   ['identityDocument'],
  creditCheck: ['additionalDocument'],
};

@Injectable()
export class ReferencingService {
  private readonly logger = new Logger(ReferencingService.name);

  constructor(private readonly emailService: EmailService) {}

  // ── Firestore helpers ──────────────────────────────────────────────────────

  private get db() {
    if (!admin.apps.length) return null;
    try { return admin.firestore(); } catch { return null; }
  }

  private get collection() {
    const db = this.db;
    return db ? db.collection('referencing') : null;
  }

  private get filesCollection() {
    const db = this.db;
    return db ? db.collection('referencing_files') : null;
  }

  private get sharesCollection() {
    const db = this.db;
    return db ? db.collection('referencing_shares') : null;
  }

  // ── Storage helpers ────────────────────────────────────────────────────────

  /**
   * Scans a section data object for base64 data URI values, uploads each one
   * to Firebase Storage, and replaces the raw bytes with a small metadata
   * object: { url, storagePath, contentType, size }.
   *
   * Storage path pattern: referencing/{userId}/{section}/{fieldName}/{uuid}.{ext}
   */
  private async uploadSectionFiles(
    userId: string,
    section: string,
    data: Record<string, any>,
  ): Promise<Record<string, any>> {
    const fields = SECTION_FILE_FIELDS[section] ?? [];
    if (!fields.length) return data;

    const result = { ...data };

    for (const field of fields) {
      const value = result[field];
      if (!isBase64DataUri(value)) continue;

      try {
        const ext = value.split(';')[0].split('/')[1] || 'bin';
        const storagePath = `referencing/${userId}/${section}/${field}/${randomUUID()}.${ext}`;
        const uploaded = await uploadBase64ToStorage(value, storagePath);

        // Replace raw base64 with small metadata object
        result[field] = {
          url:         uploaded.downloadUrl,
          storagePath: uploaded.storagePath,
          contentType: uploaded.contentType,
          size:        uploaded.size,
        };
      } catch (err: any) {
        this.logger.error(
          `Failed to upload ${section}.${field} for user ${userId}: ${err?.message || err}`,
        );
        // Remove the raw bytes rather than letting them hit Firestore
        delete result[field];
      }
    }

    return result;
  }

  /**
   * Recursively scan any object for leftover base64 data URIs and remove them.
   * Acts as a safety net so nothing large ever reaches Firestore even if a new
   * field is added without being listed in SECTION_FILE_FIELDS.
   */
  private stripRawBase64(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(i => this.stripRawBase64(i));
    const out: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined) continue;
      if (isBase64DataUri(v)) {
        this.logger.warn(`Stripping unexpected base64 field "${k}" before Firestore write`);
        // Keep a placeholder so the client knows a file was present
        out[k] = '[file removed — re-upload required]';
      } else {
        out[k] = this.stripRawBase64(v);
      }
    }
    return out;
  }

  /** Strip base64 blobs for public-facing responses (passport view). */
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

  // ── Form data ──────────────────────────────────────────────────────────────

  async getFormData(userId: string) {
    const col = this.collection;
    if (!col) return {};
    try {
      const doc = await col.doc(userId).get();
      return doc.exists ? (doc.data() || {}) : {};
    } catch (err: any) {
      this.logger.warn(`getFormData failed for ${userId}: ${err?.message || err}`);
      return {};
    }
  }

  async saveSectionData(userId: string, section: string, data: any) {
    const col = this.collection;

    // 1. Upload any base64 files to Firebase Storage → replace with metadata
    const sectionWithUrls = await this.uploadSectionFiles(userId, section, data ?? {});

    // 2. Strip any remaining raw base64 (safety net)
    const safeSection = this.stripRawBase64(sectionWithUrls);

    const payload = {
      userId,
      [section]: safeSection,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!col) return { success: true, section, data: safeSection };

    try {
      await col.doc(userId).set(payload, { merge: true });
      return { success: true, section, data: safeSection };
    } catch (err: any) {
      this.logger.warn(`saveSectionData failed for ${section}/${userId}: ${err?.message || err}`);
      return { success: true, section, data: safeSection };
    }
  }

  async saveFormData(formId: string, data: any) {
    const col = this.collection;
    if (!col) return { success: true };

    try {
      // Upload files for every section present in the payload
      const safeData: any = {};
      for (const [key, value] of Object.entries(data ?? {})) {
        if (value && typeof value === 'object' && SECTION_FILE_FIELDS[key]) {
          safeData[key] = await this.uploadSectionFiles(formId, key, value as any);
          safeData[key] = this.stripRawBase64(safeData[key]);
        } else {
          safeData[key] = this.stripRawBase64(value);
        }
      }

      const payload = {
        ...safeData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await col.doc(formId).set(payload, { merge: true });
      return { success: true };
    } catch (err: any) {
      this.logger.warn(`saveFormData failed for ${formId}: ${err?.message || err}`);
      return { success: false, error: err?.message };
    }
  }

  async submitApplication(userId: string, formData: any) {
    const col = this.collection;

    // Run file uploads for any sections bundled in the submit payload
    const safeFormData: any = {};
    for (const [key, value] of Object.entries(formData ?? {})) {
      if (value && typeof value === 'object' && SECTION_FILE_FIELDS[key]) {
        safeFormData[key] = await this.uploadSectionFiles(userId, key, value as any);
        safeFormData[key] = this.stripRawBase64(safeFormData[key]);
      } else {
        safeFormData[key] = this.stripRawBase64(value);
      }
    }

    const payload = {
      userId,
      ...safeFormData,
      status: 'submitted',
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt:   admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!col) return { success: true, message: 'Application submitted successfully', status: 'submitted' };

    try {
      await col.doc(userId).set(payload, { merge: true });
      return { success: true, message: 'Application submitted successfully', status: 'submitted' };
    } catch (err: any) {
      this.logger.warn(`submitApplication failed for ${userId}: ${err?.message || err}`);
      return { success: true, message: 'Application submitted successfully', status: 'submitted' };
    }
  }

  async getReferencingStatusByEmail(email: string) {
    const col = this.collection;
    if (!col) return { status: 'none' };
    try {
      const snapshot = await col
        .where('email', '==', email.toLowerCase().trim())
        .limit(1)
        .get();
      if (snapshot.empty) return { status: 'none' };
      const data = snapshot.docs[0].data();
      return { status: data.status || 'draft', submissionId: snapshot.docs[0].id };
    } catch {
      return { status: 'none' };
    }
  }

  // ── File records (metadata only — bytes live in Firebase Storage) ──────────

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

  /**
   * Save a file record. Accepts either:
   *   a) { base64: '<data URI>', section, field, fileName } — uploads to Storage first
   *   b) { url, storagePath, contentType, size, section, field } — already uploaded
   */
  async saveUserFile(userId: string, fileData: any) {
    const col = this.filesCollection;
    const docId = `${userId}_${Date.now()}`;

    let storageResult: any = null;

    // Case (a): raw base64 sent directly to this endpoint
    if (isBase64DataUri(fileData.base64 || fileData.fileData || fileData.content)) {
      const raw = fileData.base64 || fileData.fileData || fileData.content;
      const section  = fileData.section  || 'general';
      const field    = fileData.field    || 'document';
      const ext      = raw.split(';')[0].split('/')[1] || 'bin';
      const storagePath = `referencing/${userId}/${section}/${field}/${randomUUID()}.${ext}`;

      try {
        storageResult = await uploadBase64ToStorage(raw, storagePath);
      } catch (err: any) {
        this.logger.error(`saveUserFile upload failed for ${userId}: ${err?.message || err}`);
      }
    }

    // Build the Firestore metadata record — never store raw bytes
    const payload: any = {
      id: docId,
      userId,
      section:     fileData.section     || 'general',
      field:       fileData.field       || 'document',
      fileName:    fileData.fileName    || fileData.name || 'document',
      contentType: fileData.contentType || fileData.mimeType || storageResult?.contentType || 'application/octet-stream',
      size:        fileData.size        || storageResult?.size || 0,
      url:         storageResult?.downloadUrl || fileData.url || '',
      storagePath: storageResult?.storagePath || fileData.storagePath || '',
      createdAt:   admin.firestore.FieldValue.serverTimestamp(),
    };

    if (col) {
      try {
        await col.doc(docId).set(payload);
      } catch (err: any) {
        this.logger.warn(`saveUserFile Firestore write failed: ${err?.message || err}`);
      }
    }

    return { ...payload, id: docId };
  }

  async deleteUserFile(userId: string, fileId: string) {
    const col = this.filesCollection;
    if (!col) return { success: true };

    try {
      // Fetch the record first so we can delete from Storage too
      const doc = await col.doc(fileId).get();
      if (doc.exists) {
        const data = doc.data() as any;
        if (data?.storagePath) {
          await deleteFromStorage(data.storagePath);
        }
      }
      await col.doc(fileId).delete();
      return { success: true };
    } catch (err: any) {
      this.logger.warn(`deleteUserFile failed for ${fileId}: ${err?.message || err}`);
      return { success: true };
    }
  }

  /**
   * Generate a fresh signed download URL for a stored file.
   * The URL stored in Firestore expires after 7 days — callers should use
   * this endpoint whenever they need to present a download/view link.
   */
  async refreshFileDownloadUrl(userId: string, fileId: string) {
    const col = this.filesCollection;
    if (!col) return { success: false, error: 'Service unavailable' };

    try {
      const doc = await col.doc(fileId).get();
      if (!doc.exists) return { success: false, error: 'File not found' };

      const data = doc.data() as any;
      if (!data?.storagePath) return { success: false, error: 'No storage path on record' };

      const { getSignedDownloadUrl } = await import('../utils/firebase-storage');
      const url = await getSignedDownloadUrl(data.storagePath);

      // Update the cached URL in Firestore so short-lived fetches stay fresh
      await col.doc(fileId).set({ url }, { merge: true });

      return { success: true, url, fileName: data.fileName, contentType: data.contentType };
    } catch (err: any) {
      this.logger.warn(`refreshFileDownloadUrl failed for ${fileId}: ${err?.message || err}`);
      return { success: false, error: err?.message || 'Failed to generate URL' };
    }
  }

  // ── Passport sharing ───────────────────────────────────────────────────────

  async shareReferencingPassport(userId: string, shareData: any) {
    const col = this.sharesCollection;
    const db  = this.db;

    const shareId    = `share_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const viewToken  = randomUUID();
    const claimToken = randomUUID();
    const expiresAt  = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const recipientEmail = (shareData.recipientEmail || '').toLowerCase().trim();

    let tenantName  = shareData.tenantName  || '';
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

    let hasAccount = false;
    if (db && recipientEmail) {
      try {
        const snap = await db.collection('users')
          .where('email', '==', recipientEmail)
          .limit(1)
          .get();
        hasAccount = !snap.empty;
      } catch { /* non-blocking */ }
    }

    const payload = {
      id: shareId,
      userId,
      tenantName,
      tenantEmail,
      recipientName:   shareData.recipientName   || '',
      recipientEmail,
      recipientPhone:  shareData.recipientPhone  || '',
      recipientRole:   shareData.recipientRole   || 'agent',
      agencyName:      shareData.agencyName      || '',
      propertyAddress: shareData.propertyAddress || '',
      notes:           shareData.notes           || '',
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
        this.logger.warn(`shareReferencingPassport Firestore write failed: ${err?.message || err}`);
      }
    }

    this.emailService.sendReferencingShareNotification({
      recipientEmail,
      recipientName:   shareData.recipientName   || '',
      tenantName,
      propertyAddress: shareData.propertyAddress || '',
      notes:           shareData.notes           || '',
      viewToken,
      claimToken,
      expiresAt,
      hasAccount,
    }).catch(err => {
      this.logger.error(`Referencing share email failed: ${err?.message || err}`);
    });

    return {
      success: true,
      share:   { ...payload, id: shareId, createdAt: new Date().toISOString() },
      viewToken,
      claimToken,
      expiresAt,
    };
  }

  async getPublicPassportByToken(viewToken: string) {
    const col = this.sharesCollection;
    if (!col) return null;

    try {
      const snap = await col.where('viewToken', '==', viewToken).limit(1).get();
      if (snap.empty) return null;

      const shareDoc  = snap.docs[0];
      const shareData = shareDoc.data() as any;

      if (shareData.expiresAt && new Date(shareData.expiresAt) < new Date()) {
        return { expired: true };
      }

      if (shareData.status === 'sent') {
        shareDoc.ref
          .set({ status: 'viewed', updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
          .catch(() => {});
      }

      const formData     = await this.getFormData(shareData.userId).catch(() => ({})) as any;
      const safeFormData = this.stripBlobs(formData);

      return {
        expired: false,
        share: {
          id:              shareDoc.id,
          tenantName:      shareData.tenantName,
          recipientName:   shareData.recipientName,
          propertyAddress: shareData.propertyAddress,
          notes:           shareData.notes,
          status:          shareData.status === 'sent' ? 'viewed' : shareData.status,
          expiresAt:       shareData.expiresAt,
          claimToken:      shareData.claimToken,
        },
        formData: safeFormData,
      };
    } catch (err: any) {
      this.logger.warn(`getPublicPassportByToken error: ${err?.message || err}`);
      return null;
    }
  }

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
        valid:           true,
        tenantName:      d.tenantName      || '',
        recipientName:   d.recipientName   || '',
        propertyAddress: d.propertyAddress || '',
        expiresAt:       d.expiresAt       || '',
        shareId:         snap.docs[0].id,
      };
    } catch (err: any) {
      this.logger.warn(`validateClaimToken error: ${err?.message || err}`);
      return { valid: false };
    }
  }

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

      await shareDoc.ref.set({
        claimedBy:    landlordId,
        claimedEmail: landlordEmail,
        status:       'claimed',
        claimedAt:    admin.firestore.FieldValue.serverTimestamp(),
        updatedAt:    admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      await db.collection('users').doc(landlordId).set({
        uid:       landlordId,
        email:     landlordEmail,
        role:      'landlord',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      const tenantId      = shareData.userId;
      const propertyTitle = shareData.propertyAddress || 'Rental Application';
      let conversationId  = '';

      const convCol  = db.collection('conversations');
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
          id:              conversationId,
          tenantId,
          landlordId,
          propertyTitle,
          tenantName:      shareData.tenantName || '',
          createdAt:       new Date().toISOString(),
          updatedAt:       new Date().toISOString(),
          lastMessageAt:   new Date().toISOString(),
          isDeleted:       false,
          fromReferencing: true,
        });
      }

      return {
        success:         true,
        conversationId,
        tenantName:      shareData.tenantName      || '',
        propertyAddress: shareData.propertyAddress || '',
      };
    } catch (err: any) {
      this.logger.warn(`claimShare error: ${err?.message || err}`);
      return { success: false, error: err?.message || 'Failed to claim share' };
    }
  }

  async getReferencingShares(userId: string) {
    const col = this.sharesCollection;
    if (!col) return { success: true, data: [] };
    try {
      const snapshot = await col.where('userId', '==', userId).get();
      const shares = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          createdAt: (d.createdAt as any)?.toDate
            ? (d.createdAt as any).toDate().toISOString()
            : d.createdAt || new Date().toISOString(),
        };
      });
      return { success: true, data: shares };
    } catch (err: any) {
      this.logger.warn(`getReferencingShares failed for ${userId}: ${err?.message || err}`);
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
      this.logger.warn(`deleteReferencingShare failed for ${shareId}: ${err?.message || err}`);
      return { success: true };
    }
  }

  // ── Referencing request (landlord → tenant) ───────────────────────────────

  /**
   * Sends an email to a tenant asking them to complete their Proptii
   * referencing form. The email contains a direct link to /referencing.
   * Persists a lightweight request record in `referencing_requests` so
   * landlords can see what they've already sent.
   */
  async sendReferencingRequest(payload: {
    tenantEmail:     string;
    tenantName:      string;
    propertyAddress: string;
    landlordName:    string;
    landlordId:      string;
  }) {
    const { tenantEmail, tenantName, propertyAddress, landlordName, landlordId } = payload;

    if (!tenantEmail) {
      return { success: false, error: 'tenantEmail is required' };
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://proptii.co';
    const referencingUrl = `${frontendUrl}/referencing`;

    // Persist the request record (best-effort — never blocks the email)
    const db = this.db;
    if (db) {
      const reqId = `req_${landlordId}_${Date.now()}`;
      db.collection('referencing_requests').doc(reqId).set({
        id:              reqId,
        landlordId,
        landlordName,
        tenantEmail:     tenantEmail.toLowerCase().trim(),
        tenantName,
        propertyAddress,
        status:          'sent',
        createdAt:       admin.firestore.FieldValue.serverTimestamp(),
      }).catch(err => {
        this.logger.warn(`Failed to save referencing request record: ${err?.message}`);
      });
    }

    // Build and send email via Resend
    const addressLine = propertyAddress
      ? `<p style="margin:0 0 16px;">They are requesting your referencing details in connection with the property at <strong>${propertyAddress}</strong>.</p>`
      : '';

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#136C9E,#0D4E73);padding:28px 32px;">
          <img src="${frontendUrl}/images/proptii-logo.png" alt="Proptii" style="height:32px;margin-bottom:12px;" onerror="this.style.display='none'"/>
          <h1 style="color:#fff;margin:0;font-size:20px;">Referencing Request</h1>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 16px;">Hello ${tenantName},</p>
          <p style="margin:0 0 16px;">
            <strong>${landlordName}</strong> has asked you to complete your referencing on Proptii.
          </p>
          ${addressLine}
          <p style="margin:0 0 24px;">
            Proptii referencing is quick to complete. Fill it in once and share it with as many landlords or agents as you need — no re-filling required.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${referencingUrl}"
               style="background:#136C9E;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;display:inline-block;">
              Complete My Referencing
            </a>
          </div>
          <p style="font-size:13px;color:#6b7280;">
            If the button doesn't work, copy this link into your browser:<br/>
            <a href="${referencingUrl}" style="color:#136C9E;">${referencingUrl}</a>
          </p>
          <hr style="border:1px solid #e5e7eb;margin:24px 0;"/>
          <p style="font-size:12px;color:#9ca3af;">
            This request was sent via Proptii on behalf of ${landlordName}.
            If you did not expect this email you can safely ignore it.
          </p>
        </div>
      </div>
    `;

    try {
      const { sendEmail } = await import('../utils/resend');
      const id = await sendEmail({
        to:      tenantEmail,
        subject: `${landlordName} has requested your referencing on Proptii`,
        html,
      });
      this.logger.log(`Referencing request email sent to ${tenantEmail} [${id}]`);
      return { success: true, message: 'Referencing request sent successfully' };
    } catch (err: any) {
      this.logger.error(`sendReferencingRequest email failed for ${tenantEmail}: ${err?.message || err}`);
      return { success: false, error: err?.message || 'Failed to send email' };
    }
  }

  async getReceivedReferencings(recipientEmail: string) {    const col = this.sharesCollection;
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
          createdAt:       d.createdAt?.toDate
            ? d.createdAt.toDate().toISOString()
            : d.createdAt || new Date().toISOString(),
        };
      });

      return {
        success: true,
        data: shares.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      };
    } catch (err: any) {
      this.logger.warn(`getReceivedReferencings error for ${recipientEmail}: ${err?.message || err}`);
      return { success: true, data: [] };
    }
  }
}
