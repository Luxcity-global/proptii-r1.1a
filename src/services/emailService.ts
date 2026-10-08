import JSZip from 'jszip';
import apiService from './api';
import { renderProptiiEmail } from '../utils/proptiiEmailLayout';

interface EmailAttachment {
  filename: string;
  content: File;
}

interface EmailContent {
  to: string;
  subject: string;
  html?: string;
  attachments: EmailAttachment[];
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

interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Viewing notices are not referencing applications. Build a short HTML body when the caller did not. */
function viewingNoticeHtml(emailContent: EmailContent): string {
  const form = emailContent.formData || {};
  const property = form.property || {};
  const viewing = form.viewing || {};
  const user = form.user || {};
  const manager = form.manager || {};
  const address = [property.street, property.town, property.city, property.postcode].filter(Boolean).join(', ');
  const message = viewing.rescheduleMessage || viewing.cancelMessage || '';
  const fromName = user.name || manager.name || '';
  return renderProptiiEmail({
    title: emailContent.subject || 'Viewing update',
    buttonLabel: 'Open Proptii',
    buttonHref: 'https://proptii.co',
    bodyHtml: `
      <div class="details">
        <p><strong>Property:</strong> ${escapeHtml(address || 'Property viewing')}</p>
        ${viewing.date ? `<p><strong>Date:</strong> ${escapeHtml(viewing.date)}</p>` : ''}
        ${viewing.time ? `<p><strong>Time:</strong> ${escapeHtml(viewing.time)}</p>` : ''}
        ${viewing.preference ? `<p><strong>Type:</strong> ${escapeHtml(viewing.preference)}</p>` : ''}
        ${fromName ? `<p><strong>From:</strong> ${escapeHtml(fromName)}${user.email ? ` (${escapeHtml(user.email)})` : ''}</p>` : ''}
        ${message ? `<p><strong>Message:</strong> ${escapeHtml(message)}</p>` : ''}
      </div>
    `,
  });
}

interface MultiEmailResponse {
  success: boolean;
  agent?: boolean;
  referee?: boolean;
  guarantor?: boolean;
  user?: boolean;
  error?: string;
}

interface MultiEmailParams {
  formData: {
    identity?: { email?: string };
    agentDetails?: { email?: string };
    employment?: { referenceEmail?: string };
    guarantor?: { email?: string };
  };
  submissionId: string;
}

interface MultiEmailResult {
  success: boolean;
  errors?: any[];
  error?: string;
}

class EmailService {

