import { 
  transformOpenrentToMCP, 
  transformOpenrentProperties,
  normalizePrice, 
  extractLocation, 
  extractPostcode, 
  extractCity, 
  extractArea,
  normalizePropertyType,
  extractFeatures,
  enhanceImages,
  enhanceAgent,
  generateMetadata,
  validateTransformedProperty,
  getTransformationStats,
  OpenrentProperty
} from './schemaTransformer';

// Test data
const sampleOpenrentProperty: OpenrentProperty = {
  id: 'https://www.openrent.co.uk/property-to-rent/london/2-bed-flat-bramley-court-br6/1606882',
  title: '2 Bed Flat, Bramley Court, BR6',
  address: 'Bramley Court, BR6',
  price: 1800,
  priceUnit: 'pcm',
  bedrooms: 2,
  bathrooms: 2,
  propertyType: '2 Bed Flat',
  description: 'Property: 2 Bed Flat, Bramley Court, BR6, Available to Rent in Orpington. No admin fees. £1,800.00 p/m. Furnished with parking.',
  images: [
    '//imagescdn.openrent.co.uk/listings/1606882/o_1intr4mqpbq711v915uleo2jf00.JPG',
    '//imagescdn.openrent.co.uk/listings/1606882/o_1intr4mt81oek16o777n10n715bv1.JPG'
  ],
  listingUrl: 'https://www.openrent.co.uk/property-to-rent/orpington/2-bed-flat-bramley-court-br6/1606882',
  agent: {
    name: 'OpenRent',
    contact: ''
  },
  availableFrom: 'Today'
};

const sampleOpenrentPropertyWeekly: OpenrentProperty = {
  id: 'https://www.openrent.co.uk/property-to-rent/london/1-bed-flat-london-e19/2535936',
  title: '1 Bed Flat, London, E19',
  address: 'London, E19',
  price: 459,
  priceUnit: 'pw',
  bedrooms: 1,
  bathrooms: 1,
  propertyType: '1 Bed Flat',
  description: 'We are proud to offer this delightful 1 bedroom, 1 bathroom flat in a great location. Available to move in from 30 June 2025.',
  images: [],
  listingUrl: 'https://www.openrent.co.uk/property-to-rent/london/1-bed-flat-london-e19/2535936',
  agent: {
    name: 'OpenRent',
    contact: ''
  },
  availableFrom: ''
};

