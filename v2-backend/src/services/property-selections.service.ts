import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class PropertySelectionsService {
  private readonly logger = new Logger(PropertySelectionsService.name);

  private get db() {
    if (!admin.apps.length) return null;
    try { return admin.firestore(); } catch { return null; }
  }

  private get col() {
    const db = this.db;
    return db ? db.collection('property_selections') : null;
  }

  async getSelections(userId: string, status?: string) {
    const col = this.col;
    if (!col) return { selections: [] };
    try {
      let query: admin.firestore.Query = col.where('userId', '==', userId);
      const snap = await query.get();
      let selections = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (status) selections = selections.filter((s: any) => s.status === status);
      return { selections };
    } catch (err: any) {
      this.logger.warn(`getSelections error: ${err?.message || err}`);
      return { selections: [] };
    }
  }

  async createSelection(userId: string, data: any) {
    const col = this.col;
    const docId = `sel_${userId}_${Date.now()}`;
    const payload = {
      id: docId,
      userId,
      ...data,
      status: data.status || 'interested',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (col) {
      try {
        await col.doc(docId).set(payload);
      } catch (err: any) {
        this.logger.warn(`createSelection error: ${err?.message || err}`);
      }
    }
    return { success: true, id: docId, ...payload };
  }

  async updateSelectionStatus(selectionId: string, status: string, notes?: string) {
    const col = this.col;
    const update: any = { status, updatedAt: new Date().toISOString() };
    if (notes) update.notes = notes;
    if (col) {
      try {
        await col.doc(selectionId).set(update, { merge: true });
      } catch (err: any) {
        this.logger.warn(`updateSelectionStatus error: ${err?.message || err}`);
      }
    }
    return { success: true };
  }

  async deleteSelection(selectionId: string) {
    const col = this.col;
    if (col) {
      try {
        await col.doc(selectionId).delete();
      } catch (err: any) {
        this.logger.warn(`deleteSelection error: ${err?.message || err}`);
      }
    }
    return { success: true };
  }

  async getStats(userId: string) {
    const { selections } = await this.getSelections(userId);
    const stats = {
      total: selections.length,
      interested: 0,
      viewingRequested: 0,
      viewingScheduled: 0,
      viewingCompleted: 0,
      rejected: 0,
    };
    for (const s of selections as any[]) {
      switch (s.status) {
        case 'interested': stats.interested++; break;
        case 'viewing_requested': stats.viewingRequested++; break;
        case 'viewing_scheduled': stats.viewingScheduled++; break;
        case 'viewing_completed': stats.viewingCompleted++; break;
        case 'rejected': stats.rejected++; break;
      }
    }
    return { stats };
  }
}
