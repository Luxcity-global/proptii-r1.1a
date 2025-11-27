import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as sgMail from '@sendgrid/mail';

type SendGridAttachment = NonNullable<sgMail.MailDataRequired['attachments']>[number];

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
  emailType?:
    | 'agent'
    | 'referee'
    | 'guarantor'
    | 'user'
    | 'viewing-agent'
    | 'viewing-user'
    | 'viewing-confirmed'
    | 'viewing-reschedule'
    | 'viewing-cancel'
    | 'viewing-cancellation';
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
  private sendgridEnabled = false;
  private isCloudPlatform: boolean = false;

  constructor() {
    // Detect if we're on a cloud platform (Render, Heroku, etc.)
    this.isCloudPlatform = !!(
      process.env.RENDER ||
      process.env.HEROKU_APP_NAME ||
      process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.K_SERVICE // Google Cloud Run
    );

    // Initialize SendGrid as fallback only (not preferred)
    const sendgridKey = process.env.SENDGRID_API_KEY;
    if (sendgridKey) {
      try {
        sgMail.setApiKey(sendgridKey);
        this.sendgridEnabled = true;
        console.log('✅ SendGrid email fallback enabled (SMTP is primary)');
      } catch (error) {
        console.warn('⚠️ Failed to initialize SendGrid client:', error);
        this.sendgridEnabled = false;
      }
    } else {
      console.log('ℹ️ SendGrid API key not set - SMTP only mode');
    }

    // Initialize SMTP with Nodemailer (primary method)
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    this.fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER || 'noreply@proptii.com';

    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      try {
        const port = parseInt(smtpPort);
        // On cloud platforms, use port 587 with STARTTLS instead of 465 (465 is often blocked)
        // Port 587 is more reliable on cloud hosting providers
        const usePort = this.isCloudPlatform && port === 465 ? 587 : port;
        const isSecure = usePort === 465;
        
        this.transporter = nodemailer.createTransport({
          host: smtpHost,
          port: usePort,
          secure: isSecure, // true for 465, false for other ports
          requireTLS: !isSecure, // Require TLS for non-465 ports
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          tls: {
            // Do not fail on invalid certificates
            rejectUnauthorized: false,
            // Explicitly set TLS version
            minVersion: 'TLSv1.2',
            // Enable SNI (Server Name Indication)
            servername: smtpHost
          },
          // Connection timeout (increased for cloud platforms due to network latency)
          connectionTimeout: this.isCloudPlatform ? 90000 : 30000, // 90s on cloud, 30s local
          // Socket timeout
          socketTimeout: this.isCloudPlatform ? 90000 : 30000, // 90s on cloud
          // Greeting timeout
          greetingTimeout: this.isCloudPlatform ? 45000 : 10000, // 45s on cloud, 10s local
          // DNS timeout
          dnsTimeout: this.isCloudPlatform ? 45000 : 30000, // 45s on cloud
          // Enable connection pooling for better performance
          pool: true,
          maxConnections: 5,
          maxMessages: 100,
          // Debug mode (can be removed in production)
          debug: process.env.NODE_ENV === 'development',
          logger: process.env.NODE_ENV === 'development'
        });
        this.isConfigured = true;
        if (usePort !== port) {
          console.log(`✅ Email service initialized with SMTP (${smtpHost}:${usePort}, auto-switched from ${port} for cloud compatibility)`);
          console.log(`   Using STARTTLS on port ${usePort} (more reliable on cloud platforms)`);
        } else {
          console.log(`✅ Email service initialized with SMTP (${smtpHost}:${usePort})`);
        }
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

    const propertyData = formData.property || {};
    const viewingData = formData.viewing || {};
    const managerData = formData.manager || {};
    const viewingUser = formData.user || {};

    const formatViewingDate = (dateString?: string) => {
      if (!dateString) return 'Date to be confirmed';
      try {
        const parsedDate = new Date(dateString);
        if (isNaN(parsedDate.getTime())) return dateString;
        return parsedDate.toLocaleDateString('en-GB', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } catch {
        return dateString;
      }
    };

    const formatViewingTime = (timeString?: string) => {
      if (!timeString) return 'Time to be confirmed';
      if (/^\d{2}:\d{2}$/.test(timeString)) {
        const [hours, minutes] = timeString.split(':');
        const hourValue = parseInt(hours, 10);
        const ampm = hourValue >= 12 ? 'PM' : 'AM';
        const displayHour = hourValue === 0 ? 12 : hourValue > 12 ? hourValue - 12 : hourValue;
        return `${displayHour}:${minutes} ${ampm}`;
      }
      try {
        const parsedTime = new Date(timeString);
        if (!isNaN(parsedTime.getTime())) {
          return parsedTime.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
        }
      } catch {
        return timeString;
      }
      return timeString;
    };

    const getFullAddress = () => {
      const segments = [propertyData.street, propertyData.city, propertyData.postcode].filter(Boolean);
      return segments.length ? segments.join(', ') : 'Address to be confirmed';
    };

    const formatMultilineText = (text?: string) => {
      if (!text) return '';
      return text.replace(/\n/g, '<br />');
    };

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
            
            <div class="cta">
              <a href="${baseUrl}/?responseType=referee&applicant=${encodeURIComponent(identity.firstName + ' ' + identity.lastName)}&email=${encodeURIComponent(employment.referenceEmail || '')}&tenantEmail=${encodeURIComponent(identity.email || '')}" class="button">👉 Provide Reference Response</a>
            </div>
          `
        );

      case 'guarantor':
        return wrapEmailContent(
          'Guarantor Request',
          `
            <p>Dear ${guarantor.firstName || ''} ${guarantor.lastName || ''},</p>
            <p>${identity.firstName || ''} ${identity.lastName || ''} has listed you as a guarantor for their rental application.</p>
            <p>Please confirm your willingness to support their tenancy and provide any requested documentation.</p>
            
            <div class="cta">
              <a href="${baseUrl}/?responseType=guarantor&applicant=${encodeURIComponent(identity.firstName + ' ' + identity.lastName)}&email=${encodeURIComponent(guarantor.email || '')}&tenantEmail=${encodeURIComponent(identity.email || '')}" class="button">👉 Provide Guarantor Response</a>
            </div>
          `
        );

      case 'viewing-agent': {
        const property = formData.property || {};
        const viewing = formData.viewing || {};
        const user = formData.user || {};
        
        // Format viewing date
        let viewingDate = 'N/A';
        if (viewing.date) {
          try {
            const date = new Date(viewing.date);
            viewingDate = date.toLocaleDateString('en-GB', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          } catch (error) {
            console.error('Error formatting date:', error);
          }
        }
        
        // Format viewing time
        let viewingTime = viewing.time || 'N/A';
        if (viewing.time && /^\d{2}:\d{2}$/.test(viewing.time)) {
          const [hours, minutes] = viewing.time.split(':');
          const hour = parseInt(hours, 10);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
          viewingTime = `${displayHour}:${minutes} ${ampm}`;
        }
        
        const agentName = property.agent?.name || 'Agent';
        const propertyAddress = property.street || 'the property';
        
        return wrapEmailContent(
          'New Viewing Request',
          `
            <p>Hi ${agentName},</p>
            <p>You've received a new viewing request for <strong>${propertyAddress}</strong>.</p>
            
            <div class="details">
              <h3>Viewing Details</h3>
              <p><strong>Requested by:</strong> ${user.name || 'Not provided'}</p>
              <p><strong>Preferred date/time:</strong> ${viewingDate} at ${viewingTime}</p>
              <p><strong>Viewing type:</strong> ${viewing.preference || 'Not specified'}</p>
              <p><strong>Contact email:</strong> ${user.email || 'Not provided'}</p>
              <p><strong>Phone number:</strong> ${viewing.userDetails?.phoneNumber || 'Not provided'}</p>
            </div>
            
            <p>If the property is available, please review the request and confirm the appointment at your earliest convenience. If the suggested time doesn't work for you, kindly propose an alternative that suits your schedule.</p>
            <p>Please send your response to <strong>${user.email}</strong>.</p>
            
            <div class="cta">
              <a href="${baseUrl}/landlord/viewings" class="button">👉 Manage Viewing Requests on Proptii</a>
            </div>
          `
        );
      }

      case 'viewing-user': {
        const property = formData.property || {};
        const viewing = formData.viewing || {};
        const user = formData.user || {};
        
        // Format viewing date
        let viewingDate = 'N/A';
        if (viewing.date) {
          try {
            const date = new Date(viewing.date);
            viewingDate = date.toLocaleDateString('en-GB', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          } catch (error) {
            console.error('Error formatting date:', error);
          }
        }
        
        // Format viewing time
        let viewingTime = viewing.time || 'N/A';
        if (viewing.time && /^\d{2}:\d{2}$/.test(viewing.time)) {
          const [hours, minutes] = viewing.time.split(':');
          const hour = parseInt(hours, 10);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
          viewingTime = `${displayHour}:${minutes} ${ampm}`;
        }
        
        const userName = user.name?.split(' ')[0] || 'there';
        const propertyAddress = property.street || 'the property';
        const fullAddress = `${property.street || ''}, ${property.city || ''}, ${property.postcode || ''}`.trim().replace(/, ,/g, ',').replace(/^,|,$/g, '');
        
        return wrapEmailContent(
          'Your Viewing Request Confirmation',
          `
            <p>Hi ${userName},</p>
            <p>Your viewing request for <strong>${propertyAddress}</strong> has been sent to the agent.</p>
            
            <div class="details">
              <h3>Here's a summary of what you submitted:</h3>
              <p><strong>Date/time requested:</strong> ${viewingDate} at ${viewingTime}</p>
              <p><strong>Viewing type:</strong> ${viewing.preference || 'Not specified'}</p>
              <p><strong>Agent:</strong> ${property.agent?.name || 'Not provided'}</p>
              <p><strong>Property address:</strong> ${fullAddress || 'Not provided'}</p>
            </div>
            
            <p>The agent will contact you shortly to confirm the appointment.</p>
            
            <div class="cta">
              <a href="${baseUrl}/dashboard/viewings" class="button">👉 View My Viewing Requests on Proptii</a>
            </div>
            
            <p>Thanks for choosing Proptii — we're here to make renting easy!</p>
          `
        );
      }

      case 'viewing-confirmed': {
        const propertyAddress = propertyData.street || 'the property';
        const userName = viewingUser.name?.split(' ')[0] || 'there';
        const managerName = managerData.name || propertyData.agent?.name || 'your agent';
        const managerEmail = managerData.email || propertyData.agent?.email || '';

        return wrapEmailContent(
          'Viewing Confirmed 🎉',
          `
            <p>Hi ${userName},</p>
            <p>Your viewing for <strong>${propertyAddress}</strong> is confirmed. We look forward to showing you the property.</p>

            <div class="details">
              <h3>Appointment Details</h3>
              <p><strong>Date:</strong> ${formatViewingDate(viewingData.date)}</p>
              <p><strong>Time:</strong> ${formatViewingTime(viewingData.time)}</p>
              <p><strong>Viewing type:</strong> ${viewingData.preference || 'In-person viewing'}</p>
              <p><strong>Address:</strong> ${getFullAddress()}</p>
              <p><strong>Hosted by:</strong> ${managerName}${managerEmail ? ` &lt;${managerEmail}&gt;` : ''}</p>
            </div>

            <p>Please arrive a few minutes early and bring any notes or questions you may have about the property. If anything changes, reply directly to this email so we can help reschedule.</p>

            <div class="cta">
              <a href="${baseUrl}/dashboard/viewings" class="button">👉 View My Viewing Details</a>
            </div>
          `
        );
      }

      case 'viewing-reschedule': {
        const isManagerInitiated = !!(managerData.name || managerData.email);
        const recipientName = isManagerInitiated
          ? viewingUser.name?.split(' ')[0] || 'there'
          : propertyData.agent?.name || 'there';
        const initiatorName = isManagerInitiated
          ? managerData.name || propertyData.agent?.name || 'Your agent'
          : viewingUser.name || 'The applicant';
        const messageIntro = isManagerInitiated
          ? `${initiatorName} has updated your viewing for <strong>${propertyData.street || 'the property'}</strong>.`
          : `${initiatorName} would like to reschedule the viewing for <strong>${propertyData.street || 'the property'}</strong>.`;
        const messageCopy = viewingData.rescheduleMessage
          ? `
              <div class="details">
                <h3>Message from ${initiatorName}</h3>
                <p>${formatMultilineText(viewingData.rescheduleMessage)}</p>
              </div>
            `
          : '';
        const ctaPath = isManagerInitiated ? '/dashboard/viewings' : '/landlord/viewings';
        const ctaLabel = isManagerInitiated ? '👉 View My Updated Viewing' : '👉 Manage Viewing on Proptii';

        return wrapEmailContent(
          'Viewing Rescheduled',
          `
            <p>Hi ${recipientName},</p>
            <p>${messageIntro}</p>

            <div class="details">
              <h3>New Appointment Details</h3>
              <p><strong>Date:</strong> ${formatViewingDate(viewingData.date)}</p>
              <p><strong>Time:</strong> ${formatViewingTime(viewingData.time)}</p>
              <p><strong>Viewing type:</strong> ${viewingData.preference || 'In-person viewing'}</p>
              <p><strong>Address:</strong> ${getFullAddress()}</p>
            </div>

            ${messageCopy}

            <p>If the new time does not work for you, please reply to this email so we can arrange another slot.</p>

            <div class="cta">
              <a href="${baseUrl}${ctaPath}" class="button">${ctaLabel}</a>
            </div>
          `
        );
      }

      case 'viewing-cancel':
      case 'viewing-cancellation': {
        const isManagerInitiated = !!(managerData.name || managerData.email);
        const recipientName = isManagerInitiated
          ? viewingUser.name?.split(' ')[0] || 'there'
          : propertyData.agent?.name || 'there';
        const initiatorName = isManagerInitiated
          ? managerData.name || propertyData.agent?.name || 'Your agent'
          : viewingUser.name || 'The applicant';
        const reasonText =
          formatMultilineText(viewingData.cancelMessage) ||
          (isManagerInitiated
            ? 'The agent cancelled the viewing but did not include a reason.'
            : 'The applicant cancelled the viewing but did not include a reason.');
        const ctaPath = isManagerInitiated ? '/dashboard/viewings' : '/landlord/viewings';
        const ctaLabel = isManagerInitiated ? '👉 View My Viewing Requests' : '👉 Manage Viewings on Proptii';

        return wrapEmailContent(
          'Viewing Cancelled',
          `
            <p>Hi ${recipientName},</p>
            <p>${initiatorName} has cancelled the viewing for <strong>${propertyData.street || 'the property'}</strong>.</p>

            <div class="details">
              <h3>Reason for cancellation</h3>
              <p>${reasonText}</p>
            </div>

            <p>If you'd like to arrange another visit, simply reply to this email and we'll help set up a new time.</p>

            <div class="cta">
              <a href="${baseUrl}${ctaPath}" class="button">${ctaLabel}</a>
            </div>
          `
        );
      }

      default:
        return wrapEmailContent('Proptii Notification', `<p>Email content</p>`);
    }
  }

  private formatSendGridAttachments(attachments: EmailAttachment[] = []): SendGridAttachment[] {
    return attachments
      .filter((attachment): attachment is EmailAttachment & { content: string | Buffer } => !!attachment?.content)
      .map((attachment) => {
        const buffer = typeof attachment.content === 'string'
          ? Buffer.from(attachment.content)
          : attachment.content;

        return {
          content: buffer.toString('base64'),
          filename: attachment.filename || 'attachment',
          type: attachment.contentType || 'application/octet-stream',
          disposition: 'attachment'
        } as SendGridAttachment;
      });
  }

  private async sendViaSendGrid(emailData: EmailData, htmlContent: string) {
    if (!this.sendgridEnabled) {
      throw new Error('SendGrid is not configured');
    }

    const msg: sgMail.MailDataRequired = {
      to: emailData.to,
      from: this.fromAddress,
      subject: emailData.subject,
      html: htmlContent || emailData.text || 'No content provided',
    };

    if (emailData.text) {
      msg.text = emailData.text;
    }

    const attachments = this.formatSendGridAttachments(emailData.attachments);
    if (attachments.length) {
      msg.attachments = attachments;
    }

    console.log(`📧 Sending email via SendGrid to: ${emailData.to}`);
    const [response] = await sgMail.send(msg);
    const messageId = response?.headers?.['x-message-id'] || response?.headers?.['x-sendgrid-message-id'];

    return {
      success: true,
      messageId,
    };
  }

  async sendEmail(emailData: EmailData, retries = 3): Promise<any> {
    let htmlContent = emailData.html;
    if (!htmlContent && emailData.formData && emailData.emailType) {
      htmlContent = this.generateEmailTemplate(emailData.formData, emailData.emailType);
    }

    const fallbackBody = htmlContent || emailData.text || 'No content provided';
    let lastError: Error | null = null;

    // Try SMTP first (primary method)
    if (this.isConfigured && this.transporter) {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const mailOptions = {
            from: this.fromAddress,
            to: emailData.to,
            subject: emailData.subject,
            html: fallbackBody,
            text: emailData.text,
            attachments: emailData.attachments || [],
          };

          console.log(`📧 Sending email via SMTP to: ${emailData.to} (attempt ${attempt}/${retries})`);
          const result = await this.transporter.sendMail(mailOptions);
          console.log(`✅ Email sent successfully via SMTP to ${emailData.to}`);

          return {
            success: true,
            messageId: result.messageId,
          };
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Failed to send email via SMTP');
          console.error(`❌ SMTP error while sending email (attempt ${attempt}/${retries}):`, error);
          
          // Check if it's a retryable error
          const isRetryable = (error as any)?.code === 'ECONNRESET' || 
                             (error as any)?.code === 'ESOCKET' ||
                             (error as any)?.code === 'ETIMEDOUT' ||
                             (error as any)?.code === 'ECONNREFUSED';
          
          if (attempt < retries && isRetryable) {
            const waitTime = attempt * 2000; // Exponential backoff: 2s, 4s, 6s
            console.log(`⏳ Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            // Try to recreate transporter on connection errors
            try {
              await this.transporter?.close();
            } catch (closeError) {
              // Ignore close errors
            }
            
            // Recreate transporter with improved settings
            const smtpHost = process.env.SMTP_HOST;
            const smtpPort = process.env.SMTP_PORT;
            const smtpUser = process.env.SMTP_USER;
            const smtpPass = process.env.SMTP_PASS;
            
            if (smtpHost && smtpPort && smtpUser && smtpPass) {
              const port = parseInt(smtpPort);
              const usePort = this.isCloudPlatform && port === 465 ? 587 : port;
              const isSecure = usePort === 465;
              
              this.transporter = nodemailer.createTransport({
                host: smtpHost,
                port: usePort,
                secure: isSecure,
                requireTLS: !isSecure,
                auth: {
                  user: smtpUser,
                  pass: smtpPass,
                },
                tls: {
                  rejectUnauthorized: false,
                  minVersion: 'TLSv1.2',
                  servername: smtpHost
                },
                connectionTimeout: this.isCloudPlatform ? 90000 : 30000, // 90s on cloud
                socketTimeout: this.isCloudPlatform ? 90000 : 30000, // 90s on cloud
                greetingTimeout: this.isCloudPlatform ? 45000 : 10000, // 45s on cloud
                dnsTimeout: this.isCloudPlatform ? 45000 : 30000, // 45s on cloud
                pool: true,
                maxConnections: 5,
                maxMessages: 100,
                debug: process.env.NODE_ENV === 'development',
                logger: process.env.NODE_ENV === 'development'
              });
            }
            
            continue;
          }
          
          // If all retries failed or it's not a retryable error, break and try SendGrid
          break;
        }
      }
      
      // If we get here, all retries failed
      if (!this.sendgridEnabled) {
        return {
          success: false,
          error: lastError?.message || 'Failed to send email via SMTP',
        };
      }
      console.warn('⚠️ Falling back to SendGrid after SMTP failure.');
    } else {
      console.warn('⚠️ SMTP email transport not configured. Checking SendGrid fallback.');
    }

    if (this.sendgridEnabled) {
      try {
        return await this.sendViaSendGrid(emailData, fallbackBody);
      } catch (sendgridError) {
        lastError = sendgridError instanceof Error ? sendgridError : new Error('Failed to send email via SendGrid');
        console.error('❌ SendGrid error while sending email:', sendgridError);
        return {
          success: false,
          error: lastError.message,
        };
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Email service not configured',
    };
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

