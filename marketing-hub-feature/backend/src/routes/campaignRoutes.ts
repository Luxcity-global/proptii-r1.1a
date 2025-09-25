import express from 'express';
import { mockCampaigns } from '../models/mockData';
import { ApiResponse, Campaign } from '../models/types';

const router = express.Router();

// GET /api/v1/campaigns - Get all campaigns
router.get('/', (req, res) => {
  try {
    const response: ApiResponse<Campaign[]> = {
      data: mockCampaigns,
      message: 'Campaigns retrieved successfully',
      success: true,
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  } catch {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve campaigns',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/v1/campaigns/:id - Get campaign by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const campaign = mockCampaigns.find(c => c.id === id);
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
        timestamp: new Date().toISOString(),
      });
    }
    
    const response: ApiResponse<Campaign> = {
      data: campaign,
      message: 'Campaign retrieved successfully',
      success: true,
      timestamp: new Date().toISOString(),
    };
    
    return res.json(response);
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve campaign',
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/v1/campaigns - Create new campaign
router.post('/', (req, res) => {
  try {
    const newCampaign: Campaign = {
      id: (mockCampaigns.length + 1).toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockCampaigns.push(newCampaign);
    
    const response: ApiResponse<Campaign> = {
      data: newCampaign,
      message: 'Campaign created successfully',
      success: true,
      timestamp: new Date().toISOString(),
    };
    
    res.status(201).json(response);
  } catch {
    res.status(500).json({
      success: false,
      message: 'Failed to create campaign',
      timestamp: new Date().toISOString(),
    });
  }
});

// PUT /api/v1/campaigns/:id - Update campaign
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const campaignIndex = mockCampaigns.findIndex(c => c.id === id);
    
    if (campaignIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
        timestamp: new Date().toISOString(),
      });
    }
    
    const updatedCampaign = {
      ...mockCampaigns[campaignIndex],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    
    mockCampaigns[campaignIndex] = updatedCampaign;
    
    const response: ApiResponse<Campaign> = {
      data: updatedCampaign,
      message: 'Campaign updated successfully',
      success: true,
      timestamp: new Date().toISOString(),
    };
    
    return res.json(response);
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Failed to update campaign',
      timestamp: new Date().toISOString(),
    });
  }
});

// DELETE /api/v1/campaigns/:id - Delete campaign
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const campaignIndex = mockCampaigns.findIndex(c => c.id === id);
    
    if (campaignIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
        timestamp: new Date().toISOString(),
      });
    }
    
    mockCampaigns.splice(campaignIndex, 1);
    
    const response: ApiResponse<void> = {
      data: undefined,
      message: 'Campaign deleted successfully',
      success: true,
      timestamp: new Date().toISOString(),
    };
    
    return res.json(response);
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete campaign',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
