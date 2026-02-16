import axios from 'axios';
import JSZip from 'jszip';
import { API_BASE_CANDIDATES, buildApiUrl, PRIMARY_API_BASE_URL } from '../utils/apiEndpoints';

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

const DEFAULT_BROWSER_FALLBACK = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : 'https://proptii-r1-1a-new-backend.onrender.com/api';

const API_BASE_URLS = API_BASE_CANDIDATES.length > 0 ? API_BASE_CANDIDATES : [DEFAULT_BROWSER_FALLBACK];

// Use VITE_API_URL if available, otherwise fallback to defaults
const API_BASE_URL = PRIMARY_API_BASE_URL || API_BASE_URLS[0];

class EmailService {
  private readonly API_URL = API_BASE_URL;
  private readonly apiBases = API_BASE_URLS;

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

    const htmlString = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .section { margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
          .section-title { color: #136C9E; margin-bottom: 10px; font-weight: bold; }
          .info-item { margin: 5px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; }
          .footer-logo { display: flex; align-items: center; margin-top: 16px; }
          .footer-logo img { height: 40px; margin-right: 10px; }
          .footer-desc { font-style: italic; color: #555; margin-top: 10px; }
          .footer-link { color: #136C9E; text-decoration: underline; }
          hr { border: none; border-top: 1px solid #bbb; margin: 24px 0 16px 0; }
        </style>
      </head>
      <body>
        <h2>Referencing Application</h2>
        
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

        <div style="margin: 24px 0; text-align: center;">
          <a href="${baseUrl}/landlord/clients" 
             style="display: inline-block; background: linear-gradient(135deg, #DC5F12 0%, #FF6B1A 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(220, 95, 18, 0.3); transition: all 0.3s ease;">
            👉 Review Documents in Proptii
          </a>
        </div>
        
        <p>If you need any assistance during the verification process, please contact our support team through your Proptii dashboard.</p>
        
        <div style="margin-top: 32px;">
          Best regards,<br>
          The Proptii Team
        </div>
        <hr />
        <div class="footer-desc">
          <em>Proptii is a one-stop AI platform created for tenants, agents, and landlords to conduct and fulfill property transactions. Try it <a href="https://proptii.co" class="footer-link">here</a>.</em>
        </div>
        <div class="footer-logo">
          <img src="https://ci3.googleusercontent.com/meips/ADKq_NY8hEqCfpvIsclrL2Y7Bh5rbsplzRLKZCSdpIpnfd0yj3UbdHYRghh_jcqBeTVksaYGkXybNBH7dR78-7qrgfVu81YmwI4tHtHb3B7ILEq32SZW1Rf1WYXK=s0-d-e1-ft#https://framerusercontent.com/images/tjOUqAPA6VZNlXVDj9tqwYJ7BE.png" alt="Proptii Logo" />
        </div>
      </body>
      </html>`;

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

      const errorLog: string[] = [];

      for (const base of this.apiBases) {
        const targetUrl = buildApiUrl(base, '/referencing/send-email');
        try {
          console.info(`[EmailService] Sending referencing email via ${targetUrl}`);
          const response = await axios.post(targetUrl, buildFormData(zipAttachment), axiosConfig);

          if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to send email');
          }

          console.log('Server response:', response.data);
          return {
            success: true,
            messageId: response.data.messageId
          };
        } catch (error) {
          const shouldRetry = axios.isAxiosError(error) ? !error.response : false;
          const errMessage = axios.isAxiosError(error)
            ? `${error.message}${error.code ? ` (${error.code})` : ''}`
            : (error instanceof Error ? error.message : 'Unknown error');
          errorLog.push(`[${targetUrl}] ${errMessage}`);

          if (!shouldRetry) {
            throw new Error(`Email submission failed: ${errorLog.join(' | ')}`);
          }

          console.warn(`[EmailService] Retrying with next API base due to network error at ${targetUrl}`);
        }
      }

      throw new Error(`Email submission failed for all API bases: ${errorLog.join(' | ')}`);
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: axios.isAxiosError(error)
          ? error.message
          : (error instanceof Error ? error.message : 'Unknown error occurred')
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