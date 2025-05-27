import axios, { AxiosError, AxiosInstance } from 'axios';
import { OpenAISearchService } from '../search/search.service';
import { LocalStorageService } from './LocalStorageService';
import {
  buildZooplaUrl,
  buildOpenRentUrl
  // buildOnTheMarketUrl,
  // buildRightmoveUrl
} from '../utils/siteSearchMappings';

interface SearchResponse {
  title: string;
  description: string;
}

interface Property {
  title: string;
  description: string;
  location: string;
  price: string;
  beds: number;
  propertyTypes: string[];
  site: 'rightmove' | 'zoopla' | 'openrent' | 'onthemarket';
  searchUrl: string;
}

export class SearchService {
  private static instance: SearchService;
  private axiosInstance: AxiosInstance;
  private openAIService: OpenAISearchService;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: 'http://localhost:3000',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Initialize OpenAI service
    this.openAIService = new OpenAISearchService({
      endpoint: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT,
      apiKey: import.meta.env.VITE_AZURE_OPENAI_API_KEY,
      deploymentName: import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME
    });

    // Add response interceptor for retries
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;
        
        // If no config or retry count not set, initialize it
        if (!config || !config.retryCount) {
          config.retryCount = 0;
        }

        // Check if we should retry
        if (config.retryCount < this.MAX_RETRIES) {
          config.retryCount += 1;
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * config.retryCount));
          
          // Retry the request
          return this.axiosInstance(config);
        }

        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  private transformSearchResult(apiResponse: SearchResponse[]): Property[] {
    // Only use Zoopla and OpenRent as sources
    const results = [...apiResponse];
    while (results.length < 2) {
      results.push(...apiResponse);
    }
    // Take exactly 2 results
    const twoResults = results.slice(0, 2);
    // Only use zoopla and openrent
    const sites: Property['site'][] = ['zoopla', 'openrent'];
    return twoResults.map((item, index) => {
      // Extract location and price from title
      const locationMatch = item.title.match(/in\s+([^,]+)/i);
      const priceMatch = item.description.match(/£[\d,]+(\s*pcm)?/i);
      const bedroomMatch = item.title.match(/(\d+)[\s-]bed/i);
      const location = locationMatch?.[1] || 'Unknown Location';
      const price = priceMatch?.[0] || 'Price on Application';
      const beds = bedroomMatch ? parseInt(bedroomMatch[1]) : 1;
      // Determine property type from description
      const propertyTypes = [];
      if (item.title.toLowerCase().includes('flat') || item.title.toLowerCase().includes('apartment')) {
        propertyTypes.push('Flats', 'Apartments');
      } else if (item.title.toLowerCase().includes('house')) {
        propertyTypes.push('Houses');
      } else {
        propertyTypes.push('Properties');
      }
      // Only zoopla and openrent
      const site = sites[index % sites.length];
      const searchUrl = this.generateSearchUrl(site, location, price);
      return {
        title: item.title,
        description: item.description,
        location,
        price,
        beds,
        propertyTypes,
        site,
        searchUrl
      };
    });
  }

  private generateSearchUrl(site: Property['site'], location: string, price: string): string {
    // Parse price and build a filter object
    const priceValue = price.match(/\d+/g)?.[0] ? parseInt(price.match(/\d+/g)?.[0] || '2000', 10) : 2000;
    const params = {
      location,
      beds: undefined, // Could be extracted from context if needed
      priceRange: [0, priceValue],
      type: undefined,
      petFriendly: undefined,
      furnished: undefined
    };
    try {
      switch (site) {
        case 'rightmove':
          return buildRightmoveUrl(params);
        case 'zoopla':
          return buildZooplaUrl(params);
        case 'openrent':
          return buildOpenRentUrl(params);
        case 'onthemarket':
          return buildOnTheMarketUrl(params);
        default:
          return '#';
      }
    } catch (err) {
      console.error(`Error building URL for ${site}:`, err, params);
      return '#';
    }
  }

  private async ensureBackendRunning(): Promise<void> {
    let retries = 0;
    while (retries < this.MAX_RETRIES) {
      try {
        const isHealthy = await this.checkBackendHealth();
        if (isHealthy) {
          return;
        }
      } catch (error) {
        console.warn(`Backend health check attempt ${retries + 1} failed:`, error);
      }
      retries++;
      if (retries < this.MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * retries));
      }
    }
    throw new Error(
      'Backend service is not running. Please start the backend server using: npm run start:backend'
    );
  }

  public async searchProperties(query: string): Promise<Property[]> {
    try {
      // First try the backend
      try {
        await this.ensureBackendRunning();
        const response = await this.axiosInstance.post<SearchResponse[]>(
          '/search',
          {
            query,
            type: 'properties'
          }
        );

        if (response.data && Array.isArray(response.data)) {
          return this.transformSearchResult(response.data);
        }
      } catch (backendError) {
        console.warn('Backend search failed, falling back to OpenAI:', backendError);
      }

      // Fallback to OpenAI direct search
      const openAIResults = await this.openAIService.searchProperties(query);
      return this.transformSearchResult(openAIResults);
    } catch (error) {
      console.error('Error during property search:', error);
      let message = 'An unexpected error occurred during property search.';
      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          message = 'Search endpoint not found. Please check if the backend is running.';
        } else if (error.response?.status === 429) {
          message = 'Too many requests. Please try again in a moment.';
        } else if (error.response?.data?.error) {
          message = error.response.data.error;
        }
      } else if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }
      throw message;
    }
  }

  public async getSuggestions(query: string): Promise<string[]> {
    try {
      await this.ensureBackendRunning();
      const response = await this.axiosInstance.post<string[]>(
        '/search/suggestions',
        { query }
      );
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      let message = 'An unexpected error occurred while fetching suggestions.';
      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          message = 'Suggestions endpoint not found. Please check if the backend is running.';
        } else if (error.response?.status === 429) {
          message = 'Too many requests. Please try again in a moment.';
        } else if (error.response?.data?.error) {
          message = error.response.data.error;
        }
      } else if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }
      throw message;
    }
  }

  private async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
} 