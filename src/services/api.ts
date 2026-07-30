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

// Mock properties for testing
const mockProperties = [
  {
    id: '1',
    address: '123 Main Street, London, SW1 1AA',
    type: 'Apartment',
    monthlyRent: 1500,
    bedrooms: 2,
    bathrooms: 1,
    imageUrl: '/images/modern-building.jpg'
  },
  {
    id: '2',
    address: '456 Park Avenue, London, E1 6BT',
    type: 'House',
    monthlyRent: 2200,
    bedrooms: 3,
    bathrooms: 2,
    imageUrl: '/images/viewing-room.jpg'
  },
  {
    id: '3',
    address: '789 Oxford Street, London, W1D 1BS',
    type: 'Studio',
    monthlyRent: 1100,
    bedrooms: 1,
    bathrooms: 1,
    imageUrl: '/images/modern-building.jpg'
  }
];

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

    // Request interceptor: attach Bearer token (MSAL silent → popup → auth_token fallback)
    this.api.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await getAccessTokenForApiRequest();
        if (token) {
          setBearerAuth(config, token);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for handling errors
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => this.handleApiError(error)
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
        localStorage.removeItem('auth_token');
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

// Get properties function
export const getProperties = async (): Promise<ApiResponse<any[]>> => {
  try {
    // For now, return mock data
    return {
      success: true,
      data: mockProperties
    };
  } catch (error) {
    console.error('Error fetching properties:', error);
    return {
      success: false,
      error: 'Failed to fetch properties'
    };
  }
};

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
 