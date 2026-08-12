import { Injectable, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';

function withTimeout<T>(promise: Promise<T>, timeoutMs = 2500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore operation timed out')), timeoutMs)
    ),
  ]);
}

@Injectable()
export class NativePropertiesService {
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
    return db ? db.collection('properties') : null;
  }

  async searchPublic(query = '', limit = 50) {
    try {
      const col = this.collection;
      if (!col) return [];

      const snapshot = await withTimeout(col.limit(limit).get(), 2000);
      let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (query) {
        const q = query.toLowerCase();
        docs = docs.filter((d: any) => 
          (d.title && d.title.toLowerCase().includes(q)) ||
          (d.address && d.address.toLowerCase().includes(q)) ||
          (d.city && d.city.toLowerCase().includes(q)) ||
          (d.postcode && d.postcode.toLowerCase().includes(q))
        );
      }

      return docs;
    } catch (err: any) {
      console.warn('[NativePropertiesService] Firestore search timed out or unavailable:', err?.message || err);
      return [];
    }
  }

  async findAllByUser(userId?: string, email?: string) {
    try {
      const col = this.collection;
      if (!col) return [];

      let ref: admin.firestore.Query = col;
      if (userId) {
        ref = ref.where('userId', '==', userId);
      } else if (email) {
        ref = ref.where('ownerEmail', '==', email.toLowerCase().trim());
      }

      const snapshot = await withTimeout(ref.get(), 2000);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err: any) {
      console.warn('[NativePropertiesService] Firestore query timed out or unavailable:', err?.message || err);
      return [];
    }
  }

  async findById(id: string) {
    try {
      const col = this.collection;
      if (!col) return null;

      const doc = await withTimeout(col.doc(id).get(), 2000);
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() };
    } catch (err: any) {
      console.warn('[NativePropertiesService] Firestore findById timed out or unavailable:', err?.message || err);
      return null;
    }
  }

  async create(data: any) {
    const col = this.collection;
    if (!col) {
      return { id: `local_${Date.now()}`, ...data };
    }

    try {
      const docRef = col.doc();
      const propertyData = {
        ...data,
        id: docRef.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await withTimeout(docRef.set(propertyData), 2000);
      return propertyData;
    } catch {
      return { id: `local_${Date.now()}`, ...data };
    }
  }

  async update(id: string, userId: string, data: any) {
    const col = this.collection;
    if (!col) return { id, ...data };

    try {
      const docRef = col.doc(id);
      const doc = await withTimeout(docRef.get(), 2000);
      if (!doc.exists) {
        throw new NotFoundException('Property not found');
      }

      const existing = doc.data();
      if (existing?.userId !== userId && existing?.landlordId !== userId) {
        throw new NotFoundException('Property not found or unauthorized');
      }

      const updatedData = {
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await withTimeout(docRef.update(updatedData), 2000);
      return { id, ...existing, ...updatedData };
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
      return { id, ...data };
    }
  }

  async remove(id: string, userId: string) {
    const col = this.collection;
    if (!col) return { success: true };

    try {
      const docRef = col.doc(id);
      const doc = await withTimeout(docRef.get(), 2000);
      if (!doc.exists) {
        throw new NotFoundException('Property not found');
      }

      const existing = doc.data();
      if (existing?.userId !== userId && existing?.landlordId !== userId) {
        throw new NotFoundException('Property not found or unauthorized');
      }

      await withTimeout(docRef.delete(), 2000);
      return { success: true };
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
      return { success: true };
    }
  }
}
