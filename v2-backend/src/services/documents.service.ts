/**
 * DocumentsService — landlord_documents Firestore collection
 *
 * Every document belongs to a landlord (landlordId required).
 * propertyId is optional — null means the document is unassigned.
 * Documents can be uploaded, listed, assigned to a property, or deleted.
 */
import { Injectable, Logger, Optional } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { StorageService } from './storage.service';

export interface LandlordDocument {
  id: string;
  landlordId: string;
  propertyId: string | null;      // null = unassigned
  name: string;
  type: string;
  url: string;
  issueDate: string;              // ISO string
  expiryDate?: string | null;     // ISO string or null
  status: 'valid' | 'expiring-soon' | 'expired';
  createdAt: string;
  updatedAt: string;
}

function computeStatus(expiryDate?: string | null): 'valid' | 'expiring-soon' | 'expired' {
  if (!expiryDate) return 'valid';
  const now = new Date();
  const expiry = new Date(expiryDate);
  const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring-soon';
  return 'valid';
}

function cleanDoc(doc: any): LandlordDocument {
  return {
    id:          doc.id,
    landlordId:  doc.landlordId,
    propertyId:  doc.propertyId ?? null,
    name:        doc.name,
    type:        doc.type,
    url:         doc.url,
    issueDate:   doc.issueDate,
    expiryDate:  doc.expiryDate ?? null,
    status:      doc.status ?? computeStatus(doc.expiryDate),
    createdAt:   doc.createdAt ?? new Date().toISOString(),
    updatedAt:   doc.updatedAt ?? new Date().toISOString(),
  };
}

