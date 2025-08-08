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
          store.createIndex('userId', 'userId', { unique: false });
          console.log('✅ IndexedDB store created');
        }
      };
    });
  }

  /**
   * Set data in IndexedDB
   */
  static async setItem(key: string, value: any): Promise<boolean> {
    try {
      await this.init();
      
      if (!this.db) {
        throw new Error('IndexedDB not initialized');
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      // Extract user ID from key (assuming format: userId_formData)
      const userId = key.split('_')[0];

      const data = {
        key: key,
        userId: userId,
        value: value,
        timestamp: Date.now()
      };

      const request = store.put(data);

      return new Promise((resolve) => {
        request.onsuccess = () => {
          console.log(`✅ Saved ${key} to IndexedDB`);
          resolve(true);
        };

        request.onerror = () => {
          console.error('Error saving to IndexedDB:', request.error);
          resolve(false);
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

      return new Promise((resolve) => {
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
          resolve(null);
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

      return new Promise((resolve) => {
        request.onsuccess = () => {
          console.log(`🗑️ Removed ${key} from IndexedDB`);
          resolve(true);
        };

        request.onerror = () => {
          console.error('Error removing from IndexedDB:', request.error);
          resolve(false);
        };
      });
    } catch (error) {
      console.error('Error in removeItem:', error);
      return false;
    }
  }

  /**
   * Clear all data for a specific user
   */
  static async clearUserData(userId: string): Promise<boolean> {
    try {
      await this.init();
      
      if (!this.db) {
        throw new Error('IndexedDB not initialized');
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('userId');
      const request = index.openCursor(IDBKeyRange.only(userId));

      return new Promise((resolve) => {
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            console.log(`🗑️ Cleared all data for user ${userId} from IndexedDB`);
            resolve(true);
          }
        };

        request.onerror = () => {
          console.error('Error clearing user data from IndexedDB:', request.error);
          resolve(false);
        };
      });
    } catch (error) {
      console.error('Error in clearUserData:', error);
      return false;
    }
  }

  /**
   * Get all keys for a specific user
   */
  static async getUserKeys(userId: string): Promise<string[]> {
    try {
      await this.init();
      
      if (!this.db) {
        throw new Error('IndexedDB not initialized');
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('userId');
      const request = index.openCursor(IDBKeyRange.only(userId));

      return new Promise((resolve) => {
        const keys: string[] = [];
        
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            keys.push(cursor.value.key);
            cursor.continue();
          } else {
            resolve(keys);
          }
        };

        request.onerror = () => {
          console.error('Error getting user keys from IndexedDB:', request.error);
          resolve([]);
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
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = () => reject(reader.error);
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
    const blob = new Blob([u8arr], { type: mime });
    return new File([blob], fileName, { type: fileType });
  }

  /**
   * Get database size information
   */
  static async getDatabaseInfo(): Promise<{ totalSize: number; userCount: number; keyCount: number }> {
    try {
      await this.init();
      
      if (!this.db) {
        throw new Error('IndexedDB not initialized');
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      return new Promise((resolve) => {
        request.onsuccess = () => {
          const data = request.result;
          const totalSize = JSON.stringify(data).length;
          const userIds = new Set(data.map(item => item.userId));
          
          resolve({
            totalSize,
            userCount: userIds.size,
            keyCount: data.length
          });
        };

        request.onerror = () => {
          console.error('Error getting database info:', request.error);
          resolve({ totalSize: 0, userCount: 0, keyCount: 0 });
        };
      });
    } catch (error) {
      console.error('Error in getDatabaseInfo:', error);
      return { totalSize: 0, userCount: 0, keyCount: 0 };
    }
  }
}
