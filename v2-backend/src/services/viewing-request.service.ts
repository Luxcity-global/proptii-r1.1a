import { Injectable, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class ViewingRequestService {
  private get db() {
    return admin.firestore();
  }

  private get collection() {
    return this.db.collection('viewings');
  }

  async createViewing(tenantId: string, tenantEmail: string, data: any) {
    const docRef = this.collection.doc();
    const payload = {
      id: docRef.id,
      tenantId,
      tenantEmail,
      propertyId: data.propertyId,
      propertyTitle: data.propertyTitle || 'Property Viewing',
      requestedDate: data.requestedDate,
      requestedTime: data.requestedTime || '10:00',
      status: 'pending',
      notes: data.notes || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await docRef.set(payload);
    return payload;
  }

  async getViewingRequests(userId: string, role: string) {
    let query: admin.firestore.Query = this.collection;
    if (role === 'landlord' || role === 'agent') {
      query = query.where('landlordId', '==', userId);
    } else {
      query = query.where('tenantId', '==', userId);
    }
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getViewingById(id: string) {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      throw new NotFoundException('Viewing request not found');
    }
    return { id: doc.id, ...doc.data() };
  }

  async updateViewingStatus(id: string, userId: string, status: string, notes?: string) {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException('Viewing request not found');
    }

    const payload: any = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (notes) payload.notes = notes;

    await docRef.update(payload);
    return { id, ...doc.data(), ...payload };
  }

  async cancelViewing(id: string, userId: string) {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException('Viewing request not found');
    }
    await docRef.update({
      status: 'cancelled',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true, message: 'Viewing request cancelled' };
  }
}
