// Backend TypeScript Interfaces for V2 Social Media Module

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  category: AssetCategory;
  tags: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  subcategory?: string;
  tags: string[];
  canvas_data: any;
  thumbnail_url?: string;
  metadata: TemplateMetadata;
  usage_count: number;
  rating: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CanvasProject {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  template_id?: string;
  tags: string[];
  canvas_data: any;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CanvasVersion {
  id: string;
  project_id: string;
  version_number: number;
  canvas_data: any;
  change_description?: string;
  created_at: string;
}

// Enums
export enum AssetCategory {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  OTHER = 'other'
}

export enum TemplateCategory {
  SOCIAL_MEDIA = 'social_media',
  MARKETING = 'marketing',
  PRESENTATION = 'presentation',
  WEB = 'web',
  PRINT = 'print'
}

export enum PlatformTarget {
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',
  TIKTOK = 'tiktok',
  YOUTUBE = 'youtube'
}

export enum ContentType {
  POST = 'post',
  STORY = 'story',
  AD = 'ad',
  BANNER = 'banner',
  CAROUSEL = 'carousel'
}

// Metadata interfaces
export interface TemplateMetadata {
  platform_target?: PlatformTarget;
  content_type?: ContentType;
  dimensions: {
    width: number;
    height: number;
  };
  color_scheme?: string[];
  font_requirements?: string[];
  estimated_time?: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  filter?: Record<string, any>;
}

// Request interfaces
export interface CreateAssetRequest {
  name: string;
  description?: string;
  category: AssetCategory;
  tags?: string[];
  is_public?: boolean;
}

export interface UpdateAssetRequest {
  name?: string;
  description?: string;
  category?: AssetCategory;
  tags?: string[];
  is_public?: boolean;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  category: TemplateCategory;
  subcategory?: string;
  tags?: string[];
  canvas_data: any;
  metadata?: TemplateMetadata;
  is_public?: boolean;
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  category?: TemplateCategory;
  subcategory?: string;
  tags?: string[];
  canvas_data?: any;
  metadata?: TemplateMetadata;
  is_public?: boolean;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  template_id?: string;
  tags?: string[];
  canvas_data?: any;
  is_public?: boolean;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  tags?: string[];
  canvas_data?: any;
  is_public?: boolean;
}

export interface SaveCanvasRequest {
  canvas_data: any;
  change_description?: string;
}

// Search interfaces
export interface AssetSearchParams extends PaginationParams {
  query?: string;
  category?: AssetCategory;
  tags?: string[];
  min_size?: number;
  max_size?: number;
  is_public?: boolean;
}

export interface TemplateSearchParams extends PaginationParams {
  query?: string;
  category?: TemplateCategory;
  platform_target?: PlatformTarget;
  content_type?: ContentType;
  difficulty_level?: string;
  min_rating?: number;
  is_public?: boolean;
}

// Express Request extensions
export interface AuthenticatedRequest extends Express.Request {
  user?: User;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

