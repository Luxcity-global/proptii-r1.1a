import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

function sanitizeFirestoreData(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(sanitizeFirestoreData);
  if (typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val !== undefined) clean[key] = sanitizeFirestoreData(val);
    }
    return clean;
  }
  return obj;
}

@Injectable()
export class SavedPropertiesService {
  private get db(): admin.firestore.Firestore | null {
    if (!admin.apps.length) return null;
    try { return admin.firestore(); } catch { return null; }
  }

  private get collection() {
    const db = this.db;
    return db ? db.collection('saved_properties') : null;
  }

  async getSavedProperties(userId: string) {
    const col = this.collection;
    if (!col) return [];
    try {
      const snapshot = await col.where('userId', '==', userId).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err: any) {
      console.warn('[SavedPropertiesService] getSavedProperties error:', err?.message || err);
      return [];
    }
  }

  async saveProperty(userId: string, propertyId: string, propertyData?: any) {
    const validId = propertyId || `prop_${Date.now()}`;
    const safePropertyId = encodeURIComponent(validId);
    const docId = `${userId}_${safePropertyId}`;
    const payload = sanitizeFirestoreData({
      id: validId,
      docId,
      userId,
      propertyId: validId,
      ...(propertyData || {}),
      savedAt: new Date().toISOString(),
    });
    const col = this.collection;
    if (col) {
      try {
        await col.doc(docId).set(payload, { merge: true });
      } catch (err: any) {
        console.warn('[SavedPropertiesService] saveProperty error:', err?.message || err);
      }
    }
    return payload;
  }

  async unsaveProperty(userId: string, propertyId: string) {
    const col = this.collection;
    if (!col) return { success: true, message: 'Property unsaved successfully' };
    try {
      const safePropertyId = encodeURIComponent(propertyId);
      const docId = `${userId}_${safePropertyId}`;
      await col.doc(docId).delete().catch(() => null);

      const snapshot = await col.where('userId', '==', userId).get().catch(() => null);
      if (snapshot && !snapshot.empty) {
        const docsToDelete = snapshot.docs.filter(doc => {
          const data = doc.data();
          return data.propertyId === propertyId || data.propertyId === safePropertyId || data.id === propertyId;
        });
        if (docsToDelete.length > 0) {
          const batch = this.db!.batch();
          docsToDelete.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }
      }
    } catch (err: any) {
      console.warn('[SavedPropertiesService] unsaveProperty error:', err?.message || err);
    }
    return { success: true, message: 'Property unsaved successfully' };
  }
}
