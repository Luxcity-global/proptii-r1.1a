import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import * as admin from 'firebase-admin';

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
    const col = this.collection;
    if (!col) return [];

    try {
      const snapshot = await col.limit(limit).get();
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
      console.warn('[NativePropertiesService] Firestore search error:', err?.message || err);
      return [];
    }
  }

  async findAllByUser(userId?: string, email?: string) {
    const col = this.collection;
    if (!col) return [];

    try {
      const docMap = new Map<string, any>();
      if (userId) {
        const snap1 = await col.where('userId', '==', userId).get();
        snap1.docs.forEach((doc) => docMap.set(doc.id, { id: doc.id, ...doc.data() }));
      }
      if (email) {
        const snap2 = await col.where('ownerEmail', '==', email.toLowerCase().trim()).get();
        snap2.docs.forEach((doc) => docMap.set(doc.id, { id: doc.id, ...doc.data() }));
      }

      return Array.from(docMap.values());
    } catch (err: any) {
      console.warn('[NativePropertiesService] Firestore findAllByUser error:', err?.message || err);
      return [];
    }
  }

  async findById(id: string) {
    const col = this.collection;
    if (!col) return null;

    try {
      const doc = await col.doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() };
    } catch (err: any) {
      console.warn('[NativePropertiesService] Firestore findById error:', err?.message || err);
      return null;
    }
  }

  async create(data: any) {
    const col = this.collection;
    if (!col) {
      throw new InternalServerErrorException('Firestore database connection is unavailable. Property could not be saved to DB.');
    }

    try {
      const docRef = col.doc();
      const propertyData = {
        ...data,
        id: docRef.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await docRef.set(propertyData);
      console.log(`[NativePropertiesService] Successfully saved property ${docRef.id} to Firestore.`);
      return propertyData;
    } catch (err: any) {
      console.error('[NativePropertiesService] Failed to save property to Firestore:', err);
      throw new InternalServerErrorException(`Failed to save property to database: ${err?.message || err}`);
    }
  }

  async update(id: string, userId: string, userEmail: string, data: any) {
    const col = this.collection;
    if (!col) {
      throw new InternalServerErrorException('Firestore database connection is unavailable.');
    }

    const docRef = col.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException('Property not found');
    }

    const existing = doc.data();
    const normalizedOwnerEmail = (existing?.ownerEmail || '').toLowerCase().trim();
    const normalizedUserEmail = (userEmail || '').toLowerCase().trim();

    const isOwner =
      existing?.userId === userId ||
      existing?.landlordId === userId ||
      (normalizedOwnerEmail && normalizedOwnerEmail === normalizedUserEmail);

    if (!isOwner) {
      throw new NotFoundException('Property not found or unauthorized');
    }

    const updatedData = {
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await docRef.update(updatedData);
    return { id, ...existing, ...updatedData };
  }

  async remove(id: string, userId: string, userEmail: string) {
    const col = this.collection;
    if (!col) {
      throw new InternalServerErrorException('Firestore database connection is unavailable.');
    }

    const docRef = col.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException('Property not found');
    }

    const existing = doc.data();
    const normalizedOwnerEmail = (existing?.ownerEmail || '').toLowerCase().trim();
    const normalizedUserEmail = (userEmail || '').toLowerCase().trim();

    const isOwner =
      existing?.userId === userId ||
      existing?.landlordId === userId ||
      (normalizedOwnerEmail && normalizedOwnerEmail === normalizedUserEmail);

    if (!isOwner) {
      throw new NotFoundException('Property not found or unauthorized');
    }

    await docRef.delete();
    return { success: true };
  }
}

