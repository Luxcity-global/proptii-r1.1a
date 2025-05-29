import axios from 'axios';
import JSZip from 'jszip';

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
  emailType?: 'agent' | 'referee' | 'guarantor' | 'user' | 'viewing-agent' | 'viewing-user';
}

interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface MultiEmailResponse {
  agent?: boolean;
  referee?: boolean;
  guarantor?: boolean;
  user?: boolean;
  error?: string;
}

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3002'
  : (import.meta.env.VITE_API_URL || 'http://localhost:3002');

class EmailService {
  private readonly API_URL = API_BASE_URL;

  private generateEmailTemplate(formData: any): string {
    const identity = formData.identity || {};
    const employment = formData.employment || {};
    const residential = formData.residential || {};
    const financial = formData.financial || {};
    const guarantor = formData.guarantor || {};
    const agentDetails = formData.agentDetails || {};

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
        
        <p>Please contact ${identity.firstName || ''} on ${identity.email || ''} if you need more documents. Let us know if you need support during the verification process.</p>
        
        <div style="margin-top: 32px;">
          Best regards,<br>
          The Proptii Team
        </div>
        <hr />
        <div class="footer-desc">
          <em>Proptii is a one-stop AI platform created for tenants, agents, and landlords to conduct and fulfill property transactions. Try it <a href="https://proptii.com" class="footer-link">here</a>.</em>
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

      // Create FormData to handle file uploads
      const formData = new FormData();

      // Add email metadata
      formData.append('to', emailContent.to);
      formData.append('subject', emailContent.subject);
      formData.append('formData', JSON.stringify(emailContent.formData));
      formData.append('emailType', emailContent.emailType || 'agent');

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

        // Add zip file to FormData
        formData.append('attachments', zipFile);
      }

      // Send to backend
      const response = await axios.post(`${this.API_URL}/api/referencing/send-email`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // Increased timeout for larger files
        maxContentLength: 100 * 1024 * 1024, // 100MB max
        maxBodyLength: 100 * 1024 * 1024 // 100MB max
      });

      console.log('Server response:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to send email');
      }

      return {
        success: true,
        messageId: response.data.messageId
      };
    } catch (error) {
      console.error('Error sending email:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async sendMultipleEmails(formData: any, attachments: EmailAttachment[] = []): Promise<MultiEmailResponse> {
    try {
      // Create FormData to handle file uploads
      const multiFormData = new FormData();
      multiFormData.append('formData', JSON.stringify(formData));

      // Add attachments if any
      if (attachments.length > 0) {
        attachments.forEach(attachment => {
          multiFormData.append('attachments', attachment.content, attachment.filename);
        });
      }

      // Send to backend
      const response = await axios.post(`${this.API_URL}/api/referencing/send-multiple-emails`, multiFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
        maxContentLength: 100 * 1024 * 1024,
        maxBodyLength: 100 * 1024 * 1024
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to send emails');
      }

      return response.data.results;
    } catch (error) {
      console.error('Error sending multiple emails:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
      return {
        error: error instanceof Error ? error.message : 'Failed to send emails'
      };
    }
  }

  async sendViewingEmails(data: any): Promise<MultiEmailResponse> {
    const results: MultiEmailResponse = {};

    try {
      // Send email to agent
      if (data.property.agent?.email) {
        const agentResult = await this.sendEmail({
          to: data.property.agent.email,
          subject: `New Viewing Request - ${data.property.street}`,
          formData: data,
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
          attachments: [],
          emailType: 'viewing-user'
        });
        results.user = userResult.success;
      }

      return results;
    } catch (error) {
      console.error('Error sending viewing emails:', error);
      return {
        ...results,
        error: error instanceof Error ? error.message : 'Failed to send viewing emails'
      };
    }
  }
}

export default new EmailService(); 