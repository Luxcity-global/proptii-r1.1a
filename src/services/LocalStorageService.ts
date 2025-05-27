// Frontend version of LocalStorageService
export class LocalStorageService {
  private static instance: LocalStorageService;
  private readonly CACHE_PREFIX = 'proptii_cache_';
  private readonly CACHE_EXPIRY = 1000 * 60 * 60; // 1 hour
  private readonly SEARCH_CACHE_PREFIX = 'search_results_';
  private readonly SUGGESTIONS_CACHE_PREFIX = 'search_suggestions_';
  private readonly SEARCH_CACHE_LIMIT = 20;
  private readonly SUGGESTIONS_CACHE_LIMIT = 20;
  private readonly SEARCH_CACHE_EXPIRY = 1000 * 60 * 30; // 30 min
  private readonly SUGGESTIONS_CACHE_EXPIRY = 1000 * 60 * 10; // 10 min
  private readonly DEFAULT_SUGGESTIONS = [
    "2 bedroom flat in London",
    "Houses for rent in Manchester",
    "Student accommodation in Birmingham",
    "1 bedroom apartment with parking",
    "Pet-friendly rentals nearby",
    "Studio apartments in city center",
    "Family homes with garden",
    "Luxury apartments with amenities",
    "Affordable housing options",
    "Properties near transport links"
  ];

  private constructor() {}

  public static getInstance(): LocalStorageService {
    if (!LocalStorageService.instance) {
      LocalStorageService.instance = new LocalStorageService();
    }
    return LocalStorageService.instance;
  }

  public get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.CACHE_PREFIX + key);
      if (!item) return null;

      const { value, expiry } = JSON.parse(item);
      if (expiry && Date.now() > expiry) {
        this.remove(key);
        return null;
      }

      return value as T;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  public set<T>(key: string, value: T, expiryMs: number = this.CACHE_EXPIRY): void {
    try {
      const item = {
        value,
        expiry: Date.now() + expiryMs
      };
      localStorage.setItem(this.CACHE_PREFIX + key, JSON.stringify(item));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }

  public remove(key: string): void {
    try {
      localStorage.removeItem(this.CACHE_PREFIX + key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }

  public getDefaultSuggestions(): string[] {
    return this.DEFAULT_SUGGESTIONS;
  }

  public getCachedSearchResults(query: string): any[] | null {
    const cached = localStorage.getItem(this.SEARCH_CACHE_PREFIX + query);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > this.SEARCH_CACHE_EXPIRY) {
      localStorage.removeItem(this.SEARCH_CACHE_PREFIX + query);
      return null;
    }
    return data;
  }

  public cacheSearchResults(query: string, results: any[]): void {
    const cacheData = {
      data: results,
      timestamp: Date.now()
    };
    localStorage.setItem(this.SEARCH_CACHE_PREFIX + query, JSON.stringify(cacheData));
    // Enforce cache size limit
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.SEARCH_CACHE_PREFIX));
    if (keys.length > this.SEARCH_CACHE_LIMIT) {
      // Remove oldest
      const oldest = keys
        .map(k => ({ k, t: JSON.parse(localStorage.getItem(k) || '{}').timestamp || 0 }))
        .sort((a, b) => a.t - b.t)[0];
      if (oldest) localStorage.removeItem(oldest.k);
    }
  }

  public getCachedSuggestions(query: string): string[] | null {
    const cached = localStorage.getItem(this.SUGGESTIONS_CACHE_PREFIX + query);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > this.SUGGESTIONS_CACHE_EXPIRY) {
      localStorage.removeItem(this.SUGGESTIONS_CACHE_PREFIX + query);
      return null;
    }
    return data;
  }

  public cacheSuggestions(query: string, suggestions: string[]): void {
    const cacheData = {
      data: suggestions,
      timestamp: Date.now()
    };
    localStorage.setItem(this.SUGGESTIONS_CACHE_PREFIX + query, JSON.stringify(cacheData));
    // Enforce cache size limit
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.SUGGESTIONS_CACHE_PREFIX));
    if (keys.length > this.SUGGESTIONS_CACHE_LIMIT) {
      // Remove oldest
      const oldest = keys
        .map(k => ({ k, t: JSON.parse(localStorage.getItem(k) || '{}').timestamp || 0 }))
        .sort((a, b) => a.t - b.t)[0];
      if (oldest) localStorage.removeItem(oldest.k);
    }
  }

  public clearExpiredCache(): void {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          const item = localStorage.getItem(key);
          if (item) {
            const { expiry } = JSON.parse(item);
            if (expiry && Date.now() > expiry) {
              localStorage.removeItem(key);
            }
          }
        }
      });
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }
} 