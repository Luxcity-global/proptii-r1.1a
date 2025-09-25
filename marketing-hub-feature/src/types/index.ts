// Core Marketing Hub Types

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  type: 'social_media' | 'content' | 'property_marketing';
  targetAudience: string;
  budget?: number;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ContentItem {
  id: string;
  title: string;
  content: string;
  type: 'blog_post' | 'social_post' | 'email' | 'ad_copy';
  status: 'draft' | 'review' | 'approved' | 'published';
  campaignId?: string;
  tags: string[];
  wordCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface SocialMediaAsset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'carousel';
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok';
  dimensions: {
    width: number;
    height: number;
  };
  url: string;
  thumbnailUrl?: string;
  campaignId?: string;
  status: 'draft' | 'ready' | 'published';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  price: number;
  currency: string;
  propertyType: 'apartment' | 'house' | 'commercial' | 'land';
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  areaUnit: 'sqft' | 'sqm';
  images: string[];
  features: string[];
  status: 'available' | 'sold' | 'rented' | 'off_market';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface KPI {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category: 'campaigns' | 'content' | 'assets' | 'properties';
  createdAt: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  children?: NavigationItem[];
}

// ApiResponse moved to database.ts to avoid conflicts

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// Component Props Types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export interface CardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined';
}

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  type?: 'text' | 'email' | 'password' | 'number';
  className?: string;
}

// State Management Types
export interface AppState {
  user: User | null;
  currentView: 'welcome' | 'dashboard' | 'property' | 'write-content' | 'social-assets';
  isCopilotOpen: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface NavigationState {
  currentPath: string;
  history: string[];
  breadcrumbs: NavigationItem[];
}
