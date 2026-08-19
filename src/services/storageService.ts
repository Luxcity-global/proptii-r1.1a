import { storage } from '../config/firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

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
          resolve({
            success: false,
            error: error.message || 'Upload to Firebase Storage failed',
          });
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
            console.error('Failed to get Firebase Storage download URL:', err);
            resolve({
              success: false,
              error: err?.message || 'Failed to retrieve download URL',
            });
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

// Aliases — Route all storage operations directly through Firebase Storage
export const uploadToStorage = uploadToFirebaseStorage;
export const uploadToAzureStorage = uploadToFirebaseStorage;
export const deleteFromAzureStorage = deleteFromFirebaseStorage;
export const deleteFromStorage = deleteFromFirebaseStorage;

export default {
  uploadToFirebaseStorage,
  uploadToStorage,
  uploadToAzureStorage,
  deleteFromFirebaseStorage,
  deleteFromAzureStorage,
  deleteFromStorage,
  generateUniqueFileName,
};