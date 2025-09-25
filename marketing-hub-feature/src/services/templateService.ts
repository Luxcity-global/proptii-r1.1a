// marketing-hub-feature/src/services/templateService.ts
import api from './api';
import type { Template } from '../types/database';
import type { ApiResponse } from '../types/api';

export interface TemplateLoadResult {
  success: boolean;
  template?: Template;
  error?: string;
}

export class TemplateService {
  /**
   * Load a template by ID and return its canvas data
   */
  static async loadTemplate(templateId: string): Promise<TemplateLoadResult> {
    try {
      const response = await api.get<ApiResponse<Template>>(`/templates/${templateId}`);
      
      if (response.data.success && response.data.data) {
        return {
          success: true,
          template: response.data.data
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Failed to load template'
        };
      }
    } catch (error: any) {
      console.error('Error loading template:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to load template'
      };
    }
  }

  /**
   * Get featured templates
   */
  static async getFeaturedTemplates(limit: number = 10): Promise<ApiResponse<Template[]> | null> {
    try {
      const response = await api.get<ApiResponse<Template[]>>(`/templates/featured?limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching featured templates:', error);
      return null;
    }
  }

  /**
   * Search templates with filters
   */
  static async searchTemplates(params: {
    category?: string;
    platform_target?: string;
    content_type?: string;
    difficulty_level?: string;
    min_rating?: number;
    page?: number;
    limit?: number;
  } = {}): Promise<ApiResponse<Template[]> | null> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await api.get<ApiResponse<Template[]>>(`/templates?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Error searching templates:', error);
      return null;
    }
  }

  /**
   * Record template usage
   */
  static async recordTemplateUsage(templateId: string): Promise<boolean> {
    try {
      const response = await api.post<ApiResponse<null>>(`/templates/${templateId}/use`);
      return response.data.success;
    } catch (error: any) {
      console.error('Error recording template usage:', error);
      return false;
    }
  }

  /**
   * Rate a template
   */
  static async rateTemplate(templateId: string, rating: number): Promise<boolean> {
    try {
      const response = await api.post<ApiResponse<null>>(`/templates/${templateId}/rate`, { rating });
      return response.data.success;
    } catch (error: any) {
      console.error('Error rating template:', error);
      return false;
    }
  }
}

export default TemplateService;
