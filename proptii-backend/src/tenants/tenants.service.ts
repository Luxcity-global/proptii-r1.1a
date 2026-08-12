import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);
  private firestore: Firestore | null = null;
  private readonly collectionName = 'tenants';

  constructor(
    @Inject('FIRESTORE') private readonly firestoreInstance: Firestore | null,
    private readonly paymentsService: PaymentsService
  ) {
    if (this.firestoreInstance) {
      this.firestore = this.firestoreInstance;
    } else {
      this.logger.warn('Firestore not available for TenantsService');
    }
  }

  async create(userId: string, tenantData: any) {
    if (!this.firestore) throw new Error('Firestore not available');
    const docRef = this.firestore.collection(this.collectionName).doc();
    
    const now = new Date().toISOString();
    const payload = {
      ...tenantData,
      userId,
      createdAt: now,
      updatedAt: now
    };
    
    // Convert date strings to timestamps where applicable (for consistency)
    if (payload.leaseStart) payload.leaseStart = new Date(payload.leaseStart).toISOString();
    if (payload.leaseEnd) payload.leaseEnd = new Date(payload.leaseEnd).toISOString();
    if (payload.firstPaymentDate) payload.firstPaymentDate = new Date(payload.firstPaymentDate).toISOString();
    if (payload.lastPaymentDate) payload.lastPaymentDate = new Date(payload.lastPaymentDate).toISOString();
    
    await docRef.set(payload);
    
    return { id: docRef.id, ...payload };
  }

  async findAll(userId?: string, ownedPropertyIds?: string[]) {
    if (!this.firestore) return [];
    
    let snapshot;
    try {
      snapshot = await this.firestore.collection(this.collectionName)
        .orderBy('createdAt', 'desc')
        .get();
    } catch (e: any) {
      snapshot = await this.firestore.collection(this.collectionName).get();
    }
    
    let list = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    
    if (userId) {
      const propIdsSet = new Set(ownedPropertyIds || []);
      list = list.filter((t: any) => {
        if (t.userId === userId) return true;
        if (!t.userId && propIdsSet.size > 0 && t.propertyId) {
          return propIdsSet.has(t.propertyId);
        }
        return false;
      });
    }
    
    return list;
  }

  async findOne(id: string) {
    if (!this.firestore) throw new Error('Firestore not available');
    const doc = await this.firestore.collection(this.collectionName).doc(id).get();
    if (!doc.exists) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return { id: doc.id, ...doc.data() };
  }

  async update(id: string, updates: any) {
    if (!this.firestore) throw new Error('Firestore not available');
    const docRef = this.firestore.collection(this.collectionName).doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    
    const payload = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Preserve userId if not passed
    const existingData = existing.data();
    if (existingData?.userId && !payload.userId) {
      payload.userId = existingData.userId;
    }
    
    if (payload.leaseStart) payload.leaseStart = new Date(payload.leaseStart).toISOString();
    if (payload.leaseEnd) payload.leaseEnd = new Date(payload.leaseEnd).toISOString();
    if (payload.firstPaymentDate) payload.firstPaymentDate = new Date(payload.firstPaymentDate).toISOString();
    if (payload.lastPaymentDate) payload.lastPaymentDate = new Date(payload.lastPaymentDate).toISOString();
    
    await docRef.update(payload);
    return { success: true };
  }

  async remove(id: string) {
    if (!this.firestore) throw new Error('Firestore not available');
    await this.firestore.collection(this.collectionName).doc(id).delete();
    return { success: true };
  }
}
