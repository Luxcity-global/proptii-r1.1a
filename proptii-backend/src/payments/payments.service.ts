import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private firestore: Firestore | null = null;
  private readonly collectionName = 'rentPaymentPeriods';

  constructor(@Inject('FIRESTORE') private readonly firestoreInstance: Firestore | null) {
    if (this.firestoreInstance) {
      this.firestore = this.firestoreInstance;
    } else {
      this.logger.warn('Firestore not available for PaymentsService');
    }
  }

  async getTenantPeriods(tenantId: string) {
    if (!this.firestore) return [];
    
    let snapshot;
    try {
      snapshot = await this.firestore.collection(this.collectionName)
        .where('tenantId', '==', tenantId)
        .orderBy('periodStart', 'asc')
        .get();
    } catch (e: any) {
      snapshot = await this.firestore.collection(this.collectionName)
        .where('tenantId', '==', tenantId)
        .get();
    }
    
    const docs = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    docs.sort((a: any, b: any) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime());
    return docs;
  }

  async updatePeriodStatus(periodId: string, status: string, options: any) {
    if (!this.firestore) throw new Error('Firestore not available');
    const docRef = this.firestore.collection(this.collectionName).doc(periodId);
    
    const updateData: any = {
      status,
      updatedAt: new Date().toISOString()
    };
    
    if (options?.notes) {
      updateData.notes = options.notes;
    }
    
    if (status === 'paid') {
      updateData.paidAt = options?.paidAt ? new Date(options.paidAt).toISOString() : new Date().toISOString();
    } else if (options?.paidAt === null) {
      updateData.paidAt = null;
    }
    
    await docRef.update(updateData);
    return { success: true };
  }

  async bulkUpdate(writes: any[]) {
    if (!this.firestore) throw new Error('Firestore not available');
    const batch = this.firestore.batch();
    
    for (const write of writes) {
      const docRef = this.firestore.collection(this.collectionName).doc(write.id);
      batch.set(docRef, {
        ...write.data,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
    
    await batch.commit();
    return { success: true };
  }
}
