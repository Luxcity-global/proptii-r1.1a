export class IndexedDBManager {
  private static readonly DB_NAME = 'ReferencingDB';
  private static readonly DB_VERSION = 1;
  private static readonly STORE_NAME = 'formData';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  private static db: IDBDatabase | null = null;

  /**
   * Initialize the IndexedDB database
   */
  static async init(): Promise<void> {
    if (this.db) {
      return; // Already initialized
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'key' });
          store.createIndex('key', 'key', { unique: true });
          console.log('✅ IndexedDB store created');
        }
      };
    });
  }

  /**
   * Save data to IndexedDB
   */
  static async setItem(key: string, value: any): Promise<boolean> {
    try {
      await this.init();
      
      if (!this.db) {
        throw new Error('IndexedDB not initialized');
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      const item = {
        key: key,
        value: value,
        timestamp: Date.now()
      };

      const request = store.put(item);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log(`✅ Saved ${key} to IndexedDB`);
          resolve(true);
        };

        request.onerror = () => {
          console.error('Error saving to IndexedDB:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error in setItem:', error);
      return false;
    }
  }

  /**
   * Get data from IndexedDB
   */
  static async getItem(key: string): Promise<any> {
    try {
      await this.init();
      
      if (!this.db) {
        throw new Error('IndexedDB not initialized');
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(key);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          if (request.result) {
            console.log(`📥 Retrieved ${key} from IndexedDB`);
            resolve(request.result.value);
          } else {
            console.log(`📭 No data found for ${key} in IndexedDB`);
            resolve(null);
          }
        };

        request.onerror = () => {
          console.error('Error reading from IndexedDB:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error in getItem:', error);
      return null;
    }
  }

  /**
   * Remove item from IndexedDB
   */
  static async removeItem(key: string): Promise<boolean> {
    try {
      await this.init();
      
      if (!this.db) {
        throw new Error('IndexedDB not initialized');
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(key);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log(`🗑️ Removed ${key} from IndexedDB`);
          resolve(true);
        };

        request.onerror = () => {
          console.error('Error removing from IndexedDB:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error in removeItem:', error);
      return false;
    }
  }

  /**
   * Clear all referencing data for a user
   */
  static async clearUserData(userId: string): Promise<void> {
    try {
      await this.init();
      
      if (!this.db) {
        throw new Error('IndexedDB not initialized');
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.openCursor();

      return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const key = cursor.key as string;
            if (key.startsWith(userId)) {
              cursor.delete();
              console.log(`🗑️ Removed user data: ${key}`);
            }
            cursor.continue();
          } else {
            console.log('✅ All user data cleared from IndexedDB');
            resolve();
          }
        };

        request.onerror = () => {
          console.error('Error clearing user data:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error in clearUserData:', error);
    }
  }

  /**
   * Get all keys for a user
   */
  static async getUserKeys(userId: string): Promise<string[]> {
    try {
      await this.init();
      
      if (!this.db) {
        throw new Error('IndexedDB not initialized');
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.openCursor();

      return new Promise((resolve, reject) => {
        const keys: string[] = [];

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const key = cursor.key as string;
            if (key.startsWith(userId)) {
              keys.push(key);
            }
            cursor.continue();
          } else {
            resolve(keys);
          }
        };

        request.onerror = () => {
          console.error('Error getting user keys:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error in getUserKeys:', error);
      return [];
    }
  }

  /**
   * Validate file size
   */
  static validateFileSize(file: File): boolean {
    return file.size <= this.MAX_FILE_SIZE;
  }

  /**
   * Convert file to base64
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Convert base64 to File object
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

  /**
   * Get database size information
   */
  static async getDatabaseInfo(): Promise<{ size: number; keys: string[] }> {
    try {
      await this.init();
      
      if (!this.db) {
        throw new Error('IndexedDB not initialized');
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const items = request.result;
          const keys = items.map(item => item.key);
          const size = JSON.stringify(items).length;
          resolve({ size, keys });
        };

        request.onerror = () => {
          console.error('Error getting database info:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error in getDatabaseInfo:', error);
      return { size: 0, keys: [] };
    }
  }
}
