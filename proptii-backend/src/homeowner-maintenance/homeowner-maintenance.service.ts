import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';

@Injectable()
export class HomeownerMaintenanceService {
  private readonly logger = new Logger(HomeownerMaintenanceService.name);
  private firestore: Firestore | null = null;
  private readonly collectionName = 'homeownerMaintenanceTasks';

  constructor(@Inject('FIRESTORE') private readonly firestoreInstance: Firestore | null) {
    if (this.firestoreInstance) {
      this.firestore = this.firestoreInstance;
    } else {
      this.logger.warn('Firestore not available for HomeownerMaintenanceService');
    }
  }

  async findAll(userId: string) {
    if (!this.firestore) return [];
    
    let snapshot;
    try {
      snapshot = await this.firestore.collection(this.collectionName)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
    } catch (e: any) {
      snapshot = await this.firestore.collection(this.collectionName)
        .where('userId', '==', userId)
        .get();
    }
    
    const docs = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    
    // Sort in memory if index was missing
    docs.sort((a: any, b: any) => {
      const timeA = new Date(a.createdAt || a.dueDate).getTime();
      const timeB = new Date(b.createdAt || b.dueDate).getTime();
      return timeB - timeA;
    });
    
    return docs;
  }

  async create(userId: string, taskData: any) {
    if (!this.firestore) throw new Error('Firestore not available');
    const docRef = this.firestore.collection(this.collectionName).doc();
    
    const now = new Date().toISOString();
    const data = {
      ...taskData,
      userId,
      createdAt: now,
      updatedAt: now
    };
    
    await docRef.set(data);
    return { id: docRef.id, ...data };
  }

  async update(id: string, userId: string, updates: any) {
    if (!this.firestore) throw new Error('Firestore not available');
    const docRef = this.firestore.collection(this.collectionName).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists || doc.data()?.userId !== userId) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    
    await docRef.update({
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true };
  }

  async remove(id: string, userId: string) {
    if (!this.firestore) throw new Error('Firestore not available');
    const docRef = this.firestore.collection(this.collectionName).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists || doc.data()?.userId !== userId) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    
    await docRef.delete();
    return { success: true };
  }
}
