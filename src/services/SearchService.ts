import axios, { AxiosError, AxiosInstance } from 'axios';

interface SearchResponse {
  title: string;
  description: string;
}

interface PropertySpecs {
  beds: number;
  baths: number;
  propertyType: string;
}

interface Property {
  id: string;
  site: 'rightmove' | 'zoopla' | 'openrent' | 'onthemarket';
  searchLocation: string;
  searchPrice: string;
  propertyTypes: string[];
  searchUrl: string;
  specs: PropertySpecs;
  exampleListing: {
    title: string;
    price: string;
    description: string;
  };
}

export class SearchService {
  private static instance: SearchService;
  private axiosInstance: AxiosInstance;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  private handleError(error: AxiosError): never {
    console.error('API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message);
  }

  private transformSearchResult(apiResponse: SearchResponse[]): Property[] {
    // Ensure we have at least 4 results by duplicating if necessary
    const results = [...apiResponse];
    while (results.length < 4) {
      results.push(...apiResponse);
    }
    
    // Take exactly 4 results
    const fourResults = results.slice(0, 4);
    
    // Distribute results across different sites
    const sites: Property['site'][] = ['rightmove', 'zoopla', 'openrent', 'onthemarket'];
    
    return fourResults.map((item, index) => {
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

      // Distribute results across sites evenly
      const site = sites[index % sites.length];

      // Generate search URL based on site and parameters
      const searchUrl = this.generateSearchUrl(site, location, price);

      return {
        id: `${site}-${index + 1}`,
        site,
        searchLocation: location,
        searchPrice: price,
        propertyTypes,
        searchUrl,
        specs: {
          beds,
          baths: Math.max(1, Math.floor(beds / 2)), // Estimate baths based on beds
          propertyType: propertyTypes[0]
        },
        exampleListing: {
          title: item.title,
          price,
          description: item.description
        }
      };
    });
  }

  private generateSearchUrl(site: Property['site'], location: string, price: string): string {
    const priceValue = price.match(/\d+/g)?.[0] || '2000';
    const locationEncoded = encodeURIComponent(location.toLowerCase().trim());
    
    switch (site) {
      case 'rightmove':
        return `https://www.rightmove.co.uk/property-to-rent/find.html?locationIdentifier=${locationEncoded}&maxPrice=${priceValue}&propertyTypes=flat,house`;
      case 'zoopla':
        return `https://www.zoopla.co.uk/to-rent/property/${locationEncoded}/?price_frequency=per_month&price_max=${priceValue}`;
      case 'openrent':
        return `https://www.openrent.co.uk/${locationEncoded}/properties-to-rent?term=${locationEncoded}&prices_max=${priceValue}`;
      case 'onthemarket':
        return `https://www.onthemarket.com/to-rent/property/${locationEncoded}/?max-price=${priceValue}-pcm`;
      default:
        return '#';
    }
  }

  private async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('/health');
      return response.data.status === 'ok';
    } catch (error) {
      console.error('Backend health check failed:', error);
      if (error.response?.status === 404) {
        console.error('Backend server is not running. Please start the backend server using: npm run start:backend');
      }
      return false;
    }
  }

  private async ensureBackendRunning(): Promise<void> {
    const isHealthy = await this.checkBackendHealth();
    if (!isHealthy) {
      throw new Error(
        'Backend service is not running. Please start the backend server using: npm run start:backend'
      );
    }
  }

  public async searchProperties(query: string): Promise<Property[]> {
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

      // Transform the API response into our frontend model
      return this.transformSearchResult(response.data);
    } catch (error) {
      console.error('Error during property search:', error);
      this.handleError(error as AxiosError);
    }
  }

  public async getSuggestions(query: string): Promise<string[]> {
    try {
      await this.ensureBackendRunning();
      console.log('Getting suggestions for query:', query);
      
      const response = await this.axiosInstance.post<string[]>(
        '/search',
        {
          query,
          type: 'suggestions'
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting suggestions:', error);
      this.handleError(error as AxiosError);
    }
  }
} 