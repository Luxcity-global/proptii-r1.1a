const express = require('express');
const router = express.Router();
const referencingService = require('../services/referencingService');

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
router.post('/identity', async (req, res) => {
  try {
    console.log('Saving identity data:', req.body);
    const result = await referencingService.saveIdentityData(req.body);
    res.json(result);
  } catch (err) {
    console.error('Error saving identity data:', err);
    res.status(500).json({ error: err.message });
  }
});

// Save employment data
router.post('/employment', async (req, res) => {
  try {
    console.log('Saving employment data:', req.body);
    const result = await referencingService.saveEmploymentData(req.body);
    res.json(result);
  } catch (err) {
    console.error('Error saving employment data:', err);
    res.status(500).json({ error: err.message });
  }
});

// Save residential data
router.post('/residential', async (req, res) => {
  try {
    console.log('Saving residential data:', req.body);
    const result = await referencingService.saveResidentialData(req.body);
    res.json(result);
  } catch (err) {
    console.error('Error saving residential data:', err);
    res.status(500).json({ error: err.message });
  }
});

// Save financial data
router.post('/financial', async (req, res) => {
  try {
    console.log('Saving financial data:', req.body);
    const result = await referencingService.saveFinancialData(req.body);
    res.json(result);
  } catch (err) {
    console.error('Error saving financial data:', err);
    res.status(500).json({ error: err.message });
  }
});

// Save guarantor data
router.post('/guarantor', async (req, res) => {
  try {
    console.log('Saving guarantor data:', req.body);
    const result = await referencingService.saveGuarantorData(req.body);
    res.json(result);
  } catch (err) {
    console.error('Error saving guarantor data:', err);
    res.status(500).json({ error: err.message });
  }
});

// Save agent details data
router.post('/agent-details', async (req, res) => {
  try {
    console.log('Saving agent details data:', req.body);
    const result = await referencingService.saveAgentDetailsData(req.body);
    res.json(result);
  } catch (err) {
    console.error('Error saving agent details data:', err);
    res.status(500).json({ error: err.message });
  }
});

// Submit application
router.post('/submit', async (req, res) => {
  try {
    console.log('Submitting application:', req.body.userId);
    const result = await referencingService.submitApplication(req.body.userId, req.body.formData);
    res.json(result);
  } catch (err) {
    console.error('Error submitting application:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add to referencingRoutes.js, before the existing routes
router.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    next();
});

module.exports = router;