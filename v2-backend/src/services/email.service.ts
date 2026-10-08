import { Injectable, Logger } from '@nestjs/common';
import { sendEmail } from '../utils/resend';
import { proptiiButton, renderProptiiEmail } from '../utils/emailLayout';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly frontendUrl: string;

  constructor() {
    this.frontendUrl = (process.env.FRONTEND_URL || 'https://proptii.co').replace(/\/+$/, '');
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

    const html = renderProptiiEmail({
      title: 'New Message on Proptii',
      buttonLabel: 'View and Reply',
      buttonHref: actionUrl,
      bodyHtml: `
        <p>${greeting}</p>
        <p>You have received a new message from <strong>${safeSenderName}</strong> regarding <strong>${safePropertyTitle}</strong>.</p>
        <p style="font-size:0.85em;color:#666;">
          If the button doesn't work, copy and paste this link:<br>
          <a href="${actionUrl}">${actionUrl}</a>
        </p>
      `,
    });

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

    const html = renderProptiiEmail({
      title: 'Claim your Proptii account',
      buttonLabel: 'Claim Account',
      buttonHref: actionUrl,
      bodyHtml: `
        <p>Click the link below to claim your account and view your messages securely.</p>
        <p style="font-size:0.85em;color:#666;">
          If the button doesn't work, copy and paste this link:<br>
          <a href="${actionUrl}">${actionUrl}</a>
        </p>
      `,
    });

    try {
      const id = await sendEmail({ to: recipientEmail, subject: 'Claim your Proptii account', html });
      this.logger.log(`Claim account email sent to ${recipientEmail} [${id}]`);
    } catch (err: any) {
      this.logger.error(`Failed to send claim account email: ${err?.message || err}`);
    }
  }

  // ─── Referencing Passport Share ───────────────────────────────────────────
  // Sent when a tenant shares their referencing passport with a landlord/agent.
  // Both variants open the public passport page. Login and account creation stay as text links.

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
    const viewPath    = `/referencing/view/${viewToken}`;
    const viewUrl     = `${this.frontendUrl}${viewPath}`;
    const claimUrl    = `${this.frontendUrl}/claim-referencing?token=${encodeURIComponent(claimToken)}`;
    const loginUrl    = `${this.frontendUrl}/login?redirect=${encodeURIComponent(viewPath)}`;
    const expiry      = new Date(expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const subject     = `${safeTenant} has shared their referencing passport with you`;

    let html: string;

    if (hasAccount) {
      html = renderProptiiEmail({
        title: 'Referencing Passport Received',
        bodyHtml: `
          <p style="margin:0 0 16px;">${greeting}</p>
          <p style="margin:0 0 16px;">
            <strong>${safeTenant}</strong> has shared their referencing passport with you on Proptii.
            ${safeAddress ? `They are interested in the property at <strong>${safeAddress}</strong>.` : ''}
          </p>
          ${safeNotes ? `<div class="details"><p><strong>Message from ${safeTenant}:</strong><br/>${safeNotes}</p></div>` : ''}
          <p style="margin:0 0 24px;">Open the passport to review their referencing details and documents.</p>
          ${proptiiButton('View Referencing Passport', viewUrl)}
          <p style="font-size:13px;color:#6b7280;text-align:center;"><a href="${loginUrl}">Log in</a> to message ${safeTenant} from your dashboard.</p>
          <p style="font-size:12px;color:#9ca3af;">This link expires on <strong>${expiry}</strong>. If you did not expect this email, you can safely ignore it.</p>
        `,
      });
    } else {
      html = renderProptiiEmail({
        title: "You've Received a Referencing Passport",
        bodyHtml: `
          <p style="margin:0 0 16px;">${greeting}</p>
          <p style="margin:0 0 16px;">
            <strong>${safeTenant}</strong> has shared their referencing passport with you via Proptii.
            ${safeAddress ? `They are applying for the property at <strong>${safeAddress}</strong>.` : ''}
          </p>
          ${safeNotes ? `<div class="details"><p><strong>Message from ${safeTenant}:</strong><br/>${safeNotes}</p></div>` : ''}
          ${proptiiButton('View Referencing Passport', viewUrl)}
          <p style="font-size:13px;color:#6b7280;text-align:center;">No account needed to view. <a href="${claimUrl}">Create a free account</a> to message ${safeTenant} and manage their application.</p>
          <p style="font-size:12px;color:#9ca3af;">This link expires on <strong>${expiry}</strong>. If you did not expect this email, you can safely ignore it.</p>
        `,
      });
    }

    try {
      const id = await sendEmail({ to: recipientEmail, subject, html });
      this.logger.log(`Referencing share notification sent to ${recipientEmail} (hasAccount=${hasAccount}) [${id}]`);
    } catch (err: any) {
      this.logger.error(`Failed to send referencing share notification: ${err?.message || err}`);
    }
  }
}
