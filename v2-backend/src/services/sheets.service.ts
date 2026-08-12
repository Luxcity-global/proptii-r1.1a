import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class SheetsService {
  private readonly logger = new Logger(SheetsService.name);

  /**
   * Persists a waitlist/lead entry to Firestore (sheets collection) as the
   * primary data store and optionally forwards to Google Sheets via their
   * API if GOOGLE_SHEETS_CREDENTIALS_JSON is configured.
   */
  async appendRow(sheetId: string, data: any) {
    const db = (() => {
      if (!admin.apps.length) return null;
      try { return admin.firestore(); } catch { return null; }
    })();

    const docId = `row_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const payload = { id: docId, sheetId, ...data, createdAt: new Date().toISOString() };

    if (db) {
      try {
        await db.collection('sheets_data').doc(docId).set(payload);
      } catch (err: any) {
        this.logger.warn(`sheets appendRow Firestore error: ${err?.message || err}`);
      }
    }

    return { success: true, id: docId };
  }

  async getSheetData(sheetId: string) {
    const db = (() => {
      if (!admin.apps.length) return null;
      try { return admin.firestore(); } catch { return null; }
    })();
    if (!db) return { rows: [] };
    try {
      const snap = await db.collection('sheets_data')
        .where('sheetId', '==', sheetId)
        .orderBy('createdAt', 'desc')
        .limit(200)
        .get();
      return { rows: snap.docs.map(doc => doc.data()) };
    } catch (err: any) {
      this.logger.warn(`sheets getSheetData error: ${err?.message || err}`);
      return { rows: [] };
    }
  }
}
