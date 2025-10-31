import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

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
  private transporter: nodemailer.Transporter;

  constructor() {
    // Verify required environment variables
    const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM_EMAIL'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      console.error('Missing required environment variables:', missingVars);
      throw new Error('Missing required SMTP configuration');
    }

    // Create nodemailer transporter with improved TLS configuration
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
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`📧 Preparing to send signed contract email (attempt ${attempt}/${retries}):`, {
          to: params.to,
          subject: params.subject,
          contractName: params.contractName,
          recipientName: params.recipientName,
          attachmentSize: params.attachment.content.length
        });

        // Prepare email attachments
        const attachments = [{
          filename: params.attachment.filename,
          content: params.attachment.content,
          contentType: params.attachment.contentType
        }];

        // Send email with timeout
        const result = await Promise.race([
          this.transporter.sendMail({
            from: process.env.SMTP_FROM_EMAIL,
            to: params.to,
            subject: params.subject,
            html: params.htmlContent,
            attachments: attachments
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Email send timeout after 30 seconds')), 30000)
          )
        ]) as any;

        console.log('📧 Signed contract email sent successfully:', {
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
        console.error(`❌ Failed to send signed contract email (attempt ${attempt}/${retries}):`, {
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
            await this.transporter.close();
          } catch (closeError) {
            // Ignore close errors
          }
          
          // Recreate transporter
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
          
          continue;
        }
        
        // If all retries failed or it's not a retryable error, throw
        throw lastError;
      }
    }

    throw lastError || new Error('Failed to send email after all retries');
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
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
          }
          .header { 
            color: #DC5F12; 
            font-size: 24px; 
            margin-bottom: 20px; 
            font-weight: bold; 
            text-align: center;
          }
          .section { 
            margin-bottom: 20px; 
            padding: 15px; 
            background-color: #f9f9f9; 
            border-radius: 8px; 
            border-left: 4px solid #DC5F12;
          }
          .section-title { 
            color: #DC5F12; 
            margin-bottom: 10px; 
            font-weight: bold; 
            font-size: 16px;
          }
          .info-item { 
            margin: 8px 0; 
            padding: 5px 0;
          }
          .contract-details {
            background-color: #fff;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
          }
          .footer { 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #ddd; 
            font-size: 0.9em; 
            color: #666; 
            text-align: center;
          }
          .footer-logo { 
            display: flex; 
            align-items: center; 
            justify-content: center;
            margin-top: 16px; 
          }
          .footer-logo img { 
            height: 40px; 
            margin-right: 10px; 
          }
          .footer-desc { 
            font-style: italic; 
            color: #555; 
            margin-top: 10px; 
          }
          .footer-link { 
            color: #DC5F12; 
            text-decoration: underline; 
          }
          .attachment-notice {
            background-color: #e8f4fd;
            border: 1px solid #b3d9ff;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
          }
          .attachment-notice strong {
            color: #DC5F12;
          }
          hr { 
            border: none; 
            border-top: 1px solid #bbb; 
            margin: 24px 0 16px 0; 
          }
        </style>
      </head>
      <body>
        <div class="header">📄 Signed Contract Ready</div>
        
        <p>Hi ${recipientName},</p>
        
        <p>Great news! Your contract has been successfully signed and is ready for your records.</p>
        
        <div class="section">
          <div class="section-title">Contract Details</div>
          <div class="contract-details">
            <div class="info-item"><strong>Contract Name:</strong> ${contractName}</div>
            <div class="info-item"><strong>Signed Date:</strong> ${new Date().toLocaleDateString('en-GB', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</div>
            <div class="info-item"><strong>Status:</strong> ✅ Fully Executed</div>
          </div>
        </div>
        
        <div class="attachment-notice">
          <strong>📎 Contract Attachment</strong><br>
          Your signed contract is attached to this email as a PDF document. Please save it to your records.
        </div>
        
        <div class="section">
          <div class="section-title">Next Steps</div>
          <ul>
            <li>Download and save the attached contract to your device</li>
            <li>Keep a copy for your records</li>
            <li>Contact your agent if you have any questions about the contract terms</li>
          </ul>
        </div>
        
        <p>If you have any questions about this contract or need assistance, please don't hesitate to reach out to us.</p>
        
        <div style="margin-top: 32px;">
          Best regards,<br>
          ${senderName}
        </div>
        
        <hr />
        <div class="footer-desc">
          <em>Proptii is a one-stop AI platform created for tenants, agents, and landlords to conduct and fulfill property transactions. Try it <a href="https://proptii.com" class="footer-link">here</a>.</em>
        </div>
        <div class="footer-logo">
          <img src="https://ci3.googleusercontent.com/meips/ADKq_NY8hEqCfpvIsclrL2Y7Bh5rbsplzRLKZCSdpIpnfd0yj3UbdHYRghh_jcqBeTVksaYGkXybNBH7dR78-7qrgfVu81YmwI4tHtHb3B7ILEq32SZW1Rf1WYXK=s0-d-e1-ft#https://framerusercontent.com/images/tjOUqAPA6VZNlXVDj9tqwYJ7BE.png" alt="Proptii Logo" />
        </div>
      </body>
      </html>
    `;
  }
}
