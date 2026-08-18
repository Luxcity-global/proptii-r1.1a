import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly frontendUrl: string;
  private readonly fromEmail: string;

  constructor() {
    this.frontendUrl = process.env.FRONTEND_URL || 'https://proptii-r1-1a-2.onrender.com';
    
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    this.fromEmail = process.env.SMTP_FROM_EMAIL || smtpUser || 'noreply@proptii.com';

    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || '465', 10),
        secure: true, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.logger.log(`EmailService initialized with host ${smtpHost}`);
    } else {
      this.logger.warn('EmailService not fully initialized (missing SMTP credentials in environment). Emails will be logged instead of sent.');
    }
  }

  /**
   * Helper to truncate strings so variables don't spill over in the email layout.
   */
  private truncate(str: string, maxLength: number): string {
    if (!str) return '';
    return str.length > maxLength ? str.substring(0, maxLength - 3) + '...' : str;
  }

  async sendNewMessageNotification(recipientEmail: string, recipientName: string, senderName: string, propertyTitle: string, isGuest: boolean, guestToken?: string) {
    if (!recipientEmail) return;

    // Truncate variables to prevent layout spill-over
    const safeRecipientName = this.truncate(recipientName || '', 50);
    const safeSenderName = this.truncate(senderName || 'A user', 50);
    const safePropertyTitle = this.truncate(propertyTitle || 'a property', 60);

    const actionUrl = isGuest && guestToken 
      ? `${this.frontendUrl}/claim?token=${guestToken}` 
      : `${this.frontendUrl}/login`;

    const greeting = safeRecipientName ? `Hello ${safeRecipientName},` : 'Hello,';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #3b82f6;">New Message on Proptii</h2>
        <p>${greeting}</p>
        <p>You have received a new message from <strong>${safeSenderName}</strong> regarding <strong>${safePropertyTitle}</strong>.</p>
        <div style="margin: 30px 0;">
          <a href="${actionUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View and Reply
          </a>
        </div>
        <p style="font-size: 0.85em; color: #666;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${actionUrl}">${actionUrl}</a>
        </p>
        <hr style="border: 1px solid #eee; margin-top: 30px;">
        <p style="font-size: 0.8em; color: #999;">The Proptii Team</p>
      </div>
    `;

    const subject = `New message regarding ${safePropertyTitle}`;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: `"Proptii" <${this.fromEmail}>`,
          to: recipientEmail,
          subject,
          html,
        });
        this.logger.log(`Sent new message notification to ${recipientEmail}`);
      } catch (err: any) {
        this.logger.error(`Failed to send new message notification: ${err?.message || err}`);
      }
    } else {
      this.logger.debug(`[MOCK EMAIL] To: ${recipientEmail} | Subject: ${subject}`);
    }
  }

  async sendClaimAccountEmail(recipientEmail: string, guestToken: string) {
    if (!recipientEmail || !guestToken) return;

    const actionUrl = `${this.frontendUrl}/claim?token=${guestToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #3b82f6;">Claim your Proptii account</h2>
        <p>Click the link below to claim your account and view your messages securely.</p>
        <div style="margin: 30px 0;">
          <a href="${actionUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Claim Account
          </a>
        </div>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: `"Proptii" <${this.fromEmail}>`,
          to: recipientEmail,
          subject: 'Claim your Proptii account',
          html,
        });
        this.logger.log(`Sent claim email to ${recipientEmail}`);
      } catch (err: any) {
        this.logger.error(`Failed to send claim email: ${err?.message || err}`);
      }
    } else {
      this.logger.debug(`[MOCK EMAIL] To: ${recipientEmail} | Subject: Claim your Proptii account`);
    }
  }

  /**
   * Sent when a tenant shares their referencing passport.
   *
   * hasAccount = true  → recipient has a Proptii account; simple "log in to view" email.
   * hasAccount = false → no account; full email with public view link + create-account CTA.
   */
  async sendReferencingShareNotification(opts: {
    recipientEmail: string;
    recipientName: string;
    tenantName: string;
    propertyAddress: string;
    notes: string;
    viewToken: string;
    claimToken: string;
    expiresAt: string;
    hasAccount: boolean;
  }) {
    const {
      recipientEmail, recipientName, tenantName, propertyAddress,
      notes, viewToken, claimToken, expiresAt, hasAccount,
    } = opts;

    if (!recipientEmail) return;

    const safeName    = this.truncate(recipientName || '', 60);
    const safeTenant  = this.truncate(tenantName || 'A tenant', 60);
    const safeAddress = this.truncate(propertyAddress || '', 80);
    const safeNotes   = this.truncate(notes || '', 200);
    const greeting    = safeName ? `Hello ${safeName},` : 'Hello,';
    const viewUrl     = `${this.frontendUrl}/referencing/view/${viewToken}`;
    const claimUrl    = `${this.frontendUrl}/claim-referencing?token=${claimToken}`;
    const loginUrl    = `${this.frontendUrl}/login?redirect=/landlord`;
    const expiry      = new Date(expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    let subject: string;
    let html: string;

    if (hasAccount) {
      // ── Existing-account email: brief, directs to login ──────────────────
      subject = `${safeTenant} has shared their referencing passport with you`;
      html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#136C9E,#0D4E73);padding:28px 32px;">
            <img src="${this.frontendUrl}/images/proptii-logo.png" alt="Proptii" style="height:32px;margin-bottom:12px;" onerror="this.style.display='none'"/>
            <h1 style="color:#fff;margin:0;font-size:20px;">Referencing Passport Received</h1>
          </div>
          <div style="padding:32px;">
            <p style="margin:0 0 16px;">${greeting}</p>
            <p style="margin:0 0 16px;">
              <strong>${safeTenant}</strong> has shared their referencing passport with you on Proptii.
              ${safeAddress ? `They are interested in the property at <strong>${safeAddress}</strong>.` : ''}
            </p>
            ${safeNotes ? `<div style="background:#f0f9ff;border-left:4px solid #136C9E;padding:12px 16px;border-radius:4px;margin:0 0 24px;font-size:14px;color:#374957;"><strong>Message from ${safeTenant}:</strong><br/>${safeNotes}</div>` : ''}
            <p style="margin:0 0 24px;">Log in to your Proptii dashboard to view the referencing details, review their documents, and start a conversation.</p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${loginUrl}" style="background:#136C9E;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;display:inline-block;">
                Log In to View Referencing
              </a>
            </div>
            <hr style="border:1px solid #e5e7eb;margin:24px 0;"/>
            <p style="font-size:12px;color:#9ca3af;">This referencing was shared on Proptii. If you did not expect this email, you can safely ignore it.</p>
          </div>
        </div>
      `;
    } else {
      // ── No-account email: view link + create-account CTA ─────────────────
      subject = `${safeTenant} has shared their referencing passport with you`;
      html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#136C9E,#0D4E73);padding:28px 32px;">
            <img src="${this.frontendUrl}/images/proptii-logo.png" alt="Proptii" style="height:32px;margin-bottom:12px;" onerror="this.style.display='none'"/>
            <h1 style="color:#fff;margin:0;font-size:20px;">You've Received a Referencing Passport</h1>
          </div>
          <div style="padding:32px;">
            <p style="margin:0 0 16px;">${greeting}</p>
            <p style="margin:0 0 16px;">
              <strong>${safeTenant}</strong> has shared their referencing passport with you via Proptii.
              ${safeAddress ? `They are applying for the property at <strong>${safeAddress}</strong>.` : ''}
            </p>
            ${safeNotes ? `<div style="background:#f0f9ff;border-left:4px solid #136C9E;padding:12px 16px;border-radius:4px;margin:0 0 24px;font-size:14px;color:#374957;"><strong>Message from ${safeTenant}:</strong><br/>${safeNotes}</div>` : ''}
            <p style="margin:0 0 8px;font-weight:bold;">What would you like to do?</p>
            <div style="display:flex;flex-direction:column;gap:12px;margin:24px 0;">
              <a href="${viewUrl}" style="background:#136C9E;color:#fff;padding:14px 24px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;display:block;text-align:center;">
                📄 View Referencing Passport
              </a>
              <a href="${claimUrl}" style="background:#DC5F12;color:#fff;padding:14px 24px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;display:block;text-align:center;">
                🏠 Create Account &amp; Manage Tenant
              </a>
            </div>
            <p style="font-size:13px;color:#6b7280;text-align:center;">No account needed to view. Create a free account to message ${safeTenant} and manage their application.</p>
            <hr style="border:1px solid #e5e7eb;margin:24px 0;"/>
            <p style="font-size:12px;color:#9ca3af;">This link expires on <strong>${expiry}</strong>. If you did not expect this email, you can safely ignore it.</p>
          </div>
        </div>
      `;
    }

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: `"Proptii" <${this.fromEmail}>`,
          to: recipientEmail,
          subject,
          html,
        });
        this.logger.log(`Sent referencing share notification to ${recipientEmail} (hasAccount=${hasAccount})`);
      } catch (err: any) {
        this.logger.error(`Failed to send referencing share notification: ${err?.message || err}`);
      }
    } else {
      this.logger.debug(`[MOCK EMAIL] To: ${recipientEmail} | Subject: ${subject} | hasAccount: ${hasAccount} | viewToken: ${viewToken}`);
    }
  }
}
