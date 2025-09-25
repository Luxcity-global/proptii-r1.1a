import type { Asset, Template, CanvasProject, CanvasVersion } from '../types/database';
import type { ApiResponse, PaginationParams } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ API request failed:', {
        url,
        error: error instanceof Error ? error.message : error,
        endpoint,
        online: navigator.onLine
      });
      throw error;
    }
  }

  // Fallback data for when API is not available
  private getFallbackTemplates(): Template[] {
    return [
      {
        id: 'template-1',
        name: 'Instagram Post',
        description: 'Perfect for social media posts',
        thumbnail_url: 'https://via.placeholder.com/300x300/3b82f6/ffffff?text=Instagram+Post',
        category: 'social',
        tags: ['social', 'instagram', 'post'],
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'system',
        width: 1080,
        height: 1080,
        template_data: {},
        usage_count: 0,
        is_featured: true,
        platform_targets: ['instagram'],
        content_type: 'post',
        difficulty_level: 'beginner',
        estimated_completion_time: 5,
        rating: 4.5,
        rating_count: 120
      },
      {
        id: 'template-2',
        name: 'Facebook Cover',
        description: 'Eye-catching cover photo template',
        thumbnail_url: 'https://via.placeholder.com/300x300/10b981/ffffff?text=Facebook+Cover',
        category: 'social',
        tags: ['social', 'facebook', 'cover'],
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'system',
        width: 820,
        height: 312,
        template_data: {},
        usage_count: 0,
        is_featured: true,
        platform_targets: ['facebook'],
        content_type: 'cover',
        difficulty_level: 'beginner',
        estimated_completion_time: 3,
        rating: 4.8,
        rating_count: 95
      },
      {
        id: 'template-3',
        name: 'Twitter Header',
        description: 'Professional Twitter header design',
        thumbnail_url: 'https://via.placeholder.com/300x300/f59e0b/ffffff?text=Twitter+Header',
        category: 'social',
        tags: ['social', 'twitter', 'header'],
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'system',
        width: 1500,
        height: 500,
        template_data: {},
        usage_count: 0,
        is_featured: false,
        platform_targets: ['twitter'],
        content_type: 'header',
        difficulty_level: 'intermediate',
        estimated_completion_time: 7,
        rating: 4.2,
        rating_count: 78
      }
    ];
  }

  // Asset API methods
  async getAssets(params: PaginationParams = {}): Promise<ApiResponse<Asset[]>> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.sort_by) searchParams.append('sort_by', params.sort_by);
    if (params.sort_order) searchParams.append('sort_order', params.sort_order);
    if (params.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        searchParams.append(key, value.toString());
      });
    }

    const queryString = searchParams.toString();
    return this.request<Asset[]>(`/assets${queryString ? `?${queryString}` : ''}`);
  }

  async getAsset(id: string): Promise<ApiResponse<Asset>> {
    return this.request<Asset>(`/assets/${id}`);
  }

  async uploadAssets(files: File[], metadata: {
    tags?: string[];
    category?: string;
    description?: string;
    is_public?: boolean;
  } = {}): Promise<ApiResponse<Asset[]>> {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });
    
    if (metadata.tags) formData.append('tags', metadata.tags.join(','));
    if (metadata.category) formData.append('category', metadata.category);
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.is_public !== undefined) formData.append('is_public', metadata.is_public.toString());

    return this.request<Asset[]>('/assets', {
      method: 'POST',
      headers: {}, // Remove Content-Type header to let browser set it with boundary
      body: formData,
    });
  }

  async updateAsset(id: string, updates: {
    name?: string;
    description?: string;
    tags?: string[];
    category?: string;
    is_public?: boolean;
  }): Promise<ApiResponse<Asset>> {
    return this.request<Asset>(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteAsset(id: string): Promise<ApiResponse<null>> {
    return this.request<null>(`/assets/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteAssets(assetIds: string[]): Promise<ApiResponse<null>> {
    return this.request<null>('/assets/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ assetIds }),
    });
  }

  async searchAssets(params: {
    query?: string;
    category?: string;
    tags?: string[];
    min_size?: number;
    max_size?: number;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Asset[]>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          searchParams.append(key, value.join(','));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    return this.request<Asset[]>(`/assets/search?${searchParams.toString()}`);
  }

  // Template API methods
  async getTemplates(params: PaginationParams = {}): Promise<ApiResponse<Template[]>> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.sort_by) searchParams.append('sort_by', params.sort_by);
      if (params.sort_order) searchParams.append('sort_order', params.sort_order);
      if (params.filter) {
        Object.entries(params.filter).forEach(([key, value]) => {
          searchParams.append(key, value.toString());
        });
      }

      const queryString = searchParams.toString();
      return await this.request<Template[]>(`/templates${queryString ? `?${queryString}` : ''}`);
    } catch (error) {
      console.warn('⚠️ API unavailable, using fallback templates');
      return {
        success: true,
        data: this.getFallbackTemplates(),
        message: 'Using offline templates'
      };
    }
  }

  async getFeaturedTemplates(limit: number = 10): Promise<ApiResponse<Template[]>> {
    try {
      return await this.request<Template[]>(`/templates/featured?limit=${limit}`);
    } catch (error) {
      console.warn('⚠️ API unavailable, using fallback featured templates');
      const fallbackTemplates = this.getFallbackTemplates().filter(t => t.is_featured).slice(0, limit);
      return {
        success: true,
        data: fallbackTemplates,
        message: 'Using offline featured templates'
      };
    }
  }

  async getTemplate(id: string): Promise<ApiResponse<Template>> {
    return this.request<Template>(`/templates/${id}`);
  }

  async createTemplate(template: {
    name: string;
    description?: string;
    category?: string;
    subcategory?: string;
    tags?: string[];
    canvas_data: any;
    metadata?: any;
    is_public?: boolean;
  }): Promise<ApiResponse<Template>> {
    return this.request<Template>('/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  }

  async updateTemplate(id: string, updates: {
    name?: string;
    description?: string;
    category?: string;
    subcategory?: string;
    tags?: string[];
    canvas_data?: any;
    metadata?: any;
    is_public?: boolean;
  }): Promise<ApiResponse<Template>> {
    return this.request<Template>(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTemplate(id: string): Promise<ApiResponse<null>> {
    return this.request<null>(`/templates/${id}`, {
      method: 'DELETE',
    });
  }

  async useTemplate(id: string): Promise<ApiResponse<null>> {
    return this.request<null>(`/templates/${id}/use`, {
      method: 'POST',
    });
  }

  async rateTemplate(id: string, rating: number): Promise<ApiResponse<null>> {
    return this.request<null>(`/templates/${id}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    });
  }

  // Canvas API methods
  async getProjects(params: PaginationParams = {}): Promise<ApiResponse<CanvasProject[]>> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.sort_by) searchParams.append('sort_by', params.sort_by);
    if (params.sort_order) searchParams.append('sort_order', params.sort_order);
    if (params.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        searchParams.append(key, value.toString());
      });
    }

    const queryString = searchParams.toString();
    return this.request<CanvasProject[]>(`/canvas/projects${queryString ? `?${queryString}` : ''}`);
  }

  async getProject(id: string): Promise<ApiResponse<CanvasProject>> {
    return this.request<CanvasProject>(`/canvas/projects/${id}`);
  }

  async createProject(project: {
    name: string;
    description?: string;
    template_id?: string;
    tags?: string[];
    is_public?: boolean;
    canvas_data?: any;
  }): Promise<ApiResponse<CanvasProject>> {
    return this.request<CanvasProject>('/canvas/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async updateProject(id: string, updates: {
    name?: string;
    description?: string;
    tags?: string[];
    is_public?: boolean;
  }): Promise<ApiResponse<CanvasProject>> {
    return this.request<CanvasProject>(`/canvas/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProject(id: string): Promise<ApiResponse<null>> {
    return this.request<null>(`/canvas/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async getProjectVersions(projectId: string, params: PaginationParams = {}): Promise<ApiResponse<CanvasVersion[]>> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    return this.request<CanvasVersion[]>(`/canvas/projects/${projectId}/versions${queryString ? `?${queryString}` : ''}`);
  }

  async saveCanvas(projectId: string, canvasData: any, changeDescription?: string): Promise<ApiResponse<CanvasVersion>> {
    return this.request<CanvasVersion>(`/canvas/projects/${projectId}/save`, {
      method: 'POST',
      body: JSON.stringify({
        canvas_data: canvasData,
        change_description: changeDescription
      }),
    });
  }

  async getVersion(projectId: string, versionId: string): Promise<ApiResponse<CanvasVersion>> {
    return this.request<CanvasVersion>(`/canvas/projects/${projectId}/versions/${versionId}`);
  }

  async restoreVersion(projectId: string, versionId: string): Promise<ApiResponse<null>> {
    return this.request<null>(`/canvas/projects/${projectId}/versions/${versionId}/restore`, {
      method: 'POST',
    });
  }

  async duplicateProject(projectId: string, name?: string): Promise<ApiResponse<CanvasProject>> {
    return this.request<CanvasProject>(`/canvas/projects/${projectId}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }
}

// Create singleton instance
const apiService = new ApiService();
export default apiService;