import express from 'express';
import { emailService } from '../services/emailService.js';

const router = express.Router();

// Send support form email
router.post('/send-email', async (req, res) => {
  try {
    console.log('Received support form email request:', {
      to: req.body.to,
      subject: req.body.subject,
      from: req.body.from
    });

    const { to, subject, from, formData } = req.body;

    if (!to || !subject || !formData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, or formData'
      });
    }

    // Generate HTML email for support request
    const html = generateSupportEmailTemplate(formData);

    // Send email using the existing email service
    const emailResult = await emailService.sendEmail({
      to,
      subject,
      formData,
      attachments: [],
      submissionId: Date.now().toString(),
      emailType: 'support' // New type for support emails
    });

    console.log('Support email sent successfully:', emailResult.messageId);

    res.json({
      success: true,
      messageId: emailResult.messageId
    });
  } catch (err) {
    console.error('Error sending support email:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to send support email'
    });
  }
});

// Generate HTML template for support emails
function generateSupportEmailTemplate(formData) {
  const { subject, heading, body, email, submittedAt } = formData;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #0A2342;
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .header p {
          margin: 10px 0 0 0;
          opacity: 0.9;
          font-size: 14px;
        }
        .content {
          background-color: #f9f9f9;
          padding: 30px;
          border: 1px solid #ddd;
          border-top: none;
          border-radius: 0 0 8px 8px;
        }
        .field {
          margin-bottom: 20px;
          padding: 15px;
          background-color: white;
          border-left: 4px solid #FF6B35;
          border-radius: 4px;
        }
        .field-label {
          font-weight: bold;
          color: #0A2342;
          margin-bottom: 8px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .field-value {
          color: #555;
          font-size: 15px;
          line-height: 1.5;
        }
        .field-value a {
          color: #FF6B35;
          text-decoration: none;
        }
        .field-value a:hover {
          text-decoration: underline;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #888;
          font-size: 12px;
          border-top: 1px solid #ddd;
          margin-top: 20px;
        }
        .reply-button {
          display: inline-block;
          background-color: #FF6B35;
          color: white !important;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>New Support Request</h1>
        <p>FAQ Contact Form Submission</p>
      </div>
      
      <div class="content">
        <div class="field">
          <div class="field-label">Subject Category</div>
          <div class="field-value">${subject || 'Not specified'}</div>
        </div>
        
        <div class="field">
          <div class="field-label">Heading</div>
          <div class="field-value">${heading || 'Not specified'}</div>
        </div>
        
        <div class="field">
          <div class="field-label">User Email</div>
          <div class="field-value">
            <a href="mailto:${email}">${email}</a>
          </div>
        </div>
        
        <div class="field">
          <div class="field-label">Message</div>
          <div class="field-value" style="white-space: pre-wrap;">${body || 'No message provided'}</div>
        </div>
        
        <div class="field">
          <div class="field-label">Submitted At</div>
          <div class="field-value">${submittedAt ? new Date(submittedAt).toLocaleString() : new Date().toLocaleString()}</div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="mailto:${email}" class="reply-button">Reply to User</a>
        </div>
      </div>
      
      <div class="footer">
        <p>This is an automated message from the Proptii Support System</p>
        <p>© ${new Date().getFullYear()} Proptii. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

export default router;

