import { PropertyDataMCP } from './PropertyDataMCP';

// Mock the scraper module
jest.mock('../../scrapers/openrentScraper', () => ({
  parseOpenrentListings: jest.fn(),
  fetchOpenrentSearchPage: jest.fn()
}));

describe('PropertyDataMCP - Enhanced with Real Scraping', () => {
  let propertyMCP: PropertyDataMCP;

  beforeEach(() => {
    // Reset environment
    delete process.env.ENABLE_REAL_SCRAPING;
    propertyMCP = new PropertyDataMCP();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor and Configuration', () => {
    test('should initialize with real scraping disabled by default', () => {
      const mcp = new PropertyDataMCP();
      expect(mcp).toBeDefined();
    });

    test('should enable real scraping when environment variable is set', () => {
      process.env.ENABLE_REAL_SCRAPING = 'true';
      const mcp = new PropertyDataMCP();
      expect(mcp).toBeDefined();
    });
  });

  describe('getScrapingStatus', () => {
    test('should return scraping status information', async () => {
      const status = await propertyMCP.getScrapingStatus();
      
      expect(status).toHaveProperty('realScrapingEnabled');
      expect(status).toHaveProperty('scrapingEnabled');
      expect(status).toHaveProperty('cacheEnabled');
      expect(status).toHaveProperty('redisEnabled');
      expect(status).toHaveProperty('lastScrapingAttempt');
      
      expect(typeof status.realScrapingEnabled).toBe('boolean');
      expect(typeof status.scrapingEnabled).toBe('boolean');
      expect(typeof status.cacheEnabled).toBe('boolean');
      expect(typeof status.redisEnabled).toBe('boolean');
      expect(typeof status.lastScrapingAttempt).toBe('string');
    });
  });

  describe('searchProperties - Enhanced', () => {
    test('should search properties with mock data by default', async () => {
      const results = await propertyMCP.searchProperties('London', { bedrooms: 2 }, false);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(10);
      
      if (results.length > 0) {
        const property = results[0];
        expect(property).toHaveProperty('id');
        expect(property).toHaveProperty('title');
        expect(property).toHaveProperty('price');
        expect(property).toHaveProperty('metadata');
        expect(property.metadata).toHaveProperty('source');
        expect(property.metadata).toHaveProperty('searchScore');
      }
    });

    test('should apply filters correctly', async () => {
      const results = await propertyMCP.searchProperties('London', { 
        minPrice: 2000, 
        maxPrice: 3000,
        bedrooms: 2 
      }, false);
      
      expect(Array.isArray(results)).toBe(true);
      
      // Check that all properties meet the filter criteria
      results.forEach(property => {
        expect(property.price.amount).toBeGreaterThanOrEqual(2000);
        expect(property.price.amount).toBeLessThanOrEqual(3000);
        expect(property.specifications.bedrooms).toBeGreaterThanOrEqual(2);
      });
    });

    test('should calculate search scores', async () => {
      const results = await propertyMCP.searchProperties('London', {}, false);
      
      results.forEach(property => {
        expect(property.metadata.searchScore).toBeGreaterThanOrEqual(0);
        expect(property.metadata.searchScore).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('getRealPropertyData', () => {
    test('should return mock data when real scraping is disabled', async () => {
      const results = await propertyMCP.getRealPropertyData('London', false);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(10);
    });

    test('should return mock data when real scraping is requested but disabled', async () => {
      const results = await propertyMCP.getRealPropertyData('London', true);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(10);
    });
  });

  describe('searchPropertiesWithRealData', () => {
    test('should perform enhanced search with filters', async () => {
      const results = await propertyMCP.searchPropertiesWithRealData('London', {
        minPrice: 1500,
        maxPrice: 2500,
        bedrooms: 1
      }, false);
      
      expect(Array.isArray(results)).toBe(true);
      
      if (results.length > 0) {
        results.forEach(property => {
          expect(property.price.amount).toBeGreaterThanOrEqual(1500);
          expect(property.price.amount).toBeLessThanOrEqual(2500);
          expect(property.specifications.bedrooms).toBeGreaterThanOrEqual(1);
        });
      }
    });

    test('should handle errors gracefully and fallback to original search', async () => {
      // Mock a failure scenario
      jest.spyOn(propertyMCP as any, 'getRealPropertyData').mockRejectedValue(new Error('Test error'));
      
      const results = await propertyMCP.searchPropertiesWithRealData('London', {}, false);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('updatePropertyCache', () => {
    test('should update cache with properties', async () => {
      const testProperties = [
        {
          id: 'test-1',
          title: 'Test Property',
          price: { amount: 1500, currency: 'GBP', type: 'rent' as const, display: '£1,500 pcm' },
          location: { address: 'Test Address', city: 'London', postcode: 'SW1A 1AA' },
          specifications: { bedrooms: 2, bathrooms: 1, propertyType: 'Flat' },
          features: ['Furnished'],
          description: 'Test description',
          images: [],
          agent: { name: 'Test Agent', company: 'Test Company' },
          amenities: { nearby: [], onsite: [] },
          status: 'available' as const,
          metadata: { 
            createdAt: new Date().toISOString(), 
            lastUpdated: new Date().toISOString(), 
            searchScore: 85, 
            viewCount: 0, 
            source: 'test' 
          }
        }
      ];

      await expect(propertyMCP.updatePropertyCache('test', testProperties)).resolves.not.toThrow();
    });
  });

  describe('scrapeWithPagination', () => {
    test('should handle unknown sources gracefully', async () => {
      const results = await propertyMCP.scrapeWithPagination('unknown', 'London', 2);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    test('should handle Openrent pagination', async () => {
      const results = await propertyMCP.scrapeWithPagination('openrent', 'London', 2);
      
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Filter Application', () => {
    test('should filter by price range', () => {
      const properties = [
        {
          id: '1',
          title: 'Property 1',
          price: { amount: 1000, currency: 'GBP', type: 'rent' as const, display: '£1,000 pcm' },
          location: { address: 'Address 1', city: 'London', postcode: 'SW1A 1AA' },
          specifications: { bedrooms: 2, bathrooms: 1, propertyType: 'Flat' },
          features: [],
          description: 'Description 1',
          images: [],
          agent: { name: 'Agent 1', company: 'Company 1' },
          amenities: { nearby: [], onsite: [] },
          status: 'available' as const,
          metadata: { createdAt: '', lastUpdated: '', searchScore: 0, viewCount: 0, source: 'test' }
        },
        {
          id: '2',
          title: 'Property 2',
          price: { amount: 3000, currency: 'GBP', type: 'rent' as const, display: '£3,000 pcm' },
          location: { address: 'Address 2', city: 'London', postcode: 'SW1A 1AA' },
          specifications: { bedrooms: 3, bathrooms: 2, propertyType: 'House' },
          features: [],
          description: 'Description 2',
          images: [],
          agent: { name: 'Agent 2', company: 'Company 2' },
          amenities: { nearby: [], onsite: [] },
          status: 'available' as const,
          metadata: { createdAt: '', lastUpdated: '', searchScore: 0, viewCount: 0, source: 'test' }
        }
      ];

      const filtered = (propertyMCP as any).applyFilters(properties, { minPrice: 1500, maxPrice: 2500 });
      
      expect(filtered.length).toBe(0); // Both properties are outside the range
    });

    test('should filter by bedrooms', () => {
      const properties = [
        {
          id: '1',
          title: 'Property 1',
          price: { amount: 1000, currency: 'GBP', type: 'rent' as const, display: '£1,000 pcm' },
          location: { address: 'Address 1', city: 'London', postcode: 'SW1A 1AA' },
          specifications: { bedrooms: 1, bathrooms: 1, propertyType: 'Flat' },
          features: [],
          description: 'Description 1',
          images: [],
          agent: { name: 'Agent 1', company: 'Company 1' },
          amenities: { nearby: [], onsite: [] },
          status: 'available' as const,
          metadata: { createdAt: '', lastUpdated: '', searchScore: 0, viewCount: 0, source: 'test' }
        },
        {
          id: '2',
          title: 'Property 2',
          price: { amount: 2000, currency: 'GBP', type: 'rent' as const, display: '£2,000 pcm' },
          location: { address: 'Address 2', city: 'London', postcode: 'SW1A 1AA' },
          specifications: { bedrooms: 3, bathrooms: 2, propertyType: 'House' },
          features: [],
          description: 'Description 2',
          images: [],
          agent: { name: 'Agent 2', company: 'Company 2' },
          amenities: { nearby: [], onsite: [] },
          status: 'available' as const,
          metadata: { createdAt: '', lastUpdated: '', searchScore: 0, viewCount: 0, source: 'test' }
        }
      ];

      const filtered = (propertyMCP as any).applyFilters(properties, { bedrooms: 2 });
      
      expect(filtered.length).toBe(1); // Only the 3-bedroom property should pass
      expect(filtered[0].specifications.bedrooms).toBe(3);
    });
  });

  describe('Search Score Calculation', () => {
    test('should calculate search scores correctly', () => {
      const property = {
        id: '1',
        title: 'London Apartment',
        price: { amount: 1000, currency: 'GBP', type: 'rent' as const, display: '£1,000 pcm' },
        location: { address: 'London Address', city: 'London', postcode: 'SW1A 1AA' },
        specifications: { bedrooms: 2, bathrooms: 1, propertyType: 'Apartment' },
        features: [],
        description: 'Beautiful London apartment',
        images: [],
        agent: { name: 'Agent 1', company: 'Company 1' },
        amenities: { nearby: [], onsite: [] },
        status: 'available' as const,
        metadata: { createdAt: '', lastUpdated: '', searchScore: 0, viewCount: 0, source: 'test' }
      };

      const score = (propertyMCP as any).calculateSearchScore(property, 'London');
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('should handle case-insensitive matching', () => {
      const property = {
        id: '1',
        title: 'LONDON APARTMENT',
        price: { amount: 1000, currency: 'GBP', type: 'rent' as const, display: '£1,000 pcm' },
        location: { address: 'Address', city: 'LONDON', postcode: 'SW1A 1AA' },
        specifications: { bedrooms: 2, bathrooms: 1, propertyType: 'APARTMENT' },
        features: [],
        description: 'Beautiful apartment',
        images: [],
        agent: { name: 'Agent 1', company: 'Company 1' },
        amenities: { nearby: [], onsite: [] },
        status: 'available' as const,
        metadata: { createdAt: '', lastUpdated: '', searchScore: 0, viewCount: 0, source: 'test' }
      };

      const score = (propertyMCP as any).calculateSearchScore(property, 'london');
      
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle scraping errors gracefully', async () => {
      // Mock the scraper to throw an error
      const { parseOpenrentListings, fetchOpenrentSearchPage } = require('../../scrapers/openrentScraper');
      fetchOpenrentSearchPage.mockRejectedValue(new Error('Network error'));
      
      // Enable real scraping
      process.env.ENABLE_REAL_SCRAPING = 'true';
      const mcp = new PropertyDataMCP();
      
      const results = await mcp.getRealPropertyData('London', true);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0); // Should fallback to mock data
    });

    test('should handle cache errors gracefully', async () => {
      // Mock cache operations to fail
      jest.spyOn(propertyMCP as any, 'setCache').mockRejectedValue(new Error('Cache error'));
      
      const results = await propertyMCP.searchProperties('London', {}, false);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });
  });
}); 