export interface NeighborhoodData {
  postcode: string;
  location: {
    city: string;
    area: string;
    coordinates: [number, number];
  };
  walkabilityScore: number;
  transportScore: number;
  schoolScore: number;
  safetyScore: number;
  amenities: {
    nearby: string[];
    distance: Record<string, number>;
  };
  transportLinks: {
    tube: string[];
    bus: string[];
    train: string[];
    cycle: string[];
  };
  schools: {
    name: string;
    type: 'primary' | 'secondary' | 'college' | 'university';
    rating: number;
    distance: number;
  }[];
  crimeStats: {
    totalIncidents: number;
    crimeRate: number;
    safetyLevel: 'very_safe' | 'safe' | 'moderate' | 'unsafe' | 'very_unsafe';
    recentIncidents: any[];
  };
  marketData: {
    averagePrice: number;
    priceTrend: 'rising' | 'falling' | 'stable';
    rentalYield: number;
    demandLevel: 'high' | 'medium' | 'low';
  };
  qualityOfLife: {
    airQuality: number;
    noiseLevel: number;
    greenSpaces: number;
    culturalAttractions: number;
  };
}

export interface TransportInfo {
  tubeStations: {
    name: string;
    lines: string[];
    distance: number;
    walkingTime: number;
  }[];
  busRoutes: {
    number: string;
    destination: string;
    frequency: string;
    distance: number;
  }[];
  trainStations: {
    name: string;
    services: string[];
    distance: number;
    walkingTime: number;
  }[];
  walkabilityScore: number;
  cyclingRoutes: {
    name: string;
    type: 'superhighway' | 'quietway' | 'local';
    distance: number;
  }[];
}

export interface AmenityInfo {
  name: string;
  type: 'supermarket' | 'restaurant' | 'coffee' | 'bank' | 'pharmacy' | 'post_office' | 'gym' | 'park' | 'school' | 'hospital' | 'shopping' | 'entertainment';
  distance: number;
  rating?: number;
  openingHours?: string;
  features?: string[];
}

export class NeighborhoodMCP {
  private cache: Map<string, NeighborhoodData> = new Map();

  async getNeighborhoodData(postcode: string): Promise<NeighborhoodData | null> {
    console.log(`🏘️ Getting neighborhood data for: ${postcode}`);
    
    // Return null for invalid postcodes
    if (!this.isValidPostcode(postcode)) {
      return null;
    }

    // Check cache first
    if (this.cache.has(postcode)) {
      console.log(`📋 Returning cached data for ${postcode}`);
      return this.cache.get(postcode)!;
    }

    try {
      // Generate mock neighborhood data
      const neighborhoodData = this.generateMockNeighborhoodData(postcode);
      
      // Cache the result
      this.cache.set(postcode, neighborhoodData);
      
      return neighborhoodData;
    } catch (error) {
      console.error('❌ Neighborhood data error:', error);
      throw error;
    }
  }

  private isValidPostcode(postcode: string): boolean {
    // Accepts UK postcode patterns like SW1A 1AA, W1A 1AA, etc.
    if (postcode === 'INVALID') return false;
    return /^[A-Z]{1,2}\d{1,2}[A-Z]? ?\d[A-Z]{2}$/i.test(postcode.trim());
  }

  async getTransportInfo(postcode: string): Promise<TransportInfo> {
    console.log(`🚇 Getting transport info for: ${postcode}`);
    
    const neighborhoodData = await this.getNeighborhoodData(postcode);
    if (!neighborhoodData) {
      throw new Error('No neighborhood data found for postcode: ' + postcode);
    }

    try {
      // Generate detailed transport information
      const transportInfo: TransportInfo = {
        tubeStations: [
          {
            name: `${neighborhoodData.location.area} Station`,
            lines: neighborhoodData.transportLinks.tube,
            distance: Math.round(Math.random() * 500 + 200),
            walkingTime: Math.round(Math.random() * 8 + 3)
          },
          {
            name: `${neighborhoodData.location.area} Central`,
            lines: ['Central Line', 'Northern Line'],
            distance: Math.round(Math.random() * 800 + 400),
            walkingTime: Math.round(Math.random() * 12 + 6)
          }
        ],
        busRoutes: neighborhoodData.transportLinks.bus.map(route => ({
          number: route.split(' ')[1],
          destination: 'Central London',
          frequency: 'Every 5-10 minutes',
          distance: Math.round(Math.random() * 300 + 100)
        })),
        trainStations: [
          {
            name: `${neighborhoodData.location.area} Railway Station`,
            services: ['London Bridge', 'Waterloo', 'Victoria'],
            distance: Math.round(Math.random() * 1000 + 500),
            walkingTime: Math.round(Math.random() * 15 + 8)
          }
        ],
        walkabilityScore: neighborhoodData.walkabilityScore,
        cyclingRoutes: [
          {
            name: 'Cycle Superhighway 1',
            type: 'superhighway',
            distance: Math.round(Math.random() * 500 + 200)
          },
          {
            name: `${neighborhoodData.location.area} Quietway`,
            type: 'quietway',
            distance: Math.round(Math.random() * 300 + 100)
          }
        ]
      };

      return transportInfo;
    } catch (error) {
      console.error('❌ Transport info error:', error);
      throw error;
    }
  }

