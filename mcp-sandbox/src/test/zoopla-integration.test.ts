/**
 * Zoopla Integration Test Suite
 * Tests the complete Zoopla integration with PropertyDataMCP
 */

import { PropertyDataMCP } from '../mcp/property-data/PropertyDataMCP';
import fs from 'fs';
import path from 'path';
// import { parseZooplaSearchResults } from '../scrapers/zooplaScraper';

describe('Zoopla Integration Tests', () => {
  let propertyMCP: PropertyDataMCP;

  beforeEach(() => {
    propertyMCP = new PropertyDataMCP();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Zoopla Scraping', () => {
    test('should scrape Zoopla properties successfully', async () => {
      const results = await propertyMCP.scrapeZoopla('London');
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      if (results.length > 0) {
        const sample = results[0];
        expect(sample).toHaveProperty('id');
        expect(sample).toHaveProperty('title');
        expect(sample).toHaveProperty('price');
        expect(sample).toHaveProperty('location');
        expect(sample).toHaveProperty('specifications');
        expect(sample).toHaveProperty('metadata');
        expect(sample.metadata.source).toBe('zoopla');
      }
    }, 30000); // 30 second timeout

    test('should handle empty results gracefully', async () => {
      const results = await propertyMCP.scrapeZoopla('invalid-location-xyz-123');
      
      expect(Array.isArray(results)).toBe(true);
      // Should return empty array or fallback to mock data
    }, 30000);
  });

  describe('Multi-Source Search Integration', () => {
    test('should include Zoopla in multi-source search', async () => {
      const results = await propertyMCP.searchProperties('London', { bedrooms: 2 }, true);
      
      expect(Array.isArray(results)).toBe(true);
      
      // Check if Zoopla properties are included
      const zooplaProperties = results.filter(p => p.metadata.source === 'zoopla');
      expect(zooplaProperties.length).toBeGreaterThan(0);
      
      // Verify property structure
      zooplaProperties.forEach(property => {
        expect(property.id).toMatch(/^zoopla-/);
        expect(property.metadata.source).toBe('zoopla');
      });
    }, 30000);
  });

  describe('Pagination Support', () => {
    test('should support paginated scraping', async () => {
      const results = await propertyMCP.scrapeWithPagination('zoopla', 'London', 2);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      // All properties should be from Zoopla
      results.forEach(property => {
        expect(property.metadata.source).toBe('zoopla');
      });
    }, 60000); // 60 second timeout for pagination
  });

  describe('Cache Functionality', () => {
    test('should cache Zoopla results', async () => {
      const startTime = Date.now();
      const firstCall = await propertyMCP.scrapeZoopla('Manchester');
      const firstCallTime = Date.now() - startTime;
      
      const cacheStartTime = Date.now();
      const secondCall = await propertyMCP.scrapeZoopla('Manchester');
      const cacheCallTime = Date.now() - cacheStartTime;
      
      expect(firstCall.length).toBe(secondCall.length);
      expect(cacheCallTime).toBeLessThan(firstCallTime);
    }, 60000);
  });

  describe('Schema Validation', () => {
    test('should return valid MCP property schema', async () => {
      const results = await propertyMCP.scrapeZoopla('Birmingham');
      
      if (results.length > 0) {
        const sample = results[0];
        
        // Required fields
        expect(sample.id).toBeDefined();
        expect(sample.title).toBeDefined();
        expect(sample.price).toBeDefined();
        expect(sample.location).toBeDefined();
        expect(sample.specifications).toBeDefined();
        expect(sample.metadata).toBeDefined();
        
        // Data types
        expect(typeof sample.id).toBe('string');
        expect(typeof sample.title).toBe('string');
        expect(typeof sample.price.amount).toBe('number');
        expect(typeof sample.specifications.bedrooms).toBe('number');
        expect(typeof sample.metadata.source).toBe('string');
        
        // Zoopla-specific validation
        expect(sample.id).toMatch(/^zoopla-/);
        expect(sample.metadata.source).toBe('zoopla');
      }
    }, 30000);
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Mock network failure
      jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));
      
      const results = await propertyMCP.scrapeZoopla('London');
      
      // Should return empty array or fallback data
      expect(Array.isArray(results)).toBe(true);
    });

    test('should handle parsing errors gracefully', async () => {
      const results = await propertyMCP.scrapeZoopla('invalid-query-with-special-chars-!@#$%');
      
      expect(Array.isArray(results)).toBe(true);
    }, 30000);
  });

  describe('Performance Metrics', () => {
    test('should complete scraping within reasonable time', async () => {
      const startTime = Date.now();
      const results = await propertyMCP.scrapeZoopla('London');
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
      expect(results.length).toBeGreaterThan(0);
      
      console.log(`Scraping completed in ${duration}ms with ${results.length} properties`);
    }, 30000);
  });

  describe('Data Quality', () => {
    test('should extract meaningful property data', async () => {
      const results = await propertyMCP.scrapeZoopla('London');
      
      if (results.length > 0) {
        const sample = results[0];
        
        // Check for meaningful data
        expect(sample.title.length).toBeGreaterThan(5);
        expect(sample.price.amount).toBeGreaterThan(0);
        expect(sample.location.address.length).toBeGreaterThan(0);
        expect(sample.specifications.bedrooms).toBeGreaterThanOrEqual(0);
        expect(sample.specifications.bathrooms).toBeGreaterThanOrEqual(0);
      }
    }, 30000);
  });
});

