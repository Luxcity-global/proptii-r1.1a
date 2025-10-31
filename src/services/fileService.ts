import { uploadToAzureStorage } from './storageService';
import { firestoreService, UserFile } from './firestoreService';

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

  // Initialize with only contract file
  constructor() {
    this.files = [
      {
        id: 11,
        name: 'Tenancy_Agreement Signed.pdf',
        category: 'Contracts',
        type: 'application/pdf',
        size: 5.2 * 1024,
        uploadDate: '01/05/2024',
        url: '/files/tenancy-agreement-signed.pdf'
      }
    ];
    this.nextId = 12;
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
        // Load user-specific files from Firestore
        const result = await firestoreService.getUserFiles(this.currentUserId);
        if (result.success && result.files) {
          const userFiles: FileItem[] = result.files.map((firestoreFile: UserFile) => ({
            id: parseInt(firestoreFile.id.split('_')[2]) || Date.now(),
            name: firestoreFile.name,
            category: firestoreFile.category,
            type: firestoreFile.type,
            size: firestoreFile.size,
            uploadDate: firestoreFile.uploadDate.toDate().toLocaleDateString(),
            url: firestoreFile.url,
            firestoreId: firestoreFile.id // Store the Firestore document ID
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

  // Upload files
  async uploadFiles(
    files: File[], 
    category: string,
    onProgress?: (fileName: string, progress: number) => void
  ): Promise<FileUploadResult[]> {
    const results: FileUploadResult[] = [];
    
    for (const file of files) {
      try {
        // Simulate upload progress
        if (onProgress) {
          for (let i = 0; i <= 100; i += 10) {
            onProgress(file.name, i);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        // Upload to Azure Storage (or simulate in development)
        const uploadResult = await uploadToAzureStorage(
          file,
          `files/${category.toLowerCase()}`,
          (progress) => {
            if (onProgress) {
              onProgress(file.name, progress.percentage);
            }
          }
        );

        if (uploadResult.success && uploadResult.url) {
          // Save to Firestore if user is logged in
          if (this.currentUserId) {
            const firestoreResult = await firestoreService.saveUserFile(this.currentUserId, {
              name: file.name,
              category,
              type: file.type,
              size: file.size,
              url: uploadResult.url
            });

            if (firestoreResult.success) {
              const newFile: FileItem = {
                id: this.nextId++,
                name: file.name,
                category,
                type: file.type,
                size: file.size,
                uploadDate: new Date().toLocaleDateString(),
                url: uploadResult.url,
                firestoreId: firestoreResult.fileId // Store the Firestore document ID
              };

              results.push({ success: true, file: newFile });
            } else {
              results.push({ 
                success: false, 
                error: firestoreResult.error || 'Failed to save file to database' 
              });
            }
          } else {
            // Fallback to local storage if no user
            const newFile: FileItem = {
              id: this.nextId++,
              name: file.name,
              category,
              type: file.type,
              size: file.size,
              uploadDate: new Date().toLocaleDateString(),
              url: uploadResult.url
            };

            this.files.push(newFile);
            results.push({ success: true, file: newFile });
          }
        } else {
          results.push({ 
            success: false, 
            error: uploadResult.error || 'Upload failed' 
          });
        }
      } catch (error) {
        results.push({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Upload failed' 
        });
      }
    }

    return results;
  }

  // Delete file
  async deleteFile(fileId: number, firestoreId?: string): Promise<FileDeleteResult> {
    try {
      // Check if it's a contract file (from local files)
      const contractFileIndex = this.files.findIndex(f => f.id === fileId);
      if (contractFileIndex !== -1) {
        this.files.splice(contractFileIndex, 1);
        return { success: true };
      }

      // If it's a user file with Firestore ID, delete from Firestore
      if (this.currentUserId && firestoreId) {
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

      // Handle legacy files (uploaded before Firestore implementation)
      if (this.currentUserId && !firestoreId) {
        // For legacy files, we'll just remove them from the UI
        // They weren't stored in Firestore anyway, so this is safe
        console.log('Deleting legacy file (no Firestore ID)');
        return { success: true };
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
      if (file.url) {
        // Check if it's a data URL (base64) or a regular URL
        if (file.url.startsWith('data:')) {
          // Handle data URLs (base64 encoded files)
          const link = document.createElement('a');
          link.href = file.url;
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else if (file.url.startsWith('http://') || file.url.startsWith('https://')) {
          // Handle regular URLs
          const link = document.createElement('a');
          link.href = file.url;
          link.download = file.name;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          // Handle relative URLs or mock URLs
          console.warn('Mock URL detected, creating a placeholder download');
          // Create a simple text file as a placeholder
          const blob = new Blob([`This is a placeholder for ${file.name}\n\nFile details:\n- Name: ${file.name}\n- Type: ${file.type}\n- Size: ${file.size} bytes\n- Category: ${file.category}\n- Upload Date: ${file.uploadDate}\n\nNote: This is a demo file. In a real application, this would be the actual file content.`], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = file.name.replace(/\.[^/.]+$/, '') + '_demo.txt';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      } else {
        throw new Error('File URL not available');
      }
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
