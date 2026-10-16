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

async function hydrateSavedPropertyItems(items: any[], db: admin.firestore.Firestore | null): Promise<any[]> {
  if (!db || !Array.isArray(items) || items.length === 0) return items;
  try {
    const propIds = Array.from(new Set(items.map((i: any) => i.propertyId || i.id).filter(Boolean)));
    const propDocs = await Promise.all(
      propIds.map(async (pid: string) => {
        try {
          const doc = await db.collection('properties').doc(pid).get();
          return doc.exists ? { id: doc.id, ...doc.data() } : null;
        } catch {
          return null;
        }
      })
    );
    const propMap = new Map<string, any>();
    propDocs.forEach((p: any) => {
      if (p && p.id) propMap.set(p.id, p);
    });

    return items.map((item: any) => {
      const full = propMap.get(item.propertyId) || propMap.get(item.id);
      if (full) {
        const amenities = Array.isArray(full.amenities) ? full.amenities : (Array.isArray(item.amenities) ? item.amenities : []);
        const kitchenFeatures = amenities.filter((a: string) => /kitchen|cooker|oven|hob|dishwasher|fridge|freezer/i.test(a));
        const kitchenDetails = full.kitchenDetails || full.kitchenFeatures || item.kitchenDetails || (kitchenFeatures.length > 0 ? kitchenFeatures.join(', ') : 'Fully fitted kitchen with integrated appliances');
        const desc = full.notes || full.description || item.description ||
          `Spacious ${full.bedrooms || item.bedrooms || '1'}-bedroom ${full.propertyType || item.propertyType || 'property'} located in ${full.address || full.city || item.location || 'a prime area'}.`;

        return {
          ...item,
          title: full.title || item.title,
          description: desc,
          notes: full.notes || item.notes || desc,
          bathrooms: full.bathrooms ?? item.bathrooms ?? 1,
          bathroom_count: full.bathrooms ?? item.bathrooms ?? 1,
          bedrooms: full.bedrooms ?? item.bedrooms,
          squareFootage: full.squareFootage ?? item.squareFootage,
          sq_ft: full.squareFootage ?? item.squareFootage,
          kitchenDetails,
          kitchenFeatures,
          amenities,
          agent: full.agent || item.agent,
        };
      }
      return item;
    });
  } catch (e) {
    console.warn('[SavedPropertiesService] hydration warning:', e);
    return items;
  }
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
      let items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      items = await hydrateSavedPropertyItems(items, this.db);

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
         items = await hydrateSavedPropertyItems(items, this.db);
         
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
    if (!col) {
      throw new Error('Firestore database connection is unavailable.');
    }
    await col.doc(docId).set(payload, { merge: true });
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
