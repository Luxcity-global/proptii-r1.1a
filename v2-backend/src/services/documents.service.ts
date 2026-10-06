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

  async getDocuments(landlordId: string, propertyId?: string | 'unassigned'): Promise<LandlordDocument[]> {
    const db = this.db();
    const snap = await db.collection(this.col).where('landlordId', '==', landlordId).get();
    let docs = snap.docs.map(d => cleanDoc({ id: d.id, ...d.data() }));

    if (propertyId === 'unassigned') {
      docs = docs.filter(d => !d.propertyId);
    } else if (propertyId) {
      docs = docs.filter(d => d.propertyId === propertyId);
    }

    return docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // ── Assign to property ────────────────────────────────────────────────────

  async assignToProperty(documentId: string, landlordId: string, propertyId: string | null): Promise<LandlordDocument> {
    const db = this.db();
    const ref = db.collection(this.col).doc(documentId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('Document not found');
    const data = snap.data()!;
    if (data.landlordId !== landlordId) throw new Error('Forbidden');
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

  async deleteDocument(documentId: string, landlordId: string): Promise<void> {
    const db = this.db();
    const ref = db.collection(this.col).doc(documentId);
    const snap = await ref.get();
    if (!snap.exists) return; // idempotent
    const data = snap.data()!;
    if (data.landlordId !== landlordId) throw new Error('Forbidden');

    // Delete record from Firestore
    await ref.delete();
    this.logger.log(`Deleted document ${documentId} for landlord ${landlordId}`);

    // Clean up physical file in Cloud Storage if storageService is available
    if (this.storageService && data.url) {
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
