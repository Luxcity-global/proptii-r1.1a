import * as dotenv from 'dotenv';
import express from 'express';
import { referencingService } from '../services/referencingService.js';
import { EmailClient } from '../services/emailClient.js';
import { AzureKeyCredential } from '@azure/core-auth';
import multer from 'multer';

dotenv.config();
const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  }
});

// Get all form data for a user
router.get('/:userId', async (req, res) => {
  try {
    const data = await referencingService.getFormData(req.params.userId);
    res.json(data);
  } catch (err) {
    console.error('Error fetching form data:', err);
    res.status(500).json({ error: err.message });
  }
});

// Save identity data
router.post('/:userId/identity', async (req, res) => {
  try {
    console.log('Saving identity data:', req.body);
    const result = await referencingService.saveIdentityData(req.params.userId, req.body);
    res.json(result);
  } catch (err) {
    console.error('Error saving identity data:', err);
    res.status(500).json({ error: err.message });
  }
});

// Save employment data
router.post('/:userId/employment', async (req, res) => {
  try {
    console.log('Saving employment data:', req.body);
    const result = await referencingService.saveEmploymentData(req.params.userId, req.body);
    res.json(result);
  } catch (err) {
    console.error('Error saving employment data:', err);
    res.status(500).json({ error: err.message });
  }
});

// Save residential data
router.post('/:userId/residential', async (req, res) => {
  try {
    console.log('Saving residential data:', req.body);
    const result = await referencingService.saveResidentialData(req.params.userId, req.body);
    res.json(result);
  } catch (err) {
    console.error('Error saving residential data:', err);
    res.status(500).json({ error: err.message });
  }
});

// Save financial data
router.post('/:userId/financial', async (req, res) => {
  try {
    console.log('Saving financial data:', req.body);
    const result = await referencingService.saveFinancialData(req.params.userId, req.body);
    res.json(result);
  } catch (err) {
    console.error('Error saving financial data:', err);
    res.status(500).json({ error: err.message });
  }
});

// Save guarantor data
router.post('/:userId/guarantor', async (req, res) => {
  try {
    console.log('Saving guarantor data:', req.body);
    const result = await referencingService.saveGuarantorData(req.params.userId, req.body);
    res.json(result);
  } catch (err) {
    console.error('Error saving guarantor data:', err);
    res.status(500).json({ error: err.message });
  }
});

// Save agent details data
router.post('/:userId/agent', async (req, res) => {
  try {
    console.log('Saving agent details data:', req.body);
    const result = await referencingService.saveAgentDetailsData(req.params.userId, req.body);
    res.json(result);
  } catch (err) {
    console.error('Error saving agent details data:', err);
    res.status(500).json({ error: err.message });
  }
});

// Submit application
router.post('/:userId/submit', async (req, res) => {
  try {
    console.log('Submitting application:', req.params.userId);
    const result = await referencingService.submitApplication(req.params.userId, req.body);
    res.json(result);
  } catch (err) {
    console.error('Error submitting application:', err);
    res.status(500).json({ error: err.message });
  }
});

// Send email with application details
router.post('/send-email', upload.array('attachments'), async (req, res) => {
  try {
    const { to, subject, html } = req.body;
    const attachments = req.files || [];

    console.log('Received email request:', {
      to,
      subject,
      attachmentsCount: attachments.length
    });

    // Configure email service
    const emailConfig = {
      endpoint: process.env.EMAIL_SERVICE_ENDPOINT,
      key: process.env.EMAIL_SERVICE_KEY,
      from: process.env.EMAIL_FROM_ADDRESS || 'noreply@proptii.com'
    };

    // Validate email configuration
    if (!emailConfig.endpoint || !emailConfig.key || !emailConfig.from) {
      console.error('Missing email configuration:', {
        hasEndpoint: !!emailConfig.endpoint,
        hasKey: !!emailConfig.key,
        hasFrom: !!emailConfig.from
      });
      return res.status(500).json({
        error: 'Email service not properly configured',
        success: false
      });
    }

    // Create email client
    const emailClient = new EmailClient(emailConfig.endpoint, new AzureKeyCredential(emailConfig.key));

    // Prepare email message
    const message = {
      senderAddress: emailConfig.from,
      content: {
        subject,
        html,
      },
      recipients: {
        to: [{ address: to }],
      },
    };

    // Add attachments if any
    if (attachments.length > 0) {
      message.attachments = attachments.map(file => ({
        name: file.originalname,
        contentType: file.mimetype,
        contentInBase64: file.buffer.toString('base64')
      }));
    }

    console.log('Sending email with message:', {
      to: message.recipients.to,
      subject: message.content.subject,
      attachmentsCount: message.attachments?.length || 0
    });

    // Send email
    const poller = await emailClient.beginSend(message);
    await poller.pollUntilDone();

    console.log('Email sent successfully');
    res.json({ success: true });
  } catch (err) {
    console.error('Error sending email:', err);
    res.status(500).json({
      error: err.message,
      success: false,
      details: err.toString()
    });
  }
});

// Test email configuration
router.get('/test-email-config', (req, res) => {
  try {
    const config = {
      endpoint: process.env.EMAIL_SERVICE_ENDPOINT,
      key: process.env.EMAIL_SERVICE_KEY,
      from: process.env.EMAIL_FROM_ADDRESS
    };

    // Check if all required configurations are present
    if (!config.endpoint || !config.key || !config.from) {
      return res.status(400).json({
        success: false,
        message: 'Email configuration is incomplete',
        missingFields: Object.entries(config)
          .filter(([_, value]) => !value)
          .map(([key]) => key)
      });
    }

    res.json({
      success: true,
      message: 'Email configuration is complete',
      config: {
        endpoint: config.endpoint.substring(0, 10) + '...',  // Show only first 10 chars for security
        key: '***********',
        from: config.from
      }
    });
  } catch (err) {
    console.error('Error checking email config:', err);
    res.status(500).json({ error: err.message });
  }
});

// Test email sending
router.post('/test-email', async (req, res) => {
  try {
    // Configure email service
    const emailConfig = {
      endpoint: process.env.EMAIL_SERVICE_ENDPOINT,
      key: process.env.EMAIL_SERVICE_KEY,
      from: process.env.EMAIL_FROM_ADDRESS
    };

    // Create email client
    const emailClient = new EmailClient(emailConfig.endpoint, new AzureKeyCredential(emailConfig.key));

    // Prepare test email message
    const message = {
      senderAddress: emailConfig.from,
      content: {
        subject: 'Proptii Email Service Test',
        html: `
          <h1>Email Service Test</h1>
          <p>This is a test email from Proptii Referencing System.</p>
          <p>If you're receiving this, the email service is working correctly!</p>
          <br>
          <p>Time sent: ${new Date().toLocaleString()}</p>
        `,
      },
      recipients: {
        to: [{ address: req.body.email || 'aishadaodu@mail.com' }],
      },
    };

    // Send email
    const poller = await emailClient.beginSend(message);
    await poller.pollUntilDone();

    res.json({
      success: true,
      message: 'Test email sent successfully',
      sentTo: req.body.email || 'aishadaodu@mail.com'
    });
  } catch (err) {
    console.error('Error sending test email:', err);
    res.status(500).json({
      error: err.message,
      success: false,
      details: err.toString()
    });
  }
});

// Add logging middleware
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Request Body:', JSON.stringify(req.body, null, 2));
  next();
});

export default router;