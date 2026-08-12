import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class UserProfileService {
  private readonly logger = new Logger(UserProfileService.name);

  private get db() {
    if (!admin.apps.length) return null;
    try {
      return admin.firestore();
    } catch {
      return null;
    }
  }

  private get usersCol() {
    const db = this.db;
    return db ? db.collection('users') : null;
  }

  private get reviewsCol() {
    const db = this.db;
    return db ? db.collection('reviews') : null;
  }

  async getProfile(uid: string) {
    const col = this.usersCol;
    if (!col) return { uid, role: 'tenant' };

    try {
      const doc = await col.doc(uid).get();
      if (!doc.exists) {
        return { uid, role: 'tenant' };
      }
      return { uid: doc.id, ...doc.data() };
    } catch (err: any) {
      this.logger.warn(`Failed to get user profile for ${uid}: ${err?.message || err}`);
      return { uid, role: 'tenant' };
    }
  }

  async updateProfile(uid: string, profileData: any) {
    const col = this.usersCol;
    const payload = {
      uid,
      ...profileData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!col) return payload;

    try {
      await col.doc(uid).set(payload, { merge: true });
      return payload;
    } catch {
      return payload;
    }
  }

  async getReviews(propertyId?: string) {
    const col = this.reviewsCol;
    if (!col) return [];

    try {
      let query: any = col;
      if (propertyId) {
        query = col.where('propertyId', '==', propertyId);
      }
      const snapshot = await query.get();
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch {
      return [];
    }
  }

  async createReview(userId: string, data: any) {
    const col = this.reviewsCol;
    const docId = `rev_${Date.now()}`;
    const payload = {
      id: docId,
      userId,
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!col) return payload;

    try {
      await col.doc(docId).set(payload);
      return payload;
    } catch {
      return payload;
    }
  }
}
