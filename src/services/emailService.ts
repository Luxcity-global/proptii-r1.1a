import axios from 'axios';

interface EmailAttachment {
  filename: string;
  content: File;
}

interface EmailContent {
  to: string;
  subject: string;
  html: string;
  attachments: EmailAttachment[];
}

class EmailService {
  // Use window._env_ as fallback if you have runtime environment configuration
  private readonly API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3002'
    : (process.env.REACT_APP_API_URL || 'http://localhost:3002');

  private generateEmailTemplate(formData: any): string {
    const identity = formData.identity || {};
    const employment = formData.employment || {};
    const residential = formData.residential || {};
    const financial = formData.financial || {};
    const guarantor = formData.guarantor || {};

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

  <div style="margin-top: 32px;">
    Yours sincerely,<br>
    The Proptii Team
  </div>
  <hr />
  <div class="footer-desc">
    <em>Proptii is a one-stop AI platform created for tenants, agents, and landlords to conduct and fulfill property transactions. Try it <a href="https://proptii.com" class="footer-link">here</a>.</em>
  </div>
  <div class="footer-logo">
    <img src="/images/proptii-logo.png" alt="Proptii Logo" />
    <span style="font-size: 2rem; color: #E65D24; font-weight: bold; vertical-align: middle;">proptii</span>
  </div>
</body>
</html>`;

    console.log('Generated email HTML:', htmlString);
    return htmlString;
  }

  async sendEmail(emailContent: EmailContent): Promise<boolean> {
    try {
      console.log('Starting email submission process...');
      console.log('Email content:', {
        to: emailContent.to,
        subject: emailContent.subject,
        attachmentsCount: emailContent.attachments.length
      });

      // Create FormData to handle file uploads
      const formData = new FormData();

      // Add email metadata
      formData.append('to', emailContent.to);
      let subject = emailContent.subject.replace(/^New\s+/i, '');
      formData.append('subject', subject);
      formData.append('html', emailContent.html);

      // Add attachments
      emailContent.attachments.forEach((attachment, index) => {
        if (attachment.content instanceof File) {
          console.log(`Adding attachment ${index + 1}:`, {
            filename: attachment.filename,
            size: attachment.content.size,
            type: attachment.content.type
          });
          formData.append('attachments', attachment.content, attachment.filename);
        } else {
          console.warn(`Invalid attachment at index ${index}:`, attachment);
        }
      });

      console.log('Sending request to:', `${this.API_URL}/api/email/send`);

      // Send to backend
      const response = await axios.post(`${this.API_URL}/api/email/send`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds
        maxContentLength: 50 * 1024 * 1024, // 50MB max
        maxBodyLength: 50 * 1024 * 1024 // 50MB max
      });

      console.log('Server response:', response.data);
      return response.data.success;
    } catch (error) {
      console.error('Error sending email:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
      throw new Error('Failed to send email');
    }
  }
}

export const emailService = new EmailService(); 