import axios from 'axios';

interface ContractEmailParams {
  to: string;
  recipientName: string;
  contractName: string;
  signedPdfBytes: Uint8Array;
  documentName?: string;
  senderName?: string;
  senderEmail?: string;
}

interface ContractEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

const API_BASE_URL = (() => {
  // Prefer configured URL from Vite env
  const envBase = (import.meta as any)?.env?.VITE_API_URL as string | undefined;
  const base = (envBase || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://proptii-r1-1a-new-backend.onrender.com'))
    .replace(/\/$/, '');
  return `${base}/api`;
})();

class ContractEmailService {
  private readonly API_URL = API_BASE_URL;

  private generateContractEmailTemplate(params: ContractEmailParams): string {
    const { recipientName, contractName, senderName = 'Proptii Team' } = params;
    
    // Get the base URL for links in the email
    const baseUrl = window.location.origin;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charSet="utf-8" />
        <style>
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
        </style>
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
          
          <div class="footer">
            <p>Best regards,<br>${senderName}</p>
            <hr />
            <em>Proptii is a one-stop AI platform created for tenants, agents, and landlords to conduct and fulfill property transactions. Try it <a href="https://proptii.co">here</a>.</em>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendSignedContractEmail(params: ContractEmailParams): Promise<ContractEmailResponse> {
    try {
      console.log('📧 Preparing to send signed contract email...', {
        to: params.to,
        recipientName: params.recipientName,
        contractName: params.contractName,
        documentSize: params.signedPdfBytes.length
      });

      // Create FormData to handle the PDF attachment
      const formData = new FormData();

      // Add email metadata
      formData.append('to', params.to);
      formData.append('subject', `Signed Contract: ${params.contractName}`);
      formData.append('recipientName', params.recipientName);
      formData.append('contractName', params.contractName);
      formData.append('senderName', params.senderName || 'Proptii Team');
      formData.append('senderEmail', params.senderEmail || 'noreply@proptii.co');
      formData.append('emailType', 'signed-contract');

      // Convert Uint8Array to Blob and then to File
      const pdfBlob = new Blob([params.signedPdfBytes], { type: 'application/pdf' });
      const documentName = params.documentName || `${params.contractName.replace(/[^a-zA-Z0-9]/g, '_')}_signed.pdf`;
      const pdfFile = new File([pdfBlob], documentName, { type: 'application/pdf' });

      // Add the PDF file as attachment
      formData.append('attachment', pdfFile);

      // Generate HTML content
      const htmlContent = this.generateContractEmailTemplate(params);
      formData.append('htmlContent', htmlContent);

      // Send to backend
      const response = await axios.post(`${this.API_URL}/contracts/send-signed-contract`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for file uploads
        maxContentLength: 50 * 1024 * 1024, // 50MB max
        maxBodyLength: 50 * 1024 * 1024 // 50MB max
      });

      console.log('📧 Email sent successfully:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to send contract email');
      }

      return {
        success: true,
        messageId: response.data.messageId
      };

    } catch (error) {
      console.error('❌ Error sending contract email:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred while sending email'
      };
    }
  }

  // Method to send contract to multiple recipients
  async sendSignedContractToMultipleRecipients(
    recipients: Array<{ email: string; name: string }>,
    contractName: string,
    signedPdfBytes: Uint8Array,
    documentName?: string,
    senderName?: string,
    senderEmail?: string
  ): Promise<{ success: boolean; results: Array<{ email: string; success: boolean; error?: string }> }> {
    try {
      console.log(`📧 Sending signed contract to ${recipients.length} recipients...`);

      const emailPromises = recipients.map(recipient => 
        this.sendSignedContractEmail({
          to: recipient.email,
          recipientName: recipient.name,
          contractName,
          signedPdfBytes,
          documentName,
          senderName,
          senderEmail
        }).then(result => ({
          email: recipient.email,
          success: result.success,
          error: result.error
        }))
      );

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

      console.log(`📧 Email sending completed. Success: ${allSuccessful}, Results:`, processedResults);

      return {
        success: allSuccessful,
        results: processedResults
      };

    } catch (error) {
      console.error('❌ Error sending contract to multiple recipients:', error);
      return {
        success: false,
        results: recipients.map(recipient => ({
          email: recipient.email,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }))
      };
    }
  }
}

export default new ContractEmailService();
