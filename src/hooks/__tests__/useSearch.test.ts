import { renderHook, act } from '@testing-library/react-hooks';
import { useSearch } from '../useSearch';
import { SearchService } from '../services/SearchService';
import { LocalStorageService } from '../../services/LocalStorageService';

// Mock SearchService
jest.mock('../../search/search.service');
const mockSearchService = SearchService as jest.MockedClass<typeof SearchService>;

// Mock LocalStorageService
jest.mock('../../services/LocalStorageService');
const mockLocalStorageService = LocalStorageService as jest.MockedClass<typeof LocalStorageService>;

describe('useSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock SearchService instance
    const mockSearchServiceInstance = {
      searchProperties: jest.fn(),
      getSuggestions: jest.fn()
    };
    mockSearchService.mockImplementation(() => mockSearchServiceInstance as any);

    // Mock LocalStorageService instance
    const mockLocalStorageInstance = {
      getCachedSearchResults: jest.fn(),
      getCachedSuggestions: jest.fn(),
      getDefaultSuggestions: jest.fn()
    };
    mockLocalStorageService.getInstance.mockReturnValue(mockLocalStorageInstance as any);
  });

  describe('getSuggestions', () => {
    it('should fetch suggestions from API', async () => {
      const mockSuggestions = ['suggestion 1', 'suggestion 2'];
      const mockSearchServiceInstance = mockSearchService.mock.results[0].value;
      mockSearchServiceInstance.getSuggestions.mockResolvedValueOnce(mockSuggestions);

      const { result } = renderHook(() => useSearch());

      let suggestions;
      await act(async () => {
        suggestions = await result.current.getSuggestions('test query');
      });

      expect(mockSearchServiceInstance.getSuggestions).toHaveBeenCalledWith('test query');
      expect(suggestions).toEqual(mockSuggestions);
    });

    it('should return cached suggestions when available', async () => {
      const mockCachedSuggestions = ['cached suggestion 1', 'cached suggestion 2'];
      const mockLocalStorageInstance = mockLocalStorageService.getInstance();
      mockLocalStorageInstance.getCachedSuggestions.mockReturnValueOnce(mockCachedSuggestions);

      const { result } = renderHook(() => useSearch());

      let suggestions;
      await act(async () => {
        suggestions = await result.current.getSuggestions('test query');
      });

      expect(mockLocalStorageInstance.getCachedSuggestions).toHaveBeenCalledWith('test query');
      expect(suggestions).toEqual(mockCachedSuggestions);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('API Error');
      const mockSearchServiceInstance = mockSearchService.mock.results[0].value;
      mockSearchServiceInstance.getSuggestions.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useSearch());

      await act(async () => {
        await expect(result.current.getSuggestions('test query')).rejects.toThrow('API Error');
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should return default suggestions for empty query', async () => {
      const mockDefaultSuggestions = ['default 1', 'default 2'];
      const mockLocalStorageInstance = mockLocalStorageService.getInstance();
      mockLocalStorageInstance.getDefaultSuggestions.mockReturnValueOnce(mockDefaultSuggestions);

      const { result } = renderHook(() => useSearch());

      let suggestions;
      await act(async () => {
        suggestions = await result.current.getSuggestions('');
      });

      expect(mockLocalStorageInstance.getDefaultSuggestions).toHaveBeenCalled();
      expect(suggestions).toEqual(mockDefaultSuggestions);
    });
  });

  describe('searchProperties', () => {
    it('should fetch search results from API', async () => {
      const mockResults = [
        { id: 1, title: 'Property 1' },
        { id: 2, title: 'Property 2' }
      ];
      const mockSearchServiceInstance = mockSearchService.mock.results[0].value;
      mockSearchServiceInstance.searchProperties.mockResolvedValueOnce(mockResults);

      const { result } = renderHook(() => useSearch());

      let searchResults;
      await act(async () => {
        searchResults = await result.current.searchProperties('test query');
      });

      expect(mockSearchServiceInstance.searchProperties).toHaveBeenCalledWith('test query');
      expect(searchResults).toEqual(mockResults);
    });

    it('should return cached results when available', async () => {
      const mockCachedResults = [{ id: 1, title: 'Cached Property' }];
      const mockLocalStorageInstance = mockLocalStorageService.getInstance();
      mockLocalStorageInstance.getCachedSearchResults.mockReturnValueOnce(mockCachedResults);

      const { result } = renderHook(() => useSearch());

      let searchResults;
      await act(async () => {
        searchResults = await result.current.searchProperties('test query');
      });

      expect(mockLocalStorageInstance.getCachedSearchResults).toHaveBeenCalledWith('test query');
      expect(searchResults).toEqual(mockCachedResults);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('API Error');
      const mockSearchServiceInstance = mockSearchService.mock.results[0].value;
      mockSearchServiceInstance.searchProperties.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useSearch());

      await act(async () => {
        await expect(result.current.searchProperties('test query')).rejects.toThrow('API Error');
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('offline mode', () => {
    it('should detect offline status', () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });

      const { result } = renderHook(() => useSearch());
      expect(result.current.isOffline).toBe(true);
    });

    it('should update offline status when connection changes', () => {
      // Start online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true
      });

      const { result } = renderHook(() => useSearch());
      expect(result.current.isOffline).toBe(false);

      // Go offline
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          value: false,
          writable: true
        });
        window.dispatchEvent(new Event('offline'));
      });

      expect(result.current.isOffline).toBe(true);
    });
  });
}); 