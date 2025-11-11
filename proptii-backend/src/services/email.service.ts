import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

interface EmailAttachment {
  filename: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
}

interface EmailData {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
  formData?: any;
  emailType?: 'agent' | 'referee' | 'guarantor' | 'user' | 'viewing-agent' | 'viewing-user' | 'viewing-reschedule' | 'viewing-cancel';
}

interface MultiEmailData {
  formData: any;
  attachments?: any[];
  submissionId: string;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;
  private fromAddress: string;

  constructor() {
    // Initialize SMTP with Nodemailer
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    this.fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER || 'noreply@proptii.com';

    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      try {
        this.transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort),
          secure: parseInt(smtpPort) === 465, // true for 465, false for other ports
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
        this.isConfigured = true;
        console.log(`✅ Email service initialized with SMTP (${smtpHost}:${smtpPort})`);
      } catch (error) {
        console.warn('⚠️ Failed to initialize SMTP:', error);
        this.isConfigured = false;
      }
    } else {
      console.warn('⚠️ Email service not configured - SMTP credentials not set');
      console.warn('   Required: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
      this.isConfigured = false;
    }
  }

  private generateEmailTemplate(formData: any, emailType: string): string {
    const identity = formData.identity || {};
    const employment = formData.employment || {};
    const residential = formData.residential || {};
    const financial = formData.financial || {};
    const guarantor = formData.guarantor || {};
    const agentDetails = formData.agentDetails || {};

    // Get the base URL for links in the email
    const baseUrl = process.env.APP_URL || 'https://proptii.com';

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
      .list { margin: 0; padding-left: 18px; }
      .list li { margin: 6px 0; }
    `;

    const defaultFooter = `
      <div class="footer">
        <p>Best regards,<br>The Proptii Team</p>
        <hr />
        <em>Proptii is a one-stop AI platform created for tenants, agents, and landlords to conduct and fulfill property transactions. Try it <a href="https://proptii.com">here</a>.</em>
      </div>
    `;

    const wrapEmailContent = (title: string, bodyContent: string, footerContent: string = defaultFooter) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charSet="utf-8" />
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">${title}</div>
          ${bodyContent}
          ${footerContent}
        </div>
      </body>
      </html>
    `;

    switch (emailType) {
      case 'agent':
        return wrapEmailContent(
          'New Referencing Application Received',
          `
            <p>Hi ${agentDetails.firstName || ''},</p>
            <p>${identity.firstName || ''} ${identity.lastName || ''} has uploaded their verification documents${residential.propertyAddress ? ` for ${residential.propertyAddress}` : ''}. Please review the submission details below.</p>

            <div class="details grid">
              <div>
                <h3>Tenant Information</h3>
                <p><strong>First Name:</strong> ${identity.firstName || 'N/A'}</p>
                <p><strong>Last Name:</strong> ${identity.lastName || 'N/A'}</p>
                <p><strong>Email:</strong> ${identity.email || 'N/A'}</p>
                <p><strong>Phone:</strong> ${identity.phoneNumber || 'N/A'}</p>
                <p><strong>Date of Birth:</strong> ${identity.dateOfBirth || 'N/A'}</p>
                <p><strong>Nationality:</strong> ${identity.nationality || 'N/A'}</p>
              </div>

              <div>
                <h3>Employment Details</h3>
                <p><strong>Status:</strong> ${employment.employmentStatus || 'N/A'}</p>
                <p><strong>Company:</strong> ${employment.companyDetails || 'N/A'}</p>
                <p><strong>Job Position:</strong> ${employment.jobPosition || 'N/A'}</p>
                <p><strong>Length of Employment:</strong> ${employment.lengthOfEmployment || 'N/A'}</p>
                <p><strong>Proof Provided:</strong> ${employment.proofType || 'N/A'}</p>
                <p><strong>Referee Name:</strong> ${employment.referenceFullName || 'N/A'}</p>
                <p><strong>Referee Email:</strong> ${employment.referenceEmail || 'N/A'}</p>
                <p><strong>Referee Phone:</strong> ${employment.referencePhone || 'N/A'}</p>
              </div>

              <div>
                <h3>Residential History</h3>
                <p><strong>Reason for Leaving:</strong> ${residential.reasonForLeaving || 'N/A'}</p>
                <p><strong>Current Address:</strong> ${residential.currentAddress || 'N/A'}</p>
                <p><strong>Duration at Current Address:</strong> ${residential.durationAtCurrentAddress || 'N/A'}</p>
                <p><strong>Previous Address:</strong> ${residential.previousAddress || 'N/A'}</p>
                <p><strong>Duration at Previous Address:</strong> ${residential.durationAtPreviousAddress || 'N/A'}</p>
                <p><strong>Proof of Address:</strong> ${residential.proofType || 'N/A'}</p>
              </div>

              <div>
                <h3>Financial Information</h3>
                <p><strong>Monthly Income:</strong> ${financial.monthlyIncome ? `£${financial.monthlyIncome}` : 'N/A'}</p>
                <p><strong>Proof of Income Type:</strong> ${financial.proofOfIncomeType || 'N/A'}</p>
              </div>

              <div>
                <h3>Guarantor Details</h3>
                <p><strong>Name:</strong> ${guarantor.firstName || 'N/A'} ${guarantor.lastName || ''}</p>
                <p><strong>Email:</strong> ${guarantor.email || 'N/A'}</p>
                <p><strong>Phone:</strong> ${guarantor.phoneNumber || 'N/A'}</p>
                <p><strong>Address:</strong> ${guarantor.address || 'N/A'}</p>
              </div>
            </div>

            <p>Once completed, you will receive the confirmation forms from the referee and guarantor. Please review all submissions and verify the documents. Once confirmed, you may proceed to accept the user as a tenant.</p>

            <div class="cta">
              <a href="${baseUrl}/landlord/clients" class="button">👉 Review Documents in Proptii</a>
            </div>

            <p>If you need any assistance during the verification process, please contact our support team through your Proptii dashboard.</p>
          `
        );

      case 'user':
        return wrapEmailContent(
          'Application Submitted Successfully!',
          `
            <p>Hi ${identity.firstName || ''},</p>
            <p>Thank you for submitting your referencing application through Proptii. We have received your documents and information. The agent will review your application and may contact you if any additional details are needed.</p>
            <p>You will be notified once your application has been processed.</p>

            <div class="cta">
              <a href="${baseUrl}/dashboard/tenant-referencing" class="button">👉 View My Application on Proptii</a>
            </div>

            <p>Thanks for choosing Proptii — we’re here to make renting easy!</p>
          `
        );

      case 'referee':
        return wrapEmailContent(
          'Reference Request',
          `
            <p>Dear ${employment.referenceFullName || 'Sir/Madam'},</p>
            <p>${identity.firstName || ''} ${identity.lastName || ''} has provided your details as an employment reference for their rental application.</p>
            <p>We would appreciate it if you could support their application by completing the reference at your earliest convenience.</p>
          `
        );

      case 'guarantor':
        return wrapEmailContent(
          'Guarantor Request',
          `
            <p>Dear ${guarantor.firstName || ''} ${guarantor.lastName || ''},</p>
            <p>${identity.firstName || ''} ${identity.lastName || ''} has listed you as a guarantor for their rental application.</p>
            <p>Please confirm your willingness to support their tenancy and provide any requested documentation.</p>
          `
        );

      default:
        return wrapEmailContent('Proptii Notification', `<p>Email content</p>`);
    }
  }

  async sendEmail(emailData: EmailData): Promise<any> {
    try {
      if (!this.isConfigured || !this.transporter) {
        console.warn('⚠️ Email service not configured. Email not sent.');
        return {
          success: false,
          error: 'Email service not configured'
        };
      }

      // Generate HTML content if not provided
      let htmlContent = emailData.html;
      if (!htmlContent && emailData.formData && emailData.emailType) {
        htmlContent = this.generateEmailTemplate(emailData.formData, emailData.emailType);
      }

      const mailOptions = {
        from: this.fromAddress,
        to: emailData.to,
        subject: emailData.subject,
        html: htmlContent || emailData.text || 'No content provided',
        text: emailData.text,
        attachments: emailData.attachments || [],
      };

      console.log(`📧 Sending email to: ${emailData.to}`);
      const result = await this.transporter.sendMail(mailOptions);

      console.log(`✅ Email sent successfully to ${emailData.to}`);

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('❌ Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendMultipleEmails(data: MultiEmailData): Promise<any> {
    try {
      const { formData, submissionId } = data;
      const results: any = {};

      // 1. Send email to user
      if (formData.identity?.email) {
        console.log('📧 Sending email to user...');
        results.user = await this.sendEmail({
          to: formData.identity.email,
          subject: 'Your Referencing Application Has Been Submitted',
          formData,
          emailType: 'user',
        });
      }

      // 2. Send email to agent
      if (formData.agentDetails?.email) {
        console.log('📧 Sending email to agent...');
        results.agent = await this.sendEmail({
          to: formData.agentDetails.email,
          subject: 'New Referencing Application Received',
          formData,
          emailType: 'agent',
        });
      }

      // 3. Send email to referee
      if (formData.employment?.referenceEmail) {
        console.log('📧 Sending email to referee...');
        results.referee = await this.sendEmail({
          to: formData.employment.referenceEmail,
          subject: 'Reference Request for Rental Application',
          formData,
          emailType: 'referee',
        });
      }

      // 4. Send email to guarantor
      if (formData.guarantor?.email) {
        console.log('📧 Sending email to guarantor...');
        results.guarantor = await this.sendEmail({
          to: formData.guarantor.email,
          subject: 'Guarantor Request for Rental Application',
          formData,
          emailType: 'guarantor',
        });
      }

      const allSuccess = Object.values(results).every((r: any) => r.success !== false);

      return {
        success: allSuccess,
        results,
        submissionId,
      };
    } catch (error) {
      console.error('❌ Error sending multiple emails:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

