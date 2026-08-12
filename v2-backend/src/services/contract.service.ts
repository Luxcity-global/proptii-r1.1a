import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);

  private get db() {
    if (!admin.apps.length) return null;
    try {
      return admin.firestore();
    } catch {
      return null;
    }
  }

  private get contractsCol() {
    const db = this.db;
    return db ? db.collection('contracts') : null;
  }

  private get templatesCol() {
    const db = this.db;
    return db ? db.collection('contractTemplates') : null;
  }

  async getContracts(tenantEmail: string) {
    const col = this.contractsCol;
    if (!col) return { success: true, data: [] };

    try {
      const snapshot = await col.where('tenantEmail', '==', tenantEmail.toLowerCase().trim()).get();
      const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...docData,
          sentDate: docData.sentDate?.toDate?.() || docData.sentDate,
          signedDate: docData.signedDate?.toDate?.() || docData.signedDate,
          expiryDate: docData.expiryDate?.toDate?.() || docData.expiryDate,
        };
      });

      data.sort((a: any, b: any) => new Date(b.sentDate || 0).getTime() - new Date(a.sentDate || 0).getTime());
      return { success: true, data };
    } catch (error: any) {
      this.logger.warn(`Error getting contracts: ${error?.message || error}`);
      return { success: true, data: [] };
    }
  }

  async saveTemplate(userId: string, body: any) {
    const col = this.templatesCol;
    const templateId = `${userId}_${Date.now()}`;
    const payload = {
      id: templateId,
      userId,
      ...body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!col) return { success: true, templateId };

    try {
      await col.doc(templateId).set(payload);
      return { success: true, templateId };
    } catch (error: any) {
      this.logger.warn(`Error saving template: ${error?.message || error}`);
      return { success: true, templateId };
    }
  }

  async getTemplates(userId: string, status = 'active') {
    const col = this.templatesCol;
    if (!col) return { success: true, templates: [] };

    try {
      const snapshot = await col
        .where('userId', '==', userId)
        .where('status', '==', status)
        .get();

      const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, templates };
    } catch (error: any) {
      this.logger.warn(`Error getting templates: ${error?.message || error}`);
      return { success: true, templates: [] };
    }
  }

  async updateTemplateStatus(id: string, status: string) {
    const col = this.templatesCol;
    if (col) {
      try {
        await col.doc(id).set({ status, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      } catch {}
    }
    return { success: true };
  }

  async deleteTemplate(id: string) {
    const col = this.templatesCol;
    if (col) {
      try {
        await col.doc(id).delete();
      } catch {}
    }
    return { success: true };
  }

  async getStats(userId: string) {
    const res = await this.getTemplates(userId, 'active');
    const total = res.templates.length;
    return {
      success: true,
      stats: { total, active: total, deleted: 0, totalSize: 0 },
    };
  }
}
