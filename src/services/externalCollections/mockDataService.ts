import { ExternalCollectedProperty, ExternalCollectionsSearchRequest, ExternalCollectionsSearchResponse, ExternalCollectionsTestData } from '../../types/externalCollections';

/**
 * Mock Data Service for External Collections
 * Provides realistic mock data for testing the external collections feature
 * 
 * ⚠️ IMPORTANT: All properties in this service are TEST LISTINGS
 * These should be clearly marked and easily identifiable for deprecation
 */

// Generate realistic mock properties
const generateMockProperties = (): ExternalCollectedProperty[] => {
  const locations = [
    { city: 'London', areas: ['Chelsea', 'Kensington', 'Islington', 'Camden', 'Hackney', 'Walthamstow', 'Brixton', 'Clapham'] },
    { city: 'Manchester', areas: ['Northern Quarter', 'Spinningfields', 'Deansgate', 'Castlefield', 'Ancoats', 'Hulme'] },
    { city: 'Birmingham', areas: ['Jewellery Quarter', 'Digbeth', 'Moseley', 'Edgbaston', 'Harborne', 'Kings Heath'] },
    { city: 'Leeds', areas: ['City Centre', 'Headingley', 'Chapel Allerton', 'Roundhay', 'Meanwood', 'Kirkstall'] },
    { city: 'Liverpool', areas: ['City Centre', 'Baltic Triangle', 'Georgian Quarter', 'Lark Lane', 'Woolton', 'Allerton'] }
  ];

  const propertyTypes = ['Apartment', 'House', 'Studio', 'Maisonette', 'Penthouse', 'Townhouse'];
  const features = [
    'Furnished', 'Unfurnished', 'Parking', 'Garden', 'Balcony', 'Gym', 'Concierge', 
    'Pet Friendly', 'Bike Storage', 'Security System', 'Smart Home', 'Period Features',
    'Recently Renovated', 'South Facing', 'Open Plan', 'High Ceilings', 'Fireplace'
  ];

  const agents = [
    { name: 'Sarah Johnson', company: 'Foxtons', phone: '+44 20 7123 4567', email: 'sarah.johnson@foxtons.com' },
    { name: 'David Brown', company: 'Knight Frank', phone: '+44 20 7123 4568', email: 'david.brown@knightfrank.com' },
    { name: 'Emma Wilson', company: 'Savills', phone: '+44 20 7123 4569', email: 'emma.wilson@savills.com' },
    { name: 'Michael Davis', company: 'Berkeley Group', phone: '+44 20 7123 4570', email: 'michael.davis@berkeley.com' },
    { name: 'Lisa Anderson', company: 'Rightmove', phone: '+44 20 7123 4571', email: 'lisa.anderson@rightmove.com' }
  ];

  const sources: Array<'rightmove' | 'zoopla' | 'openrent' | 'onthemarket'> = ['rightmove', 'zoopla', 'openrent', 'onthemarket'];

  return Array.from({ length: 50 }, (_, index) => {
    const location = locations[Math.floor(Math.random() * locations.length)];
    const area = location.areas[Math.floor(Math.random() * location.areas.length)];
    const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
    const agent = agents[Math.floor(Math.random() * agents.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];
    const isRent = Math.random() > 0.3; // 70% rentals, 30% sales
    
    const bedrooms = propertyType === 'Studio' ? 1 : Math.floor(Math.random() * 4) + 1;
    const bathrooms = Math.floor(Math.random() * 3) + 1;
    
    const basePrice = isRent ? 
      (bedrooms * 800 + Math.random() * 400) : 
      (bedrooms * 150000 + Math.random() * 100000);
    
    const price = Math.round(basePrice / 100) * 100;
    
    const selectedFeatures = features
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 6) + 2);

    const postcodes = {
      'London': ['SW1A 1AA', 'W1A 1AA', 'E1 6BT', 'N1 1AA', 'SE1 1AA'],
      'Manchester': ['M1 1AA', 'M2 1AA', 'M3 1AA', 'M4 1AA', 'M5 1AA'],
      'Birmingham': ['B1 1AA', 'B2 1AA', 'B3 1AA', 'B4 1AA', 'B5 1AA'],
      'Leeds': ['LS1 1AA', 'LS2 1AA', 'LS3 1AA', 'LS4 1AA', 'LS5 1AA'],
      'Liverpool': ['L1 1AA', 'L2 1AA', 'L3 1AA', 'L4 1AA', 'L5 1AA']
    };

    const postcode = postcodes[location.city as keyof typeof postcodes][Math.floor(Math.random() * 5)];

    return {
      id: `TEST-HARVESTED-${source.toUpperCase()}-${index + 1}`,
      source,
      title: `[TEST LISTING] ${propertyType} in ${area}, ${location.city}`,
      price: {
        amount: price,
        currency: 'GBP',
        type: isRent ? 'rent' : 'sale',
        period: isRent ? 'monthly' : undefined,
        display: isRent ? `£${price.toLocaleString()}/month` : `£${price.toLocaleString()}`
      },
      location: {
        address: `[TEST] ${Math.floor(Math.random() * 999) + 1} ${area} Street`,
        city: location.city,
        postcode,
        coordinates: [
          51.5074 + (Math.random() - 0.5) * 0.1, // London area
          -0.1278 + (Math.random() - 0.5) * 0.1
        ],
        area
      },
      specifications: {
        bedrooms,
        bathrooms,
        propertyType,
        totalArea: Math.floor(Math.random() * 200) + 50,
        parkingSpaces: Math.random() > 0.5 ? Math.floor(Math.random() * 2) + 1 : 0,
        yearBuilt: Math.floor(Math.random() * 50) + 1970
      },
      features: selectedFeatures,
      description: `[TEST LISTING] Beautiful ${propertyType.toLowerCase()} in the heart of ${area}. This property features ${bedrooms} bedroom${bedrooms > 1 ? 's' : ''} and ${bathrooms} bathroom${bathrooms > 1 ? 's' : ''}. ${selectedFeatures.slice(0, 2).join(', ')}. Perfect for ${isRent ? 'renting' : 'buying'} in this sought-after location. This is a test listing for development purposes.`,
      images: [
        {
          src: `/images/listings/property-${Math.floor(Math.random() * 5) + 1}.jpg`,
          alt: `[TEST] ${propertyType} in ${area}`,
          isPrimary: true
        },
        {
          src: `/images/listings/property-${Math.floor(Math.random() * 5) + 1}.jpg`,
          alt: `[TEST] ${propertyType} interior`,
          isPrimary: false
        }
      ],
      agent: {
        name: `[TEST] ${agent.name}`,
        company: `[TEST] ${agent.company}`,
        phone: agent.phone,
        email: agent.email,
        photo: `/images/agents/agent-${Math.floor(Math.random() * 3) + 1}.jpg`
      },
      amenities: {
        nearby: ['Supermarket', 'Restaurants', 'Public Transport', 'Schools'],
        onsite: selectedFeatures.filter(f => ['Gym', 'Concierge', 'Parking', 'Garden'].includes(f))
      },
      status: 'available' as const,
      metadata: {
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastUpdated: new Date().toISOString(),
        searchScore: Math.random() * 100,
        viewCount: Math.floor(Math.random() * 100),
        testEnvironment: true
      },
      contactUrl: `https://${source}.co.uk/contact/${index + 1}`,
      propertyUrl: `https://${source}.co.uk/property/${index + 1}`
    };
  });
};

