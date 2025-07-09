import React, { useState, useEffect } from 'react';
import { SearchInput } from '../components/SearchInput';
import { Grid, List, SlidersHorizontal, ExternalLink, Globe, Database, Heart } from 'lucide-react';
import ListingCard from '../components/listings/ListingCard';
import { savedPropertiesService } from '../services/externalCollections/savedPropertiesService';

// Enhanced mock data for external collections - more properties with external sources
const externalMockProperties = [
  {
    id: 'ext-1',
    title: 'Modern 2 Bed Apartment - TEST LISTING',
    price: 2500,
    type: 'rent' as const,
    bedrooms: 2,
    bathrooms: 1,
    isAvailableNow: true,
    source: 'Rightmove',
    sourceUrl: 'https://rightmove.co.uk',
    location: {
      address: '123 Main St, Swiss Cottage',
      city: 'London',
      postcode: 'SW1A 1AA',
      coordinates: [51.5074, -0.1278] as [number, number]
    },
    images: [
      {
        src: '/images/listings/property-main.jpg',
        alt: 'Modern 2 Bed Apartment - Main View',
        loading: 'lazy',
        sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
      },
      {
        src: '/images/listings/property-living.jpg',
        alt: 'Modern 2 Bed Apartment - Living Room',
        loading: 'lazy',
        sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
      }
    ],
    features: ['Furnished', 'Parking', 'Gym', 'Pet Friendly', 'Garden Access', 'Bike Storage'],
    description: 'Beautiful modern apartment in the heart of London with excellent transport links and local amenities.',
    agent: {
      name: 'John Smith',
      company: 'External Agent Ltd',
      phone: '+44 20 7123 4567',
      email: 'john@externalagent.com'
    },
    amenities: {
      schools: 3,
      transport: ['Swiss Cottage Station', 'Finchley Road Station'],
      shops: ['Waitrose', 'Marks & Spencer']
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ext-2',
    title: 'Spacious 3 Bed House - TEST LISTING',
    price: 750000,
    type: 'sale' as const,
    bedrooms: 3,
    bathrooms: 2,
    isAvailableNow: false,
    source: 'Zoopla',
    sourceUrl: 'https://zoopla.co.uk',
    location: {
      address: '456 Park Road, Hampstead',
      city: 'London',
      postcode: 'NW3 2PT',
      coordinates: [51.5225, -0.1389] as [number, number]
    },
    images: [
      {
        src: '/images/listings/property-exterior.jpg',
        alt: 'Spacious 3 Bed House - Exterior',
        loading: 'lazy',
        sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
      },
      {
        src: '/images/listings/property-garden.jpg',
        alt: 'Spacious 3 Bed House - Garden',
        loading: 'lazy',
        sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
      }
    ],
    features: [
      'Garden',
      'Off-street Parking',
      'Recently Renovated',
      'South-Facing Garden',
      'Period Features',
      'Conservatory'
    ],
    description: 'Beautifully presented family home in sought after Hampstead location. Close to excellent schools and parks.',
    agent: {
      name: 'Sarah Johnson',
      company: 'Hampstead Properties',
      phone: '+44 20 7123 4568',
      email: 'sarah@hampsteadproperties.com'
    },
    amenities: {
      schools: 5,
      transport: ['Hampstead Station', 'Belsize Park Station'],
      shops: ['Sainsbury\'s', 'Local Shops']
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ext-3',
    title: 'Luxury 1 Bed Flat - TEST LISTING',
    price: 1800,
    type: 'rent' as const,
    bedrooms: 1,
    bathrooms: 1,
    isAvailableNow: true,
    source: 'OnTheMarket',
    sourceUrl: 'https://onthemarket.com',
    location: {
      address: '789 High Street, St John\'s Wood',
      city: 'London',
      postcode: 'NW8 7DH',
      coordinates: [51.5315, -0.1740] as [number, number]
    },
    images: [
      {
        src: '/images/listings/property-main.jpg',
        alt: 'Luxury 1 Bed Flat - Main View',
        loading: 'lazy',
        sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
      },
      {
        src: '/images/listings/property-living.jpg',
        alt: 'Luxury 1 Bed Flat - Living Area',
        loading: 'lazy',
        sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
      }
    ],
    features: [
      'Concierge',
      'Balcony',
      'Underground Parking',
      'Gym Access',
      'Smart Home System',
      '24/7 Security'
    ],
    description: 'Stunning one-bedroom apartment in prestigious St John\'s Wood development with 24-hour concierge.',
    agent: {
      name: 'David Brown',
      company: 'Luxury London Lettings',
      phone: '+44 20 7123 4569',
      email: 'david@luxurylondon.com'
    },
    amenities: {
      schools: 4,
      transport: ['St John\'s Wood Station', 'Maida Vale Station'],
      shops: ['Tesco Express', 'High Street Shops']
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ext-4',
    title: 'Studio Apartment - TEST LISTING',
    price: 1200,
    type: 'rent' as const,
    bedrooms: 0,
    bathrooms: 1,
    isAvailableNow: true,
    source: 'Gumtree',
    sourceUrl: 'https://gumtree.com',
    location: {
      address: '321 Camden High Street, Camden',
      city: 'London',
      postcode: 'NW1 7JE',
      coordinates: [51.5390, -0.1426] as [number, number]
    },
    images: [
      {
        src: '/images/listings/property-main.jpg',
        alt: 'Studio Apartment - Main View',
        loading: 'lazy',
        sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
      }
    ],
    features: [
      'Furnished',
      'Bills Included',
      'High-Speed Internet',
      'Security System',
      'Bike Storage'
    ],
    description: 'Cozy studio apartment in vibrant Camden area, perfect for young professionals.',
    agent: {
      name: 'Emma Wilson',
      company: 'Camden Lettings',
      phone: '+44 20 7123 4570',
      email: 'emma@camdenlettings.com'
    },
    amenities: {
      schools: 2,
      transport: ['Camden Town Station', 'Camden Road Station'],
      shops: ['Camden Market', 'Sainsbury\'s Local']
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ext-5',
    title: '4 Bed Family Home - TEST LISTING',
    price: 1200000,
    type: 'sale' as const,
    bedrooms: 4,
    bathrooms: 3,
    isAvailableNow: false,
    source: 'PrimeLocation',
    sourceUrl: 'https://primelocation.com',
    location: {
      address: '567 Richmond Road, Richmond',
      city: 'London',
      postcode: 'TW10 5EF',
      coordinates: [51.4613, -0.3031] as [number, number]
    },
    images: [
      {
        src: '/images/listings/property-exterior.jpg',
        alt: '4 Bed Family Home - Exterior',
        loading: 'lazy',
        sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
      },
      {
        src: '/images/listings/property-garden.jpg',
        alt: '4 Bed Family Home - Garden',
        loading: 'lazy',
        sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
      }
    ],
    features: [
      'Large Garden',
      'Double Garage',
      'Period Features',
      'Conservatory',
      'Home Office',
      'Wine Cellar'
    ],
    description: 'Magnificent family home in prestigious Richmond location with stunning gardens and period features.',
    agent: {
      name: 'Michael Thompson',
      company: 'Richmond Estates',
      phone: '+44 20 7123 4571',
      email: 'michael@richmondestates.com'
    },
    amenities: {
      schools: 6,
      transport: ['Richmond Station', 'North Sheen Station'],
      shops: ['Richmond High Street', 'Waitrose']
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ext-6',
    title: 'Penthouse Suite - TEST LISTING',
    price: 3500,
    type: 'rent' as const,
    bedrooms: 2,
    bathrooms: 2,
    isAvailableNow: true,
    source: 'OpenRent',
    sourceUrl: 'https://openrent.co.uk',
    location: {
      address: '999 Canary Wharf, Docklands',
      city: 'London',
      postcode: 'E14 5AB',
      coordinates: [51.5054, -0.0235]
    },
    images: [
      {
        src: '/images/listings/property-main.jpg',
        alt: 'Penthouse Suite - Main View',
        loading: 'lazy',
        sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
      },
      {
        src: '/images/listings/property-living.jpg',
        alt: 'Penthouse Suite - Living Area',
        loading: 'lazy',
        sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
      }
    ],
    features: [
      'River Views',
      'Private Balcony',
      'Concierge Service',
      'Gym & Pool',
      'Underground Parking',
      'Smart Home System'
    ],
    description: 'Luxurious penthouse with stunning river views in the heart of Canary Wharf.',
    agent: {
      name: 'Lisa Chen',
      company: 'Docklands Luxury',
      phone: '+44 20 7123 4572',
      email: 'lisa@docklandsluxury.com'
    },
    amenities: {
      schools: 3,
      transport: ['Canary Wharf Station', 'Heron Quays Station'],
      shops: ['Canary Wharf Shopping Centre', 'Waitrose']
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const ExternalCollectionsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [properties] = useState(externalMockProperties);
  const [hasResults, setHasResults] = useState(true);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [savedProperties, setSavedProperties] = useState<Set<string>>(new Set());

  // Load saved properties on component mount
  useEffect(() => {
    const savedIds = new Set(
      savedPropertiesService.getSavedProperties().map(prop => prop.id)
    );
    setSavedProperties(savedIds);
  }, []);

  const handleSearch = (query: string) => {
    console.log('Searching external collections for:', query);
    const filteredProperties = externalMockProperties.filter(property =>
      property.title.toLowerCase().includes(query.toLowerCase()) ||
      property.location.address.toLowerCase().includes(query.toLowerCase()) ||
      property.source.toLowerCase().includes(query.toLowerCase())
    );
    setHasResults(filteredProperties.length > 0);
  };

  const handleToggleFavorite = (property: typeof externalMockProperties[0]) => {
    const isCurrentlySaved = savedProperties.has(property.id);
    
    if (isCurrentlySaved) {
      savedPropertiesService.removeProperty(property.id);
      setSavedProperties(prev => {
        const newSet = new Set(prev);
        newSet.delete(property.id);
        return newSet;
      });
    } else {
      savedPropertiesService.saveProperty(property);
      setSavedProperties(prev => new Set([...prev, property.id]));
    }
  };

  const getUniqueSources = () => {
    const sources = externalMockProperties.map(p => p.source);
    return ['all', ...Array.from(new Set(sources))];
  };

  const filteredProperties = selectedSource === 'all' 
    ? properties 
    : properties.filter(p => p.source === selectedSource);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900">External Collections</h1>
        </div>
        <p className="text-gray-600 max-w-3xl">
          Discover properties from multiple external sources including Rightmove, Zoopla, OnTheMarket, and more. 
          All properties are marked as TEST LISTINGS for development purposes.
        </p>
      </div>

      {/* Search Section */}
      <div className="mb-8">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          className="max-w-3xl mx-auto"
          hasResults={hasResults}
        />
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">External Properties</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Globe className="w-4 h-4" />
            <span>{filteredProperties.length} properties from {getUniqueSources().length - 1} sources</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Source Filter */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {getUniqueSources().map(source => (
              <option key={source} value={source}>
                {source === 'all' ? 'All Sources' : source}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Results Grid/List */}
      <div
        className={`grid gap-6 ${
          viewMode === 'grid'
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1'
        }`}
      >
        {filteredProperties.map((property) => (
          <div key={property.id} className="relative">
            <ListingCard
              property={property}
              viewMode={viewMode}
            />
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredProperties.length === 0 && (
        <div className="text-center py-12">
          <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or source filter.</p>
        </div>
      )}
    </div>
  );
};

export default ExternalCollectionsPage; 