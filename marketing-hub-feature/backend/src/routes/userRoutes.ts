import express from 'express';
import { mockUsers } from '../models/mockData';
import { ApiResponse, User } from '../models/types';

const router = express.Router();

// GET /api/v1/user/me - Get current user
router.get('/me', (req, res) => {
  try {
    // For now, return the first user as the current user
    const currentUser = mockUsers[0];
    
    const response: ApiResponse<User> = {
      data: currentUser,
      message: 'Current user retrieved successfully',
      success: true,
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  } catch {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve current user',
      timestamp: new Date().toISOString(),
    });
  }
});

// PUT /api/v1/user/:id - Update user
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const userIndex = mockUsers.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString(),
      });
    }
    
    // Update user data
    const updatedUser = {
      ...mockUsers[userIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    
    mockUsers[userIndex] = updatedUser;
    
    const response: ApiResponse<User> = {
      data: updatedUser,
      message: 'User updated successfully',
      success: true,
      timestamp: new Date().toISOString(),
    };
    
    return res.json(response);
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Failed to update user',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/v1/user - Get all users (admin only)
router.get('/', (req, res) => {
  try {
    const response: ApiResponse<User[]> = {
      data: mockUsers,
      message: 'Users retrieved successfully',
      success: true,
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  } catch {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
