import apiService from './api';
import { renderProptiiEmail } from '../utils/proptiiEmailLayout';

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

class ContractEmailService {
  private generateContractEmailTemplate(params: ContractEmailParams): string {
    const { recipientName, contractName, senderName = 'Proptii Team' } = params;
    
    const baseUrl = window.location.origin;

    return renderProptiiEmail({
      title: 'Signed Contract Ready',
      buttonLabel: 'View All Signed Contracts',
      buttonHref: `${baseUrl}/landlord/contracts?tab=signed`,
      bodyHtml: `
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
          <p><strong>Status:</strong> Fully Executed</p>
        </div>
        <div class="details">
          <h3>Contract Attachment</h3>
          <p>Your signed contract is attached to this email as a PDF document. Please save it to your records.</p>
        </div>
        <div class="details">
          <h3>Next Steps</h3>
          <ul>
            <li>Download and save the attached contract to your device</li>
            <li>Keep a copy for your records</li>
            <li>Contact your agent if you have any questions about the contract terms</li>
          </ul>
        </div>
        <p>If you have any questions about this contract or need assistance, please don't hesitate to reach out to us.</p>
        <p>Sent by ${senderName}.</p>
      `,
    });
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
      const pdfBlob = new Blob([params.signedPdfBytes as any], { type: 'application/pdf' });
      const documentName = params.documentName || `${params.contractName.replace(/[^a-zA-Z0-9]/g, '_')}_signed.pdf`;
      const pdfFile = new File([pdfBlob], documentName, { type: 'application/pdf' });

      // Add the PDF file as attachment
      formData.append('attachment', pdfFile);

      // Generate HTML content
      const htmlContent = this.generateContractEmailTemplate(params);
      formData.append('htmlContent', htmlContent);

      // Send to backend
      const response = await apiService.post<any>('/contracts/send-signed-contract', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for file uploads
        maxContentLength: 50 * 1024 * 1024, // 50MB max
        maxBodyLength: 50 * 1024 * 1024 // 50MB max
      });

      console.log('📧 Email sent successfully:', response.data);

      if (response.data && !response.data.success) {
        throw new Error(response.data.error || 'Failed to send contract email');
      }

      return {
        success: true,
        messageId: response.data?.messageId
      };

    } catch (error: any) {
      console.error('❌ Error sending contract email:', error);
      
      if (error.status) {
        console.error('API error details:', {
          status: error.status,
          message: error.message,
          errors: error.errors
        });
      }

      return {
        success: false,
        error: error.message || 'Unknown error occurred while sending email'
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