  private generateEmailTemplate(formData: any): string {
    const identity = formData.identity || {};
    const employment = formData.employment || {};
    const residential = formData.residential || {};
    const financial = formData.financial || {};
    const guarantor = formData.guarantor || {};
    const agentDetails = formData.agentDetails || {};

    // Get the base URL for links in the email
    const baseUrl = import.meta.env.VITE_APP_URL || 
                    (typeof window !== 'undefined' && window.location ? window.location.origin : 
                    (import.meta.env.DEV ? 'http://localhost:5173' : 'https://proptii.co'));

    const htmlString = renderProptiiEmail({
      title: 'Referencing Application',
      buttonLabel: 'Review Documents in Proptii',
      buttonHref: `${baseUrl}/landlord/clients`,
      bodyHtml: `
        <p>Hi ${agentDetails.firstName || ''},</p>
        <p>${identity.firstName || ''} ${identity.lastName || ''} has uploaded their verification documents. ${residential.propertyAddress || ''} </p>
        <p>The documents include:</p>
        
        <div class="section">
          <div class="section-title">Tenant Information</div>
          <div class="info-item">First Name: ${identity.firstName || 'N/A'}</div>
          <div class="info-item">Last Name: ${identity.lastName || 'N/A'}</div>
          <div class="info-item">Email Address: ${identity.email || 'N/A'}</div>
          <div class="info-item">Phone Number: ${identity.phoneNumber || 'N/A'}</div>
          <div class="info-item">Date of Birth: ${identity.dateOfBirth || 'N/A'}</div>
          <div class="info-item">Nationality: ${identity.nationality || 'N/A'}</div>
        </div>
        
        <div class="section">
          <div class="section-title">Employment Details</div>
          <div class="info-item">Employment Status: ${employment.employmentStatus || 'N/A'}</div>
          <div class="info-item">Company Details: ${employment.companyDetails || 'N/A'}</div>
          <div class="info-item">Job Position: ${employment.jobPosition || 'N/A'}</div>
          <div class="info-item">Length of Employment (Years): ${employment.lengthOfEmployment || 'N/A'}</div>
          <div class="info-item">Proof of Employment: ${employment.proofType || 'N/A'}</div>
          <div class="info-item">Refree - Full Name: ${employment.referenceFullName || 'N/A'}</div>
          <div class="info-item">Refree - Email: ${employment.referenceEmail || 'N/A'}</div>
          <div class="info-item">Refree - Phone: ${employment.referencePhone || 'N/A'}</div>
        </div>
        
        <div class="section">
          <div class="section-title">Residential History</div>
          <div class="info-item">Reason for leaving Previous Address: ${residential.reasonForLeaving || 'N/A'}</div>
          <div class="info-item">Current Address: ${residential.currentAddress || 'N/A'}</div>
          <div class="info-item">Previous Address (If less than 3 yrs at current): ${residential.previousAddress || 'N/A'}</div>
          <div class="info-item">How long have you lived at this current Address?: ${residential.durationAtCurrentAddress || 'N/A'}</div>
          <div class="info-item">Proof of Address: ${residential.proofType || 'N/A'}</div>
          <div class="info-item">exact duration at previous address: ${residential.durationAtPreviousAddress || 'N/A'}</div>
        </div>
        
        <div class="section">
          <div class="section-title">Financial Information</div>
          <div class="info-item">Monthly Income: ${financial.monthlyIncome ? `£${financial.monthlyIncome}` : 'N/A'}</div>
          <div class="info-item">Proof of Income Type: ${financial.proofOfIncomeType || 'N/A'}</div>
        </div>
        
        <div class="section">
          <div class="section-title">Guarantor Details</div>
          <div class="info-item">Guarantor's First Name: ${guarantor.firstName || 'N/A'}</div>
          <div class="info-item">Guarantor's Last Name: ${guarantor.lastName || 'N/A'}</div>
          <div class="info-item">Guarantor's Email Address: ${guarantor.email || 'N/A'}</div>
          <div class="info-item">Guarantor's Phone Number: ${guarantor.phoneNumber || 'N/A'}</div>
          <div class="info-item">Guarantor's Address: ${guarantor.address || 'N/A'}</div>
        </div>
        
        <p>Once completed, you will receive the confirmation forms from the Referee and Guarantor. Please review all submissions and verify the documents. 
        Once confirmed, you may proceed to accept the user as a tenant.</p>
        <p>If you need any assistance during the verification process, please contact our support team through your Proptii dashboard.</p>
      `,
    });

    console.log('Generated email HTML:', htmlString);
    return htmlString;
  }

  private async createAttachmentsZip(attachments: EmailAttachment[], identity: any): Promise<File | null> {
    if (attachments.length === 0) return null;

    try {
      const zip = new JSZip();

      // Create folders for different types of documents
      const idFolder = zip.folder("1_Identity_Documents");
      const employmentFolder = zip.folder("2_Employment_Documents");
      const residentialFolder = zip.folder("3_Residential_Documents");
      const financialFolder = zip.folder("4_Financial_Documents");
      const guarantorFolder = zip.folder("5_Guarantor_Documents");

      // Helper function to add file to appropriate folder
      const addFileToFolder = async (attachment: EmailAttachment) => {
        const { filename, content } = attachment;
        const fileBuffer = await content.arrayBuffer();

        if (filename.startsWith('identity_proof')) {
          idFolder?.file(filename, fileBuffer);
        } else if (filename.startsWith('employment_proof')) {
          employmentFolder?.file(filename, fileBuffer);
        } else if (filename.startsWith('residential_proof')) {
          residentialFolder?.file(filename, fileBuffer);
        } else if (filename.startsWith('income_proof')) {
          financialFolder?.file(filename, fileBuffer);
        } else if (filename.startsWith('guarantor_proof')) {
          guarantorFolder?.file(filename, fileBuffer);
        }
      };

      // Add all files to their respective folders
      await Promise.all(attachments.map(addFileToFolder));

      // Generate the zip file
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 6
        }
      });

