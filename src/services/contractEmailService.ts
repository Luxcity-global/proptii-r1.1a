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
  const base = (envBase || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://proptii-r1-1a.onrender.com'))
    .replace(/\/$/, '');
  return `${base}/api`;
})();

class ContractEmailService {
  private readonly API_URL = API_BASE_URL;

  private generateContractEmailTemplate(params: ContractEmailParams): string {
    const { recipientName, contractName, senderName = 'Proptii Team' } = params;
    
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
      formData.append('senderEmail', params.senderEmail || 'noreply@proptii.com');
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
