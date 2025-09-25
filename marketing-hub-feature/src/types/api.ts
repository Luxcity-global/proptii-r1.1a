// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  errors?: Record<string, string[]>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// File upload response
export interface FileUploadResponse {
  fileUrl: string;
  fileName: string;
}

// API error interface
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status: number;
}

// Pagination parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  filter?: Record<string, any>;
}