// Mock search history
const generateMockSearchHistory = () => {
  const queries = [
    '[TEST] 2 bedroom flat in London',
    '[TEST] 3 bedroom house in Manchester',
    '[TEST] Studio apartment in Birmingham',
    '[TEST] Family home in Leeds',
    '[TEST] Penthouse in Liverpool',
    '[TEST] Pet friendly property',
    '[TEST] Garden flat',
    '[TEST] Parking included',
    '[TEST] Furnished apartment',
    '[TEST] Period property'
  ];

  return queries.map((query, index) => ({
    query,
    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    resultCount: Math.floor(Math.random() * 20) + 5
  }));
};

// Mock contact history
const generateMockContactHistory = () => {
  const statuses: Array<'pending' | 'contacted' | 'viewing-arranged'> = ['pending', 'contacted', 'viewing-arranged'];
  
  return Array.from({ length: 10 }, (_, index) => ({
    propertyId: `TEST-HARVESTED-RIGHTMOVE-${index + 1}`,
    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: statuses[Math.floor(Math.random() * statuses.length)]
  }));
};

class MockDataService {
  private mockProperties: ExternalCollectedProperty[];
  private searchHistory: Array<{ query: string; timestamp: string; resultCount: number }>;
  private contactHistory: Array<{ propertyId: string; timestamp: string; status: 'pending' | 'contacted' | 'viewing-arranged' }>;

  constructor() {
    this.mockProperties = generateMockProperties();
    this.searchHistory = generateMockSearchHistory();
    this.contactHistory = generateMockContactHistory();
  }

