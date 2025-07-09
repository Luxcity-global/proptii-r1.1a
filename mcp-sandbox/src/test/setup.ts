// Test setup file for Jest

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.REDIS_URL = 'redis://localhost:6379';

// Global test utilities
(global as any).testUtils = {
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  mockProperty: {
    id: 'test-1',
    title: 'Test Property',
    price: {
      amount: 500000,
      currency: 'GBP',
      type: 'sale' as const,
      display: '£500,000'
    },
    location: {
      address: '123 Test Street',
      city: 'London',
      postcode: 'SW1A 1AA',
      area: 'Test Area'
    },
    specifications: {
      bedrooms: 2,
      bathrooms: 1,
      propertyType: 'Apartment'
    },
    features: ['Furnished', 'Parking'],
    description: 'A beautiful test property',
    images: [{
      src: '/test-image.jpg',
      alt: 'Test Property',
      isPrimary: true
    }],
    agent: {
      name: 'Test Agent',
      company: 'Test Agency'
    },
    amenities: {
      nearby: ['Supermarket', 'Restaurants'],
      onsite: []
    },
    status: 'available' as const,
    metadata: {
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      searchScore: 85,
      viewCount: 100,
      source: 'test'
    }
  }
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  jest.restoreAllMocks();
}); 