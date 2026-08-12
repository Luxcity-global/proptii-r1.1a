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
}
