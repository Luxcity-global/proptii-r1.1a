/**
 * CrewAI Routes
 * API endpoints for CrewAI integration
 */

const express = require('express');
const router = express.Router();
const crewaiService = require('../services/crewaiService');
const { body, validationResult } = require('express-validator');

/**
 * Generate property marketing content using CrewAI
 * POST /api/v1/crewai/generate
 */
router.post('/generate', [
  body('propertyData').isObject().withMessage('Property data is required'),
  body('platforms').optional().isArray().withMessage('Platforms must be an array'),
  body('sessionId').optional().isString().withMessage('Session ID must be a string')
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { propertyData, platforms = ['facebook', 'instagram'], sessionId } = req.body;

    console.log('🎯 CrewAI generate request:', {
      propertyId: propertyData.propertyId || propertyData.id,
      platforms: platforms,
      sessionId: sessionId
    });

    // Generate content using CrewAI
    const result = await crewaiService.generatePropertyContent(
      propertyData,
      platforms,
      sessionId
    );

    res.json(result);

  } catch (error) {
    console.error('❌ CrewAI generate error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to generate property marketing content'
    });
  }
});

/**
 * Get job status
 * GET /api/v1/crewai/jobs/:jobId
 */
router.get('/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }

    const result = await crewaiService.getJobStatus(jobId);

    res.json(result);

  } catch (error) {
    console.error('❌ CrewAI job status error:', error.message);
    
    if (error.message === 'Job not found') {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to get job status'
    });
  }
});

/**
 * Health check for CrewAI service
 * GET /api/v1/crewai/health
 */
router.get('/health', async (req, res) => {
  try {
    const health = await crewaiService.healthCheck();
    
    if (health.healthy) {
      res.json({
        success: true,
        ...health
      });
    } else {
      res.status(503).json({
        success: false,
        ...health
      });
    }

  } catch (error) {
    console.error('❌ CrewAI health check error:', error.message);
    
    res.status(503).json({
      success: false,
      error: error.message,
      healthy: false
    });
  }
});

/**
 * Get CrewAI service capabilities
 * GET /api/v1/crewai/capabilities
 */
router.get('/capabilities', async (req, res) => {
  try {
    const capabilities = await crewaiService.getCapabilities();
    
    if (capabilities) {
      res.json({
        success: true,
        capabilities: capabilities
      });
    } else {
      res.status(503).json({
        success: false,
        error: 'Unable to retrieve CrewAI capabilities'
      });
    }

  } catch (error) {
    console.error('❌ CrewAI capabilities error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to get CrewAI capabilities'
    });
  }
});

/**
 * WebSocket connection endpoint (for reference)
 * This would typically be handled by the main server setup
 */
router.get('/ws/:sessionId', (req, res) => {
  res.json({
    message: 'WebSocket endpoint',
    sessionId: req.params.sessionId,
    note: 'Use WebSocket connection to ws://localhost:8002/ws/{sessionId}'
  });
});

/**
 * Cancel a job
 * DELETE /api/v1/crewai/jobs/:jobId
 */
router.delete('/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }

    // Note: This would require implementing cancel functionality in CrewAI service
    // For now, we'll return a not implemented response
    res.status(501).json({
      success: false,
      error: 'Job cancellation not yet implemented',
      details: 'This feature will be added in a future update'
    });

  } catch (error) {
    console.error('❌ CrewAI cancel job error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to cancel job'
    });
  }
});

module.exports = router;
 * CrewAI Routes
 * API endpoints for CrewAI integration
 */

const express = require('express');
const router = express.Router();
const crewaiService = require('../services/crewaiService');
const { body, validationResult } = require('express-validator');

/**
 * Generate property marketing content using CrewAI
 * POST /api/v1/crewai/generate
 */
router.post('/generate', [
  body('propertyData').isObject().withMessage('Property data is required'),
  body('platforms').optional().isArray().withMessage('Platforms must be an array'),
  body('sessionId').optional().isString().withMessage('Session ID must be a string')
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { propertyData, platforms = ['facebook', 'instagram'], sessionId } = req.body;

    console.log('🎯 CrewAI generate request:', {
      propertyId: propertyData.propertyId || propertyData.id,
      platforms: platforms,
      sessionId: sessionId
    });

    // Generate content using CrewAI
    const result = await crewaiService.generatePropertyContent(
      propertyData,
      platforms,
      sessionId
    );

    res.json(result);

  } catch (error) {
    console.error('❌ CrewAI generate error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to generate property marketing content'
    });
  }
});

/**
 * Get job status
 * GET /api/v1/crewai/jobs/:jobId
 */
router.get('/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }

    const result = await crewaiService.getJobStatus(jobId);

    res.json(result);

  } catch (error) {
    console.error('❌ CrewAI job status error:', error.message);
    
    if (error.message === 'Job not found') {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to get job status'
    });
  }
});

/**
 * Health check for CrewAI service
 * GET /api/v1/crewai/health
 */
router.get('/health', async (req, res) => {
  try {
    const health = await crewaiService.healthCheck();
    
    if (health.healthy) {
      res.json({
        success: true,
        ...health
      });
    } else {
      res.status(503).json({
        success: false,
        ...health
      });
    }

  } catch (error) {
    console.error('❌ CrewAI health check error:', error.message);
    
    res.status(503).json({
      success: false,
      error: error.message,
      healthy: false
    });
  }
});

/**
 * Get CrewAI service capabilities
 * GET /api/v1/crewai/capabilities
 */
router.get('/capabilities', async (req, res) => {
  try {
    const capabilities = await crewaiService.getCapabilities();
    
    if (capabilities) {
      res.json({
        success: true,
        capabilities: capabilities
      });
    } else {
      res.status(503).json({
        success: false,
        error: 'Unable to retrieve CrewAI capabilities'
      });
    }

  } catch (error) {
    console.error('❌ CrewAI capabilities error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to get CrewAI capabilities'
    });
  }
});

/**
 * WebSocket connection endpoint (for reference)
 * This would typically be handled by the main server setup
 */
router.get('/ws/:sessionId', (req, res) => {
  res.json({
    message: 'WebSocket endpoint',
    sessionId: req.params.sessionId,
    note: 'Use WebSocket connection to ws://localhost:8002/ws/{sessionId}'
  });
});

/**
 * Cancel a job
 * DELETE /api/v1/crewai/jobs/:jobId
 */
router.delete('/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }

    // Note: This would require implementing cancel functionality in CrewAI service
    // For now, we'll return a not implemented response
    res.status(501).json({
      success: false,
      error: 'Job cancellation not yet implemented',
      details: 'This feature will be added in a future update'
    });

  } catch (error) {
    console.error('❌ CrewAI cancel job error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to cancel job'
    });
  }
});

module.exports = router;


