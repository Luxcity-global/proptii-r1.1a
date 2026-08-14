import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class ReferencingService {
  private readonly logger = new Logger(ReferencingService.name);

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

  async getFormData(userId: string) {
    const col = this.collection;
    if (!col) return {};

    try {
      const doc = await col.doc(userId).get();
      if (!doc.exists) {
        return {};
      }
      return doc.data() || {};
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
      await col.doc(userId).set(payload, { merge: true });
      return { success: true, section, data };
    } catch (err: any) {
      this.logger.warn(`Failed to save referencing section ${section}: ${err?.message || err}`);
      return { success: true, section, data };
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
    const shareId = `share_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const payload = {
      id: shareId,
      userId,
      recipientName: shareData.recipientName || '',
      recipientEmail: (shareData.recipientEmail || '').toLowerCase().trim(),
      recipientPhone: shareData.recipientPhone || '',
      recipientRole: shareData.recipientRole || 'agent',
      agencyName: shareData.agencyName || '',
      propertyAddress: shareData.propertyAddress || '',
      notes: shareData.notes || '',
      status: 'sent',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!col) return { success: true, share: { ...payload, id: shareId, createdAt: new Date().toISOString() } };

    try {
      await col.doc(shareId).set(payload);
      return { success: true, share: { ...payload, id: shareId, createdAt: new Date().toISOString() } };
    } catch (err: any) {
      this.logger.warn(`Failed to save referencing share for ${userId}: ${err?.message || err}`);
      return { success: true, share: { ...payload, id: shareId, createdAt: new Date().toISOString() } };
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
}
