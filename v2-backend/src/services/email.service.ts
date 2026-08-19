import { Injectable, Logger } from '@nestjs/common';
import { sendEmail } from '../utils/resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly frontendUrl: string;

  constructor() {
    this.frontendUrl = process.env.FRONTEND_URL || 'https://proptii.co';
  }

  private truncate(str: string, maxLength: number): string {
    if (!str) return '';
    return str.length > maxLength ? str.substring(0, maxLength - 3) + '...' : str;
  }

  // ─── New Message Notification ─────────────────────────────────────────────
  // Called when a user receives a new message in a conversation thread.
  // Sends to the recipient with a CTA to view/reply. Guest users get a
  // claim-account link; registered users get a login link.

  async sendNewMessageNotification(
    recipientEmail: string,
    recipientName: string,
    senderName: string,
    propertyTitle: string,
    isGuest: boolean,
    guestToken?: string,
  ) {
    if (!recipientEmail) return;

    const safeRecipientName = this.truncate(recipientName || '', 50);
    const safeSenderName    = this.truncate(senderName || 'A user', 50);
    const safePropertyTitle = this.truncate(propertyTitle || 'a property', 60);
    const actionUrl = isGuest && guestToken
      ? `${this.frontendUrl}/claim?token=${guestToken}`
      : `${this.frontendUrl}/login`;
    const greeting = safeRecipientName ? `Hello ${safeRecipientName},` : 'Hello,';
    const subject  = `New message regarding ${safePropertyTitle}`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
        <h2 style="color:#136C9E;">New Message on Proptii</h2>
        <p>${greeting}</p>
        <p>You have received a new message from <strong>${safeSenderName}</strong> regarding <strong>${safePropertyTitle}</strong>.</p>
        <div style="margin:30px 0;">
          <a href="${actionUrl}" style="background:#136C9E;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;">
            View and Reply
          </a>
        </div>
        <p style="font-size:0.85em;color:#666;">
          If the button doesn't work, copy and paste this link:<br>
          <a href="${actionUrl}">${actionUrl}</a>
        </p>
        <hr style="border:1px solid #eee;margin-top:30px;">
        <p style="font-size:0.8em;color:#999;">The Proptii Team</p>
      </div>
    `;

    try {
      const id = await sendEmail({ to: recipientEmail, subject, html });
      this.logger.log(`New message notification sent to ${recipientEmail} [${id}]`);
    } catch (err: any) {
      this.logger.error(`Failed to send new message notification: ${err?.message || err}`);
    }
  }

  // ─── Guest Claim Account ──────────────────────────────────────────────────
  // Sent to a guest user so they can claim a full Proptii account after
  // receiving messages without being registered.

  async sendClaimAccountEmail(recipientEmail: string, guestToken: string) {
    if (!recipientEmail || !guestToken) return;

    const actionUrl = `${this.frontendUrl}/claim?token=${guestToken}`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
        <h2 style="color:#136C9E;">Claim your Proptii account</h2>
        <p>Click the link below to claim your account and view your messages securely.</p>
        <div style="margin:30px 0;">
          <a href="${actionUrl}" style="background:#136C9E;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;">
            Claim Account
          </a>
        </div>
        <p style="font-size:0.85em;color:#666;">
          If the button doesn't work, copy and paste this link:<br>
          <a href="${actionUrl}">${actionUrl}</a>
        </p>
        <hr style="border:1px solid #eee;margin-top:30px;">
        <p style="font-size:0.8em;color:#999;">The Proptii Team</p>
      </div>
    `;

    try {
      const id = await sendEmail({ to: recipientEmail, subject: 'Claim your Proptii account', html });
      this.logger.log(`Claim account email sent to ${recipientEmail} [${id}]`);
    } catch (err: any) {
      this.logger.error(`Failed to send claim account email: ${err?.message || err}`);
    }
  }

  // ─── Referencing Passport Share ───────────────────────────────────────────
  // Sent when a tenant shares their referencing passport with a landlord/agent.
  // Two variants:
  //   hasAccount = true  → recipient already has an account; directs them to login.
  //   hasAccount = false → no account; provides public view link + create-account CTA.

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
    const subject     = `${safeTenant} has shared their referencing passport with you`;

    let html: string;

    if (hasAccount) {
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
            <p style="margin:0 0 24px;">Log in to your Proptii dashboard to view the referencing details, review documents, and start a conversation.</p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${loginUrl}" style="background:#136C9E;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;display:inline-block;">
                Log In to View Referencing
              </a>
            </div>
            <hr style="border:1px solid #e5e7eb;margin:24px 0;"/>
            <p style="font-size:12px;color:#9ca3af;">If you did not expect this email, you can safely ignore it.</p>
          </div>
        </div>
      `;
    } else {
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
                View Referencing Passport
              </a>
              <a href="${claimUrl}" style="background:#DC5F12;color:#fff;padding:14px 24px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;display:block;text-align:center;">
                Create Account &amp; Manage Tenant
              </a>
            </div>
            <p style="font-size:13px;color:#6b7280;text-align:center;">No account needed to view. Create a free account to message ${safeTenant} and manage their application.</p>
            <hr style="border:1px solid #e5e7eb;margin:24px 0;"/>
            <p style="font-size:12px;color:#9ca3af;">This link expires on <strong>${expiry}</strong>. If you did not expect this email, you can safely ignore it.</p>
          </div>
        </div>
      `;
    }

    try {
      const id = await sendEmail({ to: recipientEmail, subject, html });
      this.logger.log(`Referencing share notification sent to ${recipientEmail} (hasAccount=${hasAccount}) [${id}]`);
    } catch (err: any) {
      this.logger.error(`Failed to send referencing share notification: ${err?.message || err}`);
    }
  }
}
