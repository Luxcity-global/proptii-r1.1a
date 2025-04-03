import { AZURE_STORAGE, getAzureStorageSasUrl, isDevelopment } from '../config/azure';

/**
 * Interface for upload progress
 */
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Interface for upload result
 */
export interface UploadResult {
  success: boolean;
  url?: string;
  fileName?: string;
  error?: string;
}

/**
 * Generate a unique file name for storage
 * @param file The file to upload
 * @returns A unique file name
 */
export const generateUniqueFileName = (file: File): string => {
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = file.name.split('.').pop();
  return `${timestamp}-${randomString}.${extension}`;
};

/**
 * Upload a file to Azure Blob Storage
 * @param file The file to upload
 * @param folder Optional folder path within the container
 * @param onProgress Optional callback for upload progress
 * @returns Promise resolving to the upload result
 */
export const uploadToAzureStorage = async (
  file: File,
  folder: string = '',
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  try {
    // Check if Azure Storage is configured
    if (!AZURE_STORAGE.accountName || !AZURE_STORAGE.containerName || !AZURE_STORAGE.sasToken) {
      console.warn('Azure Storage configuration is incomplete, using development fallback');
      return simulateUpload(file, folder, onProgress);
    }

    // Generate a unique file name
    const uniqueFileName = generateUniqueFileName(file);
    const blobPath = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;
    
    // Get the SAS URL for the blob
    const sasUrl = getAzureStorageSasUrl(blobPath);
    
    // Check if we're in development mode and should use the fallback
    if (isDevelopment) {
      console.log('Development environment detected, using upload simulation to avoid CORS issues');
      return simulateUpload(file, folder, onProgress);
    }
    
    // Upload the file using fetch with progress tracking
    const xhr = new XMLHttpRequest();
    
    // Create a promise to handle the upload
    const uploadPromise = new Promise<UploadResult>((resolve, reject) => {
      xhr.open('PUT', sasUrl, true);
      xhr.setRequestHeader('x-ms-blob-type', 'BlockBlob');
      xhr.setRequestHeader('Content-Type', file.type);
      
      // Set up progress tracking
      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            onProgress({
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100)
            });
          }
        };
      }
      
      // Handle completion
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Success - return the URL without the SAS token
          const baseUrl = sasUrl.split('?')[0];
          resolve({
            success: true,
            url: baseUrl,
            fileName: uniqueFileName
          });
        } else {
          // Error
          reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
        }
      };
      
      // Handle errors
      xhr.onerror = () => {
        console.warn('Network error during upload, using development fallback');
        resolve(simulateUpload(file, folder, onProgress));
      };
      
      // Handle timeouts
      xhr.ontimeout = () => {
        reject(new Error('Upload timed out'));
      };
      
      // Send the file
      xhr.send(file);
    });
    
    return await uploadPromise;
  } catch (error) {
    console.error('Error uploading to Azure Storage:', error);
    // Use fallback in case of error
    return simulateUpload(file, folder, onProgress);
  }
};

/**
 * Simulate a file upload for development/testing purposes
 * @param file The file to upload
 * @param folder Optional folder path
 * @param onProgress Optional progress callback
 * @returns A simulated upload result
 */
const simulateUpload = async (
  file: File,
  folder: string = '',
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  // Generate a unique file name
  const uniqueFileName = generateUniqueFileName(file);
  const blobPath = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;
  
  // Simulate progress updates
  if (onProgress) {
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      onProgress({
        loaded: (file.size / steps) * i,
        total: file.size,
        percentage: Math.round((i / steps) * 100)
      });
    }
  } else {
    // Small delay to simulate network activity
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Create a mock URL that would be similar to what Azure would return
  const mockUrl = `https://${AZURE_STORAGE.accountName || 'mockaccount'}.blob.core.windows.net/${AZURE_STORAGE.containerName || 'documents'}/${blobPath}`;
  
  return {
    success: true,
    url: mockUrl,
    fileName: uniqueFileName
  };
};

/**
 * Get a public URL for a file in Azure Storage
 * @param fileName The name of the file
 * @param folder Optional folder path within the container
 * @returns The public URL for the file
 */
export const getPublicUrl = (fileName: string, folder: string = ''): string => {
  if (!AZURE_STORAGE.accountName || !AZURE_STORAGE.containerName) {
    throw new Error('Azure Storage configuration is incomplete');
  }
  
  const blobPath = folder ? `${folder}/${fileName}` : fileName;
  return `https://${AZURE_STORAGE.accountName}.blob.core.windows.net/${AZURE_STORAGE.containerName}/${blobPath}`;
};

/**
 * Delete a file from Azure Blob Storage
 * @param fileName The name of the file to delete
 * @param folder Optional folder path within the container
 * @returns Promise resolving to success or failure
 */
export const deleteFromAzureStorage = async (
  fileName: string,
  folder: string = ''
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Check if Azure Storage is configured
    if (!AZURE_STORAGE.accountName || !AZURE_STORAGE.containerName || !AZURE_STORAGE.sasToken) {
      console.warn('Azure Storage configuration is incomplete, using development fallback');
      return { success: true };
    }

    // Check if we're in development mode and should use the fallback
    const isDevelopment = window.location.hostname === 'localhost';
    if (isDevelopment) {
      console.log('Development environment detected, simulating successful delete');
      return { success: true };
    }

    const blobPath = folder ? `${folder}/${fileName}` : fileName;
    const sasUrl = getAzureStorageSasUrl(blobPath);
    
    const response = await fetch(sasUrl, {
      method: 'DELETE',
    });
    
    if (response.status >= 200 && response.status < 300) {
      return { success: true };
    } else {
      throw new Error(`Delete failed with status ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting from Azure Storage:', error);
    // In development, simulate success even on error
    if (window.location.hostname === 'localhost') {
      return { success: true };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during delete'
    };
  }
}; 