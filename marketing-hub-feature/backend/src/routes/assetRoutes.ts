import express from 'express';
import { mockSocialMediaAssets } from '../models/mockData';
import { ApiResponse, SocialMediaAsset } from '../models/types';

const router = express.Router();

// GET /api/v1/assets - Get all social media assets
router.get('/', (req, res) => {
  try {
    const response: ApiResponse<SocialMediaAsset[]> = {
      data: mockSocialMediaAssets,
      message: 'Social media assets retrieved successfully',
      success: true,
      timestamp: new Date().toISOString(),
    };
    
    return res.json(response);
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve social media assets',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/v1/assets/:id - Get social media asset by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const asset = mockSocialMediaAssets.find(a => a.id === id);
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Social media asset not found',
        timestamp: new Date().toISOString(),
      });
    }
    
    const response: ApiResponse<SocialMediaAsset> = {
      data: asset,
      message: 'Social media asset retrieved successfully',
      success: true,
      timestamp: new Date().toISOString(),
    };
    
    return res.json(response);
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve social media asset',
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/v1/assets - Create new social media asset
router.post('/', (req, res) => {
  try {
    const newAsset: SocialMediaAsset = {
      id: (mockSocialMediaAssets.length + 1).toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockSocialMediaAssets.push(newAsset);
    
    const response: ApiResponse<SocialMediaAsset> = {
      data: newAsset,
      message: 'Social media asset created successfully',
      success: true,
      timestamp: new Date().toISOString(),
    };
    
    return res.status(201).json(response);
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Failed to create social media asset',
      timestamp: new Date().toISOString(),
    });
  }
});

// PUT /api/v1/assets/:id - Update social media asset
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const assetIndex = mockSocialMediaAssets.findIndex(a => a.id === id);
    
    if (assetIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Social media asset not found',
        timestamp: new Date().toISOString(),
      });
    }
    
    const updatedAsset = {
      ...mockSocialMediaAssets[assetIndex],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    
    mockSocialMediaAssets[assetIndex] = updatedAsset;
    
    const response: ApiResponse<SocialMediaAsset> = {
      data: updatedAsset,
      message: 'Social media asset updated successfully',
      success: true,
      timestamp: new Date().toISOString(),
    };
    
    return res.json(response);
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Failed to update social media asset',
      timestamp: new Date().toISOString(),
    });
  }
});

// DELETE /api/v1/assets/:id - Delete social media asset
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const assetIndex = mockSocialMediaAssets.findIndex(a => a.id === id);
    
    if (assetIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Social media asset not found',
        timestamp: new Date().toISOString(),
      });
    }
    
    mockSocialMediaAssets.splice(assetIndex, 1);
    
    const response: ApiResponse<void> = {
      data: undefined,
      message: 'Social media asset deleted successfully',
      success: true,
      timestamp: new Date().toISOString(),
    };
    
    return res.json(response);
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete social media asset',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
