import axios from 'axios';
import { PRIMARY_API_BASE_URL } from '../../../utils/apiEndpoints';

interface ContractEmailParams {
  to: string;
  recipientName: string;
  contractTitle: string;
  contractFileUrl: string;
  fileName: string;
  additionalInfo?: string;
  expiryDate?: Date;
  attachmentError?: string; // Error message if attachment could not be attached
}

interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

const API_BASE_URL = PRIMARY_API_BASE_URL;

class ContractEmailService {
  private readonly API_URL = API_BASE_URL;

  /**
   * Check if backend server is accessible
   */
  private async checkBackendHealth(): Promise<boolean> {
    try {
      const baseUrl = API_BASE_URL.replace('/api', '');
      const response = await axios.get(`${baseUrl}/`, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      console.error('Backend server not accessible:', error);
      return false;
    }
  }

  /**
   * Generate HTML email template for contract sending
   */
  private generateContractEmailTemplate(params: ContractEmailParams): string {
    const { recipientName, contractTitle, additionalInfo, expiryDate, attachmentError } = params;
    
    const expiryText = expiryDate 
      ? `<p><strong>Expiry Date:</strong> ${expiryDate.toLocaleDateString('en-GB', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        })}</p>`
      : '';

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
            background: linear-gradient(135deg, #DC5F12 0%, #FF6B1A 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            background-color: #ffffff;
            padding: 30px;
            border: 1px solid #e0e0e0;
            border-top: none;
          }
          .section {
            margin: 20px 0;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 5px;
            border-left: 4px solid #DC5F12;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #DC5F12;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
          }
          .button:hover {
            background-color: #FF6B1A;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 0.9em;
            color: #666;
            text-align: center;
          }
          .info-box {
            background-color: #EEF9FF;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #136C9E;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📄 Contract for Review</h1>
        </div>
        
        <div class="content">
          <p>Dear ${recipientName},</p>
          
          <p>You have received a new contract document for your review:</p>
          
          <div class="section">
            <h2 style="margin-top: 0; color: #374957;">${contractTitle}</h2>
            ${expiryText}
            ${additionalInfo ? `<p><strong>Additional Information:</strong><br>${additionalInfo}</p>` : ''}
          </div>
          
          ${attachmentError ? `
          <div class="info-box" style="background-color: #FFF3CD; border-left-color: #FFC107;">
            <p><strong>⚠️ Notice:</strong> ${attachmentError}</p>
          </div>
          ` : `
          <div class="info-box">
            <p><strong>⚠️ Important:</strong> Please review the attached contract document carefully. 
            If you have any questions or need clarification, please contact the sender.</p>
          </div>
          <p>The contract document is attached to this email. Please review it and follow the instructions provided.</p>
          `}
          
          <p style="margin-top: 30px;">Best regards,<br>
          <strong>Proptii Property Management</strong></p>
        </div>
        
        <div class="footer">
          <p>This is an automated email from Proptii Property Management System.</p>
          <p>If you have any questions, please contact your property manager.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send contract via email (with optional attachment)
   */
  async sendContractEmail(params: ContractEmailParams, includeAttachment: boolean = true): Promise<SendEmailResponse> {
    try {
      // Check if backend is accessible
      const backendAvailable = await this.checkBackendHealth();
      if (!backendAvailable) {
        return {
          success: false,
          error: `Backend server is not accessible at ${this.API_URL.replace('/api', '')}. Please ensure the server is running.`
        };
      }

      let file: File | null = null;
      let attachmentError: string | null = null;

      // Try to fetch the attachment if requested
      if (includeAttachment && params.contractFileUrl) {
        console.log('Fetching contract file from Firebase Storage:', params.contractFileUrl);
        
        try {
          const fileResponse = await fetch(params.contractFileUrl, {
            method: 'GET',
            mode: 'cors',
          });
          
          if (!fileResponse.ok) {
            throw new Error(`Failed to fetch contract file: ${fileResponse.status} ${fileResponse.statusText}`);
          }
          
          const blob = await fileResponse.blob();
          file = new File([blob], params.fileName, { type: blob.type || 'application/pdf' });

          console.log('Preparing email with file:', {
            fileName: params.fileName,
            fileSize: file.size,
            fileType: file.type
          });
        } catch (fetchError: any) {
          console.warn('Failed to fetch attachment, sending email without attachment:', fetchError);
          attachmentError = fetchError.message || 'Could not attach file';
          // Continue without attachment
        }
      } else {
        console.log('Sending email without attachment (includeAttachment=false)');
      }

      // Create form data
      const formData = new FormData();
      formData.append('to', params.to);
      formData.append('subject', `Contract for Review: ${params.contractTitle}`);
      
      // Include note about attachment in email template if attachment failed
      const emailParams = attachmentError 
        ? { ...params, attachmentError: `Note: The contract file could not be attached (${attachmentError}). Please contact the sender to obtain the document.` }
        : params;
      
      formData.append('html', this.generateContractEmailTemplate(emailParams));
      
      // Only append attachment if we successfully fetched it
      if (file) {
        formData.append('attachments', file);
      }

      console.log('Sending email request to:', `${this.API_URL}/email/send`);
      console.log('Email details:', {
        to: params.to,
        subject: `Contract for Review: ${params.contractTitle}`,
        hasAttachment: !!file,
        attachmentError: attachmentError || null
      });

      // Send email via backend API
      const response = await axios.post(`${this.API_URL}/email/send`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for file uploads
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        }
      });

      console.log('Email API response:', response.data);

      if (!response.data.success) {
        const serverError = response.data.error || 'Failed to send email';
        const details = response.data.details;
        
        let fullError = serverError;
        if (details?.smtp) {
          console.error('SMTP Configuration:', details.smtp);
          fullError += `\n\nSMTP Config: ${details.smtp.host}:${details.smtp.port}`;
        }
        
        throw new Error(fullError);
      }

      console.log('✅ Email sent successfully! Message ID:', response.data.messageId);
      
      return {
        success: true,
        messageId: response.data.messageId
      };
    } catch (error) {
      console.error('Error sending contract email:', error);
      
      // Provide more detailed error messages
      let errorMessage = 'Unknown error occurred';
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          errorMessage = `Cannot connect to backend server at ${this.API_URL.replace('/api', '')}. Please ensure the server is running on port 3000.`;
        } else if (error.response) {
          // Server responded with error status
          errorMessage = error.response.data?.error || error.response.data?.message || `Server error: ${error.response.status}`;
          if (error.response.data?.details) {
            console.error('Error details:', error.response.data.details);
          }
        } else if (error.request) {
          errorMessage = 'No response from server. Please check if the backend server is running.';
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}

export const contractEmailService = new ContractEmailService();
