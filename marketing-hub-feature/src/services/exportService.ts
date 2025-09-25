import apiService from './api';
import type { ExportSettings } from '../components/export/ExportDialog';
import type { ExportJob } from '../components/export/ExportProgress';

export interface ExportRequest {
  canvasData: string; // JSON string of canvas state
  settings: ExportSettings;
  projectId?: string;
  userId?: string;
}

export interface ExportResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  estimatedTimeRemaining?: number;
  downloadUrl?: string;
  errorMessage?: string;
}

export interface BatchExportRequest {
  canvasData: string;
  exports: Array<{
    name: string;
    settings: ExportSettings;
  }>;
  projectId?: string;
  userId?: string;
}

export interface BatchExportResponse {
  jobIds: string[];
  status: 'queued' | 'processing';
  estimatedTimeRemaining?: number;
}

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  settings: ExportSettings;
  category: 'social' | 'print' | 'web' | 'custom';
  isDefault: boolean;
  createdAt: string;
  usageCount: number;
}

export interface ExportAnalytics {
  totalExports: number;
  successfulExports: number;
  failedExports: number;
  averageProcessingTime: number;
  mostUsedFormats: Array<{
    format: string;
    count: number;
    percentage: number;
  }>;
  exportsByDay: Array<{
    date: string;
    count: number;
  }>;
}

class ExportService {
  private baseUrl = '/api/v1/exports';

  /**
   * Export canvas with specified settings
   */
  async exportCanvas(request: ExportRequest): Promise<ExportResponse> {
    try {
      const response = await apiService.post(`${this.baseUrl}/export`, request);
      return response.data;
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error('Failed to start export process');
    }
  }

  /**
   * Start batch export with multiple format settings
   */
  async batchExport(request: BatchExportRequest): Promise<BatchExportResponse> {
    try {
      const response = await apiService.post(`${this.baseUrl}/batch-export`, request);
      return response.data;
    } catch (error) {
      console.error('Batch export failed:', error);
      throw new Error('Failed to start batch export process');
    }
  }

