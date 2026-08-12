import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);
  private firestore: Firestore | null = null;
  private readonly collectionName = 'alerts';

  constructor(@Inject('FIRESTORE') private readonly firestoreInstance: Firestore | null) {
    if (this.firestoreInstance) {
      this.firestore = this.firestoreInstance;
    } else {
      this.logger.warn('Firestore not available for AlertsService');
    }
  }

  async create(alertData: any, userId: string) {
    if (!this.firestore) throw new Error('Firestore not available');
    
    const docRef = this.firestore.collection(this.collectionName).doc();
    const now = new Date().toISOString();
    
    const data = {
      ...alertData,
      userId,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    };
    
    await docRef.set(data);
    return data;
  }

  async findAll(userId: string, filters: any = {}) {
    if (!this.firestore) return [];
    
    let query: any = this.firestore.collection(this.collectionName).where('userId', '==', userId);
    
    if (filters.type) {
      query = query.where('type', '==', filters.type);
    }
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }
    if (filters.severity) {
      query = query.where('severity', '==', filters.severity);
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').get().catch(async (e: any) => {
      // Fallback if index is missing
      const snap = await query.get();
      const docs = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      return { docs, empty: docs.length === 0 };
    });
    
    if (Array.isArray(snapshot.docs)) {
        return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    }
    return snapshot.docs || [];
  }

  async findOne(id: string, userId: string) {
    if (!this.firestore) throw new Error('Firestore not available');
    const doc = await this.firestore.collection(this.collectionName).doc(id).get();
    if (!doc.exists || doc.data()?.userId !== userId) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }
    return { id: doc.id, ...doc.data() };
  }

  async updateStatus(id: string, userId: string, status: string) {
    if (!this.firestore) throw new Error('Firestore not available');
    const docRef = this.firestore.collection(this.collectionName).doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data()?.userId !== userId) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }
    
    const now = new Date().toISOString();
    const updateData: any = {
      status,
      updatedAt: now
    };
    
    if (status === 'resolved') {
      updateData.resolvedAt = now;
    } else if (status === 'dismissed') {
      updateData.dismissedAt = now;
    }
    
    await docRef.update(updateData);
    return { success: true };
  }

  async remove(id: string, userId: string) {
    if (!this.firestore) throw new Error('Firestore not available');
    const docRef = this.firestore.collection(this.collectionName).doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data()?.userId !== userId) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }
    await docRef.delete();
    return { success: true };
  }
}
