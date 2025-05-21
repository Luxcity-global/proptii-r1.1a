import * as dotenv from 'dotenv';
import express from 'express';
import { referencingService } from '../services/referencingService.js';
import { emailService } from '../services/emailService.js';
import { AzureKeyCredential } from '@azure/core-auth';
import multer from 'multer';

dotenv.config();
const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Maximum 10 files
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
router.post('/submissions', async (req, res) => {
  try {
    console.log('Received submission request:', {
      userId: req.body.userId,
      type: req.body.type
    });

    const result = await referencingService.submitApplication(req.body);
    res.json(result);
  } catch (err) {
    console.error('Error submitting application:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to submit application'
    });
  }
});

// Send email with attachments
router.post('/send-email', upload.array('attachments'), async (req, res) => {
  try {
    console.log('Received email request:', {
      to: req.body.to,
      subject: req.body.subject,
      attachmentsCount: req.files?.length || 0,
      emailType: req.body.emailType || 'agent'
    });

    const formData = JSON.parse(req.body.formData);
    const attachments = req.files?.map(file => ({
      filename: file.originalname,
      content: file.buffer
    })) || [];

    const emailResult = await emailService.sendEmail({
      to: req.body.to,
      subject: req.body.subject,
      formData,
      attachments,
      submissionId: req.body.submissionId,
      emailType: req.body.emailType || 'agent'
    });

    res.json({
      success: true,
      messageId: emailResult.messageId
    });
  } catch (err) {
    console.error('Error sending email:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to send email'
    });
  }
});

// Send multiple emails (agent, referee, guarantor)
router.post('/send-multiple-emails', upload.array('attachments'), async (req, res) => {
  try {
    console.log('Received multiple email request');

    const formData = JSON.parse(req.body.formData);
    const attachments = req.files?.map(file => ({
      filename: file.originalname,
      content: file.buffer
    })) || [];

    const results = {
      agent: false,
      referee: false,
      guarantor: false
    };

    // Send to agent
    if (formData.agentDetails?.email) {
      const agentResult = await emailService.sendEmail({
        to: formData.agentDetails.email,
        subject: `New Tenant Application${formData.residential?.propertyAddress ? ` - ${formData.residential.propertyAddress}` : ''}`,
        formData,
        attachments,
        submissionId: req.body.submissionId,
        emailType: 'agent'
      });
      results.agent = agentResult.success;
    }

    // Send to referee
    if (formData.employment?.referenceEmail) {
      const refereeResult = await emailService.sendEmail({
        to: formData.employment.referenceEmail,
        subject: `Reference Request for ${formData.identity?.firstName} ${formData.identity?.lastName}`,
        formData,
        attachments: [],
        submissionId: req.body.submissionId,
        emailType: 'referee'
      });
      results.referee = refereeResult.success;
    }

    // Send to guarantor
    if (formData.guarantor?.email) {
      const guarantorResult = await emailService.sendEmail({
        to: formData.guarantor.email,
        subject: `Guarantor Request for ${formData.identity?.firstName} ${formData.identity?.lastName}`,
        formData,
        attachments: [],
        submissionId: req.body.submissionId,
        emailType: 'guarantor'
      });
      results.guarantor = guarantorResult.success;
    }

    res.json({
      success: true,
      results
    });
  } catch (err) {
    console.error('Error sending multiple emails:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to send emails',
      results: err.results || {}
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
    const testHtml = `
      <h1>Email Service Test</h1>
      <p>This is a test email from Proptii Referencing System.</p>
      <p>If you're receiving this, the email service is working correctly!</p>
      <br>
      <p>Time sent: ${new Date().toLocaleString()}</p>
    `;

    const result = await emailService.sendEmail({
      to: req.body.email || 'aishadaodu@gmail.com',
      subject: 'Proptii Email Service Test',
      html: testHtml
    });

    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: result.messageId,
      sentTo: req.body.email || 'aishadaodu@gmail.com'
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