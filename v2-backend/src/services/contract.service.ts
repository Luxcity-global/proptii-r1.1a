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
      const snapshot = await col
        .where('tenantEmail', '==', tenantEmail.toLowerCase().trim())
        .select('landlordId', 'landlordEmail', 'tenantEmail', 'tenantName', 'propertyId', 'propertyAddress', 'contractName', 'fileUrl', 'documentUrl', 'templateId', 'status', 'sentDate', 'signedDate', 'expiryDate', 'documentName', 'documentSize', 'documentType', 'agentName', 'agentEmail', 'emailSent', 'emailSentDate', 'createdAt', 'updatedAt')
        .get();
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

  async updateTemplateStatus(id: string, userId: string, status: string) {
    const col = this.templatesCol;
    if (col) {
      try {
        const doc = await col.doc(id).get();
        if (doc.exists && doc.data()?.userId !== userId) {
          throw new Error('Unauthorized template modification');
        }
        await col.doc(id).set({ status, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      } catch (e: any) {
        this.logger.warn(`Error updating template status: ${e?.message}`);
        throw e;
      }
    }
    return { success: true };
  }

  async deleteTemplate(id: string, userId: string) {
    const col = this.templatesCol;
    if (col) {
      try {
        const doc = await col.doc(id).get();
        if (doc.exists && doc.data()?.userId !== userId) {
          throw new Error('Unauthorized template deletion');
        }
        await col.doc(id).delete();
      } catch (e: any) {
        this.logger.warn(`Error deleting template: ${e?.message}`);
        throw e;
      }
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

  async sendContractToTenant(landlordId: string, landlordEmail: string, body: any) {
    const col = this.contractsCol;
    const docId = `contract_${landlordId}_${Date.now()}`;
    const payload = {
      id: docId,
      landlordId,
      landlordEmail,
      tenantEmail: (body.tenantEmail || '').toLowerCase().trim(),
      tenantName: body.tenantName || '',
      propertyId: body.propertyId || '',
      propertyAddress: body.propertyAddress || '',
      contractName: body.contractName || 'Tenancy Agreement',
      fileUrl: body.fileUrl || '',
      templateId: body.templateId || '',
      status: 'sent',
      sentDate: new Date().toISOString(),
      expiryDate: body.expiryDate || null,
    };

    if (col) {
      try {
        await col.doc(docId).set(payload);
      } catch (err: any) {
        this.logger.warn(`sendContractToTenant error: ${err?.message || err}`);
      }
    }

    return { success: true, contractId: docId, ...payload };
  }

  async syncContractToLandlord(body: any) {
    const col = this.contractsCol;
    const docId = `landlord_contract_${Date.now()}`;
    const payload = {
      id: docId,
      ...body,
      tenantEmail: (body.tenantEmail || '').toLowerCase().trim(),
      landlordEmail: (body.landlordEmail || '').toLowerCase().trim(),
      syncedAt: new Date().toISOString(),
    };
    if (col) {
      try {
        await col.doc(docId).set(payload);
      } catch (err: any) {
        this.logger.warn(`syncContractToLandlord error: ${err?.message || err}`);
      }
    }
    return { success: true, id: docId, contractId: docId };
  }

  async contractExists(tenantEmail: string, title: string, landlordEmail: string) {
    const col = this.contractsCol;
    if (!col) return { exists: false };
    try {
      const snap = await col
        .where('tenantEmail', '==', tenantEmail.toLowerCase().trim())
        .where('landlordEmail', '==', landlordEmail.toLowerCase().trim())
        .where('title', '==', title)
        .limit(1)
        .get();
      return { exists: !snap.empty };
    } catch (err: any) {
      this.logger.warn(`contractExists error: ${err?.message || err}`);
      return { exists: false };
    }
  }

  async sendSignedContract(body: any, senderEmail: string, file?: any) {
    if (!body?.to || typeof body.to !== 'string' || !body.to.includes('@')) {
      return { success: false, error: 'Invalid recipient email address' };
    }

    const safeContractName = String(body.contractName || 'Tenancy Contract').replace(/[<>&"']/g, '').slice(0, 120);
    const safeRecipientName = String(body.recipientName || 'Valued Client').replace(/[<>&"']/g, '').slice(0, 100);
    const safeSenderName = String(senderEmail || body.senderName || 'Proptii').replace(/[<>&"']/g, '').slice(0, 100);

    // Persist the signed contract record to Firestore
    const db = this.db;
    if (db) {
      try {
        const docId = `signed_${Date.now()}`;
        await db.collection('signed_contracts').doc(docId).set({
          id: docId,
          to: body.to.toLowerCase().trim(),
          recipientName: safeRecipientName,
          contractName: safeContractName,
          senderName: safeSenderName,
          senderEmail: senderEmail || null,
          sentAt: new Date().toISOString(),
          status: 'sent',
        });
      } catch (err: any) {
        this.logger.warn(`sendSignedContract persist error: ${err?.message || err}`);
      }
    }

    // Email delivery via Resend with strictly safe server-rendered template
    try {
      const { sendEmail } = await import('../utils/resend');

      let attachments: any[] | undefined;
      if (file && file.buffer) {
        attachments = [{
          filename: file.originalname || `${safeContractName.replace(/[^a-zA-Z0-9_-]/g, '_')}_signed.pdf`,
          content: file.buffer.toString('base64'),
          content_type: file.mimetype || 'application/pdf',
        }];
      } else if (body.attachmentBase64) {
        attachments = [{
          filename: `${safeContractName.replace(/[^a-zA-Z0-9_-]/g, '_')}_signed.pdf`,
          content: body.attachmentBase64,
          content_type: 'application/pdf',
        }];
      }

      const safeHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #111827; margin-bottom: 16px;">Signed Document Available</h2>
          <p>Hello ${safeRecipientName},</p>
          <p>Please find attached the signed contract document: <strong>${safeContractName}</strong>.</p>
          <p style="margin-top: 16px; font-size: 14px; color: #6b7280;">Sent by: ${safeSenderName}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #9ca3af;">This email was sent via Proptii on behalf of ${safeSenderName}. If you were not expecting this document, please contact support.</p>
        </div>
      `;

      const id = await sendEmail({
        to: body.to.toLowerCase().trim(),
        subject: `Signed Contract: ${safeContractName}`,
        html: safeHtml,
        attachments,
      });

      this.logger.log(`Signed contract email sent to ${body.to} [${id}]`);
      return { success: true, message: 'Signed contract emailed successfully', messageId: id };
    } catch (err: any) {
      this.logger.error(`sendSignedContract email error: ${err?.message || err}`);
      return { success: false, error: err?.message || 'Email delivery failed' };
    }
  }
}
