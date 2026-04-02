import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SearchService } from './search.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SearchService', () => {
  let service: SearchService;
  let configService: ConfigService;

  const mockEnv = {
    AZURE_OPENAI_ENDPOINT: 'https://test.openai.azure.com',
    AZURE_OPENAI_API_KEY: 'test-api-key',
    AZURE_OPENAI_DEPLOYMENT_NAME: 'gpt-4o',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => mockEnv[key as keyof typeof mockEnv],
          },
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchProperties', () => {
    it('should return properties from Azure OpenAI on success', async () => {
      const mockProperties = [
        { title: '2 Bed Flat in Islington', price: '£2000/month', location: 'Islington', bedrooms: 2, propertyType: 'Flat' },
      ];

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: JSON.stringify(mockProperties) } }],
        },
      });

      const results = await service.searchProperties('2 bed flat in Islington');
      expect(results).toEqual(mockProperties);
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });

    it('should return mock results (with source:mock) when OpenAI is not configured', async () => {
      // Temporarily unset env config
      const unconfiguredService = new SearchService({
        get: (_key: string) => undefined,
      } as unknown as ConfigService);

      // In test env (NODE_ENV=test), getMockSearchResults should return mock data
      const results = await unconfiguredService.searchProperties('studio in Leeds');
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      // All mock results must carry source:'mock'
      results.forEach((r: any) => expect(r.source).toBe('mock'));
    });

    it('should throw when OpenAI returns 429 rate limit', async () => {
      mockedAxios.post.mockRejectedValueOnce(
        Object.assign(new Error('Rate limit'), { response: { status: 429 } })
      );

      await expect(service.searchProperties('test')).rejects.toThrow('Rate limit exceeded');
    });

    it('should throw when OpenAI returns 401 authentication error', async () => {
      mockedAxios.post.mockRejectedValueOnce(
        Object.assign(new Error('Unauthorized'), { response: { status: 401 } })
      );

      await expect(service.searchProperties('test')).rejects.toThrow('Authentication failed');
    });

    it('should handle malformed JSON from OpenAI gracefully', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: 'completely invalid json {{{{' } }],
        },
      });

      // The service normalizes unexpected/parsing failures to a user-friendly message.
      await expect(service.searchProperties('test')).rejects.toThrow('Failed to process search query');
    });
  });

  describe('getSuggestions', () => {
    it('should return an array of suggestion strings', async () => {
      const mockSuggestions = ['2 bed flat in Islington', '3 bed house in Camden'];

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: JSON.stringify(mockSuggestions) } }],
        },
      });

      const results = await service.getSuggestions('flat in');
      expect(results).toEqual(mockSuggestions);
    });

    it('should return empty array when OpenAI returns no content', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { choices: [{ message: { content: null } }] },
      });

      const results = await service.getSuggestions('test');
      expect(results).toEqual([]);
    });
  });
});
