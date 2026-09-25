import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

function withTimeout<T>(promise: Promise<T>, timeoutMs = 15000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore operation timed out')), timeoutMs),
    ),
  ]);
}

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
      const snapshot = await withTimeout(col
        .where('tenantEmail', '==', tenantEmail.toLowerCase().trim())
        .select('landlordId', 'landlordEmail', 'tenantEmail', 'tenantName', 'propertyId', 'propertyAddress', 'contractName', 'title', 'fileUrl', 'documentUrl', 'templateId', 'status', 'sentDate', 'signedDate', 'expiryDate', 'documentName', 'documentSize', 'documentType', 'agentName', 'agentEmail', 'emailSent', 'emailSentDate', 'createdAt', 'updatedAt')
        .get());
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
      await withTimeout(col.doc(templateId).set(payload));
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
      const snapshot = await withTimeout(col
        .where('userId', '==', userId)
        .where('status', '==', status)
        .get());

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
        const doc = await withTimeout(col.doc(id).get());
        if (doc.exists && doc.data()?.userId !== userId) {
          throw new Error('Unauthorized template modification');
        }
        await withTimeout(col.doc(id).set({ status, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true }));
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
        const doc = await withTimeout(col.doc(id).get());
        if (doc.exists && doc.data()?.userId !== userId) {
          throw new Error('Unauthorized template deletion');
        }
        await withTimeout(col.doc(id).delete());
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

  async sendContractToTenant(landlordId: string, landlordEmail: string, body: any, file?: any) {
    const col = this.contractsCol;
    const docId = `contract_${landlordId}_${Date.now()}`;
    const payload = {
      id: docId,
      landlordId,
      landlordEmail: (body.landlordEmail || landlordEmail || '').toLowerCase().trim(),
      tenantEmail: (body.tenantEmail || body.recipientEmail || '').toLowerCase().trim(),
      tenantName: body.tenantName || body.recipientName || '',
      propertyId: body.propertyId || '',
      propertyAddress: body.propertyAddress || '',
      title: body.title || body.contractName || 'Tenancy Agreement',
      contractName: body.contractName || body.title || 'Tenancy Agreement',
      contractType: body.contractType || 'tenancy-agreement',
      fileName: file?.originalname || body.fileName || 'contract.pdf',
      fileUrl: body.fileUrl || '',
      fileBase64: body.fileBase64 || body.base64Data || (file?.buffer ? file.buffer.toString('base64') : null),
      templateId: body.templateId || '',
      status: body.status || 'sent',
      sentDate: body.sentDate || new Date().toISOString(),
      expiryDate: body.expiryDate || null,
      additionalInfo: body.additionalInfo || body.additionalEmail || body.notes || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (col) {
      try {
        await withTimeout(col.doc(docId).set(payload));
      } catch (err: any) {
        this.logger.warn(`sendContractToTenant error: ${err?.message || err}`);
      }
    }

    return { success: true, id: docId, contractId: docId, ...payload };
  }

  async createContractWithBase64(body: any, userId?: string) {
    const col = this.contractsCol;
    const contractData = body.contractData || body;
    const docId = contractData.id || `contract_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const landlordId = contractData.ownerUserId || userId || contractData.landlordId || 'unknown';

    const payload = {
      ...contractData,
      id: docId,
      title: contractData.title || contractData.contractName || 'Tenancy Agreement',
      contractName: contractData.contractName || contractData.title || 'Tenancy Agreement',
      landlordId,
      landlordEmail: (contractData.landlordEmail || '').toLowerCase().trim(),
      tenantEmail: (contractData.tenantEmail || contractData.recipientEmail || '').toLowerCase().trim(),
      tenantName: contractData.tenantName || contractData.recipientName || '',
      propertyAddress: contractData.propertyAddress || '',
      contractType: contractData.contractType || 'tenancy-agreement',
      status: contractData.status || 'sent',
      sentDate: contractData.sentDate ? new Date(contractData.sentDate).toISOString() : new Date().toISOString(),
      expiryDate: contractData.expiryDate ? new Date(contractData.expiryDate).toISOString() : null,
      fileName: body.fileName || contractData.fileName || 'contract.pdf',
      fileBase64: body.base64Data || contractData.fileBase64 || null,
      fileUrl: contractData.fileUrl || '#',
      additionalInfo: contractData.additionalInfo || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (col) {
      try {
        await withTimeout(col.doc(docId).set(payload));
        this.logger.log(`Created contract ${docId} with base64 attachment for user ${landlordId}`);
      } catch (err: any) {
        this.logger.warn(`createContractWithBase64 error: ${err?.message || err}`);
      }
    }

    return { success: true, id: docId, contractId: docId, ...payload };
  }

  async getLandlordContracts(filters: {
    userId?: string;
    landlordEmail?: string;
    landlordId?: string;
    status?: string;
    tenantId?: string;
    propertyId?: string;
  }) {
    const col = this.contractsCol;
    if (!col) return { success: true, contracts: [] };

    try {
      let query: admin.firestore.Query = col;
      const targetUserId = filters.userId || filters.landlordId;
      const targetEmail = (filters.landlordEmail || '').toLowerCase().trim();

      if (targetUserId) {
        query = query.where('landlordId', '==', targetUserId);
      } else if (targetEmail) {
        query = query.where('landlordEmail', '==', targetEmail);
      }

      const snapshot = await withTimeout(query.get(), 3500);
      let contracts = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          title: d.title || d.contractName || 'Contract',
          fileName: d.fileName || d.documentName || 'contract.pdf',
          fileUrl: d.fileUrl || d.documentUrl || '#',
          propertyAddress: d.propertyAddress || '',
          tenantName: d.tenantName || '',
          tenantEmail: d.tenantEmail || '',
          status: d.status || 'sent',
          sentDate: d.sentDate?.toDate?.() || d.sentDate ? new Date(d.sentDate) : new Date(),
          signedDate: d.signedDate?.toDate?.() || (d.signedDate ? new Date(d.signedDate) : undefined),
          expiryDate: d.expiryDate?.toDate?.() || (d.expiryDate ? new Date(d.expiryDate) : undefined),
          contractType: d.contractType || 'tenancy-agreement',
          additionalInfo: d.additionalInfo || '',
          landlordId: d.landlordId || '',
          landlordEmail: d.landlordEmail || '',
          propertyId: d.propertyId || '',
        };
      });

      if (filters.status && filters.status !== 'all') {
        contracts = contracts.filter(c => c.status === filters.status);
      }
      if (filters.propertyId) {
        contracts = contracts.filter(c => c.propertyId === filters.propertyId);
      }

      contracts.sort((a, b) => b.sentDate.getTime() - a.sentDate.getTime());
      return { success: true, contracts };
    } catch (err: any) {
      this.logger.warn(`getLandlordContracts error: ${err?.message || err}`);
      return { success: true, contracts: [] };
    }
  }

  async getContractById(contractId: string) {
    const col = this.contractsCol;
    if (!col) return { success: false, contract: null };

    try {
      const doc = await withTimeout(col.doc(contractId).get());
      if (!doc.exists) {
        return { success: false, contract: null };
      }
      const d = doc.data() || {};
      const contract = {
        id: doc.id,
        ...d,
        title: d.title || d.contractName || 'Contract',
        fileName: d.fileName || d.documentName || 'contract.pdf',
        fileUrl: d.fileUrl || d.documentUrl || '#',
        sentDate: d.sentDate?.toDate?.() || (d.sentDate ? new Date(d.sentDate) : new Date()),
        signedDate: d.signedDate?.toDate?.() || (d.signedDate ? new Date(d.signedDate) : undefined),
        expiryDate: d.expiryDate?.toDate?.() || (d.expiryDate ? new Date(d.expiryDate) : undefined),
      };
      return { success: true, contract };
    } catch (err: any) {
      this.logger.warn(`getContractById error: ${err?.message || err}`);
      return { success: false, contract: null };
    }
  }

  async updateContractStatus(contractId: string, status: string, signedDate?: string, signedBy?: string) {
    const col = this.contractsCol;
    if (!col) return { success: true };

    try {
      const payload: any = {
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (signedDate) payload.signedDate = signedDate;
      if (signedBy) payload.signedBy = signedBy;
      if (status === 'signed' && !signedDate) payload.signedDate = new Date().toISOString();

      await withTimeout(col.doc(contractId).set(payload, { merge: true }));
      return { success: true };
    } catch (err: any) {
      this.logger.warn(`updateContractStatus error: ${err?.message || err}`);
      return { success: false, error: err?.message };
    }
  }

  async deleteContract(contractId: string) {
    const col = this.contractsCol;
    if (!col) return { success: true };

    try {
      await withTimeout(col.doc(contractId).delete());
      return { success: true };
    } catch (err: any) {
      this.logger.warn(`deleteContract error: ${err?.message || err}`);
      return { success: false, error: err?.message };
    }
  }

  async getExpiringContracts(days = 7) {
    const col = this.contractsCol;
    if (!col) return { success: true, contracts: [] };

    try {
      const now = new Date();
      const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      const snapshot = await withTimeout(col.get(), 3500);

      const contracts = snapshot.docs
        .map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            title: d.title || d.contractName || 'Contract',
            fileName: d.fileName || d.documentName || 'contract.pdf',
            fileUrl: d.fileUrl || d.documentUrl || '#',
            propertyAddress: d.propertyAddress || '',
            tenantName: d.tenantName || '',
            tenantEmail: d.tenantEmail || '',
            status: d.status || 'sent',
            sentDate: d.sentDate?.toDate?.() || (d.sentDate ? new Date(d.sentDate) : new Date()),
            expiryDate: d.expiryDate?.toDate?.() || (d.expiryDate ? new Date(d.expiryDate) : undefined),
          };
        })
        .filter(c => {
          if (!c.expiryDate || c.status === 'signed') return false;
          return c.expiryDate.getTime() >= now.getTime() && c.expiryDate.getTime() <= cutoff.getTime();
        });

      return { success: true, contracts };
    } catch (err: any) {
      this.logger.warn(`getExpiringContracts error: ${err?.message || err}`);
      return { success: true, contracts: [] };
    }
  }

  async saveSignedContract(body: any, userId?: string) {
    const col = this.contractsCol;
    const docId = body.id || `signed_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const effectiveUserId = userId || body.userId || 'unknown';

    const payload = {
      ...body,
      id: docId,
      userId: effectiveUserId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (col) {
      try {
        await withTimeout(col.doc(docId).set(payload));
      } catch (err: any) {
        this.logger.warn(`saveSignedContract error: ${err?.message || err}`);
      }
    }

    return { success: true, id: docId, contractId: docId, ...payload };
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
        await withTimeout(col.doc(docId).set(payload));
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
      const snap = await withTimeout(col
        .where('tenantEmail', '==', tenantEmail.toLowerCase().trim())
        .where('landlordEmail', '==', landlordEmail.toLowerCase().trim())
        .where('title', '==', title)
        .limit(1)
        .get());
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
        await withTimeout(db.collection('signed_contracts').doc(docId).set({
          id: docId,
          to: body.to.toLowerCase().trim(),
          recipientName: safeRecipientName,
          contractName: safeContractName,
          senderName: safeSenderName,
          senderEmail: senderEmail || null,
          sentAt: new Date().toISOString(),
          status: 'sent',
        }));
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