  async getAmenities(postcode: string): Promise<AmenityInfo[]> {
    console.log(`🏪 Getting amenities for: ${postcode}`);
    
    const neighborhoodData = await this.getNeighborhoodData(postcode);
    if (!neighborhoodData) {
      throw new Error('No neighborhood data found for postcode: ' + postcode);
    }

    try {
      // Generate detailed amenities information
      const amenities: AmenityInfo[] = [
        {
          name: 'Tesco Express',
          type: 'supermarket',
          distance: neighborhoodData.amenities.distance['Supermarket'],
          rating: 4.2,
          openingHours: '7:00 AM - 11:00 PM',
          features: ['Fresh produce', 'Bakery', 'ATM']
        },
        {
          name: 'The Local Restaurant',
          type: 'restaurant',
          distance: neighborhoodData.amenities.distance['Restaurants'],
          rating: 4.5,
          openingHours: '12:00 PM - 10:00 PM',
          features: ['British cuisine', 'Outdoor seating', 'Vegetarian options']
        },
        {
          name: 'Costa Coffee',
          type: 'coffee',
          distance: neighborhoodData.amenities.distance['Coffee Shops'],
          rating: 4.0,
          openingHours: '6:30 AM - 7:00 PM',
          features: ['Free WiFi', 'Outdoor seating', 'Loyalty program']
        },
        {
          name: 'Barclays Bank',
          type: 'bank',
          distance: neighborhoodData.amenities.distance['Banks'],
          rating: 3.8,
          openingHours: '9:00 AM - 5:00 PM',
          features: ['ATM', 'Counter service', 'Business banking']
        },
        {
          name: 'Boots Pharmacy',
          type: 'pharmacy',
          distance: neighborhoodData.amenities.distance['Pharmacies'],
          rating: 4.1,
          openingHours: '8:00 AM - 8:00 PM',
          features: ['Prescription service', 'Health advice', 'Beauty products']
        },
        {
          name: 'Royal Mail Post Office',
          type: 'post_office',
          distance: neighborhoodData.amenities.distance['Post Office'],
          rating: 3.9,
          openingHours: '9:00 AM - 5:30 PM',
          features: ['Postal services', 'Parcels', 'Passport photos']
        },
        {
          name: 'PureGym',
          type: 'gym',
          distance: neighborhoodData.amenities.distance['Gym'],
          rating: 4.3,
          openingHours: '24/7',
          features: ['Cardio equipment', 'Weights', 'Classes', 'Personal training']
        },
        {
          name: `${neighborhoodData.location.area} Park`,
          type: 'park',
          distance: neighborhoodData.amenities.distance['Parks'],
          rating: 4.6,
          openingHours: 'Dawn to Dusk',
          features: ['Playground', 'Walking paths', 'Picnic areas', 'Sports facilities']
        },
        {
          name: `${neighborhoodData.location.area} Primary School`,
          type: 'school',
          distance: neighborhoodData.amenities.distance['Schools'],
          rating: 4.4,
          features: ['Ofsted Outstanding', 'After-school clubs', 'Sports facilities']
        },
        {
          name: 'St Thomas Hospital',
          type: 'hospital',
          distance: neighborhoodData.amenities.distance['Hospitals'],
          rating: 4.2,
          openingHours: '24/7',
          features: ['A&E', 'Maternity', 'Outpatient services']
        }
      ];

      return amenities;
    } catch (error) {
      console.error('❌ Amenities error:', error);
      throw error;
    }
  }

