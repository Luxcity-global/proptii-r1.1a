import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getMsalInstance } from '../contexts/AuthContext';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
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

    // Request interceptor for adding auth token
    this.api.interceptors.request.use(
      async (config) => {
        // Try to get token from MSAL first
        const msalInstance = getMsalInstance();
        if (msalInstance) {
          try {
            const accounts = msalInstance.getAllAccounts();
            if (accounts.length > 0) {
              const silentRequest = {
                scopes: ['openid', 'profile', 'email'],
                account: accounts[0]
              };
              
              const response = await msalInstance.acquireTokenSilent(silentRequest);
              if (response && response.accessToken && config.headers) {
                config.headers.Authorization = `Bearer ${response.accessToken}`;
                return config;
              }
            }
          } catch (error) {
            console.error('Error getting token from MSAL:', error);
          }
        }
        
        // Fallback to localStorage token if MSAL fails
        const token = localStorage.getItem('auth_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
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
        // Clear token and redirect to login if needed
        localStorage.removeItem('auth_token');
        // You might want to redirect to login page or trigger auth refresh
      }
    } else if (error.request) {
      // Request was made but no response received
      apiError.message = 'No response received from server';
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

  // POST request
  public async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', url, data });
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
    // Simulate API call
    console.log('Submitting listing:', data);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return success response
    return {
      success: true,
      message: 'Listing submitted successfully',
      listingId: `listing-${Date.now()}`,
    };
  },
  
  // Get all listings
  getListings: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock data
    return [
      {
        id: '1',
        title: 'Modern 2 Bed Apartment',
        price: 2500,
        type: 'rent',
        bedrooms: 2,
        bathrooms: 1,
        isAvailableNow: true,
        location: {
          address: '123 Main St, Swiss Cottage',
          city: 'London',
          postcode: 'SW1A 1AA',
        },
        images: ['https://placehold.co/600x400'],
        features: ['Furnished', 'Parking', 'Gym', 'Pet Friendly'],
        description: 'Beautiful modern apartment in the heart of London.',
        agent: {
          name: 'John Smith',
          company: 'Proptii Agents',
          phone: '+44 20 7123 4567',
          email: 'john@proptii.com'
        },
      },
      // Add more mock listings as needed
    ];
  }
}; 