  /**
   * Search for properties using mock data
   */
  async searchProperties(request: ExternalCollectionsSearchRequest): Promise<ExternalCollectionsSearchResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    let filteredProperties = [...this.mockProperties];

    // Filter by query
    if (request.query) {
      const query = request.query.toLowerCase();
      filteredProperties = filteredProperties.filter(property =>
        property.title.toLowerCase().includes(query) ||
        property.location.address.toLowerCase().includes(query) ||
        property.location.city.toLowerCase().includes(query) ||
        property.description.toLowerCase().includes(query)
      );
    }

    // Filter by location
    if (request.location) {
      const location = request.location.toLowerCase();
      filteredProperties = filteredProperties.filter(property =>
        property.location.city.toLowerCase().includes(location) ||
        property.location.area?.toLowerCase().includes(location)
      );
    }

    // Filter by price range
    if (request.priceRange) {
      filteredProperties = filteredProperties.filter(property =>
        property.price.amount >= request.priceRange!.min &&
        property.price.amount <= request.priceRange!.max
      );
    }

    // Filter by property type
    if (request.propertyType && request.propertyType.length > 0) {
      filteredProperties = filteredProperties.filter(property =>
        request.propertyType!.some(type => 
          property.specifications.propertyType.toLowerCase().includes(type.toLowerCase())
        )
      );
    }

    // Filter by bedrooms
    if (request.bedrooms) {
      filteredProperties = filteredProperties.filter(property =>
        property.specifications.bedrooms >= request.bedrooms!
      );
    }

    // Filter by type (rent/sale)
    if (request.type) {
      filteredProperties = filteredProperties.filter(property =>
        property.price.type === request.type
      );
    }

    // Filter by features
    if (request.features && request.features.length > 0) {
      filteredProperties = filteredProperties.filter(property =>
        request.features!.some(feature =>
          property.features.some(propFeature =>
            propFeature.toLowerCase().includes(feature.toLowerCase())
          )
        )
      );
    }

    // Calculate relevance score
    const relevanceScore = Math.min(100, Math.max(0, 
      (filteredProperties.length / this.mockProperties.length) * 100
    ));

    // Sort by relevance (search score)
    filteredProperties.sort((a, b) => b.metadata.searchScore - a.metadata.searchScore);

    // Limit results
    const limitedProperties = filteredProperties.slice(0, 20);

    // Add to search history
    this.searchHistory.unshift({
      query: request.query,
      timestamp: new Date().toISOString(),
      resultCount: limitedProperties.length
    });

    return {
      properties: limitedProperties,
      totalCount: filteredProperties.length,
      searchQuery: request.query,
      searchTimestamp: new Date().toISOString(),
      sources: ['rightmove', 'zoopla', 'openrent', 'onthemarket'],
      relevanceScore
    };
  }

  /**
   * Get property by ID
   */
  async getPropertyById(id: string): Promise<ExternalCollectedProperty | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.mockProperties.find(property => property.id === id) || null;
  }

  /**
   * Get search history
   */
  async getSearchHistory(): Promise<Array<{ query: string; timestamp: string; resultCount: number }>> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.searchHistory.slice(0, 10);
  }

  /**
   * Get contact history
   */
  async getContactHistory(): Promise<Array<{ propertyId: string; timestamp: string; status: 'pending' | 'contacted' | 'viewing-arranged' }>> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.contactHistory.slice(0, 10);
  }

  /**
   * Get all test data
   */
  async getTestData(): Promise<ExternalCollectionsTestData> {
    return {
      mockProperties: this.mockProperties,
      searchHistory: this.searchHistory,
      contactHistory: this.contactHistory
    };
  }

  /**
   * Reset mock data
   */
  async resetMockData(): Promise<void> {
    this.mockProperties = generateMockProperties();
    this.searchHistory = generateMockSearchHistory();
    this.contactHistory = generateMockContactHistory();
  }

  /**
   * Get test data statistics
   */
  getTestDataStats() {
    return {
      totalProperties: this.mockProperties.length,
      totalSearches: this.searchHistory.length,
      totalContacts: this.contactHistory.length,
      sources: [...new Set(this.mockProperties.map(p => p.source))],
      cities: [...new Set(this.mockProperties.map(p => p.location.city))],
      propertyTypes: [...new Set(this.mockProperties.map(p => p.specifications.propertyType))]
    };
  }
}

export const mockDataService = new MockDataService();
export default mockDataService; 