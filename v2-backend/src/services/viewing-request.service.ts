import { Injectable, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class ViewingRequestService {
  private get db(): admin.firestore.Firestore | null {
    if (!admin.apps.length) return null;
    try { return admin.firestore(); } catch { return null; }
  }

  private get collection() {
    const db = this.db;
    return db ? db.collection('viewings') : null;
  }

  async createViewing(tenantId: string, tenantEmail: string, data: any) {
    const col = this.collection;
    const id = `viewing_${tenantId}_${Date.now()}`;
    const payload = {
      id,
      tenantId,
      tenantEmail,
      propertyId: data.propertyId,
      propertyTitle: data.propertyTitle || 'Property Viewing',
      requestedDate: data.requestedDate,
      requestedTime: data.requestedTime || '10:00',
      status: 'pending',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (col) {
      try {
        await col.doc(id).set(payload);
      } catch (err: any) {
        console.warn('[ViewingRequestService] createViewing error:', err?.message || err);
      }
    }
    return payload;
  }

  async getViewingRequests(userId: string, role: string) {
    const col = this.collection;
    if (!col) return [];
    try {
      let query: admin.firestore.Query = col;
      if (role === 'landlord' || role === 'agent') {
        query = query.where('landlordId', '==', userId);
      } else {
        query = query.where('tenantId', '==', userId);
      }
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err: any) {
      console.warn('[ViewingRequestService] getViewingRequests error:', err?.message || err);
      return [];
    }
  }

  async getViewingById(id: string) {
    const col = this.collection;
    if (!col) throw new NotFoundException('Viewing request not found');
    try {
      const doc = await col.doc(id).get();
      if (!doc.exists) throw new NotFoundException('Viewing request not found');
      return { id: doc.id, ...doc.data() };
    } catch (err: any) {
      if (err?.status === 404) throw err;
      console.warn('[ViewingRequestService] getViewingById error:', err?.message || err);
      throw new NotFoundException('Viewing request not found');
    }
  }

  async updateViewingStatus(id: string, userId: string, status: string, notes?: string) {
    const col = this.collection;
    if (!col) return { id, status };
    try {
      const docRef = col.doc(id);
      const doc = await docRef.get();
      if (!doc.exists) throw new NotFoundException('Viewing request not found');
      const payload: any = { status, updatedAt: new Date().toISOString() };
      if (notes) payload.notes = notes;
      await docRef.update(payload);
      return { id, ...doc.data(), ...payload };
    } catch (err: any) {
      if (err?.status === 404) throw err;
      console.warn('[ViewingRequestService] updateViewingStatus error:', err?.message || err);
      return { id, status };
    }
  }

  async cancelViewing(id: string, userId: string) {
    const col = this.collection;
    if (!col) return { success: true, message: 'Viewing request cancelled' };
    try {
      const docRef = col.doc(id);
      const doc = await docRef.get();
      if (!doc.exists) throw new NotFoundException('Viewing request not found');
      await docRef.update({ status: 'cancelled', updatedAt: new Date().toISOString() });
      return { success: true, message: 'Viewing request cancelled' };
    } catch (err: any) {
      if (err?.status === 404) throw err;
      console.warn('[ViewingRequestService] cancelViewing error:', err?.message || err);
      return { success: true, message: 'Viewing request cancelled' };
    }
  }
}