      // Create a File from the Blob
      const applicantName = `${identity?.firstName || 'Unknown'}_${identity?.lastName || 'User'}`;
      const timestamp = new Date().toISOString().split('T')[0];
      return new File(
        [zipBlob],
        `${applicantName}_Documents_${timestamp}.zip`,
        { type: 'application/zip' }
      );
    } catch (error) {
      console.error('Error creating zip file:', error);
      throw new Error('Failed to create zip file');
    }
  }

  async sendEmail(emailContent: EmailContent): Promise<SendEmailResponse> {
    try {
      console.log('Starting email submission process...', {
        to: emailContent.to,
        subject: emailContent.subject,
        attachmentsCount: emailContent.attachments?.length || 0,
        emailType: emailContent.emailType || 'agent'
      });

      /** Viewing notifications are often sent before login; `/referencing/send-email` requires JWT. */
      const viewingEmailTypes: NonNullable<EmailContent['emailType']>[] = [
        'viewing-agent',
        'viewing-user',
        'viewing-confirmed',
        'viewing-reschedule',
        'viewing-cancel',
        'viewing-cancellation',
      ];
      if (emailContent.emailType && viewingEmailTypes.includes(emailContent.emailType)) {
        if (!emailContent.to || !String(emailContent.to).includes('@')) {
          return { success: false, error: 'A recipient email is required.' };
        }
        try {
          console.info(`[EmailService] Sending viewing email via apiService`);
          const html = emailContent.html || viewingNoticeHtml(emailContent);
          const jsonBody = {
            to: emailContent.to,
            subject: emailContent.subject,
            html,
            emailType: emailContent.emailType,
          };
          let response: { data?: { success?: boolean; error?: string; messageId?: string } };
          try {
            response = await apiService.post<any>('/email/send', jsonBody, { timeout: 60000 });
          } catch {
            const form = new FormData();
            form.append('to', emailContent.to);
            form.append('subject', emailContent.subject);
            form.append('html', html);
            form.append('emailType', emailContent.emailType);
            response = await apiService.post<any>('/email/send', form, { timeout: 60000 });
          }

          const body = response?.data;
          const sent = body?.success !== false && Boolean(body?.messageId || body?.success);
          if (!sent) {
            throw new Error(body?.error || 'Failed to send email');
          }
          console.log('Server response:', body);
          return {
            success: true,
            messageId: body?.messageId,
          };
        } catch (error: any) {
          const errMessage = error.message || 'Unknown error';
          throw new Error(`Email submission failed: ${errMessage}`);
        }
      }

      const buildFormData = (zipFile: File | null) => {
        const payload = new FormData();
        payload.append('to', emailContent.to);
        payload.append('subject', emailContent.subject);
        payload.append('formData', JSON.stringify(emailContent.formData));
        payload.append('emailType', emailContent.emailType || 'agent');
        if (zipFile) {
          payload.append('attachments', zipFile);
        }
        return payload;
      };

      let zipAttachment: File | null = null;

      // Only create zip file for referencing agent emails
      if (emailContent.emailType === 'agent' && emailContent.attachments?.length > 0) {
        // Create zip file
        const zip = new JSZip();

        // Process each attachment
        for (const attachment of emailContent.attachments) {
          try {
            // Get folder path and filename from the attachment's filename
            const [folderPath, fileName] = attachment.filename.split('/');

            // Get or create the folder in the zip
            const folder = zip.folder(folderPath);
            if (!folder) {
              console.error(`Failed to create/get folder: ${folderPath}`);
              continue;
            }

            // Convert File to ArrayBuffer
            const fileArrayBuffer = await attachment.content.arrayBuffer();

            // Add the file to the appropriate folder
            console.log(`Adding file to zip: ${folderPath}/${fileName}`);
            folder.file(fileName, fileArrayBuffer);
          } catch (error) {
            console.error('Error processing attachment:', error);
            console.error('Attachment details:', {
              filename: attachment.filename,
              contentType: attachment.content.type,
              size: attachment.content.size
            });
          }
        }

        // Generate zip file
        const zipBlob = await zip.generateAsync({
          type: 'blob',
          compression: "DEFLATE",
          compressionOptions: {
            level: 9
          }
        });

        const applicantName = `${emailContent.formData.identity.firstName || 'Unknown'}_${emailContent.formData.identity.lastName || 'User'}`;
        const timestamp = new Date().toISOString().split('T')[0];
        const zipFile = new File(
          [zipBlob],
          `${applicantName}_Documents_${timestamp}.zip`,
          { type: 'application/zip' }
        );

        zipAttachment = zipFile;
      }

      const axiosConfig = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
        maxContentLength: 100 * 1024 * 1024,
        maxBodyLength: 100 * 1024 * 1024
      };

      try {
        console.info(`[EmailService] Sending referencing email via apiService`);
        const response = await apiService.post<any>('/referencing/send-email', buildFormData(zipAttachment), axiosConfig);

        if (response.data && !response.data.success) {
          throw new Error(response.data.error || 'Failed to send email');
        }

        console.log('Server response:', response.data);
        return {
          success: true,
          messageId: response.data?.messageId
        };
      } catch (error: any) {
        const errMessage = error.message || 'Unknown error';
        throw new Error(`Email submission failed: ${errMessage}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async sendMultipleEmails({ formData, submissionId }: MultiEmailParams): Promise<MultiEmailResult> {
    try {
      const emailPromises = [];

      // 1. Send email to user
      if (formData.identity?.email) {
        emailPromises.push(this.sendEmail({
          to: formData.identity.email,
          subject: 'Your Referencing Application Has Been Submitted',
          formData,
          emailType: 'user',
          attachments: []
        }));
      }

      // 2. Send email to agent
      if (formData.agentDetails?.email) {
        emailPromises.push(this.sendEmail({
          to: formData.agentDetails.email,
          subject: 'New Referencing Application Received',
          formData,
          emailType: 'agent',
          attachments: []
        }));
      }

      // 3. Send email to referee
      if (formData.employment?.referenceEmail) {
        emailPromises.push(this.sendEmail({
          to: formData.employment.referenceEmail,
          subject: 'Reference Request for Rental Application',
          formData,
          emailType: 'referee',
          attachments: []
        }));
      }

      // 4. Send email to guarantor
      if (formData.guarantor?.email) {
        emailPromises.push(this.sendEmail({
          to: formData.guarantor.email,
          subject: 'Guarantor Request for Rental Application',
          formData,
          emailType: 'guarantor',
          attachments: []
        }));
      }

      // Send all emails in parallel
      const results = await Promise.allSettled(emailPromises);

      // Check results
      const success = results.every(result => result.status === 'fulfilled');
      const errors = results
        .filter(result => result.status === 'rejected')
        .map(result => (result as PromiseRejectedResult).reason);

      return {
        success,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('Error sending multiple emails:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send emails'
      };
    }
  }

  async sendViewingEmails(data: any): Promise<MultiEmailResponse> {
    const results: MultiEmailResponse = {
      success: false // Initialize with false
    };

    try {
      // Send email to agent
      if (data.property.agent?.email) {
        const agentResult = await this.sendEmail({
          to: data.property.agent.email,
          subject: `New Viewing Request - ${data.property.street}`,
          formData: data,
          html: data.agentHtml,
          attachments: [],
          emailType: 'viewing-agent'
        });
        results.agent = agentResult.success;
      }

      // Send confirmation email to user
      if (data.user.email) {
        const userResult = await this.sendEmail({
          to: data.user.email,
          subject: 'Your Viewing Request Confirmation',
          formData: data,
          html: data.userHtml,
          attachments: [],
          emailType: 'viewing-user'
        });
        results.user = userResult.success;
      }

      // Set overall success if at least one email was sent
      results.success = !!(results.agent || results.user);

      return results;
    } catch (error) {
      console.error('Error sending viewing emails:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send viewing emails'
      };
    }
  }
}

export default new EmailService(); 