  /**
   * Get export job status
   */
  async getExportStatus(jobId: string): Promise<ExportJob> {
    try {
      const response = await apiService.get(`${this.baseUrl}/status/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get export status:', error);
      throw new Error('Failed to get export status');
    }
  }

  /**
   * Get all export jobs for current user
   */
  async getExportJobs(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ jobs: ExportJob[]; total: number }> {
    try {
      const response = await apiService.get(`${this.baseUrl}/jobs`, { params });
      return response.data;
    } catch (error) {
      console.error('Failed to get export jobs:', error);
      throw new Error('Failed to get export jobs');
    }
  }

  /**
   * Cancel an export job
   */
  async cancelExport(jobId: string): Promise<void> {
    try {
      await apiService.post(`${this.baseUrl}/cancel/${jobId}`);
    } catch (error) {
      console.error('Failed to cancel export:', error);
      throw new Error('Failed to cancel export');
    }
  }

  /**
   * Pause an export job
   */
  async pauseExport(jobId: string): Promise<void> {
    try {
      await apiService.post(`${this.baseUrl}/pause/${jobId}`);
    } catch (error) {
      console.error('Failed to pause export:', error);
      throw new Error('Failed to pause export');
    }
  }

  /**
   * Resume a paused export job
   */
  async resumeExport(jobId: string): Promise<void> {
    try {
      await apiService.post(`${this.baseUrl}/resume/${jobId}`);
    } catch (error) {
      console.error('Failed to resume export:', error);
      throw new Error('Failed to resume export');
    }
  }

  /**
   * Retry a failed export job
   */
  async retryExport(jobId: string): Promise<void> {
    try {
      await apiService.post(`${this.baseUrl}/retry/${jobId}`);
    } catch (error) {
      console.error('Failed to retry export:', error);
      throw new Error('Failed to retry export');
    }
  }

  /**
   * Delete an export job
   */
  async deleteExport(jobId: string): Promise<void> {
    try {
      await apiService.delete(`${this.baseUrl}/jobs/${jobId}`);
    } catch (error) {
      console.error('Failed to delete export:', error);
      throw new Error('Failed to delete export');
    }
  }

  /**
   * Download export file
   */
  async downloadExport(jobId: string): Promise<Blob> {
    try {
      const response = await apiService.get(`${this.baseUrl}/download/${jobId}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to download export:', error);
      throw new Error('Failed to download export');
    }
  }

  /**
   * Get download URL for export
   */
  async getDownloadUrl(jobId: string): Promise<string> {
    try {
      const response = await apiService.get(`${this.baseUrl}/download-url/${jobId}`);
      return response.data.downloadUrl;
    } catch (error) {
      console.error('Failed to get download URL:', error);
      throw new Error('Failed to get download URL');
    }
  }

  /**
   * Save export template
   */
  async saveExportTemplate(template: Omit<ExportTemplate, 'id' | 'createdAt' | 'usageCount'>): Promise<ExportTemplate> {
    try {
      const response = await apiService.post(`${this.baseUrl}/templates`, template);
      return response.data;
    } catch (error) {
      console.error('Failed to save export template:', error);
      throw new Error('Failed to save export template');
    }
  }

  /**
   * Get user's export templates
   */
  async getExportTemplates(): Promise<ExportTemplate[]> {
    try {
      const response = await apiService.get(`${this.baseUrl}/templates`);
      return response.data;
    } catch (error) {
      console.error('Failed to get export templates:', error);
      throw new Error('Failed to get export templates');
    }
  }

  /**
   * Delete export template
   */
  async deleteExportTemplate(templateId: string): Promise<void> {
    try {
      await apiService.delete(`${this.baseUrl}/templates/${templateId}`);
    } catch (error) {
      console.error('Failed to delete export template:', error);
      throw new Error('Failed to delete export template');
    }
  }

  /**
   * Get export analytics
   */
  async getExportAnalytics(timeRange?: {
    startDate: string;
    endDate: string;
  }): Promise<ExportAnalytics> {
    try {
      const response = await apiService.get(`${this.baseUrl}/analytics`, {
        params: timeRange
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get export analytics:', error);
      throw new Error('Failed to get export analytics');
    }
  }

  /**
   * Get export queue status
   */
  async getQueueStatus(): Promise<{
    activeJobs: number;
    queuedJobs: number;
    estimatedWaitTime: number;
    averageProcessingTime: number;
  }> {
    try {
      const response = await apiService.get(`${this.baseUrl}/queue-status`);
      return response.data;
    } catch (error) {
      console.error('Failed to get queue status:', error);
      throw new Error('Failed to get queue status');
    }
  }

  /**
   * Validate export settings
   */
  async validateExportSettings(settings: ExportSettings): Promise<{
    valid: boolean;
    warnings: string[];
    errors: string[];
  }> {
    try {
      const response = await apiService.post(`${this.baseUrl}/validate-settings`, settings);
      return response.data;
    } catch (error) {
      console.error('Failed to validate export settings:', error);
      throw new Error('Failed to validate export settings');
    }
  }

  /**
   * Get supported export formats
   */
  async getSupportedFormats(): Promise<{
    formats: Array<{
      id: string;
      name: string;
      description: string;
      supportsTransparency: boolean;
      maxDimensions: { width: number; height: number };
      compressionOptions: string[];
      qualityRange: { min: number; max: number };
    }>;
  }> {
    try {
      const response = await apiService.get(`${this.baseUrl}/supported-formats`);
      return response.data;
    } catch (error) {
      console.error('Failed to get supported formats:', error);
      throw new Error('Failed to get supported formats');
    }
  }

  /**
   * Estimate export file size and processing time
   */
  async estimateExport(request: {
    canvasData: string;
    settings: ExportSettings;
  }): Promise<{
    estimatedFileSize: number;
    estimatedProcessingTime: number;
    warnings: string[];
  }> {
    try {
      const response = await apiService.post(`${this.baseUrl}/estimate`, request);
      return response.data;
    } catch (error) {
      console.error('Failed to estimate export:', error);
      throw new Error('Failed to estimate export');
    }
  }

  /**
   * Create export preview thumbnail
   */
  async createExportPreview(request: {
    canvasData: string;
    settings: ExportSettings;
  }): Promise<string> {
    try {
      const response = await apiService.post(`${this.baseUrl}/preview`, request);
      return response.data.previewUrl;
    } catch (error) {
      console.error('Failed to create export preview:', error);
      throw new Error('Failed to create export preview');
    }
  }

  /**
   * Get export history for a project
   */
  async getExportHistory(projectId: string, params?: {
    limit?: number;
    offset?: number;
    format?: string;
  }): Promise<{
    exports: ExportJob[];
    total: number;
  }> {
    try {
      const response = await apiService.get(`${this.baseUrl}/history/${projectId}`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get export history:', error);
      throw new Error('Failed to get export history');
    }
  }

  /**
   * Clean up old export files
   */
  async cleanupOldExports(olderThanDays: number = 30): Promise<{
    deletedCount: number;
    freedSpace: number;
  }> {
    try {
      const response = await apiService.post(`${this.baseUrl}/cleanup`, {
        olderThanDays
      });
      return response.data;
    } catch (error) {
      console.error('Failed to cleanup old exports:', error);
      throw new Error('Failed to cleanup old exports');
    }
  }
}

export default new ExportService();
import type { ExportSettings } from '../components/export/ExportDialog';
import type { ExportJob } from '../components/export/ExportProgress';

export interface ExportRequest {
  canvasData: string; // JSON string of canvas state
  settings: ExportSettings;
  projectId?: string;
  userId?: string;
}

export interface ExportResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  estimatedTimeRemaining?: number;
  downloadUrl?: string;
  errorMessage?: string;
}

export interface BatchExportRequest {
  canvasData: string;
  exports: Array<{
    name: string;
    settings: ExportSettings;
  }>;
  projectId?: string;
  userId?: string;
}

export interface BatchExportResponse {
  jobIds: string[];
  status: 'queued' | 'processing';
  estimatedTimeRemaining?: number;
}

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  settings: ExportSettings;
  category: 'social' | 'print' | 'web' | 'custom';
  isDefault: boolean;
  createdAt: string;
  usageCount: number;
}

export interface ExportAnalytics {
  totalExports: number;
  successfulExports: number;
  failedExports: number;
  averageProcessingTime: number;
  mostUsedFormats: Array<{
    format: string;
    count: number;
    percentage: number;
  }>;
  exportsByDay: Array<{
    date: string;
    count: number;
  }>;
}

class ExportService {
  private baseUrl = '/api/v1/exports';

  /**
   * Export canvas with specified settings
   */
  async exportCanvas(request: ExportRequest): Promise<ExportResponse> {
    try {
      const response = await apiService.post(`${this.baseUrl}/export`, request);
      return response.data;
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error('Failed to start export process');
    }
  }

  /**
   * Start batch export with multiple format settings
   */
  async batchExport(request: BatchExportRequest): Promise<BatchExportResponse> {
    try {
      const response = await apiService.post(`${this.baseUrl}/batch-export`, request);
      return response.data;
    } catch (error) {
      console.error('Batch export failed:', error);
      throw new Error('Failed to start batch export process');
    }
  }

  /**
   * Get export job status
   */
  async getExportStatus(jobId: string): Promise<ExportJob> {
    try {
      const response = await apiService.get(`${this.baseUrl}/status/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get export status:', error);
      throw new Error('Failed to get export status');
    }
  }

  /**
   * Get all export jobs for current user
   */
  async getExportJobs(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ jobs: ExportJob[]; total: number }> {
    try {
      const response = await apiService.get(`${this.baseUrl}/jobs`, { params });
      return response.data;
    } catch (error) {
      console.error('Failed to get export jobs:', error);
      throw new Error('Failed to get export jobs');
    }
  }

  /**
   * Cancel an export job
   */
  async cancelExport(jobId: string): Promise<void> {
    try {
      await apiService.post(`${this.baseUrl}/cancel/${jobId}`);
    } catch (error) {
      console.error('Failed to cancel export:', error);
      throw new Error('Failed to cancel export');
    }
  }

  /**
   * Pause an export job
   */
  async pauseExport(jobId: string): Promise<void> {
    try {
      await apiService.post(`${this.baseUrl}/pause/${jobId}`);
    } catch (error) {
      console.error('Failed to pause export:', error);
      throw new Error('Failed to pause export');
    }
  }

  /**
   * Resume a paused export job
   */
  async resumeExport(jobId: string): Promise<void> {
    try {
      await apiService.post(`${this.baseUrl}/resume/${jobId}`);
    } catch (error) {
      console.error('Failed to resume export:', error);
      throw new Error('Failed to resume export');
    }
  }

  /**
   * Retry a failed export job
   */
  async retryExport(jobId: string): Promise<void> {
    try {
      await apiService.post(`${this.baseUrl}/retry/${jobId}`);
    } catch (error) {
      console.error('Failed to retry export:', error);
      throw new Error('Failed to retry export');
    }
  }

  /**
   * Delete an export job
   */
  async deleteExport(jobId: string): Promise<void> {
    try {
      await apiService.delete(`${this.baseUrl}/jobs/${jobId}`);
    } catch (error) {
      console.error('Failed to delete export:', error);
      throw new Error('Failed to delete export');
    }
  }

  /**
   * Download export file
   */
  async downloadExport(jobId: string): Promise<Blob> {
    try {
      const response = await apiService.get(`${this.baseUrl}/download/${jobId}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to download export:', error);
      throw new Error('Failed to download export');
    }
  }

  /**
   * Get download URL for export
   */
  async getDownloadUrl(jobId: string): Promise<string> {
    try {
      const response = await apiService.get(`${this.baseUrl}/download-url/${jobId}`);
      return response.data.downloadUrl;
    } catch (error) {
      console.error('Failed to get download URL:', error);
      throw new Error('Failed to get download URL');
    }
  }

  /**
   * Save export template
   */
  async saveExportTemplate(template: Omit<ExportTemplate, 'id' | 'createdAt' | 'usageCount'>): Promise<ExportTemplate> {
    try {
      const response = await apiService.post(`${this.baseUrl}/templates`, template);
      return response.data;
    } catch (error) {
      console.error('Failed to save export template:', error);
      throw new Error('Failed to save export template');
    }
  }

  /**
   * Get user's export templates
   */
  async getExportTemplates(): Promise<ExportTemplate[]> {
    try {
      const response = await apiService.get(`${this.baseUrl}/templates`);
      return response.data;
    } catch (error) {
      console.error('Failed to get export templates:', error);
      throw new Error('Failed to get export templates');
    }
  }

  /**
   * Delete export template
   */
  async deleteExportTemplate(templateId: string): Promise<void> {
    try {
      await apiService.delete(`${this.baseUrl}/templates/${templateId}`);
    } catch (error) {
      console.error('Failed to delete export template:', error);
      throw new Error('Failed to delete export template');
    }
  }

  /**
   * Get export analytics
   */
  async getExportAnalytics(timeRange?: {
    startDate: string;
    endDate: string;
  }): Promise<ExportAnalytics> {
    try {
      const response = await apiService.get(`${this.baseUrl}/analytics`, {
        params: timeRange
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get export analytics:', error);
      throw new Error('Failed to get export analytics');
    }
  }

  /**
   * Get export queue status
   */
  async getQueueStatus(): Promise<{
    activeJobs: number;
    queuedJobs: number;
    estimatedWaitTime: number;
    averageProcessingTime: number;
  }> {
    try {
      const response = await apiService.get(`${this.baseUrl}/queue-status`);
      return response.data;
    } catch (error) {
      console.error('Failed to get queue status:', error);
      throw new Error('Failed to get queue status');
    }
  }

  /**
   * Validate export settings
   */
  async validateExportSettings(settings: ExportSettings): Promise<{
    valid: boolean;
    warnings: string[];
    errors: string[];
  }> {
    try {
      const response = await apiService.post(`${this.baseUrl}/validate-settings`, settings);
      return response.data;
    } catch (error) {
      console.error('Failed to validate export settings:', error);
      throw new Error('Failed to validate export settings');
    }
  }

  /**
   * Get supported export formats
   */
  async getSupportedFormats(): Promise<{
    formats: Array<{
      id: string;
      name: string;
      description: string;
      supportsTransparency: boolean;
      maxDimensions: { width: number; height: number };
      compressionOptions: string[];
      qualityRange: { min: number; max: number };
    }>;
  }> {
    try {
      const response = await apiService.get(`${this.baseUrl}/supported-formats`);
      return response.data;
    } catch (error) {
      console.error('Failed to get supported formats:', error);
      throw new Error('Failed to get supported formats');
    }
  }

  /**
   * Estimate export file size and processing time
   */
  async estimateExport(request: {
    canvasData: string;
    settings: ExportSettings;
  }): Promise<{
    estimatedFileSize: number;
    estimatedProcessingTime: number;
    warnings: string[];
  }> {
    try {
      const response = await apiService.post(`${this.baseUrl}/estimate`, request);
      return response.data;
    } catch (error) {
      console.error('Failed to estimate export:', error);
      throw new Error('Failed to estimate export');
    }
  }

  /**
   * Create export preview thumbnail
   */
  async createExportPreview(request: {
    canvasData: string;
    settings: ExportSettings;
  }): Promise<string> {
    try {
      const response = await apiService.post(`${this.baseUrl}/preview`, request);
      return response.data.previewUrl;
    } catch (error) {
      console.error('Failed to create export preview:', error);
      throw new Error('Failed to create export preview');
    }
  }

  /**
   * Get export history for a project
   */
  async getExportHistory(projectId: string, params?: {
    limit?: number;
    offset?: number;
    format?: string;
  }): Promise<{
    exports: ExportJob[];
    total: number;
  }> {
    try {
      const response = await apiService.get(`${this.baseUrl}/history/${projectId}`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get export history:', error);
      throw new Error('Failed to get export history');
    }
  }

  /**
   * Clean up old export files
   */
  async cleanupOldExports(olderThanDays: number = 30): Promise<{
    deletedCount: number;
    freedSpace: number;
  }> {
    try {
      const response = await apiService.post(`${this.baseUrl}/cleanup`, {
        olderThanDays
      });
      return response.data;
    } catch (error) {
      console.error('Failed to cleanup old exports:', error);
      throw new Error('Failed to cleanup old exports');
    }
  }
}

export default new ExportService();


