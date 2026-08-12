import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

@Injectable()
export class RefereeGuarantorService {
  private readonly logger = new Logger(RefereeGuarantorService.name);

  private get db() {
    if (!admin.apps.length) return null;
    try { return admin.firestore(); } catch { return null; }
  }

  async getResponses(userId: string) {
    const db = this.db;
    if (!db) return { responses: [] };
    try {
      const snap = await db.collection('referee_guarantor_responses')
        .where('tenantId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      return { responses: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) };
    } catch (err: any) {
      this.logger.warn(`getResponses error: ${err?.message || err}`);
      return { responses: [] };
    }
  }

  async saveResponse(data: any) {
    const db = this.db;
    const docId = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const payload = {
      id: docId,
      ...data,
      createdAt: new Date().toISOString(),
    };
    if (db) {
      try {
        await db.collection('referee_guarantor_responses').doc(docId).set(payload);
      } catch (err: any) {
        this.logger.warn(`saveResponse error: ${err?.message || err}`);
      }
    }
    return { success: true, id: docId };
  }

  async sendReferencingEmail(payload: {
    to: string;
    tenantName: string;
    type: 'referee' | 'guarantor';
    formUrl: string;
    senderName?: string;
  }) {
    const { to, tenantName, type, formUrl, senderName = 'Proptii Team' } = payload;

    const subject = type === 'referee'
      ? `Reference Request for ${tenantName}`
      : `Guarantor Request for ${tenantName}`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; background: #fff; border-radius: 8px;">
        <h2 style="color: #136C9E;">Proptii Referencing Request</h2>
        <p>Hi,</p>
        <p>You have been asked to provide a <strong>${type === 'referee' ? 'reference' : 'guarantor confirmation'}</strong> for <strong>${tenantName}</strong> as part of their rental application.</p>
        <p>Please click the link below to complete the form:</p>
        <p><a href="${formUrl}" style="background: #DC5F12; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">Complete ${type === 'referee' ? 'Reference' : 'Guarantor'} Form</a></p>
        <p>If you have any questions, please contact us at <a href="mailto:contactus@theluxcity.co.uk">contactus@theluxcity.co.uk</a>.</p>
        <p>Best regards,<br>${senderName}</p>
      </div>
    `;

    try {
      const smtpHost = process.env.SMTP_HOST;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      if (smtpHost && smtpUser && smtpPass) {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(process.env.SMTP_PORT || '465'),
          secure: true,
          auth: { user: smtpUser, pass: smtpPass },
        });

        await transporter.sendMail({
          from: `"${senderName}" <${process.env.SMTP_FROM_EMAIL || smtpUser}>`,
          to,
          subject,
          html: htmlBody,
        });

        this.logger.log(`Referencing email sent to ${to} (${type})`);
        return { success: true, message: 'Email sent successfully' };
      }

      // Log if no SMTP configured — in production this should always be set
      this.logger.warn('SMTP not configured — referencing email not sent');
      return { success: false, message: 'Email service not configured' };
    } catch (err: any) {
      this.logger.error(`sendReferencingEmail error: ${err?.message || err}`);
      return { success: false, error: err?.message || 'Failed to send email' };
    }
  }
}
