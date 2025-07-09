import { PropertyDataMCP } from '../mcp/property-data/PropertyDataMCP';
import { NeighborhoodMCP } from '../mcp/neighborhood/NeighborhoodMCP';
import { ProptiiMCPOrchestrator } from '../mcp/ProptiiMCPOrchestrator';

// Mock Redis for testing
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    on: jest.fn(),
    get: jest.fn(),
    setEx: jest.fn(),
  })),
}));

// Mock axios for testing
jest.mock('axios', () => ({
  get: jest.fn(),
}));

describe('PropertyDataMCP', () => {
  let propertyMCP: PropertyDataMCP;

  beforeEach(() => {
    propertyMCP = new PropertyDataMCP();
  });

  describe('searchProperties', () => {
    it('should return mock properties when scraping is disabled', async () => {
      // Disable scraping for this test
      (propertyMCP as any).scrapingEnabled = false;
      
      const results = await propertyMCP.searchProperties('London');
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      // Check property structure
      const property = results[0];
      expect(property).toHaveProperty('id');
      expect(property).toHaveProperty('title');
      expect(property).toHaveProperty('price');
      expect(property).toHaveProperty('location');
      expect(property).toHaveProperty('specifications');
    });

    it('should filter properties based on query', async () => {
      (propertyMCP as any).scrapingEnabled = false;
      
      const results = await propertyMCP.searchProperties('Chelsea');
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      
      // All results should contain 'Chelsea' in title, address, or description
      results.forEach(property => {
        const searchText = `${property.title} ${property.location.address} ${property.description}`.toLowerCase();
        expect(searchText).toContain('chelsea');
      });
    });

    it('should apply price filters', async () => {
      (propertyMCP as any).scrapingEnabled = false;
      
      const filters = {
        priceRange: { min: 1000, max: 2000 }
      };
      
      const results = await propertyMCP.searchProperties('London', filters);
      
      results.forEach(property => {
        expect(property.price.amount).toBeGreaterThanOrEqual(1000);
        expect(property.price.amount).toBeLessThanOrEqual(2000);
      });
    });

    it('should apply bedroom filters', async () => {
      (propertyMCP as any).scrapingEnabled = false;
      
      const filters = {
        bedrooms: 2
      };
      
      const results = await propertyMCP.searchProperties('London', filters);
      
      results.forEach(property => {
        expect(property.specifications.bedrooms).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('getPropertyById', () => {
    it('should return property by ID', async () => {
      const property = await propertyMCP.getPropertyById('rightmove-1');
      
      expect(property).toBeDefined();
      expect(property?.id).toBe('rightmove-1');
    });

    it('should return null for non-existent property', async () => {
      const property = await propertyMCP.getPropertyById('non-existent');
      
      expect(property).toBeNull();
    });
  });

  describe('cache functionality', () => {
    it('should cache search results', async () => {
      (propertyMCP as any).scrapingEnabled = false;
      
      // First search
      const results1 = await propertyMCP.searchProperties('London');
      
      // Second search should use cache
      const results2 = await propertyMCP.searchProperties('London');
      
      expect(results1).toEqual(results2);
    });
  });
});

describe('NeighborhoodMCP', () => {
  let neighborhoodMCP: NeighborhoodMCP;

  beforeEach(() => {
    neighborhoodMCP = new NeighborhoodMCP();
  });

  describe('getNeighborhoodData', () => {
    it('should return neighborhood data for valid postcode', async () => {
      const data = await neighborhoodMCP.getNeighborhoodData('SW1A 1AA');
      
      expect(data).toBeDefined();
      expect(data).toHaveProperty('postcode');
      expect(data).toHaveProperty('location');
      expect(data!.location).toHaveProperty('area');
      expect(data!.location).toHaveProperty('city');
      expect(data).toHaveProperty('transportLinks');
      expect(data).toHaveProperty('amenities');
      expect(data).toHaveProperty('schools');
      expect(data).toHaveProperty('safetyScore');
    });

    it('should return null for invalid postcode', async () => {
      const data = await neighborhoodMCP.getNeighborhoodData('INVALID');
      
      expect(data).toBeNull();
    });
  });

  describe('getTransportInfo', () => {
    it('should return transport information', async () => {
      const transport = await neighborhoodMCP.getTransportInfo('SW1A 1AA');
      
      expect(transport).toBeDefined();
      expect(transport).toHaveProperty('tubeStations');
      expect(transport).toHaveProperty('busRoutes');
      expect(transport).toHaveProperty('walkabilityScore');
    });
  });

  describe('getAmenities', () => {
    it('should return nearby amenities', async () => {
      const amenities = await neighborhoodMCP.getAmenities('SW1A 1AA');
      
      expect(amenities).toBeDefined();
      expect(Array.isArray(amenities)).toBe(true);
      expect(amenities.length).toBeGreaterThan(0);
    });
  });
});

describe('ProptiiMCPOrchestrator', () => {
  let orchestrator: ProptiiMCPOrchestrator;

  beforeEach(() => {
    orchestrator = new ProptiiMCPOrchestrator();
  });

  describe('processQuery', () => {
    it('should process property search query', async () => {
      const query = '2 bed flat in Islington under £500k';
      const result = await orchestrator.processQuery(query);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('properties');
      expect(result.data).toHaveProperty('marketAnalysis');
      expect(result.data).toHaveProperty('neighborhoodInsights');
      expect(result.data).toHaveProperty('agentRecommendations');
    });

    it('should handle neighborhood query', async () => {
      const query = 'What is the neighborhood like in Chelsea?';
      const result = await orchestrator.processQuery(query);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      expect(result.data).toHaveProperty('neighborhoodInsights');
    });

    it('should handle agent query', async () => {
      const query = 'Who are the best agents in London?';
      const result = await orchestrator.processQuery(query);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      expect(result.data).toHaveProperty('agentRecommendations');
    });
  });

  describe('analyzeIntent', () => {
    it('should identify property search intent', () => {
      const intent = orchestrator.analyzeIntent('2 bed flat in Islington');
      
      expect(intent).toBeDefined();
      expect(intent.type).toBe('property_search');
      expect(intent.confidence).toBeGreaterThan(0.5);
    });

    it('should identify neighborhood intent', () => {
      const intent = orchestrator.analyzeIntent('What is Chelsea like?');
      
      expect(intent).toBeDefined();
      expect(intent.type).toBe('neighborhood_info');
      expect(intent.confidence).toBeGreaterThanOrEqual(0.4);
    });

    it('should identify agent intent', () => {
      const intent = orchestrator.analyzeIntent('Best agents in London');
      
      expect(intent).toBeDefined();
      expect(intent.type).toBe('agent_recommendation');
      expect(intent.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('synthesizeIntelligence', () => {
    it('should synthesize market analysis', async () => {
      const properties = [
        {
          id: '1',
          price: { amount: 500000 },
          location: { area: 'Islington' }
        }
      ] as any;
      
      const analysis = await orchestrator.synthesizeIntelligence(properties);
      
      expect(analysis).toBeDefined();
      expect(analysis).toHaveProperty('marketAnalysis');
      expect(analysis).toHaveProperty('neighborhoodInsights');
      expect(analysis).toHaveProperty('agentRecommendations');
    });
  });
});

// Integration tests
describe('MCP Integration', () => {
  let orchestrator: ProptiiMCPOrchestrator;

  beforeEach(() => {
    orchestrator = new ProptiiMCPOrchestrator();
  });

  it('should handle complex multi-intent query', async () => {
    const query = 'Find 2 bed flats in Islington under £500k and tell me about the neighborhood';
    const result = await orchestrator.processQuery(query);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.properties).toBeDefined();
    expect(result.data!.neighborhoodInsights).toBeDefined();
  });

  it('should handle query with filters', async () => {
    const query = '3 bed houses in Chelsea with garden';
    const result = await orchestrator.processQuery(query);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.properties).toBeDefined();
    
    // Check that filters were applied
    result.data!.properties.forEach((property: any) => {
      expect(property.specifications.bedrooms).toBeGreaterThanOrEqual(3);
    });
  });
});

// Performance tests
describe('Performance', () => {
  let orchestrator: ProptiiMCPOrchestrator;

  beforeEach(() => {
    orchestrator = new ProptiiMCPOrchestrator();
  });

  it('should respond within 5 seconds', async () => {
    const startTime = Date.now();
    
    await orchestrator.processQuery('2 bed flat in London');
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    expect(responseTime).toBeLessThan(5000);
  });

  it('should handle concurrent requests', async () => {
    const queries = [
      '2 bed flat in Islington',
      '3 bed house in Chelsea',
      'Studio in Camden'
    ];
    
    const startTime = Date.now();
    
    const promises = queries.map(query => orchestrator.processQuery(query));
    const results = await Promise.all(promises);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    expect(results).toHaveLength(3);
    expect(responseTime).toBeLessThan(10000); // Should handle concurrent requests efficiently
  });
});

// Error handling tests
describe('Error Handling', () => {
  let orchestrator: ProptiiMCPOrchestrator;

  beforeEach(() => {
    orchestrator = new ProptiiMCPOrchestrator();
  });

  it('should handle empty query gracefully', async () => {
    const result = await orchestrator.processQuery('');
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle malformed query', async () => {
    const result = await orchestrator.processQuery('   ');
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle network errors gracefully', async () => {
    // This test would require mocking network failures
    // For now, we'll test that the system doesn't crash
    const result = await orchestrator.processQuery('test query');
    
    expect(result).toBeDefined();
    // Should either succeed or fail gracefully, but not crash
  });
}); 