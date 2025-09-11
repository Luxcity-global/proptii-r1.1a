import type { AreaInsight } from '../types/areaInsight';

export const mockAreaInsights: Record<string, AreaInsight> = {
  'london': {
    location: 'London',
    averageRent: {
      amount: 3200,
      currency: 'USD',
      propertyType: '1-BR',
      period: 'monthly'
    },
    amenities: [
      {
        category: 'Dining',
        items: ['World-class restaurants', 'International cuisine', 'Street food markets']
      },
      {
        category: 'Arts & Culture',
        items: ['Museums and galleries', 'Theaters and cinemas', 'Art exhibitions']
      },
      {
        category: 'Parks & Recreation',
        items: ['Hyde Park', 'Regent\'s Park', 'Greenwich Park', 'Victoria Park']
      },
      {
        category: 'Shopping',
        items: ['Oxford Street', 'Covent Garden', 'Camden Market', 'Westfield']
      }
    ],
    transport: [
      {
        type: 'Underground',
        details: 'Extensive Tube network with 11 lines covering all areas'
      },
      {
        type: 'Buses',
        details: '24/7 bus service with over 700 routes'
      },
      {
        type: 'Rail',
        details: 'National Rail, Overground, and Elizabeth Line connections'
      },
      {
        type: 'Cycling',
        details: 'Santander Cycles and dedicated cycle lanes'
      }
    ],
    marketTrends: {
      trend: 'rising',
      percentage: 5.2,
      description: 'Rental prices have increased by 5.2% in the last 12 months'
    },
    neighborhoodInfo: {
      description: 'London offers diverse neighborhoods from historic Westminster to trendy Shoreditch, each with unique character and amenities.',
      highlights: [
        'Historic landmarks and royal palaces',
        'Vibrant nightlife and entertainment',
        'Excellent educational institutions',
        'Major business and financial districts'
      ]
    }
  },
  'manchester': {
    location: 'Manchester',
    averageRent: {
      amount: 1800,
      currency: 'USD',
      propertyType: '1-BR',
      period: 'monthly'
    },
    amenities: [
      {
        category: 'Entertainment',
        items: ['Music venues and clubs', 'Sports stadiums', 'Shopping centers']
      },
      {
        category: 'Culture',
        items: ['Museums and galleries', 'Theaters', 'Historical sites']
      },
      {
        category: 'Parks',
        items: ['Heaton Park', 'Fletcher Moss Park', 'Platt Fields Park']
      },
      {
        category: 'Shopping',
        items: ['Arndale Centre', 'Trafford Centre', 'Northern Quarter']
      }
    ],
    transport: [
      {
        type: 'Tram',
        details: 'Metrolink tram system connecting city center and suburbs'
      },
      {
        type: 'Buses',
        details: 'Comprehensive bus network operated by multiple companies'
      },
      {
        type: 'Rail',
        details: 'Major rail hub with connections to London and other cities'
      },
      {
        type: 'Cycling',
        details: 'Dedicated cycle lanes and bike-sharing schemes'
      }
    ],
    marketTrends: {
      trend: 'stable',
      percentage: 2.1,
      description: 'Rental market remains stable with moderate 2.1% growth'
    },
    neighborhoodInfo: {
      description: 'Manchester combines industrial heritage with modern development, offering affordable living with excellent amenities.',
      highlights: [
        'Rich industrial and musical heritage',
        'Major universities and research institutions',
        'Growing tech and media sectors',
        'Affordable cost of living compared to London'
      ]
    }
  },
  'birmingham': {
    location: 'Birmingham',
    averageRent: {
      amount: 1400,
      currency: 'USD',
      propertyType: '1-BR',
      period: 'monthly'
    },
    amenities: [
      {
        category: 'Shopping',
        items: ['Bullring Shopping Centre', 'Grand Central', 'Jewellery Quarter']
      },
      {
        category: 'Culture',
        items: ['Birmingham Museum', 'Symphony Hall', 'Library of Birmingham']
      },
      {
        category: 'Parks',
        items: ['Cannon Hill Park', 'Sutton Park', 'Lickey Hills']
      },
      {
        category: 'Entertainment',
        items: ['Broad Street nightlife', 'Arenas and theaters', 'Sports venues']
      }
    ],
    transport: [
      {
        type: 'Rail',
        details: 'Major rail hub with high-speed connections to London'
      },
      {
        type: 'Buses',
        details: 'Extensive bus network including night buses'
      },
      {
        type: 'Tram',
        details: 'Midland Metro tram system'
      },
      {
        type: 'Cycling',
        details: 'Cycle routes and bike-sharing available'
      }
    ],
    marketTrends: {
      trend: 'rising',
      percentage: 3.8,
      description: 'Growing rental market with 3.8% increase year-over-year'
    },
    neighborhoodInfo: {
      description: 'Birmingham offers excellent value for money with a diverse cultural scene and strong transport links.',
      highlights: [
        'Second largest city in the UK',
        'Major business and conference center',
        'Excellent transport connectivity',
        'Affordable housing market'
      ]
    }
  }
};

export const getMockAreaInsight = (location: string): AreaInsight | null => {
  const normalizedLocation = location.toLowerCase().trim();
  
  // Try exact match first
  if (mockAreaInsights[normalizedLocation]) {
    return mockAreaInsights[normalizedLocation];
  }
  
  // Try partial matches
  for (const [key, insight] of Object.entries(mockAreaInsights)) {
    if (normalizedLocation.includes(key) || key.includes(normalizedLocation)) {
      return insight;
    }
  }
  
  // Return London as default if no match found
  return mockAreaInsights['london'];
}; 