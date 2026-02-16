import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';

interface SendSignedContractParams {
  to: string;
  subject: string;
  recipientName: string;
  contractName: string;
  senderName: string;
  senderEmail: string;
  htmlContent: string;
  attachment: {
    filename: string;
    content: Buffer;
    contentType: string;
  };
}

@Injectable()
export class ContractEmailService {
  private transporter: nodemailer.Transporter | null = null;
  private resend: Resend | null = null;
  private isConfigured: boolean = false;
  private fromAddress: string;

  constructor() {
    // Set from address - prioritize EMAIL_FROM_ADDRESS, fallback to SMTP_FROM_EMAIL or default
    this.fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_FROM_EMAIL || 'noreply@proptii.co';

    // Initialize Resend first (if API key is provided) - primary email service
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        this.resend = new Resend(resendApiKey);
        this.isConfigured = true;
        console.log('✅ Contract email service initialized with Resend API');

        // If using Resend, determine the best from address
        // Priority: EMAIL_FROM_ADDRESS > verified domain > Resend default
        if (process.env.EMAIL_FROM_ADDRESS &&
          process.env.EMAIL_FROM_ADDRESS.includes('@') &&
          !process.env.EMAIL_FROM_ADDRESS.endsWith('@resend.dev')) {
          // User has explicitly set EMAIL_FROM_ADDRESS with a custom domain
          this.fromAddress = process.env.EMAIL_FROM_ADDRESS;
          console.log(`📧 Using from address: ${this.fromAddress}`);
          console.log('✅ Make sure this domain is verified in your Resend dashboard');
        } else if (process.env.EMAIL_FROM_ADDRESS) {
          // EMAIL_FROM_ADDRESS is set but might be using resend.dev default
          this.fromAddress = process.env.EMAIL_FROM_ADDRESS;
          console.log(`📧 Using from address: ${this.fromAddress}`);
        } else {
          // Use Resend default domain for testing (can only send to verified email)
          this.fromAddress = 'onboarding@resend.dev';
          console.log('📧 Using Resend default from address: onboarding@resend.dev');
          console.warn('⚠️  Note: For better deliverability, verify your domain in Resend dashboard');
          console.warn('   and set EMAIL_FROM_ADDRESS to your verified domain (e.g., noreply@proptii.co)');
        }
      } catch (error) {
        console.warn('⚠️ Failed to initialize Resend:', error);
        this.resend = null;
      }
    }

    // Initialize SMTP as fallback (only if Resend is not configured)
    if (!this.resend) {
      // Verify required environment variables for SMTP
      const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

      if (missingVars.length > 0) {
        if (!resendApiKey) {
          console.warn('⚠️ Email service not configured - No RESEND_API_KEY or SMTP credentials set');
          console.warn('   Set RESEND_API_KEY for Resend API (recommended)');
          console.warn('   OR set SMTP credentials (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS) for SMTP');
          this.isConfigured = false;
        }
      } else {
        // Create nodemailer transporter with improved TLS configuration
        try {
          this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
            requireTLS: process.env.SMTP_PORT !== '465', // Require TLS for non-465 ports
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            },
            tls: {
              // Do not fail on invalid certificates
              rejectUnauthorized: false,
              // Explicitly set TLS version
              minVersion: 'TLSv1.2'
            },
            // Connection timeout
            connectionTimeout: 10000, // 10 seconds
            // Socket timeout
            socketTimeout: 10000, // 10 seconds
            // Greeting timeout
            greetingTimeout: 5000, // 5 seconds
            // Debug mode (can be removed in production)
            debug: process.env.NODE_ENV === 'development',
            logger: process.env.NODE_ENV === 'development'
          });
          this.isConfigured = true;
          console.log('✅ Contract email service initialized with SMTP');
        } catch (error) {
          console.warn('⚠️ Failed to initialize SMTP:', error);
          this.isConfigured = false;
        }
      }
    }
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('SMTP connection verification failed:', error);
      return false;
    }
  }

  async sendSignedContractEmail(params: SendSignedContractParams, retries = 3) {
    console.log(`📧 Preparing to send signed contract email:`, {
      to: params.to,
      subject: params.subject,
      contractName: params.contractName,
      recipientName: params.recipientName,
      attachmentSize: params.attachment.content.length
    });

    // Prioritize Resend if configured (primary email service)
    if (this.isConfigured && this.resend) {
      try {
        return await this.sendSignedContractViaResend(params);
      } catch (resendError) {
        console.error('❌ Resend API failed:', resendError);
        // If Resend fails and SMTP is available, try SMTP as fallback
        if (this.transporter) {
          console.warn('⚠️ Resend failed, trying SMTP as fallback...');
          // Continue to SMTP fallback below
        } else {
          throw resendError;
        }
      }
    }

    // Use SMTP as fallback (or primary if Resend not configured)
    if (this.isConfigured && this.transporter) {
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          // Prepare email attachments
          const attachments = [{
            filename: params.attachment.filename,
            content: params.attachment.content,
            contentType: params.attachment.contentType
          }];

          // Send email with timeout
          const result = await Promise.race([
            this.transporter.sendMail({
              from: this.fromAddress,
              to: params.to,
              subject: params.subject,
              html: params.htmlContent,
              attachments: attachments
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Email send timeout after 30 seconds')), 30000)
            )
          ]) as any;

          console.log('📧 Signed contract email sent successfully via SMTP:', {
            messageId: result.messageId,
            to: params.to,
            subject: params.subject,
            contractName: params.contractName
          });

          return {
            success: true,
            messageId: result.messageId
          };

        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.error(`❌ Failed to send signed contract email via SMTP (attempt ${attempt}/${retries}):`, {
            error: lastError.message,
            code: (error as any)?.code,
            errno: (error as any)?.errno,
            syscall: (error as any)?.syscall
          });

          // If it's a connection error and we have retries left, wait and retry
          if (attempt < retries && (
            (error as any)?.code === 'ECONNRESET' ||
            (error as any)?.code === 'ESOCKET' ||
            (error as any)?.code === 'ETIMEDOUT' ||
            (error as any)?.code === 'ECONNREFUSED'
          )) {
            const waitTime = attempt * 2000; // Exponential backoff: 2s, 4s, 6s
            console.log(`⏳ Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));

            // Try to recreate transporter on connection errors
            try {
              await this.transporter?.close();
            } catch (closeError) {
              // Ignore close errors
            }

            // Recreate transporter
            if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS) {
              this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT),
                secure: process.env.SMTP_PORT === '465',
                requireTLS: process.env.SMTP_PORT !== '465',
                auth: {
                  user: process.env.SMTP_USER,
                  pass: process.env.SMTP_PASS
                },
                tls: {
                  rejectUnauthorized: false,
                  minVersion: 'TLSv1.2'
                },
                connectionTimeout: 10000,
                socketTimeout: 10000,
                greetingTimeout: 5000,
                debug: process.env.NODE_ENV === 'development',
                logger: process.env.NODE_ENV === 'development'
              });
            }

            continue;
          }

          // If all retries failed or it's not a retryable error, throw
          throw lastError;
        }
      }

      throw lastError || new Error('Failed to send email after all retries');
    } else {
      throw new Error('Email service not configured. Set RESEND_API_KEY or SMTP credentials.');
    }
  }

  private async sendSignedContractViaResend(params: SendSignedContractParams): Promise<any> {
    if (!this.resend) {
      throw new Error('Resend client not initialized');
    }

    // Use the configured from address (should already be set correctly in constructor)
    const fromAddress = this.fromAddress;

    try {
      console.log(`📧 Sending signed contract email via Resend API to: ${params.to}`);
      console.log(`   From: ${fromAddress}`);
      console.log(`   Subject: ${params.subject}`);
      console.log(`   Attachment: ${params.attachment.filename} (${params.attachment.content.length} bytes)`);

      // Convert attachment to base64 for Resend
      const attachmentBase64 = params.attachment.content.toString('base64');

      const result = await this.resend.emails.send({
        from: fromAddress,
        to: params.to,
        subject: params.subject,
        html: params.htmlContent,
        attachments: [{
          filename: params.attachment.filename,
          content: attachmentBase64,
        }],
      });

      // Check if there's an error in the response
      if (result.error) {
        const error = result.error as any;
        console.error('❌ Resend API returned an error:', result.error);
        throw new Error(error.message || 'Resend API returned an error');
      }

      const messageId = result.data?.id;
      if (!messageId) {
        console.warn('⚠️ Resend API response missing message ID');
      }

      console.log(`✅ Signed contract email sent successfully via Resend API to ${params.to}${messageId ? ` (ID: ${messageId})` : ''}`);

      return {
        success: true,
        messageId: messageId || 'resend-email-sent',
      };
    } catch (error: any) {
      console.error('❌ Resend API error:', error);
      throw new Error(error.message || 'Failed to send email via Resend');
    }
  }

  // Method to send contract to multiple recipients
  async sendSignedContractToMultipleRecipients(
    recipients: Array<{ email: string; name: string }>,
    contractName: string,
    contractBuffer: Buffer,
    documentName: string,
    senderName: string,
    senderEmail: string
  ) {
    try {
      console.log(`📧 Sending signed contract to ${recipients.length} recipients...`);

      const emailPromises = recipients.map(async (recipient) => {
        try {
          const result = await this.sendSignedContractEmail({
            to: recipient.email,
            subject: `Signed Contract: ${contractName}`,
            recipientName: recipient.name,
            contractName,
            senderName,
            senderEmail,
            htmlContent: this.generateContractEmailTemplate({
              recipientName: recipient.name,
              contractName,
              senderName
            }),
            attachment: {
              filename: documentName,
              content: contractBuffer,
              contentType: 'application/pdf'
            }
          });

          return {
            email: recipient.email,
            success: result.success,
            messageId: result.messageId
          };

        } catch (error) {
          console.error(`❌ Error sending email to ${recipient.email}:`, error);
          return {
            email: recipient.email,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });

      const results = await Promise.allSettled(emailPromises);

      const processedResults = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            email: recipients[index].email,
            success: false,
            error: result.reason?.message || 'Unknown error'
          };
        }
      });

      const allSuccessful = processedResults.every(result => result.success);

      console.log(`📧 Multiple recipient email sending completed. Success: ${allSuccessful}`);

      return {
        success: allSuccessful,
        results: processedResults
      };

    } catch (error) {
      console.error('❌ Error sending contract to multiple recipients:', error);
      throw error;
    }
  }

  private generateContractEmailTemplate(params: {
    recipientName: string;
    contractName: string;
    senderName: string;
  }): string {
    const { recipientName, contractName, senderName } = params;

    // Get the base URL for links in the email
    // Supports both localhost (for local testing) and proptii.co (for production)
    const getBaseUrl = (): string => {
      // Priority 1: If APP_URL is explicitly set, use it (allows override for any environment)
      if (process.env.APP_URL) {
        return process.env.APP_URL;
      }

      // Priority 2: If FRONTEND_URL is set, use it (allows specifying localhost explicitly)
      if (process.env.FRONTEND_URL) {
        return process.env.FRONTEND_URL;
      }

      // Priority 3: Check if we're in development mode
      const isDevelopment = process.env.NODE_ENV === 'development' ||
        process.env.NODE_ENV !== 'production';

      if (isDevelopment) {
        // Default to localhost:5173 (Vite default) for local development
        return 'http://localhost:5173';
      }

      // Priority 4: Production - use proptii.co (not mail.proptii.co for consistency)
      return 'https://proptii.co';
    };

    const baseUrl = getBaseUrl();

    // Unified base styles matching email.service.ts
    const baseStyles = `
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f7fa; padding: 24px 0; margin: 0; }
      .container { max-width: 640px; margin: 0 auto; padding: 32px 24px; background: #ffffff; box-shadow: 0 8px 24px rgba(19, 108, 158, 0.12); border-radius: 12px; }
      .header { color: #136C9E; font-size: 24px; font-weight: 700; margin-bottom: 24px; }
      .details { background: #f5f8fb; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid rgba(19, 108, 158, 0.08); }
      .details h3 { margin-top: 0; color: #136C9E; font-size: 16px; }
      .details p { margin: 8px 0; }
      .footer { margin-top: 40px; font-size: 14px; color: #666; text-align: left; }
      .footer hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
      a { color: #136C9E; }
      .cta { text-align: center; margin: 28px 0; }
      .button { display: inline-block; background: linear-gradient(135deg, #DC5F12 0%, #FF6B1A 100%); color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(220, 95, 18, 0.25); transition: all 0.3s ease; }
      .button:hover { box-shadow: 0 12px 24px rgba(220, 95, 18, 0.35); transform: translateY(-1px); }
      .grid { display: grid; gap: 16px; }
      .muted { color: #4b5563; }
      .attachment-notice { background: #e0f2fe; padding: 16px; border-radius: 10px; margin: 20px 0; text-align: center; border: 1px solid #bae6fd; }
      .attachment-notice strong { color: #DC5F12; }
      .list { margin: 0; padding-left: 18px; }
      .list li { margin: 6px 0; }
      .status-badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 6px; font-weight: 600; font-size: 14px; }
    `;

    const customFooter = `
      <div class="footer">
        <p>Best regards,<br>${senderName}</p>
        <hr />
        <em>Proptii is a one-stop AI platform created for tenants, agents, and landlords to conduct and fulfill property transactions. Try it <a href="https://proptii.co">here</a>.</em>
      </div>
    `;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charSet="utf-8" />
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">📄 Signed Contract Ready</div>
          
          <p>Hi ${recipientName},</p>
          
          <p>Great news! Your contract has been successfully signed and is ready for your records.</p>
          
          <div class="details">
            <h3>Contract Details</h3>
            <p><strong>Contract Name:</strong> ${contractName}</p>
            <p><strong>Signed Date:</strong> ${new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}</p>
            <p><strong>Status:</strong> <span class="status-badge">✅ Fully Executed</span></p>
          </div>
          
          <div class="attachment-notice">
            <strong>📎 Contract Attachment</strong><br>
            Your signed contract is attached to this email as a PDF document. Please save it to your records.
          </div>
          
          <div class="details">
            <h3>Next Steps</h3>
            <ul class="list">
              <li>Download and save the attached contract to your device</li>
              <li>Keep a copy for your records</li>
              <li>Contact your agent if you have any questions about the contract terms</li>
            </ul>
          </div>
          
          <div class="cta">
            <a href="${baseUrl}/landlord/contracts?tab=signed" class="button">👉 View All Signed Contracts</a>
          </div>
          
          <p>If you have any questions about this contract or need assistance, please don't hesitate to reach out to us.</p>
          
          ${customFooter}
        </div>
      </body>
      </html>
    `;
  }
}
