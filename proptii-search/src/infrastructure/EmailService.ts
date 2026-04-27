import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // For development, we'll use a mock/log transporter if SMTP is not configured
    // In production, use real SMTP credentials from env
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, 
      auth: {
        user: process.env.SMTP_USER || 'mock_user',
        pass: process.env.SMTP_PASS || 'mock_pass',
      },
    });
  }

  async sendViewingRequest(agentEmail: string, details: {
    userName: string;
    userEmail: string;
    propertyName: string;
    propertyUrl: string;
    preferredDate: string;
    message?: string;
  }) {
    console.log(`[EmailService] Preparing viewing request for: ${agentEmail}`);

    const html = `
      <h1>New Viewing Request from Proptii</h1>
      <p>A user is interested in booking a viewing for a property listed by your agency.</p>
      
      <h3>Property Details:</h3>
      <ul>
        <li><strong>Name:</strong> ${details.propertyName}</li>
        <li><strong>URL:</strong> <a href="${details.propertyUrl}">${details.propertyUrl}</a></li>
      </ul>

      <h3>Requester Details:</h3>
      <ul>
        <li><strong>Name:</strong> ${details.userName}</li>
        <li><strong>Email:</strong> ${details.userEmail}</li>
        <li><strong>Preferred Date:</strong> ${details.preferredDate}</li>
      </ul>

      ${details.message ? `<h3>Message:</h3><p>${details.message}</p>` : ''}
      
      <p>Please contact the user directly to confirm the viewing.</p>
      <hr>
      <p>Sent via Proptii Search</p>
    `;

    try {
      // In development/no-auth mode, we just log the email content
      if (!process.env.SMTP_USER) {
        console.log('--- MOCK EMAIL SENT ---');
        console.log(`To: ${agentEmail}`);
        console.log(`Subject: Viewing Request: ${details.propertyName}`);
        console.log(`Body: ${html}`);
        console.log('-----------------------');
        return { success: true, messageId: 'mock' };
      }

      const info = await this.transporter.sendMail({
        from: '"Proptii Search" <no-reply@proptii.com>',
        to: agentEmail,
        subject: `Viewing Request: ${details.propertyName}`,
        html: html,
      });

      console.log(`[EmailService] Email sent: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error('[EmailService] Failed to send email:', err);
      throw err;
    }
  }
}
