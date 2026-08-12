import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  private get db() {
    if (!admin.apps.length) return null;
    try { return admin.firestore(); } catch { return null; }
  }

  private get col() {
    const db = this.db;
    return db ? db.collection('alerts') : null;
  }

  async getAlerts(userId: string) {
    const col = this.col;
    if (!col) return { alerts: [] };
    try {
      const snap = await col.where('userId', '==', userId).orderBy('createdAt', 'desc').get();
      return { alerts: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) };
    } catch (err: any) {
      this.logger.warn(`getAlerts error: ${err?.message || err}`);
      return { alerts: [] };
    }
  }

  async createAlert(userId: string, data: any) {
    const col = this.col;
    const docId = `alert_${userId}_${Date.now()}`;
    const payload = {
      id: docId,
      userId,
      ...data,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    if (col) {
      try { await col.doc(docId).set(payload); } catch (err: any) {
        this.logger.warn(`createAlert error: ${err?.message || err}`);
      }
    }
    return { success: true, id: docId, ...payload };
  }

  async markAlertRead(alertId: string) {
    const col = this.col;
    if (col) {
      try { await col.doc(alertId).set({ isRead: true, readAt: new Date().toISOString() }, { merge: true }); }
      catch (err: any) { this.logger.warn(`markAlertRead error: ${err?.message || err}`); }
    }
    return { success: true };
  }

  async deleteAlert(alertId: string) {
    const col = this.col;
    if (col) {
      try { await col.doc(alertId).delete(); } catch (err: any) {
        this.logger.warn(`deleteAlert error: ${err?.message || err}`);
      }
    }
    return { success: true };
  }
}
