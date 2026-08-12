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

  async getAllUsers() {
    const col = this.usersCol;
    if (!col) return [];
    try {
      const snap = await col.limit(500).get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err: any) {
      this.logger.warn(`getAllUsers error: ${err?.message || err}`);
      return [];
    }
  }

  async createUser(data: any) {
    const col = this.usersCol;
    const uid = data.uid || data.id || `user_${Date.now()}`;
    const payload = {
      uid,
      ...data,
      email: (data.email || '').toLowerCase().trim(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (col) {
      try {
        await col.doc(uid).set(payload, { merge: true });
      } catch (err: any) {
        this.logger.warn(`createUser error: ${err?.message || err}`);
      }
    }
    return payload;
  }

  async deleteUser(uid: string) {
    const col = this.usersCol;
    if (col) {
      try {
        await col.doc(uid).delete();
      } catch (err: any) {
        this.logger.warn(`deleteUser error: ${err?.message || err}`);
      }
    }
    return { success: true };
  }

  async getReviewStats(propertyId?: string) {
    const reviews = await this.getReviews(propertyId);
    const arr = Array.isArray(reviews) ? reviews : [];
    const total = arr.length;
    const avg = total > 0
      ? arr.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0) / total
      : 0;
    const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    arr.forEach((r: any) => {
      const rating = Math.round(Number(r.rating));
      if (rating >= 1 && rating <= 5) breakdown[rating]++;
    });
    return { total, average: Math.round(avg * 10) / 10, breakdown };
  }
}
