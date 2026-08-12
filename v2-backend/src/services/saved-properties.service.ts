import { Injectable, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class SavedPropertiesService {
  private get db() {
    return admin.firestore();
  }

  private get collection() {
    return this.db.collection('saved_properties');
  }

  async getSavedProperties(userId: string) {
    const snapshot = await this.collection.where('userId', '==', userId).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async saveProperty(userId: string, propertyId: string, propertyData?: any) {
    const safePropertyId = encodeURIComponent(propertyId);
    const docId = `${userId}_${safePropertyId}`;
    const docRef = this.collection.doc(docId);
    
    const payload = {
      id: propertyId,
      docId,
      userId,
      propertyId,
      property: propertyData || null,
      ...(propertyData || {}),
      savedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await docRef.set(payload, { merge: true });
    return payload;
  }

  async unsaveProperty(userId: string, propertyId: string) {
    const safePropertyId = encodeURIComponent(propertyId);
    const docId = `${userId}_${safePropertyId}`;
    await this.collection.doc(docId).delete().catch(() => null);

    // Query fallback for legacy saved documents
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .get()
      .catch(() => null);

    if (snapshot && !snapshot.empty) {
      const docsToDelete = snapshot.docs.filter(doc => {
        const data = doc.data();
        return data.propertyId === propertyId || data.propertyId === safePropertyId || data.id === propertyId;
      });

      if (docsToDelete.length > 0) {
        const batch = this.db.batch();
        docsToDelete.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }
    }

    return { success: true, message: 'Property unsaved successfully' };
  }
}
