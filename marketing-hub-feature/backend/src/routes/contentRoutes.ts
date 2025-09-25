import express from 'express';
import { mockContentItems } from '../models/mockData';
import { ApiResponse, ContentItem } from '../models/types';

const router = express.Router();

// GET /api/v1/content - Get all content items
router.get('/', (req, res) => {
  try {
    const response: ApiResponse<ContentItem[]> = {
      data: mockContentItems,
      message: 'Content items retrieved successfully',
      success: true,
      timestamp: new Date().toISOString(),
    };
    
    return res.json(response);
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve content items',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/v1/content/:id - Get content item by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const contentItem = mockContentItems.find(c => c.id === id);
    
    if (!contentItem) {
      return res.status(404).json({
        success: false,
        message: 'Content item not found',
        timestamp: new Date().toISOString(),
      });
    }
    
    const response: ApiResponse<ContentItem> = {
      data: contentItem,
      message: 'Content item retrieved successfully',
      success: true,
      timestamp: new Date().toISOString(),
    };
    
    return res.json(response);
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve content item',
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/v1/content - Create new content item
router.post('/', (req, res) => {
  try {
    const newContentItem: ContentItem = {
      id: (mockContentItems.length + 1).toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockContentItems.push(newContentItem);
    
    const response: ApiResponse<ContentItem> = {
      data: newContentItem,
      message: 'Content item created successfully',
      success: true,
      timestamp: new Date().toISOString(),
    };
    
    return res.status(201).json(response);
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Failed to create content item',
      timestamp: new Date().toISOString(),
    });
  }
});

// PUT /api/v1/content/:id - Update content item
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const contentIndex = mockContentItems.findIndex(c => c.id === id);
    
    if (contentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Content item not found',
        timestamp: new Date().toISOString(),
      });
    }
    
    const updatedContentItem = {
      ...mockContentItems[contentIndex],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    
    mockContentItems[contentIndex] = updatedContentItem;
    
    const response: ApiResponse<ContentItem> = {
      data: updatedContentItem,
      message: 'Content item updated successfully',
      success: true,
      timestamp: new Date().toISOString(),
    };
    
    return res.json(response);
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Failed to update content item',
      timestamp: new Date().toISOString(),
    });
  }
});

// DELETE /api/v1/content/:id - Delete content item
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const contentIndex = mockContentItems.findIndex(c => c.id === id);
    
    if (contentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Content item not found',
        timestamp: new Date().toISOString(),
      });
    }
    
    mockContentItems.splice(contentIndex, 1);
    
    const response: ApiResponse<void> = {
      data: undefined,
      message: 'Content item deleted successfully',
      success: true,
      timestamp: new Date().toISOString(),
    };
    
    return res.json(response);
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete content item',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
