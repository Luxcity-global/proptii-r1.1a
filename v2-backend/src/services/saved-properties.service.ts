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
    const docId = `${userId}_${propertyId}`;
    const docRef = this.collection.doc(docId);
    
    const payload = {
      id: docId,
      userId,
      propertyId,
      property: propertyData || null,
      savedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await docRef.set(payload, { merge: true });
    return payload;
  }

  async unsaveProperty(userId: string, propertyId: string) {
    const docId = `${userId}_${propertyId}`;
    const docRef = this.collection.doc(docId);
    await docRef.delete();
    return { success: true, message: 'Property unsaved successfully' };
  }
}
