import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { serializeUserDates } from '../utils/firestore-date';

@Injectable()
export class LandlordsService {
  private readonly logger = new Logger(LandlordsService.name);

  private get db() {
    if (!admin.apps.length) return null;
    try { return admin.firestore(); } catch { return null; }
  }

  private get usersCol() {
    const db = this.db;
    return db ? db.collection('users') : null;
  }

  async getAllLandlords() {
    const col = this.usersCol;
    if (!col) return { users: [] };
    try {
      const snap = await col
        .where('role', 'in', ['landlord', 'agent'])
        .get();
      const users = snap.docs.map((doc) => serializeUserDates({ id: doc.id, ...doc.data() }));
      return { users };
    } catch (err: any) {
      this.logger.warn(`getAllLandlords error: ${err?.message || err}`);
      return { users: [] };
    }
  }

  async checkLandlord(email: string) {
    const col = this.usersCol;
    if (!col) return { exists: false };
    try {
      const snap = await col
        .where('email', '==', email.toLowerCase().trim())
        .where('role', 'in', ['landlord', 'agent'])
        .limit(1)
        .get();
      if (snap.empty) return { exists: false };
      const user = { id: snap.docs[0].id, ...snap.docs[0].data() };
      return { exists: true, user };
    } catch (err: any) {
      this.logger.warn(`checkLandlord error: ${err?.message || err}`);
      return { exists: false };
    }
  }

  async registerLandlord(data: any) {
    const col = this.usersCol;
    const docId = `landlord_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const payload = {
      id: docId,
      ...data,
      email: (data.email || '').toLowerCase().trim(),
      role: data.role || 'landlord',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (col) {
      try {
        await col.doc(docId).set(payload);
      } catch (err: any) {
        this.logger.warn(`registerLandlord error: ${err?.message || err}`);
      }
    }
    return { success: true, id: docId, ...payload };
  }

  async getAllTenants() {
    const col = this.usersCol;
    if (!col) return { users: [] };
    try {
      const snap = await col.where('role', '==', 'tenant').get();
      const users = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { users };
    } catch (err: any) {
      this.logger.warn(`getAllTenants error: ${err?.message || err}`);
      return { users: [] };
    }
  }

  async getLandlordById(id: string) {
    const col = this.usersCol;
    if (!col) return { success: false, user: null };
    try {
      const doc = await col.doc(id).get();
      if (!doc.exists) return { success: false, user: null };
      return { success: true, user: serializeUserDates({ id: doc.id, ...doc.data() }) };
    } catch (err: any) {
      this.logger.warn(`getLandlordById error: ${err?.message || err}`);
      return { success: false, user: null };
    }
  }

  async updateLandlord(id: string, updates: any) {
    const col = this.usersCol;
    if (!col) return { success: true };
    try {
      await col.doc(id).set(
        { ...updates, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true },
      );
      return { success: true };
    } catch (err: any) {
      this.logger.warn(`updateLandlord error: ${err?.message || err}`);
      return { success: false, error: err?.message };
    }
  }

  async deleteLandlord(id: string) {
    const col = this.usersCol;
    if (!col) return { success: true };
    try {
      await col.doc(id).delete();
      return { success: true };
    } catch (err: any) {
      this.logger.warn(`deleteLandlord error: ${err?.message || err}`);
      return { success: false, error: err?.message };
    }
  }
}
