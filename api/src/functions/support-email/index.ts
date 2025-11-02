import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as nodemailer from 'nodemailer';

interface SupportFormData {
  subject: string;
  heading: string;
  body: string;
  email: string;
}

export async function supportEmail(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Support email function triggered');

  // Handle CORS preflight request
  if (request.method === 'OPTIONS') {
    return {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    };
  }

  try {
    // Parse request body
    const formData: SupportFormData = await request.json() as SupportFormData;
    
    // Validate form data
    if (!formData.subject || !formData.heading || !formData.body || !formData.email) {
      return {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        jsonBody: {
          success: false,
          message: 'Missing required fields'
        }
      };
    }

    // Verify required environment variables
    const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM_EMAIL'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      context.error('Missing required environment variables:', missingVars);
      return {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        jsonBody: {
          success: false,
          message: 'Email service is not properly configured'
        }
      };
    }

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      }
    });

    // Verify SMTP connection
    try {
      await transporter.verify();
      context.log('SMTP connection verified');
    } catch (verifyError) {
      context.error('SMTP verification failed:', verifyError);
      return {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        jsonBody: {
          success: false,
          message: 'Email service connection failed'
        }
      };
    }

    // Prepare email HTML template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
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
            margin-bottom: 5px;
            font-size: 14px;
            text-transform: uppercase;
          }
          .field-value {
            color: #555;
            margin-top: 8px;
            font-size: 15px;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #888;
            font-size: 12px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #FF6B35;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0;">New Support Request</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">FAQ Contact Form Submission</p>
        </div>
        <div class="content">
          <div class="field">
            <div class="field-label">Subject</div>
            <div class="field-value">${formData.subject}</div>
          </div>
          
          <div class="field">
            <div class="field-label">Heading</div>
            <div class="field-value">${formData.heading}</div>
          </div>
          
          <div class="field">
            <div class="field-label">User Email</div>
            <div class="field-value"><a href="mailto:${formData.email}" style="color: #FF6B35;">${formData.email}</a></div>
          </div>
          
          <div class="field">
            <div class="field-label">Message</div>
            <div class="field-value" style="white-space: pre-wrap;">${formData.body}</div>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="mailto:${formData.email}" class="button">Reply to User</a>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated message from the Proptii Support System</p>
          <p>© ${new Date().getFullYear()} Proptii. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    // Email options to support team
    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL,
      to: process.env.SUPPORT_EMAIL || process.env.SMTP_FROM_EMAIL, // Use SUPPORT_EMAIL if set, otherwise use FROM_EMAIL
      subject: `[Support Request] ${formData.subject} - ${formData.heading}`,
      html: emailHtml,
      replyTo: formData.email
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    context.log('Support email sent successfully:', info.messageId);

    // Send confirmation email to user
    const confirmationHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
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
          .content {
            background-color: #f9f9f9;
            padding: 30px;
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 8px 8px;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #888;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0;">Thank You for Contacting Us!</h1>
        </div>
        <div class="content">
          <p>Hi there,</p>
          <p>We've received your support request and our team will review it shortly. Here's a summary of your submission:</p>
          
          <div style="background-color: white; padding: 20px; border-left: 4px solid #FF6B35; margin: 20px 0;">
            <p><strong>Subject:</strong> ${formData.subject}</p>
            <p><strong>Heading:</strong> ${formData.heading}</p>
            <p><strong>Your Message:</strong></p>
            <p style="white-space: pre-wrap;">${formData.body}</p>
          </div>
          
          <p>We typically respond within 24-48 hours. If your inquiry is urgent, please don't hesitate to reach out to us directly.</p>
          
          <p>Best regards,<br>
          <strong>The Proptii Support Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated confirmation email.</p>
          <p>© ${new Date().getFullYear()} Proptii. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const confirmationMailOptions = {
      from: process.env.SMTP_FROM_EMAIL,
      to: formData.email,
      subject: 'We received your support request - Proptii',
      html: confirmationHtml
    };

    // Send confirmation email to user
    await transporter.sendMail(confirmationMailOptions);
    context.log('Confirmation email sent to user:', formData.email);

    return {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      jsonBody: {
        success: true,
        message: 'Support request sent successfully'
      }
    };

  } catch (error) {
    context.error('Error processing support email:', error);
    
    return {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      jsonBody: {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send support email'
      }
    };
  }
}

app.http('support-email', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: supportEmail
});

