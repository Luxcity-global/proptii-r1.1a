import OpenAI from 'openai';
import { LocalStorageService } from '../../services/LocalStorageService';
import { OpenAISearchService } from '../OpenAISearchService';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    }))
  };
});

// Mock LocalStorageService
jest.mock('../../services/LocalStorageService');

describe('SearchService', () => {
  let searchService: OpenAISearchService;
  let mockOpenAI: jest.Mocked<OpenAI>;
  let mockLocalStorageService: jest.Mocked<LocalStorageService>;

  beforeEach(() => {
    // Setup mock OpenAI
    mockOpenAI = new OpenAI() as jest.Mocked<OpenAI>;
    
    // Setup mock LocalStorageService
    mockLocalStorageService = LocalStorageService.getInstance() as jest.Mocked<LocalStorageService>;
    mockLocalStorageService.getCachedSearchResults = jest.fn();
    mockLocalStorageService.cacheSearchResults = jest.fn();
    mockLocalStorageService.getCachedSuggestions = jest.fn();
    mockLocalStorageService.cacheSuggestions = jest.fn();

    searchService = new OpenAISearchService({
      endpoint: 'https://test-endpoint',
      apiKey: 'test-key',
      deploymentName: 'test-model'
    });
  });

  describe('searchProperties', () => {
    it('should return cached results if available', async () => {
      const cachedResults = [{ title: 'Cached Property' }];
      mockLocalStorageService.getCachedSearchResults.mockReturnValueOnce(cachedResults);

      const results = await searchService.searchProperties('test query');
      expect(results).toEqual(cachedResults);
      expect(mockLocalStorageService.getCachedSearchResults).toHaveBeenCalledWith('test query');
    });

    it('should fetch and cache new results if no cache available', async () => {
      const newResults = [{ title: 'New Property' }];
      mockLocalStorageService.getCachedSearchResults.mockReturnValueOnce(null);
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify(newResults)
          }
        }]
      } as any);

      const results = await searchService.searchProperties('test query');
      expect(results).toEqual(newResults);
      expect(mockLocalStorageService.cacheSearchResults).toHaveBeenCalledWith('test query', newResults);
    });
  });

  describe('getSuggestions', () => {
    it('should return cached suggestions if available', async () => {
      const cachedSuggestions = ['suggestion1', 'suggestion2'];
      mockLocalStorageService.getCachedSuggestions.mockReturnValueOnce(cachedSuggestions);

      const suggestions = await searchService.getSuggestions('test query');
      expect(suggestions).toEqual(cachedSuggestions);
      expect(mockLocalStorageService.getCachedSuggestions).toHaveBeenCalledWith('test query');
    });

    it('should fetch and cache new suggestions if no cache available', async () => {
      const newSuggestions = ['new suggestion1', 'new suggestion2'];
      mockLocalStorageService.getCachedSuggestions.mockReturnValueOnce(null);
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify(newSuggestions)
          }
        }]
      } as any);

      const suggestions = await searchService.getSuggestions('test query');
      expect(suggestions).toEqual(newSuggestions);
      expect(mockLocalStorageService.cacheSuggestions).toHaveBeenCalledWith('test query', newSuggestions);
    });
  });
}); 