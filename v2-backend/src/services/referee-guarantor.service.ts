import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { randomUUID } from 'crypto';
import { sendEmail } from '../utils/resend';

@Injectable()
export class RefereeGuarantorService {
  private readonly logger = new Logger(RefereeGuarantorService.name);
  private readonly frontendUrl: string;

  constructor() {
    this.frontendUrl = process.env.FRONTEND_URL || 'https://proptii.co';
  }

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

  /**
   * Save an incoming referee or guarantor response, auto-update tenant's passport,
   * and send notification emails to both tenant and guarantor.
   */
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
        this.logger.log(`✅ Saved response ${docId} for type ${data.responseType || data.type}`);

        // If this is a guarantor response, automatically reflect in tenant's referencing passport
        if (data.responseType === 'guarantor' || data.type === 'guarantor_response') {
          if (data.token) {
            try {
              await db.collection('guarantor_invitations').doc(data.token).set({
                status: 'completed',
                completedAt: new Date().toISOString(),
                guarantorResponseId: docId
              }, { merge: true });
            } catch (invErr: any) {
              this.logger.warn(`Could not update guarantor_invitation status: ${invErr?.message || invErr}`);
            }
          }
          await this.reflectGuarantorInReferencing(data);
          await this.sendGuarantorCompletionEmails(data);
        }
      } catch (err: any) {
        this.logger.warn(`saveResponse error: ${err?.message || err}`);
      }
    }
    return { success: true, id: docId };
  }

  /**
   * Update tenant's referencing form in Firestore so guarantor details immediately reflect
   */
  private async reflectGuarantorInReferencing(data: any) {
    const db = this.db;
    if (!db) return;

    try {
      const tenantId = data.tenantId;
      const tenantEmail = (data.tenantEmail || data.applicantEmail || '').toLowerCase().trim();

      const guarantorData = {
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || data.phone || '',
        address: data.address || '',
        employmentStatus: data.employmentStatus || '',
        annualIncome: data.annualIncome || '',
        relationship: data.relationship || '',
        consent: data.consent || 'agree',
        reason: data.reason || '',
        submittedAt: new Date().toISOString(),
        verifiedViaLink: true,
        identityDocument: data.identityDocument || (data.documentUrl ? {
          name: data.documentName || 'Guarantor_ID_Document',
          url: data.documentUrl,
          type: data.documentType || 'application/pdf',
          size: data.documentSize || 0,
          lastModified: Date.now()
        } : null)
      };

      // 1. If tenantId is provided, update propertyId = general_{tenantId}
      if (tenantId) {
        const formId = `general_${tenantId}`;
        const formRef = db.collection('referencing').doc(formId);
        const doc = await formRef.get();

        if (doc.exists) {
          const currentData = doc.data() || {};
          const updatedFormData = {
            ...(currentData.formData || {}),
            guarantor: guarantorData,
            guarantorInvitation: {
              ...(currentData.formData?.guarantorInvitation || {}),
              status: 'completed',
              completedAt: new Date().toISOString(),
              guarantorEmail: data.email
            }
          };
          const updatedStepStatus = {
            ...(currentData.stepStatus || {}),
            5: 'complete'
          };

          await formRef.set({
            ...currentData,
            formData: updatedFormData,
            stepStatus: updatedStepStatus,
            updatedAt: new Date().toISOString()
          }, { merge: true });
          this.logger.log(`✅ Reflected guarantor response directly in referencing form ${formId}`);
          return;
        }
      }

      // 2. Alternatively search by tenantEmail
      if (tenantEmail) {
        const snap = await db.collection('referencing').get();
        for (const doc of snap.docs) {
          const d = doc.data() as any;
          const emailInDoc = (d.formData?.identity?.email || d.tenantEmail || '').toLowerCase().trim();
          if (emailInDoc === tenantEmail) {
            const updatedFormData = {
              ...(d.formData || {}),
              guarantor: guarantorData,
              guarantorInvitation: {
                ...(d.formData?.guarantorInvitation || {}),
                status: 'completed',
                completedAt: new Date().toISOString(),
                guarantorEmail: data.email
              }
            };
            const updatedStepStatus = {
              ...(d.stepStatus || {}),
              5: 'complete'
            };

            await doc.ref.set({
              formData: updatedFormData,
              stepStatus: updatedStepStatus,
              updatedAt: new Date().toISOString()
            }, { merge: true });
            this.logger.log(`✅ Found & updated referencing form for email ${tenantEmail} in ${doc.id}`);
            return;
          }
        }
      }
    } catch (err: any) {
      this.logger.error(`Failed to reflect guarantor in referencing: ${err?.message || err}`);
    }
  }

  /**
   * Send notification emails when a guarantor submits their details
   */
  private async sendGuarantorCompletionEmails(data: any) {
    const tenantEmail = data.tenantEmail || data.applicantEmail;
    const tenantName = data.applicantName || data.tenantName || 'Tenant';
    const guarantorName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Guarantor';
    const guarantorEmail = data.email;

    // 1. Email to Tenant
    if (tenantEmail) {
      const subjectToTenant = `Great news! ${guarantorName} has completed their Guarantor Form`;
      const htmlToTenant = `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #136C9E, #0D4E73); padding: 24px; border-radius: 8px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 20px;">Guarantor Verification Received</h1>
          </div>
          <div style="padding: 24px 8px;">
            <p>Hi ${tenantName},</p>
            <p>Your guarantor, <strong>${guarantorName}</strong> (<em>${guarantorEmail}</em>), has successfully submitted their guarantor details and verification on Proptii.</p>
            <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 14px 18px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #166534; font-weight: bold;">Status: Guarantor Section Complete</p>
              <p style="margin: 6px 0 0 0; color: #15803d; font-size: 14px;">Your referencing passport has been automatically updated with their submitted details.</p>
            </div>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${this.frontendUrl}/dashboard/tenant-referencing" style="background: #136C9E; color: #fff; padding: 12px 28px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">
                View Referencing Passport
              </a>
            </div>
            <hr style="border: 1px solid #eee; margin: 24px 0;" />
            <p style="font-size: 12px; color: #9ca3af;">The Proptii Referencing Team</p>
          </div>
        </div>
      `;
      try {
        await sendEmail({ to: tenantEmail, subject: subjectToTenant, html: htmlToTenant });
        this.logger.log(`Guarantor completion notification email sent to tenant: ${tenantEmail}`);
      } catch (err: any) {
        this.logger.warn(`Could not email tenant on guarantor completion: ${err?.message || err}`);
      }
    }

    // 2. Receipt email to Guarantor
    if (guarantorEmail) {
      const subjectToGuarantor = `Confirmation: Guarantor Submission for ${tenantName}`;
      const htmlToGuarantor = `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #136C9E, #0D4E73); padding: 24px; border-radius: 8px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 20px;">Thank You for Your Submission</h1>
          </div>
          <div style="padding: 24px 8px;">
            <p>Hi ${guarantorName},</p>
            <p>Thank you for submitting your guarantor verification and information for <strong>${tenantName}</strong>'s rental application.</p>
            <p>Your details have been securely recorded and attached to the application.</p>
            <hr style="border: 1px solid #eee; margin: 24px 0;" />
            <p style="font-size: 12px; color: #9ca3af;">If you have any questions or did not authorize this, please contact <a href="mailto:contactus@theluxcity.co.uk">contactus@theluxcity.co.uk</a>.</p>
          </div>
        </div>
      `;
      try {
        await sendEmail({ to: guarantorEmail, subject: subjectToGuarantor, html: htmlToGuarantor });
        this.logger.log(`Guarantor completion confirmation sent to guarantor: ${guarantorEmail}`);
      } catch (err: any) {
        this.logger.warn(`Could not email guarantor confirmation: ${err?.message || err}`);
      }
    }
  }

  /**
   * Send an invitation to a guarantor with a dedicated link, and notify the tenant
   */
  async inviteGuarantor(payload: {
    tenantId: string;
    tenantName: string;
    tenantEmail: string;
    guarantorName: string;
    guarantorEmail: string;
    guarantorPhone?: string;
    message?: string;
    frontendUrl?: string;
  }) {
    const {
      tenantId,
      tenantName,
      tenantEmail,
      guarantorName,
      guarantorEmail,
      guarantorPhone = '',
      message = '',
      frontendUrl
    } = payload;

    const baseUrl = (frontendUrl || this.frontendUrl).replace(/\/$/, '');
    const token = randomUUID();
    const formUrl = `${baseUrl}/guarantor-reference?token=${token}&tenantId=${encodeURIComponent(tenantId)}&tenantEmail=${encodeURIComponent(tenantEmail)}&tenantName=${encodeURIComponent(tenantName)}`;

    const db = this.db;
    if (db) {
      try {
        // Record invitation in Firestore
        await db.collection('guarantor_invitations').doc(token).set({
          token,
          tenantId,
          tenantName,
          tenantEmail,
          guarantorName,
          guarantorEmail,
          guarantorPhone,
          message,
          status: 'invited',
          createdAt: new Date().toISOString()
        });

        // Update referencing form draft with invite info
        const formRef = db.collection('referencing').doc(`general_${tenantId}`);
        const doc = await formRef.get();
        if (doc.exists) {
          const currentData = doc.data() || {};
          await formRef.set({
            formData: {
              ...(currentData.formData || {}),
              guarantorInvitation: {
                token,
                guarantorName,
                guarantorEmail,
                guarantorPhone,
                status: 'invited',
                invitedAt: new Date().toISOString()
              }
            }
          }, { merge: true });
        }
      } catch (err: any) {
        this.logger.warn(`Error storing guarantor invitation in Firestore: ${err?.message || err}`);
      }
    }

    // 1. Send invitation email to Guarantor
    const subjectToGuarantor = `Guarantor Request from ${tenantName || 'a tenant'} on Proptii`;
    const htmlToGuarantor = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px;">
        <div style="background: linear-gradient(135deg, #136C9E, #0D4E73); padding: 24px; border-radius: 8px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 20px;">Guarantor Request</h1>
        </div>
        <div style="padding: 24px 8px;">
          <p>Hi ${guarantorName || 'there'},</p>
          <p><strong>${tenantName}</strong> has listed you as their guarantor for their rental application on Proptii.</p>
          ${message ? `<div style="background: #f8fafc; border-left: 4px solid #136C9E; padding: 12px 16px; border-radius: 6px; margin: 18px 0; font-style: italic; color: #334155;">"${message}"</div>` : ''}
          <p>Please click the button below to review the request, enter your details, and securely upload your ID document:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${formUrl}" style="background: #DC5F12; color: #fff; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 15px; text-decoration: none; display: inline-block; box-shadow: 0 4px 12px rgba(220, 95, 18, 0.25);">
              Complete Guarantor Form
            </a>
          </div>
          <p style="font-size: 13px; color: #64748b;">If the button above does not work, copy and paste this link into your browser:<br/>
            <a href="${formUrl}" style="color: #136C9E; word-break: break-all;">${formUrl}</a>
          </p>
          <hr style="border: 1px solid #eee; margin: 24px 0;" />
          <p style="font-size: 12px; color: #9ca3af;">This request was generated via Proptii Referencing. If you did not expect this, please contact <a href="mailto:contactus@theluxcity.co.uk">contactus@theluxcity.co.uk</a>.</p>
        </div>
      </div>
    `;

    try {
      await sendEmail({ to: guarantorEmail, subject: subjectToGuarantor, html: htmlToGuarantor });
      this.logger.log(`Guarantor invite email sent to ${guarantorEmail}`);
    } catch (err: any) {
      this.logger.error(`Failed to send invite email to guarantor: ${err?.message || err}`);
      return { success: false, error: 'Failed to send email to guarantor' };
    }

    // 2. Send confirmation email to Tenant
    if (tenantEmail) {
      const subjectToTenant = `Guarantor Invitation Sent to ${guarantorName}`;
      const htmlToTenant = `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #136C9E, #0D4E73); padding: 24px; border-radius: 8px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 20px;">Guarantor Invitation Dispatched</h1>
          </div>
          <div style="padding: 24px 8px;">
            <p>Hi ${tenantName},</p>
            <p>We've sent an invitation email to your guarantor, <strong>${guarantorName}</strong> (<em>${guarantorEmail}</em>), with instructions to complete their guarantor section.</p>
            <p>You can also share this direct link with them if needed:</p>
            <div style="background: #f1f5f9; padding: 12px 16px; border-radius: 8px; word-break: break-all; font-size: 13px; color: #1e293b; margin: 16px 0;">
              ${formUrl}
            </div>
            <p>We will notify you via email as soon as ${guarantorName} completes their submission.</p>
            <hr style="border: 1px solid #eee; margin: 24px 0;" />
            <p style="font-size: 12px; color: #9ca3af;">The Proptii Referencing Team</p>
          </div>
        </div>
      `;

      try {
        await sendEmail({ to: tenantEmail, subject: subjectToTenant, html: htmlToTenant });
        this.logger.log(`Guarantor invite confirmation email sent to tenant: ${tenantEmail}`);
      } catch (err: any) {
        this.logger.warn(`Could not email tenant on invite dispatch: ${err?.message || err}`);
      }
    }

    return {
      success: true,
      message: `Invitation successfully sent to ${guarantorEmail}`,
      formUrl,
      token
    };
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
      const id = await sendEmail({ to, subject, html: htmlBody });
      this.logger.log(`Referencing email sent to ${to} (${type}) [${id}]`);
      return { success: true, message: 'Email sent successfully' };
    } catch (err: any) {
      this.logger.error(`sendReferencingEmail error: ${err?.message || err}`);
      return { success: false, error: err?.message || 'Failed to send email' };
    }
  }
}
