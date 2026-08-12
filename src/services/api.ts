import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { getResolvedApiBaseUrl } from '../config/apiBaseUrl';
import { getAccessTokenForApiRequest } from './msalAccessToken';
import type { PropertyFormData } from '../components/listings/submission/types';


/** Axios 1.x may use AxiosHeaders — set Authorization in a way that always applies. */
function setBearerAuth(config: InternalAxiosRequestConfig, accessToken: string): void {
  const value = `Bearer ${accessToken}`;
  const headers = config.headers;
  if (!headers) return;
  if (typeof (headers as { set?: (k: string, v: string) => void }).set === 'function') {
    (headers as { set: (k: string, v: string) => void }).set('Authorization', value);
  } else {
    (headers as Record<string, string>)['Authorization'] = value;
  }
}

const API_BASE_URL = getResolvedApiBaseUrl();
// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  errors?: Record<string, string[]>;
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



class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    // This will be replaced with the actual API URL from environment variables
    this.baseURL = API_BASE_URL;
    
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000, // 30 seconds timeout
    });

    // Request interceptor: attach Bearer token + log outgoing request
    this.api.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await getAccessTokenForApiRequest();
        if (token) {
          setBearerAuth(config, token);
        }
        // Stamp request start time for duration tracking
        (config as any)._t = Date.now();
        const method = config.method?.toUpperCase() ?? 'GET';
        const url = `${config.baseURL ?? ''}${config.url ?? ''}`;
        console.groupCollapsed(
          `%c[API] → ${method} ${config.url}`,
          'color:#1776B6;font-weight:bold'
        );
        console.log('URL:', url);
        if (config.params && Object.keys(config.params).length) {
          console.log('Params:', config.params);
        }
        if (config.data) {
          console.log('Body:', config.data);
        }
        console.groupEnd();
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: log success/error + on 401, clear stale token and retry once
    this.api.interceptors.response.use(
      (response) => {
        const ms = Date.now() - ((response.config as any)._t ?? Date.now());
        const method = response.config.method?.toUpperCase() ?? '?';
        console.log(
          `%c[API] ← ${response.status} ${method} ${response.config.url} (${ms}ms)`,
          'color:#22c55e;font-weight:bold',
          response.data
        );
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retried?: boolean };
        const ms = Date.now() - ((originalRequest as any)?._t ?? Date.now());
        const method = originalRequest?.method?.toUpperCase() ?? '?';
        const status = error.response?.status ?? 'NETWORK';
        console.groupCollapsed(
          `%c[API] ✖ ${status} ${method} ${originalRequest?.url} (${ms}ms)`,
          'color:#ef4444;font-weight:bold'
        );
        console.error('Status:', error.response?.status);
        console.error('Response data:', error.response?.data);
        console.error('Message:', error.message);
        console.groupEnd();

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retried
        ) {
          originalRequest._retried = true;
          // Clear the stale token so getAccessTokenForApiRequest() skips the localStorage fallback
          localStorage.removeItem('auth_token');
          try {
            const freshToken = await getAccessTokenForApiRequest();
            if (freshToken) {
              setBearerAuth(originalRequest, freshToken);
              return this.api.request(originalRequest);
            }
          } catch {
            // Fresh token acquisition failed — fall through to error handling
          }
        }
        return this.handleApiError(error);
      }
    );
  }

  // Handle API errors
  private handleApiError(error: AxiosError): Promise<never> {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      status: error.response?.status || 500,
    };

    if (error.response) {
      const data = error.response.data as any;
      
      // Handle structured error responses
      if (data.message) {
        apiError.message = data.message;
      }
      
      if (data.errors) {
        apiError.errors = data.errors;
      }

      // Handle authentication errors
      if (error.response.status === 401) {
        if (
          /missing or invalid bearer token/i.test(apiError.message) ||
          apiError.message === 'Unauthorized'
        ) {
          apiError.message =
            'Sign in required, or your session expired. Please sign in again and retry this action.';
        }
      }
    } else if (error.request) {
      const code = (error as AxiosError & { code?: string }).code;
      if (code === 'ECONNABORTED') {
        apiError.message = 'Request timed out — the server may still be processing. Try again or wait a moment.';
      } else {
        apiError.message = 'No response received from server';
      }
    }

    return Promise.reject(apiError);
  }

  // Generic request method
  public async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await this.api.request(config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      throw error;
    }
  }

  // GET request
  public async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', url, params });
  }

  // POST request (optional Axios overrides, e.g. `{ timeout: 120000 }` for long-running submits)
  public async post<T>(
    url: string,
    data?: any,
    config?: Omit<AxiosRequestConfig, 'method' | 'url' | 'data'>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', url, data, ...config });
  }

  // PUT request
  public async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data });
  }

  // PATCH request
  public async patch<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PATCH', url, data });
  }

  // DELETE request
  public async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', url });
  }

  // Upload file
  public async uploadFile<T>(
    url: string, 
    file: File, 
    additionalData?: Record<string, any>,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.request<T>({
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...(onProgress && {
        onUploadProgress: (progressEvent: any) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      }),
    });
  }
}

// Create a singleton instance
const apiService = new ApiService();
export default apiService;



// API service functions
export const saveSectionData = async (
  applicationId: string,
  section: string,
  data: Record<string, any>
): Promise<ApiResponse<any>> => {
  try {
    const response = await apiService.put(`/applications/${applicationId}/${section}`, data);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Error saving section data:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to save section data'
    };
  }
};

export const uploadDocument = async (
  applicationId: string,
  section: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<ApiResponse<FileUploadResponse>> => {
  try {
    const response = await apiService.uploadFile<FileUploadResponse>(
      `/applications/${applicationId}/upload`, 
      file, 
      { section },
      onProgress
    );

    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to upload document'
    };
  }
};

export const submitApplication = async (applicationId: string): Promise<ApiResponse<any>> => {
  try {
    const response = await apiService.post(`/applications/${applicationId}/submit`);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Error submitting application:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to submit application'
    };
  }
};

export const getApplicationById = async (applicationId: string): Promise<ApiResponse<any>> => {
  try {
    const response = await apiService.get(`/applications/${applicationId}`);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Error fetching application:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch application'
    };
  }
};

export const getDocuments = async (applicationId: string, section?: string): Promise<ApiResponse<any>> => {
  try {
    const url = section 
      ? `/applications/${applicationId}/documents/${section}`
      : `/applications/${applicationId}/documents`;
    const response = await apiService.get(url);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch documents'
    };
  }
};

export const deleteDocument = async (documentId: string): Promise<ApiResponse<any>> => {
  try {
    const response = await apiService.delete(`/documents/${documentId}`);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to delete document'
    };
  }
};
export const api = {
  // Submit a new listing
  submitListing: async (data: PropertyFormData) => {
    try {
      const response = await apiService.post<any>('/native-properties', {
        title: data.title,
        price: data.price.toString(),
        type: data.type,
        propertyType: data.propertyType,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        description: data.description,
        isAvailableNow: data.isAvailableNow,
        address: data.address,
        city: data.city,
        postcode: data.postcode,
        agentName: data.agentName,
        agentCompany: data.agentCompany,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        photos: data.images ? data.images.map((f: any) => ({
          id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: f.url || '',
          filename: f.name || '',
          isCover: false
        })) : []
      });

      return {
        success: true,
        message: 'Listing submitted successfully',
        listingId: response.data?.id,
      };
    } catch (error: any) {
      console.error('Error submitting listing:', error);
      throw error;
    }
  }
};
 