  private generateMockNeighborhoodData(postcode: string): NeighborhoodData {
    // Extract area from postcode (simple mapping)
    const areaMap: Record<string, string> = {
      'SW1A': 'Westminster',
      'W1A': 'Westminster',
      'E1': 'Tower Hamlets',
      'N1': 'Islington',
      'SE1': 'Southwark',
      'M1': 'Manchester City Centre',
      'M2': 'Manchester City Centre',
      'B1': 'Birmingham City Centre',
      'B2': 'Birmingham City Centre'
    };

    const postcodePrefix = postcode.split(' ')[0];
    const area = areaMap[postcodePrefix] || 'Central London';
    const city = postcodePrefix.startsWith('M') ? 'Manchester' : 
                 postcodePrefix.startsWith('B') ? 'Birmingham' : 'London';

    // Generate realistic coordinates based on area
    const coordinates: [number, number] = this.getCoordinatesForArea(area);

    return {
      postcode,
      location: {
        city,
        area,
        coordinates
      },
      walkabilityScore: Math.round(Math.random() * 30 + 70), // 70-100
      transportScore: Math.round(Math.random() * 20 + 80), // 80-100
      schoolScore: Math.round(Math.random() * 25 + 75), // 75-100
      safetyScore: Math.round(Math.random() * 30 + 70), // 70-100
      amenities: {
        nearby: [
          'Supermarket',
          'Restaurants',
          'Coffee Shops',
          'Banks',
          'Pharmacies',
          'Post Office',
          'Gym',
          'Parks',
          'Schools',
          'Hospitals'
        ],
        distance: {
          'Supermarket': Math.round(Math.random() * 500 + 100),
          'Restaurants': Math.round(Math.random() * 300 + 50),
          'Coffee Shops': Math.round(Math.random() * 200 + 50),
          'Banks': Math.round(Math.random() * 400 + 100),
          'Pharmacies': Math.round(Math.random() * 300 + 100),
          'Post Office': Math.round(Math.random() * 600 + 200),
          'Gym': Math.round(Math.random() * 800 + 200),
          'Parks': Math.round(Math.random() * 1000 + 300),
          'Schools': Math.round(Math.random() * 800 + 200),
          'Hospitals': Math.round(Math.random() * 2000 + 500)
        }
      },
      transportLinks: {
        tube: ['Central Line', 'Piccadilly Line', 'Northern Line'].slice(0, Math.floor(Math.random() * 3) + 1),
        bus: ['Bus 24', 'Bus 29', 'Bus 73', 'Bus 134'].slice(0, Math.floor(Math.random() * 4) + 1),
        train: ['London Bridge', 'Waterloo', 'Victoria'].slice(0, Math.floor(Math.random() * 3) + 1),
        cycle: ['Cycle Superhighway 1', 'Cycle Superhighway 2'].slice(0, Math.floor(Math.random() * 2) + 1)
      },
      schools: [
        {
          name: `${area} Primary School`,
          type: 'primary' as const,
          rating: Math.round(Math.random() * 2 + 3), // 3-5
          distance: Math.round(Math.random() * 800 + 200)
        },
        {
          name: `${area} Secondary School`,
          type: 'secondary' as const,
          rating: Math.round(Math.random() * 2 + 3), // 3-5
          distance: Math.round(Math.random() * 1200 + 300)
        },
        {
          name: `${area} College`,
          type: 'college' as const,
          rating: Math.round(Math.random() * 2 + 3), // 3-5
          distance: Math.round(Math.random() * 1500 + 500)
        }
      ],
      crimeStats: {
        totalIncidents: Math.floor(Math.random() * 50 + 10),
        crimeRate: Math.round((Math.random() * 20 + 10) * 100) / 100, // 10-30 per 1000
        safetyLevel: this.getSafetyLevel(Math.random()),
        recentIncidents: [
          {
            type: 'Anti-social behaviour',
            date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            location: `${area} High Street`
          },
          {
            type: 'Theft',
            date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            location: `${area} Shopping Centre`
          }
        ]
      },
      marketData: {
        averagePrice: Math.round((Math.random() * 200000 + 400000) / 1000) * 1000, // 400k-600k
        priceTrend: Math.random() > 0.5 ? 'rising' : 'stable',
        rentalYield: Math.round((Math.random() * 2 + 3) * 100) / 100, // 3-5%
        demandLevel: Math.random() > 0.7 ? 'high' : 'medium'
      },
      qualityOfLife: {
        airQuality: Math.round(Math.random() * 20 + 80), // 80-100
        noiseLevel: Math.round(Math.random() * 30 + 40), // 40-70
        greenSpaces: Math.round(Math.random() * 25 + 75), // 75-100
        culturalAttractions: Math.round(Math.random() * 20 + 80) // 80-100
      }
    };
  }

  private getCoordinatesForArea(area: string): [number, number] {
    const coordinates: Record<string, [number, number]> = {
      'Westminster': [51.5074, -0.1278],
      'Tower Hamlets': [51.5200, -0.0290],
      'Islington': [51.5362, -0.1033],
      'Southwark': [51.5020, -0.1050],
      'Manchester City Centre': [53.4808, -2.2426],
      'Birmingham City Centre': [52.4862, -1.8904]
    };

    return coordinates[area] || [51.5074, -0.1278]; // Default to London
  }

  private getSafetyLevel(randomValue: number): 'very_safe' | 'safe' | 'moderate' | 'unsafe' | 'very_unsafe' {
    if (randomValue < 0.2) return 'very_safe';
    if (randomValue < 0.5) return 'safe';
    if (randomValue < 0.8) return 'moderate';
    if (randomValue < 0.95) return 'unsafe';
    return 'very_unsafe';
  }
} 