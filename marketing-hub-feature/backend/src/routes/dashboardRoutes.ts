import express from 'express';
import { ApiResponse } from '../models/types';

const router = express.Router();

// Dashboard KPI data
const dashboardKPIs = [
  {
    id: "campaigns",
    label: "Total Campaigns",
    value: "24",
    trend: "+12%",
    trendDirection: "up",
    icon: "BarChart3",
    color: "lux-blue"
  },
  {
    id: "leads",
    label: "Leads Generated",
    value: "387",
    trend: "+28%",
    trendDirection: "up",
    icon: "Users",
    color: "lux-green"
  },
  {
    id: "cpl",
    label: "Avg CPL",
    value: "£9.80",
    trend: "-15%",
    trendDirection: "down",
    icon: "DollarSign",
    color: "lux-orange"
  },
  {
    id: "roi",
    label: "ROI",
    value: "4.2x",
    trend: "+0.8x",
    trendDirection: "up",
    icon: "Target",
    color: "lux-green"
  }
];

// Active campaigns data
const activeCampaigns = [
  {
    id: "1",
    name: "Shoreditch Premium Campaign",
    description: "2-bed flat in Shoreditch",
    status: "active",
    budget: "£2,500",
    spent: "£47.20",
    leads: 8,
    startDate: "3 days ago",
    cpl: "£5.90"
  },
  {
    id: "2",
    name: "Canary Wharf Luxury Suite",
    description: "1-bed luxury suite, Canary Wharf",
    status: "paused",
    budget: "£1,800",
    spent: "£32.50",
    leads: 5,
    startDate: "1 week ago",
    cpl: "£6.50"
  },
  {
    id: "3",
    name: "Hackney Modern Apartment",
    description: "3-bed modern apartment, Hackney",
    status: "draft",
    budget: "£3,200",
    spent: "£0.00",
    leads: 0,
    startDate: "yesterday",
    cpl: "-"
  }
];

// Recent activity data
const recentActivity = [
  {
    id: "1",
    action: "Campaign launched",
    detail: "Shoreditch property",
    time: "2 hours ago",
    type: "success",
    icon: "Rocket"
  },
  {
    id: "2",
    action: "Content generated",
    detail: "3 new social posts",
    time: "4 hours ago",
    type: "info",
    icon: "PenTool"
  },
  {
    id: "3",
    action: "Lead received",
    detail: "Hackney apartment",
    time: "6 hours ago",
    type: "success",
    icon: "Users"
  },
  {
    id: "4",
    action: "Campaign paused",
    detail: "Canary Wharf suite",
    time: "1 day ago",
    type: "warning",
    icon: "Pause"
  }
];

// GET /api/v1/dashboard/kpis
router.get('/kpis', (req, res) => {
  try {
    const response: ApiResponse<typeof dashboardKPIs> = {
      success: true,
      data: dashboardKPIs,
      message: 'Dashboard KPIs retrieved successfully',
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: `Failed to retrieve dashboard KPIs: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    };
    
    res.status(500).json(response);
  }
});

// GET /api/v1/dashboard/campaigns
router.get('/campaigns', (req, res) => {
  try {
    const response: ApiResponse<typeof activeCampaigns> = {
      success: true,
      data: activeCampaigns,
      message: 'Active campaigns retrieved successfully',
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: `Failed to retrieve active campaigns: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    };
    
    res.status(500).json(response);
  }
});

// GET /api/v1/dashboard/activity
router.get('/activity', (req, res) => {
  try {
    const response: ApiResponse<typeof recentActivity> = {
      success: true,
      data: recentActivity,
      message: 'Recent activity retrieved successfully',
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: `Failed to retrieve recent activity: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    };
    
    res.status(500).json(response);
  }
});

// GET /api/v1/dashboard/summary
router.get('/summary', (req, res) => {
  try {
    const summary = {
      kpis: dashboardKPIs,
      campaigns: activeCampaigns,
      activity: recentActivity
    };
    
    const response: ApiResponse<typeof summary> = {
      success: true,
      data: summary,
      message: 'Dashboard summary retrieved successfully',
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: `Failed to retrieve dashboard summary: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    };
    
    res.status(500).json(response);
  }
});

export default router;