function isDocumentAuthorized(data: any, landlordId?: string, userEmail?: string): boolean {
  if (!data) return false;
  const uid = (landlordId || '').trim();
  const email = (userEmail || '').trim().toLowerCase();

  // 1. Direct UID matching across UID fields
  if (uid) {
    if (data.landlordId && String(data.landlordId).trim() === uid) return true;
    if (data.userId && String(data.userId).trim() === uid) return true;
    if (data.ownerId && String(data.ownerId).trim() === uid) return true;
  }

  // 2. Direct Email matching across all potential email fields
  if (email) {
    const candidateEmails = [
      data.landlordEmail,
      data.ownerEmail,
      data.email,
      data.userEmail,
      data.landlordId, // could be saved as email
      data.userId,     // could be saved as email
    ]
      .filter(Boolean)
      .map(e => String(e).trim().toLowerCase());

    if (candidateEmails.includes(email)) return true;
  }

  // 3. Reverse UID match if UID passed is an email
  if (uid && uid.includes('@')) {
    const uidEmail = uid.toLowerCase();
    const candidateEmails = [
      data.landlordEmail,
      data.ownerEmail,
      data.email,
      data.userEmail,
      data.landlordId,
      data.userId,
    ]
      .filter(Boolean)
      .map(e => String(e).trim().toLowerCase());

    if (candidateEmails.includes(uidEmail)) return true;
  }

  return false;
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly col = 'landlord_documents';

  constructor(
    @Optional() private readonly storageService?: StorageService,
  ) {}

  private db(): FirebaseFirestore.Firestore {
    return admin.firestore();
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async createDocument(
    landlordId: string,
    data: Omit<LandlordDocument, 'id' | 'landlordId' | 'createdAt' | 'updatedAt'>,
  ): Promise<LandlordDocument> {
    const db = this.db();
    const ref = db.collection(this.col).doc();
    const now = new Date().toISOString();
    const doc: LandlordDocument = {
      id:         ref.id,
      landlordId,
      propertyId: data.propertyId ?? null,
      name:       data.name,
      type:       data.type,
      url:        data.url,
      issueDate:  data.issueDate,
      expiryDate: data.expiryDate ?? null,
      status:     computeStatus(data.expiryDate),
      createdAt:  now,
      updatedAt:  now,
    };
    await ref.set(doc);
    this.logger.log(`Created document ${ref.id} for landlord ${landlordId}`);
    return doc;
  }

  // ── List ──────────────────────────────────────────────────────────────────

  async getDocuments(landlordId: string, propertyId?: string | 'unassigned', userEmail?: string): Promise<LandlordDocument[]> {
    const db = this.db();
    const docMap = new Map<string, LandlordDocument>();
    const uid = (landlordId || '').trim();
    const mail = (userEmail || '').trim().toLowerCase();

    if (uid) {
      const [s1, s2] = await Promise.all([
        db.collection(this.col).where('landlordId', '==', uid).get().catch(() => ({ docs: [] })),
        db.collection(this.col).where('userId', '==', uid).get().catch(() => ({ docs: [] })),
      ]);
      s1.docs.forEach(d => docMap.set(d.id, cleanDoc({ id: d.id, ...d.data() })));
      s2.docs.forEach(d => docMap.set(d.id, cleanDoc({ id: d.id, ...d.data() })));
    }

    if (mail) {
      const [s3, s4, s5, s6] = await Promise.all([
        db.collection(this.col).where('landlordId', '==', mail).get().catch(() => ({ docs: [] })),
        db.collection(this.col).where('ownerEmail', '==', mail).get().catch(() => ({ docs: [] })),
        db.collection(this.col).where('landlordEmail', '==', mail).get().catch(() => ({ docs: [] })),
        db.collection(this.col).where('email', '==', mail).get().catch(() => ({ docs: [] })),
      ]);
      s3.docs.forEach(d => docMap.set(d.id, cleanDoc({ id: d.id, ...d.data() })));
      s4.docs.forEach(d => docMap.set(d.id, cleanDoc({ id: d.id, ...d.data() })));
      s5.docs.forEach(d => docMap.set(d.id, cleanDoc({ id: d.id, ...d.data() })));
      s6.docs.forEach(d => docMap.set(d.id, cleanDoc({ id: d.id, ...d.data() })));
    }

    let docs = Array.from(docMap.values());
    if (propertyId === 'unassigned') {
      docs = docs.filter(d => !d.propertyId);
    } else if (propertyId) {
      docs = docs.filter(d => d.propertyId === propertyId);
    }

    return docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // ── Assign to property ────────────────────────────────────────────────────

  async assignToProperty(documentId: string, landlordId: string, propertyId: string | null, userEmail?: string): Promise<LandlordDocument> {
    const db = this.db();
    const ref = db.collection(this.col).doc(documentId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('Document not found');
    const data = snap.data()!;
    if (!isDocumentAuthorized(data, landlordId, userEmail)) {
      throw new Error('Forbidden');
    }
    const update = {
      propertyId: propertyId ?? null,
      updatedAt: new Date().toISOString(),
    };
    await ref.update(update);

    // Synchronize to properties collection if assigning to a property
    if (propertyId) {
      try {
        const propRef = db.collection('properties').doc(propertyId);
        const propSnap = await propRef.get();
        if (propSnap.exists) {
          const propData = propSnap.data()!;
          const existingDocs = Array.isArray(propData.documents) ? propData.documents : [];
          const alreadyExists = existingDocs.some((d: any) => d.id === documentId || d.url === data.url);
          if (!alreadyExists) {
            const docItem = {
              id: documentId,
              name: data.name,
              type: data.type,
              url: data.url,
              issueDate: data.issueDate,
              expiryDate: data.expiryDate ?? null,
              status: data.status ?? 'valid',
            };
            await propRef.update({
              documents: [...existingDocs, docItem],
              updatedAt: new Date().toISOString(),
            });
            this.logger.log(`Synced assigned document ${documentId} to property ${propertyId}`);
          }
        }
      } catch (propErr: any) {
        this.logger.warn(`Could not sync document ${documentId} to property ${propertyId}: ${propErr?.message}`);
      }
    }

    return cleanDoc({ id: documentId, ...data, ...update });
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async deleteDocument(documentId: string, landlordId: string, userEmail?: string): Promise<void> {
    const db = this.db();
    const ref = db.collection(this.col).doc(documentId);
    const snap = await ref.get();
    let data: any = null;

    if (snap.exists) {
      data = snap.data()!;
      if (!isDocumentAuthorized(data, landlordId, userEmail)) {
        throw new Error('Forbidden');
      }

      // Delete record from Firestore landlord_documents collection
      await ref.delete();
      this.logger.log(`Deleted document ${documentId} from landlord_documents`);
    }

    // Clean up document from property if it was explicitly assigned
    if (data?.propertyId) {
      try {
        const propRef = db.collection('properties').doc(data.propertyId);
        const propSnap = await propRef.get();
        if (propSnap.exists) {
          const propData = propSnap.data()!;
          const existingDocs = Array.isArray(propData.documents) ? propData.documents : [];
          const filteredDocs = existingDocs.filter((d: any) => d.id !== documentId && d.url !== data.url);
          if (filteredDocs.length !== existingDocs.length) {
            await propRef.update({
              documents: filteredDocs,
              updatedAt: new Date().toISOString(),
            });
            this.logger.log(`Cleaned up document ${documentId} from property ${data.propertyId}`);
          }
        }
      } catch (propErr: any) {
        this.logger.warn(`Could not remove document ${documentId} from property ${data.propertyId}: ${propErr?.message}`);
      }
    }

    // Also sweep landlord's properties in case the document is embedded in a property's documents array
    try {
      const col = db.collection('properties');
      const uid = (landlordId || '').trim();
      const mail = (userEmail || '').trim().toLowerCase();
      const queries: Promise<any>[] = [];
      if (uid) {
        queries.push(col.where('userId', '==', uid).get().catch(() => ({ docs: [] })));
        queries.push(col.where('landlordId', '==', uid).get().catch(() => ({ docs: [] })));
      }
      if (mail) {
        queries.push(col.where('ownerEmail', '==', mail).get().catch(() => ({ docs: [] })));
        queries.push(col.where('landlordEmail', '==', mail).get().catch(() => ({ docs: [] })));
      }
      const results = await Promise.all(queries);
      const propsMap = new Map<string, any>();
      results.forEach(res => (res.docs || []).forEach((d: any) => propsMap.set(d.id, d)));

      for (const [propId, propDoc] of propsMap.entries()) {
        const propData = propDoc.data();
        const existingDocs = Array.isArray(propData.documents) ? propData.documents : [];
        const hasDoc = existingDocs.some((d: any) => d.id === documentId || (data?.url && d.url === data.url));
        if (hasDoc) {
          const filteredDocs = existingDocs.filter((d: any) => d.id !== documentId && (!data?.url || d.url !== data.url));
          await propDoc.ref.update({
            documents: filteredDocs,
            updatedAt: new Date().toISOString(),
          });
          this.logger.log(`Cleaned up document ${documentId} from property ${propId}`);
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not sweep properties for document ${documentId}: ${err?.message}`);
    }

    // Clean up physical file in Cloud Storage if storageService is available
    if (this.storageService && data?.url) {
      try {
        const match = data.url.match(/\/o\/([^?]+)/);
        if (match && match[1]) {
          const storagePath = decodeURIComponent(match[1]);
          await this.storageService.deleteFile(storagePath);
          this.logger.log(`Cleaned up storage file ${storagePath} for document ${documentId}`);
        }
      } catch (err: any) {
        this.logger.warn(`Could not delete storage file for doc ${documentId}: ${err?.message}`);
      }
    }
  }
}
