import express from 'express';
import { mockKPIs } from '../models/mockData';
import { ApiResponse, KPI } from '../models/types';

const router = express.Router();

// GET /api/v1/kpis - Get all KPIs
router.get('/', (req, res) => {
  try {
    const { category } = req.query;
    
    let kpis = mockKPIs;
    
    // Filter by category if provided
    if (category && typeof category === 'string') {
      kpis = mockKPIs.filter(kpi => kpi.category === category);
    }
    
    const response: ApiResponse<KPI[]> = {
      data: kpis,
      message: 'KPIs retrieved successfully',
      success: true,
      timestamp: new Date().toISOString(),
    };
    
    return res.json(response);
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve KPIs',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/v1/kpis/:id - Get KPI by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const kpi = mockKPIs.find(k => k.id === id);
    
    if (!kpi) {
      return res.status(404).json({
        success: false,
        message: 'KPI not found',
        timestamp: new Date().toISOString(),
      });
    }
    
    const response: ApiResponse<KPI> = {
      data: kpi,
      message: 'KPI retrieved successfully',
      success: true,
      timestamp: new Date().toISOString(),
    };
    
    return res.json(response);
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve KPI',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
