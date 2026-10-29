import { firestoreService, UserFile } from './firestoreService';
import { uploadToFirebaseStorage, deleteFromFirebaseStorage } from './storageService';

export interface FileItem {
  id: number;
  name: string;
  category: string;
  type: string;
  size: number;
  uploadDate: string;
  url?: string;
  firestoreId?: string; // Store Firestore document ID for deletion
}

export interface FileUploadResult {
  success: boolean;
  file?: FileItem;
  error?: string;
}

export interface FileDeleteResult {
  success: boolean;
  error?: string;
}

class FileService {
  private files: FileItem[] = [];
  private nextId = 1;
  private currentUserId: string | null = null;

  constructor() {
    this.files = [];
    this.nextId = 1;
  }

  // Set current user ID for user-specific file management
  setCurrentUser(userId: string | null) {
    this.currentUserId = userId;
  }

  // Get all files (contract files + user-specific files from Firestore)
  async getFiles(): Promise<FileItem[]> {
    try {
      const contractFiles = [...this.files];
      
      if (this.currentUserId) {
        // Load user-specific files from database
        const result = await firestoreService.getUserFiles(this.currentUserId);
        if (result.success && result.files) {
          const userFiles: FileItem[] = result.files.map((firestoreFile: any, index: number) => ({
            id: parseInt(firestoreFile.id?.split('_')?.[1]) || (Date.now() + index),
            name: firestoreFile.name || firestoreFile.fileName || 'Untitled File',
            category: firestoreFile.category || firestoreFile.section || 'Identity',
            type: firestoreFile.type || firestoreFile.contentType || 'application/pdf',
            size: firestoreFile.size || 0,
            uploadDate: firestoreFile.uploadDate?.toDate
              ? firestoreFile.uploadDate.toDate().toLocaleDateString()
              : firestoreFile.createdAt?.toDate
                ? firestoreFile.createdAt.toDate().toLocaleDateString()
                : firestoreFile.uploadDate
                  ? new Date(firestoreFile.uploadDate).toLocaleDateString()
                  : firestoreFile.createdAt
                    ? new Date(firestoreFile.createdAt).toLocaleDateString()
                    : new Date().toLocaleDateString(),
            url: firestoreFile.url,
            firestoreId: firestoreFile.id,
          }));

          return [...contractFiles, ...userFiles];
        }
      }
      
      return contractFiles;
    } catch (error) {
      console.error('Error loading files:', error);
      return [...this.files];
    }
  }

  // Upload files — uploads binary directly to Cloud Storage and saves metadata to database
  async uploadFiles(
    files: File[], 
    category: string,
    onProgress?: (fileName: string, progress: number) => void
  ): Promise<FileUploadResult[]> {
    const results: FileUploadResult[] = [];

    for (const file of files) {
      try {
        if (onProgress) onProgress(file.name, 10);

        // 1. Pre-validation: enforce 25MB ceiling and block dangerous extensions
        if (file.size > 25 * 1024 * 1024) {
          throw new Error(`File "${file.name}" exceeds the maximum 25MB limit`);
        }
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const prohibitedExts = ['exe', 'dll', 'bat', 'cmd', 'sh', 'php', 'html', 'htm', 'js', 'vbs', 'msi', 'com', 'scr'];
        if (fileExt && prohibitedExts.includes(fileExt)) {
          throw new Error(`File type ".${fileExt}" is not allowed for security reasons`);
        }

        // 2. Upload binary directly to Cloud Storage
        const safeCategory = (category || 'general').replace(/[^a-zA-Z0-9_-]/g, '_');
        const targetFolder = `documents/${this.currentUserId || 'general'}/${safeCategory}`;

        const storageResult = await uploadToFirebaseStorage(
          file,
          targetFolder,
          (progress) => {
            if (onProgress) onProgress(file.name, Math.min(95, Math.max(10, progress.percentage)));
          }
        );

        if (!storageResult.success || !storageResult.url) {
          throw new Error(storageResult.error || `Failed to upload "${file.name}" to cloud storage`);
        }

        const uploadedUrl = storageResult.url;
        let fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        // 3. Save metadata to database with cloud storage URL
        if (this.currentUserId) {
          const fsRes = await firestoreService.saveUserFile(this.currentUserId, {
            name: file.name,
            category,
            type: file.type,
            size: file.size,
            url: uploadedUrl,
          });

          if (!fsRes.success) {
            throw new Error(fsRes.error || 'Failed to save file metadata to database');
          }

          if (fsRes.fileId) {
            fileId = fsRes.fileId;
          }
        }

        if (onProgress) onProgress(file.name, 100);

        const newFile: FileItem = {
          id: this.nextId++,
          name: file.name,
          category,
          type: file.type,
          size: file.size,
          uploadDate: new Date().toLocaleDateString(),
          url: uploadedUrl,
          firestoreId: fileId,
        };

        results.push({
          success: true,
          file: newFile,
        });
      } catch (error) {
        console.error(`[FileService] Failed to upload ${file.name}:`, error);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Upload failed',
        });
      }
    }

    return results;
  }

  // Delete file
  async deleteFile(fileId: number, firestoreId?: string, fileUrl?: string): Promise<FileDeleteResult> {
    try {
      // Check if it's a contract file (from local template files)
      const contractFileIndex = this.files.findIndex(f => f.id === fileId);
      if (contractFileIndex !== -1) {
        this.files.splice(contractFileIndex, 1);
        return { success: true };
      }

      // If it's a user file with Firestore ID, delete from database and storage
      if (this.currentUserId && firestoreId) {
        if (fileUrl) {
          deleteFromFirebaseStorage(fileUrl).catch(() => null);
        }
        const result = await firestoreService.deleteUserFile(this.currentUserId, firestoreId);
        if (result.success) {
          return { success: true };
        } else {
          return { 
            success: false, 
            error: result.error || 'Failed to delete file from database' 
          };
        }
      }

      return { success: false, error: 'File not found' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Delete failed' 
      };
    }
  }

  // Download file
  async downloadFile(file: FileItem): Promise<void> {
    try {
      if (!file.url) {
        throw new Error('File URL not available');
      }
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get file statistics
  getFileStats(files: FileItem[]) {
    const totalFiles = files.length;
    const referencingFiles = files.filter(f => f.category !== 'Contracts').length;
    const contractFiles = files.filter(f => f.category === 'Contracts').length;
    const totalSize = files.reduce((total, file) => total + file.size, 0);
    
    return {
      totalFiles,
      referencingFiles,
      contractFiles,
      totalSize
    };
  }

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const fileService = new FileService();
