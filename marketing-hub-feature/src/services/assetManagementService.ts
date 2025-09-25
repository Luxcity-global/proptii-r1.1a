import apiService from './api';

export interface AssetVersion {
  id: string;
  version: number;
  file_path: string;
  file_size: number;
  created_at: string;
  created_by: string;
  change_description?: string;
  is_current: boolean;
}

export interface Asset {
  id: string;
  name: string;
  description?: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  duration?: number;
  thumbnail_url?: string;
  is_public: boolean;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  upload_date: string;
  last_accessed?: string;
  access_count: number;
  tags: string[];
  folder_id?: string;
  version: number;
  versions: AssetVersion[];
  is_favorite: boolean;
  usage_count: number;
  last_used?: string;
  permissions: {
    can_edit: boolean;
    can_delete: boolean;
    can_share: boolean;
    can_download: boolean;
  };
  metadata: {
    dimensions?: { width: number; height: number };
    duration?: number;
    color_palette?: string[];
    dominant_colors?: string[];
    ai_tags?: string[];
    file_format?: string;
    compression_ratio?: number;
    created_by?: string;
    modified_by?: string;
    camera_info?: any;
    exif_data?: any;
  };
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  asset_count: number;
  created_at: string;
  updated_at: string;
  is_default: boolean;
  color?: string;
  icon?: string;
  permissions: {
    can_edit: boolean;
    can_delete: boolean;
    can_add_assets: boolean;
  };
  metadata: {
    total_size: number;
    last_modified: string;
    created_by: string;
  };
}

export interface AssetCollection {
  id: string;
  name: string;
  description?: string;
  assets: string[];
  created_at: string;
  is_public: boolean;
  tags: string[];
  cover_image?: string;
}

export interface AssetFilter {
  type?: 'image' | 'video' | 'audio' | 'document' | 'all';
  size?: 'small' | 'medium' | 'large' | 'all';
  date_range?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  folder?: string;
  favorites?: boolean;
  recently_used?: boolean;
}

export interface AssetAnalytics {
  totalAssets: number;
  totalSize: number;
  assetsByType: Array<{
    type: string;
    count: number;
    size: number;
  }>;
  mostUsedAssets: Asset[];
  recentlyAdded: Asset[];
  storageUsage: {
    used: number;
    available: number;
    percentage: number;
  };
  usageStats: {
    totalDownloads: number;
    totalViews: number;
    averageFileSize: number;
  };
}

export interface AssetSearchResult {
  assets: Asset[];
  total: number;
  facets: {
    types: Array<{ type: string; count: number }>;
    folders: Array<{ folder: string; count: number }>;
    tags: Array<{ tag: string; count: number }>;
    sizes: Array<{ size: string; count: number }>;
  };
}

class AssetManagementService {
  private baseUrl = '/api/v1/assets';

  /**
   * Get assets with advanced filtering and pagination
   */
  async getAssets(params?: {
    page?: number;
    limit?: number;
    search?: string;
    filter?: AssetFilter;
    sort_by?: 'name' | 'size' | 'date' | 'usage';
    sort_order?: 'asc' | 'desc';
  }): Promise<{ assets: Asset[]; total: number }> {
    try {
      const response = await apiService.get(`${this.baseUrl}`, { params });
      return response.data;
    } catch (error) {
      console.error('Failed to get assets:', error);
      throw new Error('Failed to get assets');
    }
  }

