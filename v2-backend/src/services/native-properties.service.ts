import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import * as admin from 'firebase-admin';

function isPropertyAuthorized(existing: any, userId?: string, userEmail?: string): boolean {
  if (!existing) return false;

  const uid = (userId || '').trim();
  const email = (userEmail || '').trim().toLowerCase();

  // 1. Direct UID matching across UID-like fields
  if (uid) {
    if (existing.userId && String(existing.userId).trim() === uid) return true;
    if (existing.landlordId && String(existing.landlordId).trim() === uid) return true;
    if (existing.ownerId && String(existing.ownerId).trim() === uid) return true;
  }

  // 2. Direct Email matching across all potential email/user fields
  if (email) {
    const candidateEmails = [
      existing.ownerEmail,
      existing.landlordEmail,
      existing.email,
      existing.userEmail,
      existing.userId,     // often saved as email
      existing.landlordId, // often saved as email
    ]
      .filter(Boolean)
      .map(e => String(e).trim().toLowerCase());

    if (candidateEmails.includes(email)) return true;
  }

  // 3. Reverse UID match if UID passed is an email
  if (uid && uid.includes('@')) {
    const uidEmail = uid.toLowerCase();
    const candidateEmails = [
      existing.ownerEmail,
      existing.landlordEmail,
      existing.email,
      existing.userEmail,
      existing.userId,
      existing.landlordId,
    ]
      .filter(Boolean)
      .map(e => String(e).trim().toLowerCase());

    if (candidateEmails.includes(uidEmail)) return true;
  }

  return false;
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
      const uid = (userId || '').trim();
      const mail = (email || '').trim().toLowerCase();

      if (uid) {
        const [snap1, snap2] = await Promise.all([
          col.where('userId', '==', uid).get().catch(() => ({ docs: [] })),
          col.where('landlordId', '==', uid).get().catch(() => ({ docs: [] })),
        ]);
        snap1.docs.forEach((doc: any) => docMap.set(doc.id, { id: doc.id, ...doc.data() }));
        snap2.docs.forEach((doc: any) => docMap.set(doc.id, { id: doc.id, ...doc.data() }));
      }

      if (mail) {
        const [s3, s4, s5, s6, s7] = await Promise.all([
          col.where('ownerEmail', '==', mail).get().catch(() => ({ docs: [] })),
          col.where('landlordEmail', '==', mail).get().catch(() => ({ docs: [] })),
          col.where('email', '==', mail).get().catch(() => ({ docs: [] })),
          col.where('userId', '==', mail).get().catch(() => ({ docs: [] })),
          col.where('landlordId', '==', mail).get().catch(() => ({ docs: [] })),
        ]);
        s3.docs.forEach((doc: any) => docMap.set(doc.id, { id: doc.id, ...doc.data() }));
        s4.docs.forEach((doc: any) => docMap.set(doc.id, { id: doc.id, ...doc.data() }));
        s5.docs.forEach((doc: any) => docMap.set(doc.id, { id: doc.id, ...doc.data() }));
        s6.docs.forEach((doc: any) => docMap.set(doc.id, { id: doc.id, ...doc.data() }));
        s7.docs.forEach((doc: any) => docMap.set(doc.id, { id: doc.id, ...doc.data() }));
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
    if (!isPropertyAuthorized(existing, userId, userEmail)) {
      throw new NotFoundException('Property not found or unauthorized');
    }

    // Clean undefined values to prevent Firestore driver errors
    const cleanedData = JSON.parse(JSON.stringify(data, (key, value) => value === undefined ? null : value));

    const updatedData = {
      ...cleanedData,
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
    if (!isPropertyAuthorized(existing, userId, userEmail)) {
      throw new NotFoundException('Property not found or unauthorized');
    }

    await docRef.delete();

    // If documents were assigned to this property in landlord_documents, unassign them
    try {
      const db = this.db;
      if (db) {
        const snap = await db.collection('landlord_documents').where('propertyId', '==', id).get();
        if (!snap.empty) {
          const batch = db.batch();
          snap.docs.forEach(d => {
            batch.update(d.ref, { propertyId: null, updatedAt: new Date().toISOString() });
          });
          await batch.commit();
        }
      }
    } catch {}

    return { success: true };
  }
}

