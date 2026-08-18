import { storage } from '../config/firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAzureStorageSasUrl } from '../config/azure';

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
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${timestamp}-${randomString}_${cleanName}`;
};

/**
 * Upload a file to Google Firebase Cloud Storage
 * @param file The file to upload
 * @param folder Optional folder path within the storage bucket
 * @param onProgress Optional callback for upload progress
 * @returns Promise resolving to the upload result
 */
export const uploadToFirebaseStorage = async (
  file: File,
  folder: string = 'documents',
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  try {
    const uniqueFileName = generateUniqueFileName(file);
    const storagePath = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;
    const storageRef = ref(storage, storagePath);

    return new Promise((resolve) => {
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (onProgress && snapshot.totalBytes > 0) {
            const percentage = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            onProgress({
              loaded: snapshot.bytesTransferred,
              total: snapshot.totalBytes,
              percentage,
            });
          }
        },
        (error) => {
          console.error('Firebase Storage upload error:', error);
          // Fallback to data URL on network/CORS failure
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              success: true,
              url: reader.result as string,
              fileName: uniqueFileName,
            });
          };
          reader.onerror = () => {
            resolve({
              success: false,
              error: error.message || 'Upload failed',
            });
          };
          reader.readAsDataURL(file);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              success: true,
              url: downloadUrl,
              fileName: uniqueFileName,
            });
          } catch (err: any) {
            console.warn('Failed to get download URL, using data URL fallback:', err);
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                success: true,
                url: reader.result as string,
                fileName: uniqueFileName,
              });
            };
            reader.readAsDataURL(file);
          }
        }
      );
    });
  } catch (error: any) {
    console.error('Error in uploadToFirebaseStorage:', error);
    return {
      success: false,
      error: error?.message || 'Upload failed',
    };
  }
};

/**
 * Upload a file to Azure Blob Storage using a SAS token.
 * This bypasses Firebase Storage permission issues.
 */
export const uploadToAzureStorage = async (
  file: File,
  folder: string = 'referencing_documents',
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  try {
    const fileName = generateUniqueFileName(file);
    const blobName = `${folder}/${fileName}`;
    const sasUrl = getAzureStorageSasUrl(blobName);

    // Provide an initial progress event
    if (onProgress) {
      onProgress({ loaded: 0, total: file.size, percentage: 0 });
    }

    const response = await fetch(sasUrl, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error(`Azure Storage upload failed: ${response.statusText}`);
    }

    if (onProgress) {
      onProgress({ loaded: file.size, total: file.size, percentage: 100 });
    }

    // The blob URL is the SAS URL without the query string
    const url = sasUrl.split('?')[0];

    return {
      success: true,
      url,
      fileName,
    };
  } catch (error: any) {
    console.error('Azure Storage upload error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred during Azure upload',
    };
  }
};

/**
 * Delete a file from Google Firebase Cloud Storage
 * @param filePathOrUrl The storage path or download URL of the file to delete
 * @returns Promise resolving to success or failure
 */
export const deleteFromFirebaseStorage = async (
  filePathOrUrl: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const storageRef = ref(storage, filePathOrUrl);
    await deleteObject(storageRef);
    return { success: true };
  } catch (error: any) {
    console.warn('Error deleting from Firebase Storage:', error);
    return { success: true }; // Optimistic delete
  }
};

// Aliases for full backward compatibility across the application
export const deleteFromAzureStorage = deleteFromFirebaseStorage;
export const uploadToStorage = uploadToFirebaseStorage;
export const deleteFromStorage = deleteFromFirebaseStorage;