  /**
   * Search assets with advanced search capabilities
   */
  async searchAssets(query: string, options?: {
    filter?: AssetFilter;
    limit?: number;
    include_facets?: boolean;
  }): Promise<AssetSearchResult> {
    try {
      const response = await apiService.post(`${this.baseUrl}/search`, {
        query,
        ...options
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search assets:', error);
      throw new Error('Failed to search assets');
    }
  }

  /**
   * Get asset by ID with full details
   */
  async getAssetById(assetId: string): Promise<Asset> {
    try {
      const response = await apiService.get(`${this.baseUrl}/${assetId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get asset:', error);
      throw new Error('Failed to get asset');
    }
  }

  /**
   * Upload new asset with metadata
   */
  async uploadAsset(file: File, metadata?: {
    name?: string;
    description?: string;
    tags?: string[];
    folder_id?: string;
    is_public?: boolean;
  }): Promise<Asset> {
    try {
      const formData = new FormData();
      formData.append('asset', file);
      
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
      }

      const response = await apiService.post(`${this.baseUrl}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to upload asset:', error);
      throw new Error('Failed to upload asset');
    }
  }

  /**
   * Update asset metadata
   */
  async updateAsset(assetId: string, updates: {
    name?: string;
    description?: string;
    tags?: string[];
    folder_id?: string;
    is_public?: boolean;
  }): Promise<Asset> {
    try {
      const response = await apiService.patch(`${this.baseUrl}/${assetId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Failed to update asset:', error);
      throw new Error('Failed to update asset');
    }
  }

  /**
   * Delete asset
   */
  async deleteAsset(assetId: string): Promise<void> {
    try {
      await apiService.delete(`${this.baseUrl}/${assetId}`);
    } catch (error) {
      console.error('Failed to delete asset:', error);
      throw new Error('Failed to delete asset');
    }
  }

  /**
   * Create new version of asset
   */
  async createAssetVersion(assetId: string, file: File, changeDescription?: string): Promise<AssetVersion> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (changeDescription) {
        formData.append('change_description', changeDescription);
      }

      const response = await apiService.post(`${this.baseUrl}/${assetId}/versions`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create asset version:', error);
      throw new Error('Failed to create asset version');
    }
  }

  /**
   * Get asset versions
   */
  async getAssetVersions(assetId: string): Promise<AssetVersion[]> {
    try {
      const response = await apiService.get(`${this.baseUrl}/${assetId}/versions`);
      return response.data;
    } catch (error) {
      console.error('Failed to get asset versions:', error);
      throw new Error('Failed to get asset versions');
    }
  }

  /**
   * Restore asset to specific version
   */
  async restoreAssetVersion(assetId: string, versionId: string): Promise<Asset> {
    try {
      const response = await apiService.post(`${this.baseUrl}/${assetId}/versions/${versionId}/restore`);
      return response.data;
    } catch (error) {
      console.error('Failed to restore asset version:', error);
      throw new Error('Failed to restore asset version');
    }
  }

  /**
   * Toggle asset favorite status
   */
  async toggleAssetFavorite(assetId: string): Promise<Asset> {
    try {
      const response = await apiService.post(`${this.baseUrl}/${assetId}/favorite`);
      return response.data;
    } catch (error) {
      console.error('Failed to toggle asset favorite:', error);
      throw new Error('Failed to toggle asset favorite');
    }
  }

  /**
   * Get folders
   */
  async getFolders(): Promise<Folder[]> {
    try {
      const response = await apiService.get(`${this.baseUrl}/folders`);
      return response.data;
    } catch (error) {
      console.error('Failed to get folders:', error);
      throw new Error('Failed to get folders');
    }
  }

  /**
   * Create folder
   */
  async createFolder(folder: {
    name: string;
    description?: string;
    parent_id?: string;
    color?: string;
    icon?: string;
  }): Promise<Folder> {
    try {
      const response = await apiService.post(`${this.baseUrl}/folders`, folder);
      return response.data;
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw new Error('Failed to create folder');
    }
  }

  /**
   * Update folder
   */
  async updateFolder(folderId: string, updates: {
    name?: string;
    description?: string;
    color?: string;
    icon?: string;
  }): Promise<Folder> {
    try {
      const response = await apiService.patch(`${this.baseUrl}/folders/${folderId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Failed to update folder:', error);
      throw new Error('Failed to update folder');
    }
  }

  /**
   * Delete folder
   */
  async deleteFolder(folderId: string): Promise<void> {
    try {
      await apiService.delete(`${this.baseUrl}/folders/${folderId}`);
    } catch (error) {
      console.error('Failed to delete folder:', error);
      throw new Error('Failed to delete folder');
    }
  }

  /**
   * Get asset collections
   */
  async getCollections(): Promise<AssetCollection[]> {
    try {
      const response = await apiService.get(`${this.baseUrl}/collections`);
      return response.data;
    } catch (error) {
      console.error('Failed to get collections:', error);
      throw new Error('Failed to get collections');
    }
  }

  /**
   * Create asset collection
   */
  async createCollection(collection: {
    name: string;
    description?: string;
    assets?: string[];
    is_public?: boolean;
    tags?: string[];
  }): Promise<AssetCollection> {
    try {
      const response = await apiService.post(`${this.baseUrl}/collections`, collection);
      return response.data;
    } catch (error) {
      console.error('Failed to create collection:', error);
      throw new Error('Failed to create collection');
    }
  }

  /**
   * Update asset collection
   */
  async updateCollection(collectionId: string, updates: {
    name?: string;
    description?: string;
    assets?: string[];
    is_public?: boolean;
    tags?: string[];
  }): Promise<AssetCollection> {
    try {
      const response = await apiService.patch(`${this.baseUrl}/collections/${collectionId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Failed to update collection:', error);
      throw new Error('Failed to update collection');
    }
  }

  /**
   * Delete asset collection
   */
  async deleteCollection(collectionId: string): Promise<void> {
    try {
      await apiService.delete(`${this.baseUrl}/collections/${collectionId}`);
    } catch (error) {
      console.error('Failed to delete collection:', error);
      throw new Error('Failed to delete collection');
    }
  }

  /**
   * Get asset analytics
   */
  async getAssetAnalytics(): Promise<AssetAnalytics> {
    try {
      const response = await apiService.get(`${this.baseUrl}/analytics`);
      return response.data;
    } catch (error) {
      console.error('Failed to get asset analytics:', error);
      throw new Error('Failed to get asset analytics');
    }
  }

  /**
   * Get popular tags
   */
  async getPopularTags(limit: number = 20): Promise<Array<{ tag: string; count: number }>> {
    try {
      const response = await apiService.get(`${this.baseUrl}/tags/popular`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get popular tags:', error);
      throw new Error('Failed to get popular tags');
    }
  }

  /**
   * Get similar assets
   */
  async getSimilarAssets(assetId: string, limit: number = 10): Promise<Asset[]> {
    try {
      const response = await apiService.get(`${this.baseUrl}/${assetId}/similar`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get similar assets:', error);
      throw new Error('Failed to get similar assets');
    }
  }

  /**
   * Generate asset thumbnails
   */
  async generateThumbnails(assetId: string, sizes?: number[]): Promise<{
    thumbnails: Array<{
      size: number;
      url: string;
      width: number;
      height: number;
    }>;
  }> {
    try {
      const response = await apiService.post(`${this.baseUrl}/${assetId}/thumbnails`, {
        sizes: sizes || [150, 300, 600]
      });
      return response.data;
    } catch (error) {
      console.error('Failed to generate thumbnails:', error);
      throw new Error('Failed to generate thumbnails');
    }
  }

  /**
   * Optimize asset
   */
  async optimizeAsset(assetId: string, options?: {
    quality?: number;
    format?: 'jpg' | 'png' | 'webp';
    max_width?: number;
    max_height?: number;
  }): Promise<Asset> {
    try {
      const response = await apiService.post(`${this.baseUrl}/${assetId}/optimize`, options);
      return response.data;
    } catch (error) {
      console.error('Failed to optimize asset:', error);
      throw new Error('Failed to optimize asset');
    }
  }

  /**
   * Batch operations on assets
   */
  async batchOperation(operation: 'delete' | 'move' | 'tag' | 'favorite', assetIds: string[], options?: any): Promise<{
    success: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    try {
      const response = await apiService.post(`${this.baseUrl}/batch`, {
        operation,
        asset_ids: assetIds,
        options
      });
      return response.data;
    } catch (error) {
      console.error('Failed to perform batch operation:', error);
      throw new Error('Failed to perform batch operation');
    }
  }

  /**
   * Get asset download URL
   */
  async getDownloadUrl(assetId: string, options?: {
    expires_in?: number; // seconds
    format?: string;
    size?: string;
  }): Promise<{ download_url: string; expires_at: string }> {
    try {
      const response = await apiService.get(`${this.baseUrl}/${assetId}/download-url`, {
        params: options
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get download URL:', error);
      throw new Error('Failed to get download URL');
    }
  }

  /**
   * Share asset
   */
  async shareAsset(assetId: string, options: {
    permissions: 'view' | 'download' | 'edit';
    expires_at?: string;
    password?: string;
    allow_download?: boolean;
  }): Promise<{
    share_url: string;
    share_id: string;
    expires_at?: string;
  }> {
    try {
      const response = await apiService.post(`${this.baseUrl}/${assetId}/share`, options);
      return response.data;
    } catch (error) {
      console.error('Failed to share asset:', error);
      throw new Error('Failed to share asset');
    }
  }

  /**
   * Get shared asset
   */
  async getSharedAsset(shareId: string, password?: string): Promise<Asset> {
    try {
      const response = await apiService.get(`${this.baseUrl}/shared/${shareId}`, {
        params: password ? { password } : {}
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get shared asset:', error);
      throw new Error('Failed to get shared asset');
    }
  }
}

export default new AssetManagementService();

export interface AssetVersion {
  id: string;
  version: number;
  file_path: string;
  file_size: number;
  created_at: string;
  created_by: string;
  change_description?: string;
  is_current: boolean;
}

export interface Asset {
  id: string;
  name: string;
  description?: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  duration?: number;
  thumbnail_url?: string;
  is_public: boolean;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  upload_date: string;
  last_accessed?: string;
  access_count: number;
  tags: string[];
  folder_id?: string;
  version: number;
  versions: AssetVersion[];
  is_favorite: boolean;
  usage_count: number;
  last_used?: string;
  permissions: {
    can_edit: boolean;
    can_delete: boolean;
    can_share: boolean;
    can_download: boolean;
  };
  metadata: {
    dimensions?: { width: number; height: number };
    duration?: number;
    color_palette?: string[];
    dominant_colors?: string[];
    ai_tags?: string[];
    file_format?: string;
    compression_ratio?: number;
    created_by?: string;
    modified_by?: string;
    camera_info?: any;
    exif_data?: any;
  };
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  asset_count: number;
  created_at: string;
  updated_at: string;
  is_default: boolean;
  color?: string;
  icon?: string;
  permissions: {
    can_edit: boolean;
    can_delete: boolean;
    can_add_assets: boolean;
  };
  metadata: {
    total_size: number;
    last_modified: string;
    created_by: string;
  };
}

export interface AssetCollection {
  id: string;
  name: string;
  description?: string;
  assets: string[];
  created_at: string;
  is_public: boolean;
  tags: string[];
  cover_image?: string;
}

export interface AssetFilter {
  type?: 'image' | 'video' | 'audio' | 'document' | 'all';
  size?: 'small' | 'medium' | 'large' | 'all';
  date_range?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  folder?: string;
  favorites?: boolean;
  recently_used?: boolean;
}

export interface AssetAnalytics {
  totalAssets: number;
  totalSize: number;
  assetsByType: Array<{
    type: string;
    count: number;
    size: number;
  }>;
  mostUsedAssets: Asset[];
  recentlyAdded: Asset[];
  storageUsage: {
    used: number;
    available: number;
    percentage: number;
  };
  usageStats: {
    totalDownloads: number;
    totalViews: number;
    averageFileSize: number;
  };
}

export interface AssetSearchResult {
  assets: Asset[];
  total: number;
  facets: {
    types: Array<{ type: string; count: number }>;
    folders: Array<{ folder: string; count: number }>;
    tags: Array<{ tag: string; count: number }>;
    sizes: Array<{ size: string; count: number }>;
  };
}

class AssetManagementService {
  private baseUrl = '/api/v1/assets';

  /**
   * Get assets with advanced filtering and pagination
   */
  async getAssets(params?: {
    page?: number;
    limit?: number;
    search?: string;
    filter?: AssetFilter;
    sort_by?: 'name' | 'size' | 'date' | 'usage';
    sort_order?: 'asc' | 'desc';
  }): Promise<{ assets: Asset[]; total: number }> {
    try {
      const response = await apiService.get(`${this.baseUrl}`, { params });
      return response.data;
    } catch (error) {
      console.error('Failed to get assets:', error);
      throw new Error('Failed to get assets');
    }
  }

  /**
   * Search assets with advanced search capabilities
   */
  async searchAssets(query: string, options?: {
    filter?: AssetFilter;
    limit?: number;
    include_facets?: boolean;
  }): Promise<AssetSearchResult> {
    try {
      const response = await apiService.post(`${this.baseUrl}/search`, {
        query,
        ...options
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search assets:', error);
      throw new Error('Failed to search assets');
    }
  }

  /**
   * Get asset by ID with full details
   */
  async getAssetById(assetId: string): Promise<Asset> {
    try {
      const response = await apiService.get(`${this.baseUrl}/${assetId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get asset:', error);
      throw new Error('Failed to get asset');
    }
  }

  /**
   * Upload new asset with metadata
   */
  async uploadAsset(file: File, metadata?: {
    name?: string;
    description?: string;
    tags?: string[];
    folder_id?: string;
    is_public?: boolean;
  }): Promise<Asset> {
    try {
      const formData = new FormData();
      formData.append('asset', file);
      
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
      }

      const response = await apiService.post(`${this.baseUrl}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to upload asset:', error);
      throw new Error('Failed to upload asset');
    }
  }

  /**
   * Update asset metadata
   */
  async updateAsset(assetId: string, updates: {
    name?: string;
    description?: string;
    tags?: string[];
    folder_id?: string;
    is_public?: boolean;
  }): Promise<Asset> {
    try {
      const response = await apiService.patch(`${this.baseUrl}/${assetId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Failed to update asset:', error);
      throw new Error('Failed to update asset');
    }
  }

  /**
   * Delete asset
   */
  async deleteAsset(assetId: string): Promise<void> {
    try {
      await apiService.delete(`${this.baseUrl}/${assetId}`);
    } catch (error) {
      console.error('Failed to delete asset:', error);
      throw new Error('Failed to delete asset');
    }
  }

  /**
   * Create new version of asset
   */
  async createAssetVersion(assetId: string, file: File, changeDescription?: string): Promise<AssetVersion> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (changeDescription) {
        formData.append('change_description', changeDescription);
      }

      const response = await apiService.post(`${this.baseUrl}/${assetId}/versions`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create asset version:', error);
      throw new Error('Failed to create asset version');
    }
  }

  /**
   * Get asset versions
   */
  async getAssetVersions(assetId: string): Promise<AssetVersion[]> {
    try {
      const response = await apiService.get(`${this.baseUrl}/${assetId}/versions`);
      return response.data;
    } catch (error) {
      console.error('Failed to get asset versions:', error);
      throw new Error('Failed to get asset versions');
    }
  }

  /**
   * Restore asset to specific version
   */
  async restoreAssetVersion(assetId: string, versionId: string): Promise<Asset> {
    try {
      const response = await apiService.post(`${this.baseUrl}/${assetId}/versions/${versionId}/restore`);
      return response.data;
    } catch (error) {
      console.error('Failed to restore asset version:', error);
      throw new Error('Failed to restore asset version');
    }
  }

  /**
   * Toggle asset favorite status
   */
  async toggleAssetFavorite(assetId: string): Promise<Asset> {
    try {
      const response = await apiService.post(`${this.baseUrl}/${assetId}/favorite`);
      return response.data;
    } catch (error) {
      console.error('Failed to toggle asset favorite:', error);
      throw new Error('Failed to toggle asset favorite');
    }
  }

  /**
   * Get folders
   */
  async getFolders(): Promise<Folder[]> {
    try {
      const response = await apiService.get(`${this.baseUrl}/folders`);
      return response.data;
    } catch (error) {
      console.error('Failed to get folders:', error);
      throw new Error('Failed to get folders');
    }
  }

  /**
   * Create folder
   */
  async createFolder(folder: {
    name: string;
    description?: string;
    parent_id?: string;
    color?: string;
    icon?: string;
  }): Promise<Folder> {
    try {
      const response = await apiService.post(`${this.baseUrl}/folders`, folder);
      return response.data;
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw new Error('Failed to create folder');
    }
  }

  /**
   * Update folder
   */
  async updateFolder(folderId: string, updates: {
    name?: string;
    description?: string;
    color?: string;
    icon?: string;
  }): Promise<Folder> {
    try {
      const response = await apiService.patch(`${this.baseUrl}/folders/${folderId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Failed to update folder:', error);
      throw new Error('Failed to update folder');
    }
  }

  /**
   * Delete folder
   */
  async deleteFolder(folderId: string): Promise<void> {
    try {
      await apiService.delete(`${this.baseUrl}/folders/${folderId}`);
    } catch (error) {
      console.error('Failed to delete folder:', error);
      throw new Error('Failed to delete folder');
    }
  }

  /**
   * Get asset collections
   */
  async getCollections(): Promise<AssetCollection[]> {
    try {
      const response = await apiService.get(`${this.baseUrl}/collections`);
      return response.data;
    } catch (error) {
      console.error('Failed to get collections:', error);
      throw new Error('Failed to get collections');
    }
  }

  /**
   * Create asset collection
   */
  async createCollection(collection: {
    name: string;
    description?: string;
    assets?: string[];
    is_public?: boolean;
    tags?: string[];
  }): Promise<AssetCollection> {
    try {
      const response = await apiService.post(`${this.baseUrl}/collections`, collection);
      return response.data;
    } catch (error) {
      console.error('Failed to create collection:', error);
      throw new Error('Failed to create collection');
    }
  }

  /**
   * Update asset collection
   */
  async updateCollection(collectionId: string, updates: {
    name?: string;
    description?: string;
    assets?: string[];
    is_public?: boolean;
    tags?: string[];
  }): Promise<AssetCollection> {
    try {
      const response = await apiService.patch(`${this.baseUrl}/collections/${collectionId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Failed to update collection:', error);
      throw new Error('Failed to update collection');
    }
  }

  /**
   * Delete asset collection
   */
  async deleteCollection(collectionId: string): Promise<void> {
    try {
      await apiService.delete(`${this.baseUrl}/collections/${collectionId}`);
    } catch (error) {
      console.error('Failed to delete collection:', error);
      throw new Error('Failed to delete collection');
    }
  }

  /**
   * Get asset analytics
   */
  async getAssetAnalytics(): Promise<AssetAnalytics> {
    try {
      const response = await apiService.get(`${this.baseUrl}/analytics`);
      return response.data;
    } catch (error) {
      console.error('Failed to get asset analytics:', error);
      throw new Error('Failed to get asset analytics');
    }
  }

  /**
   * Get popular tags
   */
  async getPopularTags(limit: number = 20): Promise<Array<{ tag: string; count: number }>> {
    try {
      const response = await apiService.get(`${this.baseUrl}/tags/popular`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get popular tags:', error);
      throw new Error('Failed to get popular tags');
    }
  }

  /**
   * Get similar assets
   */
  async getSimilarAssets(assetId: string, limit: number = 10): Promise<Asset[]> {
    try {
      const response = await apiService.get(`${this.baseUrl}/${assetId}/similar`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get similar assets:', error);
      throw new Error('Failed to get similar assets');
    }
  }

  /**
   * Generate asset thumbnails
   */
  async generateThumbnails(assetId: string, sizes?: number[]): Promise<{
    thumbnails: Array<{
      size: number;
      url: string;
      width: number;
      height: number;
    }>;
  }> {
    try {
      const response = await apiService.post(`${this.baseUrl}/${assetId}/thumbnails`, {
        sizes: sizes || [150, 300, 600]
      });
      return response.data;
    } catch (error) {
      console.error('Failed to generate thumbnails:', error);
      throw new Error('Failed to generate thumbnails');
    }
  }

  /**
   * Optimize asset
   */
  async optimizeAsset(assetId: string, options?: {
    quality?: number;
    format?: 'jpg' | 'png' | 'webp';
    max_width?: number;
    max_height?: number;
  }): Promise<Asset> {
    try {
      const response = await apiService.post(`${this.baseUrl}/${assetId}/optimize`, options);
      return response.data;
    } catch (error) {
      console.error('Failed to optimize asset:', error);
      throw new Error('Failed to optimize asset');
    }
  }

  /**
   * Batch operations on assets
   */
  async batchOperation(operation: 'delete' | 'move' | 'tag' | 'favorite', assetIds: string[], options?: any): Promise<{
    success: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    try {
      const response = await apiService.post(`${this.baseUrl}/batch`, {
        operation,
        asset_ids: assetIds,
        options
      });
      return response.data;
    } catch (error) {
      console.error('Failed to perform batch operation:', error);
      throw new Error('Failed to perform batch operation');
    }
  }

  /**
   * Get asset download URL
   */
  async getDownloadUrl(assetId: string, options?: {
    expires_in?: number; // seconds
    format?: string;
    size?: string;
  }): Promise<{ download_url: string; expires_at: string }> {
    try {
      const response = await apiService.get(`${this.baseUrl}/${assetId}/download-url`, {
        params: options
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get download URL:', error);
      throw new Error('Failed to get download URL');
    }
  }

  /**
   * Share asset
   */
  async shareAsset(assetId: string, options: {
    permissions: 'view' | 'download' | 'edit';
    expires_at?: string;
    password?: string;
    allow_download?: boolean;
  }): Promise<{
    share_url: string;
    share_id: string;
    expires_at?: string;
  }> {
    try {
      const response = await apiService.post(`${this.baseUrl}/${assetId}/share`, options);
      return response.data;
    } catch (error) {
      console.error('Failed to share asset:', error);
      throw new Error('Failed to share asset');
    }
  }

  /**
   * Get shared asset
   */
  async getSharedAsset(shareId: string, password?: string): Promise<Asset> {
    try {
      const response = await apiService.get(`${this.baseUrl}/shared/${shareId}`, {
        params: password ? { password } : {}
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get shared asset:', error);
      throw new Error('Failed to get shared asset');
    }
  }
}

export default new AssetManagementService();


