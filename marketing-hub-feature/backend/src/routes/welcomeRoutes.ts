import express from 'express';
import { ApiResponse } from '../models/types';

const router = express.Router();

// Welcome page content data
const welcomeContent = {
  hero: {
    title: "Welcome to Proptii Marketing Hub",
    subtitle: "Generate compelling content, launch targeted campaigns, and attract quality tenants faster than ever with our AI-powered marketing platform",
    primaryCta: "Get Started",
    secondaryCta: "View Dashboard"
  },
  features: [
    {
      id: "social",
      title: "Create Social Media Assets",
      description: "Design eye-catching posts, stories, and ads for Facebook, Instagram, and TikTok",
      icon: "Share2",
      color: "lux-orange"
    },
    {
      id: "content",
      title: "Write Up Content",
      description: "Generate compelling property descriptions, blog posts, and marketing copy with AI assistance",
      icon: "PenTool",
      color: "lux-orange"
    },
    {
      id: "dashboard",
      title: "View Dashboard",
      description: "Monitor campaign performance, track leads, and analyze ROI across all your properties",
      icon: "BarChart3",
      color: "lux-blue"
    },
    {
      id: "campaign",
      title: "Create New Campaign",
      description: "Launch targeted marketing campaigns across multiple channels with AI optimization",
      icon: "Rocket",
      color: "lux-blue"
    }
  ],
  quickStats: [
    { label: "Active Campaigns", value: "24", trend: "+12%" },
    { label: "Leads Generated", value: "387", trend: "+28%" },
    { label: "Avg CPL", value: "£9.80", trend: "-15%" }
  ],
  recentActivity: [
    { action: "Campaign launched", detail: "Shoreditch property", time: "2 hours ago", type: "success" },
    { action: "Content generated", detail: "3 new social posts", time: "4 hours ago", type: "info" },
    { action: "Lead received", detail: "Hackney apartment", time: "6 hours ago", type: "success" }
  ]
};

// GET /api/v1/welcome/content
router.get('/content', (req, res) => {
  try {
    const response: ApiResponse<typeof welcomeContent> = {
      success: true,
      data: welcomeContent,
      message: 'Welcome page content retrieved successfully',
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: `Failed to retrieve welcome page content: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    };
    
    res.status(500).json(response);
  }
});

// GET /api/v1/welcome/stats
router.get('/stats', (req, res) => {
  try {
    const response: ApiResponse<typeof welcomeContent.quickStats> = {
      success: true,
      data: welcomeContent.quickStats,
      message: 'Welcome page stats retrieved successfully',
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: `Failed to retrieve welcome page stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    };
    
    res.status(500).json(response);
  }
});

// GET /api/v1/welcome/activity
router.get('/activity', (req, res) => {
  try {
    const response: ApiResponse<typeof welcomeContent.recentActivity> = {
      success: true,
      data: welcomeContent.recentActivity,
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

export default router;
