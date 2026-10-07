import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { randomUUID } from 'crypto';
import {
  getSignedDownloadUrl,
  isBase64DataUri,
  uploadBase64ToStorage,
  uploadBufferToStorage,
} from '../utils/firebase-storage';

function withTimeout<T>(promise: Promise<T>, timeoutMs = 15000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore operation timed out')), timeoutMs),
    ),
  ]);
}

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);

  private get db() {
    if (!admin.apps.length) return null;
    try {
      return admin.firestore();
    } catch {
      return null;
    }
  }

  private get contractsCol() {
    const db = this.db;
    return db ? db.collection('contracts') : null;
  }

  private get templatesCol() {
    const db = this.db;
    return db ? db.collection('contractTemplates') : null;
  }

  private normalizedEmail(...values: unknown[]): string {
    for (const value of values) {
      if (typeof value !== 'string') continue;
      const email = value.trim().toLowerCase();
      if (email.includes('@')) return email;
    }
    return '';
  }

  private emailCandidates(email: string): string[] {
    const raw = (email || '').trim();
    const lower = raw.toLowerCase();
    return [...new Set([lower, raw].filter((value) => value.includes('@')))];
  }

  private async collectEmails(email: string, userId?: string): Promise<Set<string>> {
    const emails = new Set<string>(this.emailCandidates(email));
    const db = this.db;
    if (!db || !userId) return emails;

    try {
      const userDoc = await db.collection('users').doc(userId).get();
      const profileEmail = this.normalizedEmail(userDoc.exists ? (userDoc.data() as any)?.email : '');
      if (profileEmail) emails.add(profileEmail);
    } catch { /* profile lookup is optional */ }

    try {
      if (admin.apps.length) {
        const record = await admin.auth().getUser(userId);
        const authEmail = this.normalizedEmail(
          record.email,
          record.providerData?.map((provider) => provider.email).find(Boolean),
        );
        if (authEmail) emails.add(authEmail);
      }
    } catch { /* mock users have no auth record */ }

    return emails;
  }

  private toDate(value: any): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value?.toDate === 'function') {
      const date = value.toDate();
      if (date instanceof Date && !Number.isNaN(date.getTime())) return date;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  /** Preview links use fileUrl. Older rows kept the PDF inline and left fileUrl as "#". */
  private presentContract(id: string, data: any) {
    const storedUrl = data.fileUrl || data.documentUrl || '';
    let fileUrl = storedUrl && storedUrl !== '#' ? storedUrl : '';
    if (!fileUrl && typeof data.fileBase64 === 'string' && data.fileBase64.length > 0) {
      fileUrl = data.fileBase64.startsWith('data:')
        ? data.fileBase64
        : `data:${data.documentType || 'application/pdf'};base64,${data.fileBase64}`;
    }
    return {
      id,
      title: data.title || data.contractName || data.templateName || 'Contract',
      contractName: data.contractName || data.title || data.templateName || 'Contract',
      fileName: data.fileName || data.documentName || 'contract.pdf',
      documentName: data.documentName || data.fileName || data.title || 'contract.pdf',
      fileUrl: fileUrl || data.documentUrl || '',
      documentUrl: data.documentUrl || fileUrl || '',
      storagePath: data.storagePath || '',
      propertyAddress: data.propertyAddress || '',
      propertyName: data.propertyName || '',
      propertyId: data.propertyId || '',
      tenantName: data.tenantName || '',
      tenantEmail: data.tenantEmail || '',
      landlordId: data.landlordId || '',
      landlordEmail: data.landlordEmail || '',
      userId: data.userId || '',
      agentName: data.agentName || data.landlordEmail || '',
      agentEmail: data.agentEmail || data.landlordEmail || '',
      status: data.status || 'sent',
      signedBy: data.signedBy || '',
      contractType: data.contractType || 'tenancy-agreement',
      additionalInfo: data.additionalInfo || '',
      templateId: data.templateId || '',
      sentDate: this.toDate(data.sentDate) || this.toDate(data.createdAt) || new Date(),
      signedDate: this.toDate(data.signedDate),
      expiryDate: this.toDate(data.expiryDate),
      createdAt: this.toDate(data.createdAt),
      updatedAt: this.toDate(data.updatedAt),
      emailSent: data.emailSent || false,
      documentSize: data.documentSize || 0,
      documentType: data.documentType || 'application/pdf',
    };
  }

  private async rememberQuery(
    col: admin.firestore.CollectionReference,
    field: string,
    value: string,
    into: Map<string, any>,
  ) {
    if (!value) return;
    try {
      const snap = await withTimeout(col.where(field, '==', value).get());
      snap.docs.forEach((doc) => into.set(doc.id, doc));
    } catch (err: any) {
      this.logger.warn(`contract query ${field} failed: ${err?.message || err}`);
    }
  }

  /**
   * Store the PDF in Cloud Storage. Firestore only keeps the URL.
   * A small inline copy is kept only when storage is unavailable, so the
   * record itself still saves.
   */
  private async storeContractDocument(
    ownerId: string,
    file?: { buffer?: Buffer; mimetype?: string },
    base64?: string | null,
  ): Promise<{ fileUrl: string; storagePath: string; inlineBase64: string | null }> {
    const inline = (value?: string | null) => {
      const MAX = 700_000;
      if (!value || value.length > MAX) return { fileUrl: '', storagePath: '', inlineBase64: null as string | null };
      const fileUrl = value.startsWith('data:')
        ? value
        : `data:application/pdf;base64,${value}`;
      return { fileUrl, storagePath: '', inlineBase64: value };
    };

    const hasFile = Boolean(file?.buffer?.length);
    const hasBase64 = typeof base64 === 'string' && base64.length > 20;
    if (!hasFile && !hasBase64) return { fileUrl: '', storagePath: '', inlineBase64: null };
    if (!admin.apps.length) return inline(base64 || null);

    try {
      const storagePath = `contracts/${ownerId || 'shared'}/${randomUUID()}.pdf`;
      if (hasFile) {
        const uploaded = await uploadBufferToStorage(file!.buffer!, storagePath, file?.mimetype || 'application/pdf');
        return { fileUrl: uploaded.downloadUrl, storagePath: uploaded.storagePath, inlineBase64: null };
      }
      if (isBase64DataUri(base64)) {
        const uploaded = await uploadBase64ToStorage(base64 as string, storagePath);
        return { fileUrl: uploaded.downloadUrl, storagePath: uploaded.storagePath, inlineBase64: null };
      }
      const uploaded = await uploadBufferToStorage(Buffer.from(base64 as string, 'base64'), storagePath, 'application/pdf');
      return { fileUrl: uploaded.downloadUrl, storagePath: uploaded.storagePath, inlineBase64: null };
    } catch (err: any) {
      this.logger.warn(`contract file upload failed: ${err?.message || err}`);
      return inline(base64 || null);
    }
  }

  async getContracts(tenantEmail: string, userId?: string) {
    const col = this.contractsCol;
    if (!col) return { success: true, data: [] };

    try {
      const emails = await this.collectEmails(tenantEmail, userId);
      const byId = new Map<string, any>();
      for (const email of emails) {
        await this.rememberQuery(col, 'tenantEmail', email, byId);
      }
      if (userId) await this.rememberQuery(col, 'userId', userId, byId);

      const data = [...byId.values()].map((doc) => this.presentContract(doc.id, doc.data()));
      const ids = new Set(data.map((contract) => contract.id));
      const visible = data.filter((contract) => !contract.templateId || contract.templateId === 'template-id' || !ids.has(contract.templateId));
      visible.sort((a, b) => (b.sentDate?.getTime?.() || 0) - (a.sentDate?.getTime?.() || 0));
      return { success: true, data: visible };
    } catch (error: any) {
      this.logger.warn(`Error getting contracts: ${error?.message || error}`);
      return { success: true, data: [] };
    }
  }

  async saveTemplate(userId: string, body: any) {
    const col = this.templatesCol;
    const templateId = `${userId}_${Date.now()}`;
    const payload = {
      id: templateId,
      userId,
      ...body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!col) return { success: true, templateId };

    try {
      await withTimeout(col.doc(templateId).set(payload));
      return { success: true, templateId };
    } catch (error: any) {
      this.logger.warn(`Error saving template: ${error?.message || error}`);
      return { success: true, templateId };
    }
  }

  async getTemplates(userId: string, status = 'active') {
    const col = this.templatesCol;
    if (!col) return { success: true, templates: [] };

    try {
      const snapshot = await withTimeout(col
        .where('userId', '==', userId)
        .where('status', '==', status)
        .get());

      const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, templates };
    } catch (error: any) {
      this.logger.warn(`Error getting templates: ${error?.message || error}`);
      return { success: true, templates: [] };
    }
  }

  async updateTemplateStatus(id: string, userId: string, status: string) {
    const col = this.templatesCol;
    if (col) {
      try {
        const doc = await withTimeout(col.doc(id).get());
        if (doc.exists && doc.data()?.userId !== userId) {
          throw new Error('Unauthorized template modification');
        }
        await withTimeout(col.doc(id).set({ status, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true }));
      } catch (e: any) {
        this.logger.warn(`Error updating template status: ${e?.message}`);
        throw e;
      }
    }
    return { success: true };
  }

  async deleteTemplate(id: string, userId: string) {
    const col = this.templatesCol;
    if (col) {
      try {
        const doc = await withTimeout(col.doc(id).get());
        if (doc.exists && doc.data()?.userId !== userId) {
          throw new Error('Unauthorized template deletion');
        }
        await withTimeout(col.doc(id).delete());
      } catch (e: any) {
        this.logger.warn(`Error deleting template: ${e?.message}`);
        throw e;
      }
    }
    return { success: true };
  }

  async getStats(userId: string) {
    const res = await this.getTemplates(userId, 'active');
    const total = res.templates.length;
    return {
      success: true,
      stats: { total, active: total, deleted: 0, totalSize: 0 },
    };
  }

  async sendContractToTenant(landlordId: string, landlordEmail: string, body: any, file?: any) {
    const col = this.contractsCol;
    const docId = `contract_${landlordId}_${Date.now()}`;
    const stored = await this.storeContractDocument(
      landlordId,
      file,
      body.fileBase64 || body.base64Data || null,
    );
    const payload = {
      id: docId,
      landlordId,
      landlordEmail: this.normalizedEmail(body.landlordEmail, landlordEmail),
      tenantEmail: this.normalizedEmail(body.tenantEmail, body.recipientEmail),
      tenantName: body.tenantName || body.recipientName || '',
      propertyId: body.propertyId || '',
      propertyAddress: body.propertyAddress || '',
      title: body.title || body.contractName || 'Tenancy Agreement',
      contractName: body.contractName || body.title || 'Tenancy Agreement',
      contractType: body.contractType || 'tenancy-agreement',
      fileName: file?.originalname || body.fileName || 'contract.pdf',
      fileUrl: stored.fileUrl || body.fileUrl || '',
      storagePath: stored.storagePath || '',
      ...(stored.inlineBase64 ? { fileBase64: stored.inlineBase64 } : {}),
      templateId: body.templateId || '',
      status: body.status || 'sent',
      sentDate: body.sentDate || new Date().toISOString(),
      expiryDate: body.expiryDate || null,
      additionalInfo: body.additionalInfo || body.additionalEmail || body.notes || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (col) {
      try {
        await withTimeout(col.doc(docId).set(payload));
      } catch (err: any) {
        this.logger.warn(`sendContractToTenant error: ${err?.message || err}`);
      }
    }

    return { success: true, id: docId, contractId: docId, ...payload };
  }

  async createContractWithBase64(body: any, userId?: string) {
    const col = this.contractsCol;
    const contractData = body.contractData || body;
    const docId = contractData.id || `contract_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const landlordId = contractData.ownerUserId || userId || contractData.landlordId || 'unknown';

    const stored = await this.storeContractDocument(landlordId, undefined, body.base64Data || contractData.fileBase64 || null);
    const payload: any = {
      ...contractData,
      id: docId,
      title: contractData.title || contractData.contractName || 'Tenancy Agreement',
      contractName: contractData.contractName || contractData.title || 'Tenancy Agreement',
      landlordId,
      landlordEmail: this.normalizedEmail(contractData.landlordEmail),
      tenantEmail: this.normalizedEmail(contractData.tenantEmail, contractData.recipientEmail),
      tenantName: contractData.tenantName || contractData.recipientName || '',
      propertyAddress: contractData.propertyAddress || '',
      contractType: contractData.contractType || 'tenancy-agreement',
      status: contractData.status || 'sent',
      sentDate: contractData.sentDate ? new Date(contractData.sentDate).toISOString() : new Date().toISOString(),
      expiryDate: contractData.expiryDate ? new Date(contractData.expiryDate).toISOString() : null,
      fileName: body.fileName || contractData.fileName || 'contract.pdf',
      fileUrl: stored.fileUrl || contractData.fileUrl || '',
      storagePath: stored.storagePath || contractData.storagePath || '',
      additionalInfo: contractData.additionalInfo || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (stored.inlineBase64) payload.fileBase64 = stored.inlineBase64;
    else delete payload.fileBase64;
    delete payload.base64Data;

    if (col) {
      try {
        await withTimeout(col.doc(docId).set(payload));
        this.logger.log(`Created contract ${docId} with base64 attachment for user ${landlordId}`);
      } catch (err: any) {
        this.logger.warn(`createContractWithBase64 error: ${err?.message || err}`);
      }
    }

    return { success: true, id: docId, contractId: docId, ...payload };
  }

  async getLandlordContracts(filters: {
    userId?: string;
    landlordEmail?: string;
    landlordId?: string;
    status?: string;
    tenantId?: string;
    propertyId?: string;
  }) {
    const col = this.contractsCol;
    if (!col) return { success: true, contracts: [] };

    try {
      const targetUserId = filters.userId || filters.landlordId;
      const emails = await this.collectEmails(filters.landlordEmail || '', targetUserId);
      const byId = new Map<string, any>();

      if (targetUserId) await this.rememberQuery(col, 'landlordId', targetUserId, byId);
      for (const email of emails) {
        await this.rememberQuery(col, 'landlordEmail', email, byId);
        await this.rememberQuery(col, 'agentEmail', email, byId);
      }

      let contracts = [...byId.values()].map((doc) => this.presentContract(doc.id, doc.data()));

      if (filters.status && filters.status !== 'all') {
        contracts = contracts.filter(c => c.status === filters.status);
      }
      if (filters.propertyId) {
        contracts = contracts.filter(c => c.propertyId === filters.propertyId);
      }

      contracts.sort((a, b) => (b.sentDate?.getTime?.() || 0) - (a.sentDate?.getTime?.() || 0));
      return { success: true, contracts };
    } catch (err: any) {
      this.logger.warn(`getLandlordContracts error: ${err?.message || err}`);
      return { success: true, contracts: [] };
    }
  }

  /** The stored file link expires. Signing needs the PDF bytes or a fresh link. */
  private async contractForViewer(id: string, data: any) {
    const presented = this.presentContract(id, data);
    let fileBase64 = typeof data.fileBase64 === 'string' ? data.fileBase64 : '';
    if (!fileBase64 && typeof data.base64Data === 'string') fileBase64 = data.base64Data;

    if (!fileBase64 && data.storagePath && admin.apps.length) {
      try {
        const bucketName = process.env.FIREBASE_STORAGE_BUCKET
          || `${process.env.FIREBASE_PROJECT_ID || 'proptii-16946'}.firebasestorage.app`;
        const bucket = admin.storage().bucket(bucketName);
        const plainPath = String(data.storagePath).startsWith('gs://')
          ? String(data.storagePath).replace(`gs://${bucket.name}/`, '')
          : String(data.storagePath);
        const [bytes] = await bucket.file(plainPath).download();
        if (bytes?.length && bytes.length < 8_000_000) {
          fileBase64 = `data:application/pdf;base64,${bytes.toString('base64')}`;
        }
      } catch (err: any) {
        this.logger.warn(`contract file read failed for ${id}: ${err?.message || err}`);
      }
    }

    let fileUrl = presented.fileUrl || '';
    if (data.storagePath) {
      try {
        const fresh = await getSignedDownloadUrl(String(data.storagePath));
        if (fresh) fileUrl = fresh;
      } catch (err: any) {
        this.logger.warn(`contract link refresh failed for ${id}: ${err?.message || err}`);
      }
    }
    if (fileBase64) {
      const inline = fileBase64.startsWith('data:')
        ? fileBase64
        : `data:application/pdf;base64,${fileBase64}`;
      if (!fileUrl || fileUrl === '#') fileUrl = inline;
      return { ...presented, fileUrl, documentUrl: presented.documentUrl || fileUrl, fileBase64: inline };
    }
    return { ...presented, fileUrl, documentUrl: presented.documentUrl || fileUrl };
  }

  async getContractById(contractId: string) {
    const col = this.contractsCol;
    if (!col) return { success: false, contract: null };

    try {
      const doc = await withTimeout(col.doc(contractId).get());
      if (!doc.exists) {
        return { success: false, contract: null };
      }
      const d = doc.data() || {};
      return { success: true, contract: await this.contractForViewer(doc.id, d) };
    } catch (err: any) {
      this.logger.warn(`getContractById error: ${err?.message || err}`);
      return { success: false, contract: null };
    }
  }

  async updateContractStatus(contractId: string, status: string, signedDate?: string, signedBy?: string) {
    const col = this.contractsCol;
    if (!col) return { success: true };

    try {
      const payload: any = {
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (signedDate) payload.signedDate = signedDate;
      if (signedBy) payload.signedBy = signedBy;
      if (status === 'signed' && !signedDate) payload.signedDate = new Date().toISOString();

      await withTimeout(col.doc(contractId).set(payload, { merge: true }));
      return { success: true };
    } catch (err: any) {
      this.logger.warn(`updateContractStatus error: ${err?.message || err}`);
      return { success: false, error: err?.message };
    }
  }

  async deleteContract(contractId: string) {
    const col = this.contractsCol;
    if (!col) return { success: true };

    try {
      await withTimeout(col.doc(contractId).delete());
      return { success: true };
    } catch (err: any) {
      this.logger.warn(`deleteContract error: ${err?.message || err}`);
      return { success: false, error: err?.message };
    }
  }

  async getExpiringContracts(days = 7) {
    const col = this.contractsCol;
    if (!col) return { success: true, contracts: [] };

    try {
      const now = new Date();
      const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      const snapshot = await withTimeout(col.get(), 3500);

      const contracts = snapshot.docs
        .map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            title: d.title || d.contractName || 'Contract',
            fileName: d.fileName || d.documentName || 'contract.pdf',
            fileUrl: d.fileUrl || d.documentUrl || '#',
            propertyAddress: d.propertyAddress || '',
            tenantName: d.tenantName || '',
            tenantEmail: d.tenantEmail || '',
            status: d.status || 'sent',
            sentDate: d.sentDate?.toDate?.() || (d.sentDate ? new Date(d.sentDate) : new Date()),
            expiryDate: d.expiryDate?.toDate?.() || (d.expiryDate ? new Date(d.expiryDate) : undefined),
          };
        })
        .filter(c => {
          if (!c.expiryDate || c.status === 'signed') return false;
          return c.expiryDate.getTime() >= now.getTime() && c.expiryDate.getTime() <= cutoff.getTime();
        });

      return { success: true, contracts };
    } catch (err: any) {
      this.logger.warn(`getExpiringContracts error: ${err?.message || err}`);
      return { success: true, contracts: [] };
    }
  }

  async saveSignedContract(body: any, userId?: string) {
    const col = this.contractsCol;
    const docId = body.id || `signed_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const effectiveUserId = userId || body.userId || 'unknown';

    const landlordEmail = this.normalizedEmail(body.landlordEmail, body.agentEmail);
    const agentEmail = this.normalizedEmail(body.agentEmail, body.landlordEmail);
    const payload = {
      ...body,
      id: docId,
      userId: effectiveUserId,
      title: body.title || body.contractName || body.templateName || 'Contract',
      contractName: body.contractName || body.title || body.templateName || 'Contract',
      tenantEmail: this.normalizedEmail(body.tenantEmail) || body.tenantEmail || '',
      tenantName: body.tenantName || '',
      propertyAddress: body.propertyAddress || '',
      fileUrl: body.fileUrl || body.documentUrl || '',
      documentUrl: body.documentUrl || body.fileUrl || '',
      fileName: body.fileName || body.documentName || 'contract.pdf',
      ...(landlordEmail ? { landlordEmail, agentEmail: agentEmail || landlordEmail } : {}),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (col) {
      try {
        await withTimeout(col.doc(docId).set(payload));
        await this.reflectSignatureOnSource(col, docId, body);
      } catch (err: any) {
        this.logger.warn(`saveSignedContract error: ${err?.message || err}`);
      }
    }

    return { success: true, id: docId, contractId: docId, ...payload };
  }

  /** When a tenant signs a contract the landlord already sent, update that same row. */
  private async reflectSignatureOnSource(
    col: admin.firestore.CollectionReference,
    signedId: string,
    body: any,
  ) {
    const sourceId = String(body.contractId || body.sourceContractId || body.templateId || '');
    if (!sourceId || sourceId === signedId || sourceId === 'template-id' || sourceId === 'template') return;
    try {
      const existing = await col.doc(sourceId).get();
      if (!existing.exists) return;
      const current = existing.data() || {};
      const documentUrl = body.documentUrl || body.fileUrl || '';
      await col.doc(sourceId).set({
        status: 'signed',
        signedDate: body.signedDate || new Date().toISOString(),
        signedBy: 'tenant',
        ...(documentUrl ? { documentUrl, fileUrl: documentUrl } : {}),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      this.logger.log(`Marked source contract ${sourceId} signed (was ${current.status || 'sent'})`);
    } catch (err: any) {
      this.logger.warn(`reflectSignatureOnSource failed for ${sourceId}: ${err?.message || err}`);
    }
  }

  async syncContractToLandlord(body: any) {
    const col = this.contractsCol;
    const docId = `landlord_contract_${Date.now()}`;
    const payload = {
      id: docId,
      ...body,
      tenantEmail: (body.tenantEmail || '').toLowerCase().trim(),
      landlordEmail: (body.landlordEmail || '').toLowerCase().trim(),
      syncedAt: new Date().toISOString(),
    };
    if (col) {
      try {
        await withTimeout(col.doc(docId).set(payload));
      } catch (err: any) {
        this.logger.warn(`syncContractToLandlord error: ${err?.message || err}`);
      }
    }
    return { success: true, id: docId, contractId: docId };
  }

  async contractExists(tenantEmail: string, title: string, landlordEmail: string) {
    const col = this.contractsCol;
    if (!col) return { exists: false };
    const tenant = this.normalizedEmail(tenantEmail);
    const landlord = this.normalizedEmail(landlordEmail);
    const name = (title || '').trim();
    try {
      const snap = await withTimeout(col
        .where('tenantEmail', '==', tenant)
        .where('landlordEmail', '==', landlord)
        .where('title', '==', name)
        .limit(1)
        .get());
      return { exists: !snap.empty };
    } catch (err: any) {
      this.logger.warn(`contractExists composite query failed, checking in memory: ${err?.message || err}`);
      try {
        const snap = await withTimeout(col.where('tenantEmail', '==', tenant).get());
        const exists = snap.docs.some((doc) => {
          const data = doc.data() as any;
          return (data.landlordEmail || '').toLowerCase() === landlord
            && (data.title || data.contractName || '') === name;
        });
        return { exists };
      } catch (fallbackErr: any) {
        this.logger.warn(`contractExists error: ${fallbackErr?.message || fallbackErr}`);
        return { exists: false };
      }
    }
  }

  async sendSignedContract(body: any, senderEmail: string, file?: any) {
    if (!body?.to || typeof body.to !== 'string' || !body.to.includes('@')) {
      return { success: false, error: 'Invalid recipient email address' };
    }

    const safeContractName = String(body.contractName || 'Tenancy Contract').replace(/[<>&"']/g, '').slice(0, 120);
    const safeRecipientName = String(body.recipientName || 'Valued Client').replace(/[<>&"']/g, '').slice(0, 100);
    const safeSenderName = String(senderEmail || body.senderName || 'Proptii').replace(/[<>&"']/g, '').slice(0, 100);

    // Persist the signed contract record to Firestore
    const db = this.db;
    if (db) {
      try {
        const docId = `signed_${Date.now()}`;
        await withTimeout(db.collection('signed_contracts').doc(docId).set({
          id: docId,
          to: body.to.toLowerCase().trim(),
          recipientName: safeRecipientName,
          contractName: safeContractName,
          senderName: safeSenderName,
          senderEmail: senderEmail || null,
          sentAt: new Date().toISOString(),
          status: 'sent',
        }));
      } catch (err: any) {
        this.logger.warn(`sendSignedContract persist error: ${err?.message || err}`);
      }
    }

    // Email delivery via Resend with strictly safe server-rendered template
    try {
      const { sendEmail } = await import('../utils/resend');

      let attachments: any[] | undefined;
      if (file && file.buffer) {
        attachments = [{
          filename: file.originalname || `${safeContractName.replace(/[^a-zA-Z0-9_-]/g, '_')}_signed.pdf`,
          content: file.buffer.toString('base64'),
          content_type: file.mimetype || 'application/pdf',
        }];
      } else if (body.attachmentBase64) {
        attachments = [{
          filename: `${safeContractName.replace(/[^a-zA-Z0-9_-]/g, '_')}_signed.pdf`,
          content: body.attachmentBase64,
          content_type: 'application/pdf',
        }];
      }

      const safeHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #111827; margin-bottom: 16px;">Signed Document Available</h2>
          <p>Hello ${safeRecipientName},</p>
          <p>Please find attached the signed contract document: <strong>${safeContractName}</strong>.</p>
          <p style="margin-top: 16px; font-size: 14px; color: #6b7280;">Sent by: ${safeSenderName}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #9ca3af;">This email was sent via Proptii on behalf of ${safeSenderName}. If you were not expecting this document, please contact support.</p>
        </div>
      `;

      const id = await sendEmail({
        to: body.to.toLowerCase().trim(),
        subject: `Signed Contract: ${safeContractName}`,
        html: safeHtml,
        attachments,
      });

      this.logger.log(`Signed contract email sent to ${body.to} [${id}]`);
      return { success: true, message: 'Signed contract emailed successfully', messageId: id };
    } catch (err: any) {
      this.logger.error(`sendSignedContract email error: ${err?.message || err}`);
      return { success: false, error: err?.message || 'Email delivery failed' };
    }
  }
}
