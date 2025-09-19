// Simple and reliable storage manager for referencing form data
export class StorageManager {
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly STORAGE_PREFIX = 'referencing_';

  /**
   * Save data to localStorage with proper error handling
   */
  static setItem(key: string, value: any): boolean {
    try {
      const fullKey = `${this.STORAGE_PREFIX}${key}`;
      const serializedValue = JSON.stringify(value);
      
      // Check if data is too large
      if (serializedValue.length > 5 * 1024 * 1024) { // 5MB limit
        console.warn('Data too large for localStorage, attempting to save essential data only');
        return this.setEssentialData(key, value);
      }
      
      localStorage.setItem(fullKey, serializedValue);
      console.log(`✅ Saved ${key} to localStorage`);
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }

  /**
   * Get data from localStorage with proper error handling
   */
  static getItem(key: string): any {
    try {
      const fullKey = `${this.STORAGE_PREFIX}${key}`;
      const item = localStorage.getItem(fullKey);
      
      if (item === null) {
        return null;
      }
      
      return JSON.parse(item);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  /**
   * Remove item from localStorage
   */
  static removeItem(key: string): boolean {
    try {
      const fullKey = `${this.STORAGE_PREFIX}${key}`;
      localStorage.removeItem(fullKey);
      console.log(`🗑️ Removed ${key} from localStorage`);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }

  /**
   * Save only essential data (without file content) when storage is limited
   */
  private static setEssentialData(key: string, value: any): boolean {
    try {
      const essentialData = this.extractEssentialData(value);
      const fullKey = `${this.STORAGE_PREFIX}${key}`;
      localStorage.setItem(fullKey, JSON.stringify(essentialData));
      console.log(`⚠️ Saved essential data for ${key} (files removed due to size)`);
      return true;
    } catch (error) {
      console.error('Error saving essential data:', error);
      return false;
    }
  }

  /**
   * Extract essential data by removing file content but keeping metadata
   */
  private static extractEssentialData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.extractEssentialData(item));
    }

    const essentialData: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object' && 'dataUrl' in value) {
        // This is a file object - keep only metadata
        const fileObj = value as any;
        essentialData[key] = {
          name: fileObj.name,
          type: fileObj.type,
          size: fileObj.size,
          lastModified: fileObj.lastModified,
          // Don't include dataUrl to save space
        };
      } else if (value && typeof value === 'object') {
        // Recursively process nested objects
        essentialData[key] = this.extractEssentialData(value);
      } else {
        // Keep primitive values as-is
        essentialData[key] = value;
      }
    }

    return essentialData;
  }

  /**
   * Clear all referencing data for a specific user
   */
  static clearReferencingData(userId: string): void {
    try {
      const keys = Object.keys(localStorage);
      const referencingKeys = keys.filter(key => 
        key.startsWith(`${this.STORAGE_PREFIX}${userId}_`)
      );

      referencingKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Cleared ${key}`);
      });

      console.log(`✅ Cleared ${referencingKeys.length} referencing items for user ${userId}`);
    } catch (error) {
      console.error('Error clearing referencing data:', error);
    }
  }

  /**
   * Check if a file is within size limits
   */
  static validateFileSize(file: File): boolean {
    if (file.size > this.MAX_FILE_SIZE) {
      console.warn(`File ${file.name} is too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max: 5MB)`);
      return false;
    }
    return true;
  }

  /**
   * Convert file to base64 for storage
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.validateFileSize(file)) {
        reject(new Error('File too large'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Convert base64 back to File object
   */
  static base64ToFile(base64: string, fileName: string, fileType: string): File {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || fileType;
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], fileName, { type: mime });
  }
}