describe('Schema Transformer', () => {
  describe('transformOpenrentToMCP', () => {
    it('should transform a complete Openrent property to MCP format', () => {
      const result = transformOpenrentToMCP(sampleOpenrentProperty);
      
      expect(result.id).toBe(sampleOpenrentProperty.id);
      expect(result.title).toBe(sampleOpenrentProperty.title);
      expect(result.price.amount).toBe(1800);
      expect(result.price.currency).toBe('GBP');
      expect(result.price.type).toBe('rent');
      expect(result.price.period).toBe('monthly');
      expect(result.price.display).toBe('£1,800 pcm');
      expect(result.location.address).toBe('Bramley Court, BR6');
      expect(result.specifications.bedrooms).toBe(2);
      expect(result.specifications.bathrooms).toBe(2);
      expect(result.specifications.propertyType).toBe('2 Bedroom Flat');
      expect(result.description).toBe(sampleOpenrentProperty.description);
      expect(result.images).toHaveLength(2);
      expect(result.agent.name).toBe('OpenRent');
      expect(result.agent.company).toBe('OpenRent');
      expect(result.status).toBe('available');
      expect(result.metadata.source).toBe('openrent');
      expect(result.contactUrl).toBe(sampleOpenrentProperty.listingUrl);
      expect(result.propertyUrl).toBe(sampleOpenrentProperty.listingUrl);
    });

    it('should handle weekly pricing correctly', () => {
      const result = transformOpenrentToMCP(sampleOpenrentPropertyWeekly);
      
      // Weekly prices are converted to monthly equivalent for MCP schema
      expect(result.price.amount).toBe(1989); // 459 * 52 / 12 rounded
      expect(result.price.period).toBe('monthly');
      expect(result.price.display).toBe('£459 pw (~£1989/pcm)');
    });

    it('should handle missing data gracefully', () => {
      const incompleteProperty: OpenrentProperty = {
        ...sampleOpenrentProperty,
        description: '',
        images: [],
        agent: { name: '', contact: '' }
      };
      
      const result = transformOpenrentToMCP(incompleteProperty);
      
      expect(result.description).toBe('');
      expect(result.images).toHaveLength(0);
      expect(result.agent.name).toBe('Unknown');
      expect(result.features).toHaveLength(0);
    });

    it('should handle invalid property data gracefully', () => {
      const invalidProperty = {
        ...sampleOpenrentProperty,
        id: null as any
      };
      
      // Transformer should handle invalid data gracefully, not throw
      const result = transformOpenrentToMCP(invalidProperty);
      expect(result.id).toBe(null);
    });
  });

  describe('normalizePrice', () => {
    it('should normalize monthly prices', () => {
      const result = normalizePrice(1500, 'pcm');
      
      expect(result.amount).toBe(1500);
      expect(result.currency).toBe('GBP');
      expect(result.type).toBe('rent');
      expect(result.period).toBe('monthly');
      expect(result.display).toBe('£1,500 pcm');
    });

    it('should normalize weekly prices to monthly equivalent', () => {
      const result = normalizePrice(350, 'pw');
      
      expect(result.period).toBe('monthly');
      expect(result.amount).toBe(1517); // 350 * 52 / 12 rounded
      expect(result.display).toBe('£350 pw (~£1517/pcm)');
    });

    it('should handle yearly prices', () => {
      const result = normalizePrice(18000, 'pa');
      
      expect(result.period).toBe('yearly');
      expect(result.display).toBe('£18,000 pa');
    });

    it('should default to monthly for unknown units', () => {
      const result = normalizePrice(1000, 'unknown');
      
      expect(result.period).toBe('monthly');
    });
  });

  describe('extractLocation', () => {
    it('should extract location from address with postcode', () => {
      const result = extractLocation('123 Main Street, London, SW1A 1AA');
      
      expect(result.address).toBe('123 Main Street, London, SW1A 1AA');
      expect(result.city).toBe('London');
      expect(result.postcode).toBe('SW1A 1AA');
      expect(result.area).toBe('London');
    });

    it('should handle address without postcode', () => {
      const result = extractLocation('456 High Street, Manchester');
      
      expect(result.address).toBe('456 High Street, Manchester');
      expect(result.city).toBe('Manchester');
      expect(result.postcode).toBe('');
      expect(result.area).toBe('Manchester');
    });

    it('should handle empty address', () => {
      const result = extractLocation('');
      
      expect(result.address).toBe('');
      expect(result.city).toBe('Unknown');
      expect(result.postcode).toBe('');
      expect(result.area).toBe('');
    });
  });

  describe('extractPostcode', () => {
    it('should extract various UK postcode formats', () => {
      expect(extractPostcode('SW1A 1AA')).toBe('SW1A 1AA');
      expect(extractPostcode('M1 1AA')).toBe('M1 1AA');
      expect(extractPostcode('B33 8TH')).toBe('B33 8TH');
      expect(extractPostcode('W1A 0AX')).toBe('W1A 0AX');
      expect(extractPostcode('M60 1NW')).toBe('M60 1NW');
    });

    it('should return null for invalid postcodes', () => {
      expect(extractPostcode('Invalid Postcode')).toBeNull();
      expect(extractPostcode('12345')).toBeNull();
      expect(extractPostcode('')).toBeNull();
    });
  });

  describe('extractCity', () => {
    it('should extract known UK cities', () => {
      expect(extractCity('London, SW1A 1AA')).toBe('London');
      expect(extractCity('Manchester, M1 1AA')).toBe('Manchester');
      expect(extractCity('Birmingham, B33 8TH')).toBe('Birmingham');
      expect(extractCity('Liverpool, L1 1AA')).toBe('Liverpool');
    });

    it('should extract city from postcode area when not in known cities', () => {
      expect(extractCity('Some Street, SW1A 1AA')).toBe('SW1A');
      expect(extractCity('Another Road, M1 1AA')).toBe('M1');
    });

    it('should return null for unknown locations', () => {
      expect(extractCity('Unknown Location')).toBeNull();
      expect(extractCity('')).toBeNull();
    });
  });

  describe('extractArea', () => {
    it('should extract area from address', () => {
      expect(extractArea('123 Main Street, Camden, London, SW1A 1AA')).toBe('London');
      expect(extractArea('456 High Street, Soho, London')).toBe('London');
    });

    it('should handle address without clear area', () => {
      expect(extractArea('123 Street, SW1A 1AA')).toBe('123 Street');
      expect(extractArea('London')).toBe('London');
    });
  });

  describe('normalizePropertyType', () => {
    it('should normalize common property types', () => {
      expect(normalizePropertyType('flat')).toBe('Flat');
      expect(normalizePropertyType('apartment')).toBe('Flat');
      expect(normalizePropertyType('studio')).toBe('Studio');
      expect(normalizePropertyType('1 bed flat')).toBe('1 Bedroom Flat');
      expect(normalizePropertyType('2 bedroom flat')).toBe('2 Bedroom Flat');
      expect(normalizePropertyType('house')).toBe('House');
      expect(normalizePropertyType('penthouse')).toBe('Penthouse');
    });

    it('should handle unknown property types', () => {
      expect(normalizePropertyType('unknown type')).toBe('unknown type');
      expect(normalizePropertyType('')).toBe('Unknown');
    });
  });

  describe('extractFeatures', () => {
    it('should extract features from description', () => {
      const description = 'Beautiful furnished flat with parking, garden, and central heating. Pet friendly and bills included.';
      const features = extractFeatures(description);
      
      expect(features).toContain('Furnished');
      expect(features).toContain('Parking');
      expect(features).toContain('Garden');
      expect(features).toContain('Central Heating');
      expect(features).toContain('Pet Friendly');
      expect(features).toContain('Bills Included');
    });

    it('should handle empty description', () => {
      expect(extractFeatures('')).toEqual([]);
    });

    it('should not duplicate features', () => {
      const description = 'Furnished flat, fully furnished with parking and parking space';
      const features = extractFeatures(description);
      
      expect(features.filter(f => f === 'Furnished')).toHaveLength(1);
      expect(features.filter(f => f === 'Parking')).toHaveLength(1);
    });
  });

  describe('enhanceImages', () => {
    it('should enhance image URLs and add metadata', () => {
      const images = [
        '//imagescdn.openrent.co.uk/listings/1606882/image1.JPG',
        'https://imagescdn.openrent.co.uk/listings/1606882/image2.JPG'
      ];
      
      const result = enhanceImages(images);
      
      expect(result).toHaveLength(2);
      expect(result[0].src).toBe('https://imagescdn.openrent.co.uk/listings/1606882/image1.JPG');
      expect(result[0].alt).toBe('Property image 1');
      expect(result[0].isPrimary).toBe(true);
      expect(result[1].src).toBe('https://imagescdn.openrent.co.uk/listings/1606882/image2.JPG');
      expect(result[1].alt).toBe('Property image 2');
      expect(result[1].isPrimary).toBe(false);
    });

    it('should handle empty images array', () => {
      expect(enhanceImages([])).toEqual([]);
    });
  });

  describe('enhanceAgent', () => {
    it('should enhance agent information', () => {
      const agent = { name: 'John Smith', contact: '+44 123 456 7890' };
      const result = enhanceAgent(agent);
      
      expect(result.name).toBe('John Smith');
      expect(result.company).toBe('OpenRent');
      expect(result.phone).toBe('+44 123 456 7890');
      expect(result.email).toBeUndefined();
      expect(result.photo).toBeUndefined();
    });

    it('should handle missing agent data', () => {
      const agent = { name: '', contact: '' };
      const result = enhanceAgent(agent);
      
      expect(result.name).toBe('Unknown');
      expect(result.phone).toBeUndefined();
    });
  });

  describe('generateMetadata', () => {
    it('should generate metadata with current timestamp', () => {
      const result = generateMetadata('openrent');
      
      expect(result.source).toBe('openrent');
      expect(result.createdAt).toBeDefined();
      expect(result.lastUpdated).toBeDefined();
      expect(typeof result.searchScore).toBe('number');
      expect(result.viewCount).toBe(0);
      
      // Check timestamps are recent
      const now = new Date();
      const createdAt = new Date(result.createdAt);
      expect(now.getTime() - createdAt.getTime()).toBeLessThan(1000); // Within 1 second
    });
  });

  describe('validateTransformedProperty', () => {
    it('should validate complete property data', () => {
      const property = transformOpenrentToMCP(sampleOpenrentProperty);
      const result = validateTransformedProperty(property);
      
      // Property should be valid but may have warnings for missing optional data
      expect(result.isValid).toBe(false); // Will have warnings for missing postcode, images, etc.
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings).toContain('No postcode available');
    });

    it('should detect missing required fields', () => {
      const incompleteProperty = {
        ...transformOpenrentToMCP(sampleOpenrentProperty),
        title: '',
        price: { amount: 0, currency: 'GBP', type: 'rent' as const, display: '£0' }
      };
      
      const result = validateTransformedProperty(incompleteProperty);
      
      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain('Missing property title');
      expect(result.warnings).toContain('Missing or invalid price');
    });

    it('should detect unusual data values', () => {
      const unusualProperty = {
        ...transformOpenrentToMCP(sampleOpenrentProperty),
        price: { amount: 50000, currency: 'GBP', type: 'rent' as const, display: '£50,000' },
        specifications: { ...transformOpenrentToMCP(sampleOpenrentProperty).specifications, bedrooms: 15 }
      };
      
      const result = validateTransformedProperty(unusualProperty);
      
      expect(result.warnings).toContain('Unusually high price - may need verification');
      expect(result.warnings).toContain('Unusually high bedroom count - may need verification');
    });
  });

  describe('transformOpenrentProperties', () => {
    it('should transform multiple properties', () => {
      const properties = [sampleOpenrentProperty, sampleOpenrentPropertyWeekly];
      const result = transformOpenrentProperties(properties);
      
      expect(result).toHaveLength(2);
      expect(result[0].price.period).toBe('monthly');
      expect(result[1].price.period).toBe('monthly'); // Weekly converted to monthly
    });

    it('should handle errors gracefully', () => {
      const properties = [
        sampleOpenrentProperty,
        { ...sampleOpenrentProperty, id: null as any }, // Invalid property
        sampleOpenrentPropertyWeekly
      ];
      
      const result = transformOpenrentProperties(properties);
      
      expect(result).toHaveLength(3); // All properties should be transformed, even invalid ones
    });
  });

  describe('getTransformationStats', () => {
    it('should calculate transformation statistics', () => {
      const original = [sampleOpenrentProperty, sampleOpenrentPropertyWeekly];
      const transformed = transformOpenrentProperties(original);
      const stats = getTransformationStats(original, transformed);
      
      expect(stats.total).toBe(2);
      expect(stats.successful).toBe(2);
      expect(stats.failed).toBe(0);
      expect(stats.successRate).toBe(100);
      expect(stats.averagePrice).toBe(1895); // (1800 + 1989) / 2 rounded - weekly converted to monthly
      expect(stats.propertyTypes['2 Bedroom Flat']).toBe(1);
      expect(stats.propertyTypes['1 Bedroom Flat']).toBe(1);
    });

    it('should handle failed transformations', () => {
      const original = [sampleOpenrentProperty];
      const transformed: any[] = []; // No successful transformations
      const stats = getTransformationStats(original, transformed);
      
      expect(stats.total).toBe(1);
      expect(stats.successful).toBe(0);
      expect(stats.failed).toBe(1);
      expect(stats.successRate).toBe(0);
      expect(stats.averagePrice).toBe(0);
    });
  });
}); 