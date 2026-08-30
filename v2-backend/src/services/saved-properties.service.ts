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

  async getSavedProperties(userId: string, limitNum?: number, lastVisibleId?: string) {
    const col = this.collection;
    if (!col) return { items: [], allIds: [] };
    try {
      // First, get all IDs for global 'isPropertySaved' checks on the frontend
      const allDocs = await col.where('userId', '==', userId).get();
      const allIds = allDocs.docs.map(doc => {
        const data = doc.data();
        return data.propertyId || data.id || doc.id;
      });

      let query = col.where('userId', '==', userId).orderBy('savedAt', 'desc');

      if (limitNum) {
        query = query.limit(limitNum);
      }

      if (lastVisibleId) {
        const lastDocRef = await col.doc(lastVisibleId).get();
        if (lastDocRef.exists) {
          query = query.startAfter(lastDocRef);
        }
      }

      const snapshot = await query.get();
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      return {
        items,
        allIds,
        lastVisible: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
        hasMore: limitNum ? snapshot.docs.length === limitNum : false
      };
    } catch (err: any) {
      console.warn('[SavedPropertiesService] getSavedProperties error:', err?.message || err);
      // Fallback for missing index: return all un-ordered, but still slice them manually
      try {
         const allDocs = await col.where('userId', '==', userId).get();
         let items = allDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
         items.sort((a: any, b: any) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
         
         const allIds = items.map((i: any) => i.propertyId || i.id);
         
         if (lastVisibleId) {
            const idx = items.findIndex(i => i.id === lastVisibleId);
            if (idx !== -1) items = items.slice(idx + 1);
         }
         
         const hasMore = limitNum ? items.length > limitNum : false;
         if (limitNum) items = items.slice(0, limitNum);
         
         return {
           items,
           allIds,
           lastVisible: items.length > 0 ? items[items.length - 1].id : null,
           hasMore
         };
      } catch (fallbackErr) {
        return { items: [], allIds: [], lastVisible: null, hasMore: false };
      }
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
