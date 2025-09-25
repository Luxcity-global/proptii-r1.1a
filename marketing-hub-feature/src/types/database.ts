// Database Schema Types for Version 2 Social Media Assets Module

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  canvas_settings: CanvasSettings;
  default_export_settings: ExportSettings;
  theme: 'light' | 'dark' | 'system';
  created_at: string;
  updated_at: string;
}

export interface CanvasSettings {
  default_width: number;
  default_height: number;
  default_zoom: number;
  show_grid: boolean;
  snap_to_grid: boolean;
  grid_size: number;
  auto_save_interval: number; // seconds
  max_undo_history: number;
}

export interface ExportSettings {
  default_format: 'png' | 'jpg' | 'pdf' | 'svg';
  default_quality: number; // 1-100
  default_dpi: number;
  include_metadata: boolean;
  watermark_settings?: WatermarkSettings;
}

export interface WatermarkSettings {
  enabled: boolean;
  text?: string;
  opacity: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

// Asset Management Tables
export interface Asset {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  width: number;
  height: number;
  thumbnail_url?: string;
  tags: string[];
  category: AssetCategory;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  metadata: AssetMetadata;
}

export interface AssetMetadata {
  original_filename: string;
  upload_source: 'user' | 'template' | 'ai_generated';
  color_profile?: string;
  exif_data?: Record<string, any>;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_error?: string;
}

export enum AssetCategory {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  TEMPLATE = 'template',
  ICON = 'icon',
  FONT = 'font',
  OTHER = 'other'
}

// Template Management Tables
export interface Template {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  subcategory?: string;
  tags: string[];
  thumbnail_url: string;
  preview_url?: string;
  canvas_data: CanvasData;
  metadata: TemplateMetadata;
  is_public: boolean;
  is_featured: boolean;
  usage_count: number;
  rating: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateMetadata {
  dimensions: {
    width: number;
    height: number;
  };
  platform_targets: PlatformTarget[];
  content_type: ContentType;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_completion_time: number; // minutes
  required_assets: string[]; // asset IDs
  color_scheme?: ColorScheme;
  font_requirements?: FontRequirement[];
}

export enum TemplateCategory {
  SOCIAL_MEDIA = 'social_media',
  MARKETING = 'marketing',
  REAL_ESTATE = 'real_estate',
  LIFESTYLE = 'lifestyle',
  BUSINESS = 'business',
  EDUCATION = 'education',
  ENTERTAINMENT = 'entertainment',
  OTHER = 'other'
}

export enum PlatformTarget {
  INSTAGRAM = 'instagram',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',
  YOUTUBE = 'youtube',
  TIKTOK = 'tiktok',
  PINTEREST = 'pinterest',
  WEB = 'web',
  PRINT = 'print'
}

export enum ContentType {
  POST = 'post',
  STORY = 'story',
  AD = 'ad',
  BANNER = 'banner',
  FLYER = 'flyer',
  BROCHURE = 'brochure',
  PRESENTATION = 'presentation',
  VIDEO_THUMBNAIL = 'video_thumbnail'
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface FontRequirement {
  font_family: string;
  font_weight: string;
  font_style: string;
  required: boolean;
}

// Canvas Data Structure
export interface CanvasData {
  version: string;
  objects: CanvasObject[];
  background: CanvasBackground;
  dimensions: {
    width: number;
    height: number;
  };
  metadata: CanvasMetadata;
}

export interface CanvasObject {
  id: string;
  type: string;
  data: Record<string, any>;
  layer_index: number;
  visible: boolean;
  locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface CanvasBackground {
  type: 'color' | 'image' | 'gradient';
  value: string;
  opacity: number;
}

export interface CanvasMetadata {
  created_by: string;
  canvas_name: string;
  description?: string;
  tags: string[];
  platform_target?: PlatformTarget;
  content_type?: ContentType;
  created_at: string;
  updated_at: string;
}

// Canvas Projects and Versions
export interface CanvasProject {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
  current_version_id: string;
  template_id?: string;
  tags: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CanvasVersion {
  id: string;
  project_id: string;
  version_number: number;
  canvas_data: CanvasData;
  change_description?: string;
  created_by: string;
  created_at: string;
  is_current: boolean;
}

// Collaboration and Sharing
export interface CanvasShare {
  id: string;
  project_id: string;
  shared_by: string;
  shared_with: string;
  permission: 'view' | 'edit' | 'admin';
  expires_at?: string;
  created_at: string;
}

export interface CanvasComment {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  position?: {
    x: number;
    y: number;
  };
  resolved: boolean;
  created_at: string;
  updated_at: string;
}

// Export and Analytics
export interface CanvasExport {
  id: string;
  project_id: string;
  user_id: string;
  export_format: 'png' | 'jpg' | 'pdf' | 'svg';
  export_settings: ExportSettings;
  file_path: string;
  file_size: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface CanvasAnalytics {
  id: string;
  project_id: string;
  user_id: string;
  action: 'create' | 'edit' | 'export' | 'share' | 'comment' | 'view';
  metadata?: Record<string, any>;
  created_at: string;
}

// AI and Automation
export interface AIGeneration {
  id: string;
  user_id: string;
  project_id?: string;
  prompt: string;
  generation_type: 'text' | 'image' | 'layout' | 'color_scheme';
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

// User Sessions and Preferences
export interface UserSession {
  id: string;
  user_id: string;
  session_data: {
    current_project_id?: string;
    active_tool?: string;
    canvas_settings: CanvasSettings;
    recent_templates: string[];
    recent_assets: string[];
  };
  expires_at: string;
  created_at: string;
  updated_at: string;
}

// Database Indexes and Constraints
export interface DatabaseIndex {
  table: string;
  columns: string[];
  type: 'primary' | 'unique' | 'index' | 'foreign_key';
  name: string;
}

// Migration and Version Control
export interface DatabaseMigration {
  id: string;
  version: string;
  description: string;
  up_sql: string;
  down_sql: string;
  executed_at?: string;
  created_at: string;
}

// API Response Types moved to ../api.ts to avoid duplication

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  filter?: Record<string, any>;
}

// Search and Filter Types
export interface SearchParams {
  query?: string;
  category?: string;
  tags?: string[];
  user_id?: string;
  is_public?: boolean;
  created_after?: string;
  created_before?: string;
  pagination: PaginationParams;
}

export interface AssetSearchParams extends SearchParams {
  asset_category?: AssetCategory;
  mime_type?: string;
  min_size?: number;
  max_size?: number;
}

export interface TemplateSearchParams extends SearchParams {
  template_category?: TemplateCategory;
  platform_target?: PlatformTarget;
  content_type?: ContentType;
  difficulty_level?: string;
  min_rating?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  canvas_settings: CanvasSettings;
  default_export_settings: ExportSettings;
  theme: 'light' | 'dark' | 'system';
  created_at: string;
  updated_at: string;
}

export interface CanvasSettings {
  default_width: number;
  default_height: number;
  default_zoom: number;
  show_grid: boolean;
  snap_to_grid: boolean;
  grid_size: number;
  auto_save_interval: number; // seconds
  max_undo_history: number;
}

export interface ExportSettings {
  default_format: 'png' | 'jpg' | 'pdf' | 'svg';
  default_quality: number; // 1-100
  default_dpi: number;
  include_metadata: boolean;
  watermark_settings?: WatermarkSettings;
}

export interface WatermarkSettings {
  enabled: boolean;
  text?: string;
  opacity: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

// Asset Management Tables
export interface Asset {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  width: number;
  height: number;
  thumbnail_url?: string;
  tags: string[];
  category: AssetCategory;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  metadata: AssetMetadata;
}

export interface AssetMetadata {
  original_filename: string;
  upload_source: 'user' | 'template' | 'ai_generated';
  color_profile?: string;
  exif_data?: Record<string, any>;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_error?: string;
}

export enum AssetCategory {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  TEMPLATE = 'template',
  ICON = 'icon',
  FONT = 'font',
  OTHER = 'other'
}

// Template Management Tables
export interface Template {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  subcategory?: string;
  tags: string[];
  thumbnail_url: string;
  preview_url?: string;
  canvas_data: CanvasData;
  metadata: TemplateMetadata;
  is_public: boolean;
  is_featured: boolean;
  usage_count: number;
  rating: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateMetadata {
  dimensions: {
    width: number;
    height: number;
  };
  platform_targets: PlatformTarget[];
  content_type: ContentType;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_completion_time: number; // minutes
  required_assets: string[]; // asset IDs
  color_scheme?: ColorScheme;
  font_requirements?: FontRequirement[];
}

export enum TemplateCategory {
  SOCIAL_MEDIA = 'social_media',
  MARKETING = 'marketing',
  REAL_ESTATE = 'real_estate',
  LIFESTYLE = 'lifestyle',
  BUSINESS = 'business',
  EDUCATION = 'education',
  ENTERTAINMENT = 'entertainment',
  OTHER = 'other'
}

export enum PlatformTarget {
  INSTAGRAM = 'instagram',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',
  YOUTUBE = 'youtube',
  TIKTOK = 'tiktok',
  PINTEREST = 'pinterest',
  WEB = 'web',
  PRINT = 'print'
}

export enum ContentType {
  POST = 'post',
  STORY = 'story',
  AD = 'ad',
  BANNER = 'banner',
  FLYER = 'flyer',
  BROCHURE = 'brochure',
  PRESENTATION = 'presentation',
  VIDEO_THUMBNAIL = 'video_thumbnail'
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface FontRequirement {
  font_family: string;
  font_weight: string;
  font_style: string;
  required: boolean;
}

// Canvas Data Structure
export interface CanvasData {
  version: string;
  objects: CanvasObject[];
  background: CanvasBackground;
  dimensions: {
    width: number;
    height: number;
  };
  metadata: CanvasMetadata;
}

export interface CanvasObject {
  id: string;
  type: string;
  data: Record<string, any>;
  layer_index: number;
  visible: boolean;
  locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface CanvasBackground {
  type: 'color' | 'image' | 'gradient';
  value: string;
  opacity: number;
}

export interface CanvasMetadata {
  created_by: string;
  canvas_name: string;
  description?: string;
  tags: string[];
  platform_target?: PlatformTarget;
  content_type?: ContentType;
  created_at: string;
  updated_at: string;
}

// Canvas Projects and Versions
export interface CanvasProject {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
  current_version_id: string;
  template_id?: string;
  tags: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CanvasVersion {
  id: string;
  project_id: string;
  version_number: number;
  canvas_data: CanvasData;
  change_description?: string;
  created_by: string;
  created_at: string;
  is_current: boolean;
}

// Collaboration and Sharing
export interface CanvasShare {
  id: string;
  project_id: string;
  shared_by: string;
  shared_with: string;
  permission: 'view' | 'edit' | 'admin';
  expires_at?: string;
  created_at: string;
}

export interface CanvasComment {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  position?: {
    x: number;
    y: number;
  };
  resolved: boolean;
  created_at: string;
  updated_at: string;
}

// Export and Analytics
export interface CanvasExport {
  id: string;
  project_id: string;
  user_id: string;
  export_format: 'png' | 'jpg' | 'pdf' | 'svg';
  export_settings: ExportSettings;
  file_path: string;
  file_size: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface CanvasAnalytics {
  id: string;
  project_id: string;
  user_id: string;
  action: 'create' | 'edit' | 'export' | 'share' | 'comment' | 'view';
  metadata?: Record<string, any>;
  created_at: string;
}

// AI and Automation
export interface AIGeneration {
  id: string;
  user_id: string;
  project_id?: string;
  prompt: string;
  generation_type: 'text' | 'image' | 'layout' | 'color_scheme';
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

// User Sessions and Preferences
export interface UserSession {
  id: string;
  user_id: string;
  session_data: {
    current_project_id?: string;
    active_tool?: string;
    canvas_settings: CanvasSettings;
    recent_templates: string[];
    recent_assets: string[];
  };
  expires_at: string;
  created_at: string;
  updated_at: string;
}

// Database Indexes and Constraints
export interface DatabaseIndex {
  table: string;
  columns: string[];
  type: 'primary' | 'unique' | 'index' | 'foreign_key';
  name: string;
}

// Migration and Version Control
export interface DatabaseMigration {
  id: string;
  version: string;
  description: string;
  up_sql: string;
  down_sql: string;
  executed_at?: string;
  created_at: string;
}

// API Response Types moved to ../api.ts to avoid duplication

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  filter?: Record<string, any>;
}

// Search and Filter Types
export interface SearchParams {
  query?: string;
  category?: string;
  tags?: string[];
  user_id?: string;
  is_public?: boolean;
  created_after?: string;
  created_before?: string;
  pagination: PaginationParams;
}

export interface AssetSearchParams extends SearchParams {
  asset_category?: AssetCategory;
  mime_type?: string;
  min_size?: number;
  max_size?: number;
}

export interface TemplateSearchParams extends SearchParams {
  template_category?: TemplateCategory;
  platform_target?: PlatformTarget;
  content_type?: ContentType;
  difficulty_level?: string;
  min_rating?: number;
}
