import axios from 'axios';
import { LocalStorageService } from '../services/LocalStorageService';

export class OpenAISearchService {
  private endpoint: string;
  private apiKey: string;
  private deploymentName: string;
  private localStorageService: LocalStorageService;

  constructor(config: {
    endpoint: string;
    apiKey: string;
    deploymentName: string;
  }) {
    this.endpoint = config.endpoint;
    this.apiKey = config.apiKey;
    this.deploymentName = config.deploymentName;
    this.localStorageService = LocalStorageService.getInstance();
  }

  private getApiUrl() {
    return `${this.endpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=2024-02-15-preview`;
  }

  async searchProperties(query: string) {
    try {
      // Check cache first
      const cachedResults = this.localStorageService.getCachedSearchResults(query);
      if (cachedResults) {
        return cachedResults;
      }

      const response = await axios.post(
        this.getApiUrl(),
        {
        messages: [
          {
              role: 'system',
              content: 'You are a property search assistant. Return results as a JSON array of property objects.'
          },
          {
              role: 'user',
            content: query
          }
        ],
        max_tokens: 150
        },
        {
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices?.[0]?.message?.content;
      if (!content) throw new Error('No response content received');
      const results = JSON.parse(content);
      
      // Cache the results
      this.localStorageService.cacheSearchResults(query, results);
      
      return results;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  async getSuggestions(query: string) {
    try {
      // Check cache first
      const cachedSuggestions = this.localStorageService.getCachedSuggestions(query);
      if (cachedSuggestions) {
        return cachedSuggestions;
      }

      const response = await axios.post(
        this.getApiUrl(),
        {
        messages: [
          {
              role: 'system',
              content: 'You are a property search suggestion assistant. Return results as a JSON array of suggestion strings.'
          },
          {
              role: 'user',
            content: query
          }
        ],
        max_tokens: 50
        },
        {
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices?.[0]?.message?.content;
      if (!content) throw new Error('No response content received');
      const suggestions = JSON.parse(content);
      
      // Cache the suggestions
      this.localStorageService.cacheSuggestions(query, suggestions);
      
      return suggestions;
    } catch (error) {
      console.error('Suggestions error:', error);
      throw error;
    }
  }
} 