import express from 'express';
import { mockProperties } from '../models/mockData';
import { ApiResponse, Property } from '../models/types';

const router = express.Router();

// GET /api/v1/properties - Get all properties
router.get('/', (req, res) => {
  try {
    const response: ApiResponse<Property[]> = {
      data: mockProperties,
      message: 'Properties retrieved successfully',
      success: true,
      timestamp: new Date().toISOString(),
    };
    
    return res.json(response);
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve properties',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/v1/properties/:id - Get property by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const property = mockProperties.find(p => p.id === id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
        timestamp: new Date().toISOString(),
      });
    }
    
    const response: ApiResponse<Property> = {
      data: property,
      message: 'Property retrieved successfully',
      success: true,
      timestamp: new Date().toISOString(),
    };
    
    return res.json(response);
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve property',
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/v1/properties - Create new property
router.post('/', (req, res) => {
  try {
    const newProperty: Property = {
      id: (mockProperties.length + 1).toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockProperties.push(newProperty);
    
    const response: ApiResponse<Property> = {
      data: newProperty,
      message: 'Property created successfully',
      success: true,
      timestamp: new Date().toISOString(),
    };
    
    return res.status(201).json(response);
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Failed to create property',
      timestamp: new Date().toISOString(),
    });
  }
});

// PUT /api/v1/properties/:id - Update property
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const propertyIndex = mockProperties.findIndex(p => p.id === id);
    
    if (propertyIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
        timestamp: new Date().toISOString(),
      });
    }
    
    const updatedProperty = {
      ...mockProperties[propertyIndex],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    
    mockProperties[propertyIndex] = updatedProperty;
    
    const response: ApiResponse<Property> = {
      data: updatedProperty,
      message: 'Property updated successfully',
      success: true,
      timestamp: new Date().toISOString(),
    };
    
    return res.json(response);
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Failed to update property',
      timestamp: new Date().toISOString(),
    });
  }
});

// DELETE /api/v1/properties/:id - Delete property
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const propertyIndex = mockProperties.findIndex(p => p.id === id);
    
    if (propertyIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
        timestamp: new Date().toISOString(),
      });
    }
    
    mockProperties.splice(propertyIndex, 1);
    
    const response: ApiResponse<void> = {
      data: undefined,
      message: 'Property deleted successfully',
      success: true,
      timestamp: new Date().toISOString(),
    };
    
    return res.json(response);
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete property',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
