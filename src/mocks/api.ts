import { ApiResponse, FileUploadResponse } from '../services/api';

// Mock data storage
const mockStorage: Record<string, any> = {
  applications: {}
};

// Initialize a test application
export const initializeMockApplication = (applicationId: string) => {
  if (!mockStorage.applications[applicationId]) {
    mockStorage.applications[applicationId] = {
      id: applicationId,
      status: 'draft',
      identity: {},
      employment: {},
      residential: {},
      financial: {},
      guarantor: {},
      creditCheck: {},
      documents: {
        identity: [],
        employment: [],
        residential: [],
        financial: []
      }
    };
  }
  return mockStorage.applications[applicationId];
};

// Mock API implementations
export const mockSaveSectionData = async (
  applicationId: string,
  section: string,
  data: Record<string, any>
): Promise<ApiResponse<any>> => {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Initialize application if it doesn't exist
    if (!mockStorage.applications[applicationId]) {
      initializeMockApplication(applicationId);
    }
    
    // Save section data
    mockStorage.applications[applicationId][section] = {
      ...mockStorage.applications[applicationId][section],
      ...data
    };
    
    return { success: true, data: mockStorage.applications[applicationId] };
  } catch (error: any) {
    console.error('Mock API Error:', error);
    return {
      success: false,
      error: 'Failed to save section data'
    };
  }
};

export const mockUploadDocument = async (
  applicationId: string,
  section: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<ApiResponse<FileUploadResponse>> => {
  try {
    // Initialize application if it doesn't exist
    if (!mockStorage.applications[applicationId]) {
      initializeMockApplication(applicationId);
    }
    
    // Simulate upload progress
    if (onProgress) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        onProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
        }
      }, 200);
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create mock file response
    const fileResponse: FileUploadResponse = {
      fileUrl: `https://mock-storage.example.com/${applicationId}/${section}/${file.name}`,
      fileName: file.name
    };
    
    // Save document reference
    mockStorage.applications[applicationId].documents[section].push(fileResponse);
    
    return { success: true, data: fileResponse };
  } catch (error: any) {
    console.error('Mock API Error:', error);
    return {
      success: false,
      error: 'Failed to upload document'
    };
  }
};

export const mockSubmitApplication = async (applicationId: string): Promise<ApiResponse<any>> => {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Initialize application if it doesn't exist
    if (!mockStorage.applications[applicationId]) {
      initializeMockApplication(applicationId);
    }
    
    // Update application status
    mockStorage.applications[applicationId].status = 'submitted';
    mockStorage.applications[applicationId].submittedAt = new Date().toISOString();
    
    return { success: true, data: mockStorage.applications[applicationId] };
  } catch (error: any) {
    console.error('Mock API Error:', error);
    return {
      success: false,
      error: 'Failed to submit application'
    };
  }
};

export const mockGetApplicationById = async (applicationId: string): Promise<ApiResponse<any>> => {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Initialize application if it doesn't exist
    if (!mockStorage.applications[applicationId]) {
      initializeMockApplication(applicationId);
    }
    
    return { success: true, data: mockStorage.applications[applicationId] };
  } catch (error: any) {
    console.error('Mock API Error:', error);
    return {
      success: false,
      error: 'Failed to fetch application'
    };
  }
};

export const mockGetDocuments = async (applicationId: string, section?: string): Promise<ApiResponse<any>> => {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Initialize application if it doesn't exist
    if (!mockStorage.applications[applicationId]) {
      initializeMockApplication(applicationId);
    }
    
    if (section) {
      return { 
        success: true, 
        data: mockStorage.applications[applicationId].documents[section] || [] 
      };
    }
    
    return { 
      success: true, 
      data: mockStorage.applications[applicationId].documents 
    };
  } catch (error: any) {
    console.error('Mock API Error:', error);
    return {
      success: false,
      error: 'Failed to fetch documents'
    };
  }
};

export const mockDeleteDocument = async (documentId: string): Promise<ApiResponse<any>> => {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In a real implementation, we would find and delete the document
    // For mock purposes, we'll just return success
    
    return { success: true, data: { id: documentId, deleted: true } };
  } catch (error: any) {
    console.error('Mock API Error:', error);
    return {
      success: false,
      error: 'Failed to delete document'
    };
  }
}; 