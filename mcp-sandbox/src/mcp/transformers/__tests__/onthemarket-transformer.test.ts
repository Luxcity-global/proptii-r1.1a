import {
  transformOnTheMarketToMCP,
  transformOnTheMarketProperties,
  OnTheMarketProperty,
  generateUniqueId,
  normalizePrice,
  extractLocation,
  extractPostcode,
  extractCity,
  extractArea,
  normalizeSpecifications,
  normalizePropertyType,
  extractFeatures,
  enhanceImages,
  enhanceAgent,
  generateMetadata,
  validateTransformedProperty,
  getTransformationStats
} from '../onthemarket-transformer';

describe('OnTheMarket Transformer', () => {
  
  const sampleOnTheMarketProperty: OnTheMarketProperty = {
    id: 'otm_test_123',
    title: '2 Bedroom Flat, Central London',
    address: 'Camden High Street, Camden, London NW1 7JE',
    price: 2500,
    priceUnit: 'pcm',
    bedrooms: 2,
    bathrooms: 1,
    propertyType: '2 bedroom flat',
    description: 'Beautiful modern flat with garden, parking, and central heating. Recently renovated with fitted kitchen.',
    images: [
      '/images/property1.jpg',
      'https://example.com/image2.jpg'
    ],
    listingUrl: 'https://www.onthemarket.com/details/property123',
    agent: {
      name: 'Premium Estate Agents',
      contact: '020 1234 5678'
    },
    availableFrom: '2024-01-01'
  };

  describe('generateUniqueId', () => {
    test('should generate consistent IDs from URLs', () => {
      const url = 'https://www.onthemarket.com/details/property123';
      const id1 = generateUniqueId(url);
      const id2 = generateUniqueId(url);
      
      expect(id1).toBe(id2);
      expect(id1).toMatch(/^otm_[a-f0-9]{12}$/);
    });

    test('should generate different IDs for different URLs', () => {
      const url1 = 'https://www.onthemarket.com/details/property123';
      const url2 = 'https://www.onthemarket.com/details/property456';
      
      const id1 = generateUniqueId(url1);
      const id2 = generateUniqueId(url2);
      
      expect(id1).not.toBe(id2);
    });
  });

  describe('normalizePrice', () => {
    test('should handle pcm pricing', () => {
      const price = normalizePrice(2500, 'pcm');
      
      expect(price.amount).toBe(2500);
      expect(price.currency).toBe('GBP');
      expect(price.type).toBe('rent');
      expect(price.period).toBe('monthly');
      expect(price.display).toBe('£2,500 pcm');
    });

    test('should convert pw to monthly', () => {
      const price = normalizePrice(600, 'pw');
      const expectedMonthly = Math.round(600 * 52 / 12);
      
      expect(price.amount).toBe(expectedMonthly);
      expect(price.period).toBe('monthly');
      expect(price.display).toContain('pw');
      expect(price.display).toContain(`£${expectedMonthly}`);
    });

    test('should handle pppw pricing', () => {
      const price = normalizePrice(150, 'pppw');
      const expectedMonthly = Math.round(150 * 52 / 12);
      
      expect(price.amount).toBe(expectedMonthly);
      expect(price.period).toBe('monthly');
      expect(price.display).toContain('pppw');
    });

    test('should handle sale prices', () => {
      const price = normalizePrice(450000, 'total');
      
      expect(price.amount).toBe(450000);
      expect(price.type).toBe('sale');
      expect(price.display).toBe('£450,000');
    });

    test('should handle yearly pricing', () => {
      const price = normalizePrice(30000, 'pa');
      
      expect(price.amount).toBe(30000);
      expect(price.period).toBe('yearly');
      expect(price.display).toBe('£30,000 pa');
    });
  });

  describe('extractLocation', () => {
    test('should extract complete location data', () => {
      const address = 'Camden High Street, Camden, London NW1 7JE';
      const location = extractLocation(address);
      
      expect(location.address).toBe(address);
      expect(location.city).toBe('London');
      expect(location.postcode).toBe('NW1 7JE');
      expect(location.area).toBe('Camden High Street');
    });

    test('should handle addresses without postcodes', () => {
      const address = 'High Street, Manchester';
      const location = extractLocation(address);
      
      expect(location.address).toBe(address);
      expect(location.city).toBe('Manchester');
      expect(location.postcode).toBe('');
    });
  });

  describe('extractPostcode', () => {
    test('should extract various UK postcode formats', () => {
      const testCases = [
        { address: 'London NW1 7JE', expected: 'NW1 7JE' },
        { address: 'Birmingham B1 1AA', expected: 'B1 1AA' },
        { address: 'Manchester M1 1AA', expected: 'M1 1AA' },
        { address: 'Edinburgh EH1 1YZ', expected: 'EH1 1YZ' }
      ];

      testCases.forEach(({ address, expected }) => {
        expect(extractPostcode(address)).toBe(expected);
      });
    });

    test('should return null for invalid postcodes', () => {
      expect(extractPostcode('No postcode here')).toBeNull();
      expect(extractPostcode('123456')).toBeNull();
    });
  });

  describe('extractCity', () => {
    test('should extract major UK cities', () => {
      const testCases = [
        'Camden, London NW1',
        'City Centre, Manchester M1',
        'Digbeth, Birmingham B1',
        'Old Town, Edinburgh EH1'
      ];

      const cities = testCases.map(extractCity);
      expect(cities).toEqual(['London', 'Manchester', 'Birmingham', 'Edinburgh']);
    });

    test('should extract from comma-separated address parts', () => {
      const address = 'High Street, Oxford, Oxfordshire';
      expect(extractCity(address)).toBe('Oxford');
    });
  });

  describe('extractArea', () => {
    test('should extract area from address', () => {
      expect(extractArea('Camden High Street, London')).toBe('Camden High Street');
      expect(extractArea('King\'s Road, Chelsea, London')).toBe('King\'s Road');
    });

    test('should ignore street numbers', () => {
      expect(extractArea('123 High Street, London')).toBeNull();
    });
  });

  describe('normalizeSpecifications', () => {
    test('should normalize property specifications', () => {
      const specs = normalizeSpecifications(sampleOnTheMarketProperty);
      
      expect(specs.bedrooms).toBe(2);
      expect(specs.bathrooms).toBe(1);
      expect(specs.propertyType).toBe('2 bedroom flat');
    });

    test('should handle missing values', () => {
      const propertyWithMissingData: OnTheMarketProperty = {
        ...sampleOnTheMarketProperty,
        bedrooms: 0,
        bathrooms: 0,
        propertyType: ''
      };

      const specs = normalizeSpecifications(propertyWithMissingData);
      expect(specs.bedrooms).toBe(0);
      expect(specs.bathrooms).toBe(0);
    });
  });

  describe('normalizePropertyType', () => {
    test('should normalize property types', () => {
      const testCases = [
        { input: 'flat', expected: 'Flat' },
        { input: 'HOUSE', expected: 'House' },
        { input: 'studio apartment', expected: 'Studio' },
        { input: 'terraced house', expected: 'Terraced House' },
        { input: 'detached house', expected: 'Detached House' },
        { input: 'unknown type', expected: 'Unknown type' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(normalizePropertyType(input)).toBe(expected);
      });
    });
  });

  describe('extractFeatures', () => {
    test('should extract features from description', () => {
      const description = 'Beautiful flat with garden, parking, central heating and dishwasher';
      const features = extractFeatures(description);
      
      expect(features).toContain('Garden');
      expect(features).toContain('Parking');
      expect(features).toContain('Central heating');
      expect(features).toContain('Dishwasher');
    });

    test('should limit features to 10', () => {
      const longDescription = 'Property with parking, garden, balcony, terrace, patio, furnished, dishwasher, washing machine, central heating, double glazing, gym, concierge';
      const features = extractFeatures(longDescription);
      
      expect(features.length).toBeLessThanOrEqual(10);
    });

    test('should return empty array for empty description', () => {
      expect(extractFeatures('')).toEqual([]);
      expect(extractFeatures(null as any)).toEqual([]);
    });
  });

  describe('enhanceImages', () => {
    test('should enhance images with MCP format', () => {
      const images = ['/image1.jpg', 'https://example.com/image2.jpg'];
      const enhanced = enhanceImages(images);
      
      expect(enhanced).toHaveLength(2);
      expect(enhanced[0].src).toBe('https://www.onthemarket.com/image1.jpg');
      expect(enhanced[0].isPrimary).toBe(true);
      expect(enhanced[1].src).toBe('https://example.com/image2.jpg');
      expect(enhanced[1].isPrimary).toBe(false);
    });

    test('should handle empty images array', () => {
      expect(enhanceImages([])).toEqual([]);
      expect(enhanceImages(null as any)).toEqual([]);
    });

    test('should limit to 20 images', () => {
      const manyImages = Array(25).fill('/image.jpg');
      const enhanced = enhanceImages(manyImages);
      
      expect(enhanced.length).toBe(20);
    });
  });

  describe('enhanceAgent', () => {
    test('should enhance agent information', () => {
      const agent = { name: 'Test Estate Agents', contact: '020 1234 5678' };
      const enhanced = enhanceAgent(agent);
      
      expect(enhanced.name).toBe('Test Estate Agents');
      expect(enhanced.company).toBe('Test Estate Agents');
      expect(enhanced.phone).toBe('020 1234 5678');
    });

    test('should handle missing agent information', () => {
      const agent = { name: '', contact: '' };
      const enhanced = enhanceAgent(agent);
      
      expect(enhanced.name).toBe('On the Market');
      expect(enhanced.company).toBe('On the Market');
    });
  });

  describe('generateMetadata', () => {
    test('should generate metadata with source', () => {
      const metadata = generateMetadata('On the Market');
      
      expect(metadata.source).toBe('On the Market');
      expect(metadata.searchScore).toBe(0.8);
      expect(metadata.viewCount).toBe(0);
      expect(metadata.createdAt).toBeTruthy();
      expect(metadata.lastUpdated).toBeTruthy();
    });
  });

  describe('validateTransformedProperty', () => {
    test('should validate complete property', () => {
      const transformedProperty = transformOnTheMarketToMCP(sampleOnTheMarketProperty);
      const validation = validateTransformedProperty(transformedProperty);
      
      expect(validation.isValid).toBe(true);
      expect(validation.warnings.length).toBeLessThan(3); // Allow some minor warnings
    });

    test('should detect missing required fields', () => {
      const incompleteProperty = {
        ...transformOnTheMarketToMCP(sampleOnTheMarketProperty),
        id: '',
        title: '',
        location: { ...transformOnTheMarketToMCP(sampleOnTheMarketProperty).location, address: '' }
      };

      const validation = validateTransformedProperty(incompleteProperty);
      
      expect(validation.isValid).toBe(false);
      expect(validation.warnings).toContain('Missing property ID');
      expect(validation.warnings).toContain('Missing address');
    });
  });

  describe('transformOnTheMarketToMCP', () => {
    test('should transform complete property', () => {
      const transformed = transformOnTheMarketToMCP(sampleOnTheMarketProperty);
      
      expect(transformed.id).toMatch(/^otm_[a-f0-9]{12}$/);
      expect(transformed.title).toBe(sampleOnTheMarketProperty.title);
      expect(transformed.price.amount).toBe(2500);
      expect(transformed.price.type).toBe('rent');
      expect(transformed.location.city).toBe('London');
      expect(transformed.specifications.bedrooms).toBe(2);
      expect(transformed.agent.name).toBe('Premium Estate Agents');
      expect(transformed.metadata.source).toBe('On the Market');
      expect(transformed.propertyUrl).toBe(sampleOnTheMarketProperty.listingUrl);
    });

    test('should handle missing optional fields', () => {
      const minimalProperty: OnTheMarketProperty = {
        id: 'test',
        title: 'Test Property',
        address: 'Test Address, London',
        price: 1000,
        priceUnit: 'pcm',
        bedrooms: 1,
        bathrooms: 1,
        propertyType: 'flat',
        description: '',
        images: [],
        listingUrl: 'https://test.com',
        agent: { name: '', contact: '' },
        availableFrom: ''
      };

      const transformed = transformOnTheMarketToMCP(minimalProperty);
      
      expect(transformed.id).toBeTruthy();
      expect(transformed.images).toEqual([]);
      expect(transformed.agent.name).toBe('On the Market');
    });
  });

  describe('transformOnTheMarketProperties', () => {
    test('should transform array of properties', () => {
      const properties = [
        sampleOnTheMarketProperty,
        { ...sampleOnTheMarketProperty, id: 'otm_test_456', title: 'Another Property' }
      ];

      const transformed = transformOnTheMarketProperties(properties);
      
      expect(transformed).toHaveLength(2);
      expect(transformed[0].title).toBe('2 Bedroom Flat, Central London');
      expect(transformed[1].title).toBe('Another Property');
    });

    test('should handle transformation errors gracefully', () => {
      const properties = [
        sampleOnTheMarketProperty,
        null as any, // This will cause an error
        { ...sampleOnTheMarketProperty, id: 'otm_test_789' }
      ];

      const transformed = transformOnTheMarketProperties(properties);
      
      // Should successfully transform the valid properties and skip the invalid one
      expect(transformed.length).toBeLessThan(properties.length);
    });
  });

  describe('getTransformationStats', () => {
    test('should calculate transformation statistics', () => {
      const original = [
        sampleOnTheMarketProperty,
        { ...sampleOnTheMarketProperty, id: 'otm_test_456', price: 3000, propertyType: 'house' }
      ];

      const transformed = transformOnTheMarketProperties(original);
      const stats = getTransformationStats(original, transformed);
      
      expect(stats.total).toBe(2);
      expect(stats.successful).toBe(2);
      expect(stats.failed).toBe(0);
      expect(stats.successRate).toBe(100);
      expect(stats.averagePrice).toBeGreaterThan(0);
      expect(stats.propertyTypes).toBeTruthy();
      expect(stats.cities).toBeTruthy();
    });
  });
}); 