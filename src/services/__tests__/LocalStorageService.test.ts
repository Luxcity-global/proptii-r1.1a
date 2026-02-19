import { LocalStorageService } from '../LocalStorageService';

describe('LocalStorageService', () => {
  let service: LocalStorageService;
  const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });

    // Get service instance
    service = LocalStorageService.getInstance();
  });

  describe('getInstance', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = LocalStorageService.getInstance();
      const instance2 = LocalStorageService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('get', () => {
    it('should return null for non-existent key', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const result = service.get('non-existent');
      expect(result).toBeNull();
    });

    it('should return parsed value for valid key', () => {
      const testData = { value: 'test', expiry: Date.now() + 1000 };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testData));
      const result = service.get('test-key');
      expect(result).toBe('test');
    });

    it('should return null for expired item', () => {
      const testData = { value: 'test', expiry: Date.now() - 1000 };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testData));
      const result = service.get('expired-key');
      expect(result).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('set', () => {
    it('should store item with expiry', () => {
      const testValue = 'test-value';
      service.set('test-key', testValue);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      const storedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(storedData.value).toBe(testValue);
      expect(storedData.expiry).toBeGreaterThan(Date.now());
    });
  });

  describe('remove', () => {
    it('should remove item from storage', () => {
      service.remove('test-key');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('proptii_cache_test-key');
    });
  });

  describe('getDefaultSuggestions', () => {
    it('should return array of default suggestions', () => {
      const suggestions = service.getDefaultSuggestions();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(typeof suggestions[0]).toBe('string');
    });
  });

  describe('cacheSearchResults', () => {
    it('should cache search results', () => {
      const results = [{ id: 1, title: 'Test Property' }];
      service.cacheSearchResults('test query', results);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      const storedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(storedData.value).toEqual(results);
    });
  });

  describe('getCachedSearchResults', () => {
    it('should return cached search results', () => {
      const results = [{ id: 1, title: 'Test Property' }];
      const testData = { value: results, expiry: Date.now() + 1000 };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testData));
      const cachedResults = service.getCachedSearchResults('test query');
      expect(cachedResults).toEqual(results);
    });
  });

  describe('cacheSuggestions', () => {
    it('should cache suggestions', () => {
      const suggestions = ['suggestion 1', 'suggestion 2'];
      service.cacheSuggestions('test query', suggestions);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      const storedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(storedData.value).toEqual(suggestions);
    });
  });

  describe('getCachedSuggestions', () => {
    it('should return cached suggestions', () => {
      const suggestions = ['suggestion 1', 'suggestion 2'];
      const testData = { value: suggestions, expiry: Date.now() + 1000 };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testData));
      const cachedSuggestions = service.getCachedSuggestions('test query');
      expect(cachedSuggestions).toEqual(suggestions);
    });
  });

  describe('clearExpiredCache', () => {
    it('should remove expired items', () => {
      const expiredData = { value: 'test', expiry: Date.now() - 1000 };
      const validData = { value: 'test', expiry: Date.now() + 1000 };
      
      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(expiredData))
        .mockReturnValueOnce(JSON.stringify(validData));

      Object.defineProperty(window.localStorage, 'key', {
        value: (index: number) => index === 0 ? 'proptii_cache_expired' : 'proptii_cache_valid'
      });

      service.clearExpiredCache();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('proptii_cache_expired');
    });
  });
}); 