// Integration test for the complete workflow
describe('Zoopla Complete Workflow', () => {
  let propertyMCP: PropertyDataMCP;

  beforeAll(() => {
    propertyMCP = new PropertyDataMCP();
  });

  test('should complete full Zoopla integration workflow', async () => {
    console.log('🧪 Starting Zoopla integration workflow test...');
    
    // Step 1: Basic scraping
    console.log('Step 1: Basic Zoopla scraping...');
    const basicResults = await propertyMCP.scrapeZoopla('London');
    expect(basicResults.length).toBeGreaterThan(0);
    console.log(`✅ Basic scraping: ${basicResults.length} properties`);
    
    // Step 2: Multi-source search
    console.log('Step 2: Multi-source search...');
    const multiSourceResults = await propertyMCP.searchProperties('London', { bedrooms: 2 }, true);
    expect(multiSourceResults.length).toBeGreaterThan(0);
    
    const zooplaInMultiSource = multiSourceResults.filter(p => p.metadata.source === 'zoopla');
    expect(zooplaInMultiSource.length).toBeGreaterThan(0);
    console.log(`✅ Multi-source search: ${multiSourceResults.length} total, ${zooplaInMultiSource.length} from Zoopla`);
    
    // Step 3: Pagination
    console.log('Step 3: Pagination test...');
    const paginatedResults = await propertyMCP.scrapeWithPagination('zoopla', 'London', 2);
    expect(paginatedResults.length).toBeGreaterThan(0);
    console.log(`✅ Pagination: ${paginatedResults.length} properties`);
    
    // Step 4: Cache test
    console.log('Step 4: Cache functionality...');
    const startTime = Date.now();
    const cachedResults = await propertyMCP.scrapeZoopla('London');
    const cacheTime = Date.now() - startTime;
    expect(cachedResults.length).toBeGreaterThan(0);
    console.log(`✅ Cache test: ${cachedResults.length} properties in ${cacheTime}ms`);
    
    console.log('🎉 Zoopla integration workflow completed successfully!');
  }, 120000); // 2 minute timeout for complete workflow
}); 

describe.only('Zoopla Parser Unit Tests', () => {
  test.only('should parse properties from static HTML fixture', () => {
    const fixturePath = path.join(__dirname, 'fixtures', 'zoopla-search.html');
    const html = fs.readFileSync(fixturePath, 'utf8');
    // const properties = parseZooplaSearchResults(html);
    const properties: any[] = []; // Temporarily disabled
    expect(Array.isArray(properties)).toBe(true);
    expect(properties.length).toBeGreaterThan(0);
    const sample = properties[0];
    expect(sample).toHaveProperty('id');
    expect(sample).toHaveProperty('title');
    expect(sample).toHaveProperty('price');
    expect(sample).toHaveProperty('location');
    expect(sample).toHaveProperty('details');
    expect(sample).toHaveProperty('metadata');
  });
}); 