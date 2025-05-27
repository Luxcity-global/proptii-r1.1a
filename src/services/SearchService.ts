import axios, { AxiosError, AxiosInstance } from 'axios';

interface SearchResponse {
  title: string;
  description: string;
}

interface Property {
  id: string;
  title: string;
  description: string;
  price: string;
  location: string;
  images: string[];
  source: string;
  url: string;
}

export class SearchService {
  private static instance: SearchService;
  private axiosInstance: AxiosInstance;

  private constructor() {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    // Add response interceptor for better error handling
    this.axiosInstance.interceptors.response.use(
      response => response,
      error => {
        console.error('API Error:', error);
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

  private async ensureBackendRunning(): Promise<void> {
    try {
      const response = await this.axiosInstance.get('/health');
      if (!response.data?.status === 'ok') {
        throw new Error('Backend health check failed');
      }
    } catch (error) {
      console.error('Backend health check failed:', error);
      throw new Error('Search service is not available');
    }
  }

  private handleError(error: AxiosError): never {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new Error(error.response.data?.message || 'Search request failed');
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response from search service');
    } else {
      // Something happened in setting up the request
      throw new Error('Failed to make search request');
    }
  }

  private transformSearchResult(data: any[]): Property[] {
    if (!Array.isArray(data)) {
      console.warn('Search result is not an array:', data);
      return [];
    }

    return data.map(item => ({
      id: item.id || Math.random().toString(36).substr(2, 9),
      title: item.title || '',
      description: item.description || '',
      price: item.price || '',
      location: item.location || '',
      images: Array.isArray(item.images) ? item.images : [],
      source: item.source || '',
      url: item.url || ''
    }));
  }

  public async searchProperties(query: string): Promise<Property[]> {
    if (!query?.trim()) {
      return [];
    }

    try {
      await this.ensureBackendRunning();
      console.log('Searching properties with query:', query);
      
      const response = await this.axiosInstance.post<SearchResponse[]>(
        '/search',
        {
          query,
          type: 'properties'
        }
      );

      return this.transformSearchResult(response.data);
    } catch (error) {
      console.error('Error during property search:', error);
      throw this.handleError(error as AxiosError);
    }
  }

  public async getSuggestions(query: string): Promise<string[]> {
    if (!query?.trim()) {
      return [];
    }

    try {
      await this.ensureBackendRunning();
      console.log('Getting suggestions for query:', query);
      
      const response = await this.axiosInstance.post<string[]>(
        '/search/suggestions',
        {
          query,
          type: 'suggestions'
        }
      );

      if (!Array.isArray(response.data)) {
        console.warn('Suggestions response is not an array:', response.data);
        return [];
      }

      return response.data;
    } catch (error) {
      console.error('Error getting suggestions:', error);
      throw this.handleError(error as AxiosError);
    }
  }
} 