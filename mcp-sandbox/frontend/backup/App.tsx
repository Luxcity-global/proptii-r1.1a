import React, { useState } from 'react';
import { SearchInput } from './components/SearchInput';
import { Grid, List, SlidersHorizontal } from 'lucide-react';
import ListingCard from './components/ListingCard';

// Mock data - replace with actual API call
interface Property {
  id: string;
  title: string;
  price: number;
  type: 'rent' | 'sale';
  bedrooms: number;
  bathrooms: number;
  isAvailableNow: boolean;
  location: {
    address: string;
    city: string;
    postcode: string;
    coordinates: [number, number];
  };
  images: {
    src: string;
    alt: string;
    loading: string;
    sizes: string;
  }[];
  features: string[];
  description: string;
  agent: {
    name: string;
    company: string;
    phone: string;
    email: string;
  };
  amenities: {
    schools: number;
    transport: string[];
    shops: string[];
  };
  createdAt: string;
  updatedAt: string;
}

const mockProperties: Property[] = [
  {
    id: '1',
    title: 'Modern 2 Bed Apartment',
    price: 2500,
    type: 'rent',
    bedrooms: 2,
    bathrooms: 1,
    isAvailableNow: true,
    location: {
      address: '123 Main St, Swiss Cottage',
      city: 'London',
      postcode: 'SW1A 1AA',
      coordinates: [51.5074, -0.1278]
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
      },
      {
        src: '/images/listings/property-kitchen.jpg',
        alt: 'Modern 2 Bed Apartment - Kitchen',
        loading: 'lazy',
        sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
      },
      {
        src: '/images/listings/property-bedroom.jpg',
        alt: 'Modern 2 Bed Apartment - Bedroom',
        loading: 'lazy',
        sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
      }
    ],
    features: ['Furnished', 'Parking', 'Gym', 'Pet Friendly', 'Garden Access', 'Bike Storage'],
    description: 'Beautiful modern apartment in the heart of London with excellent transport links and local amenities.',
    agent: {
      name: 'John Smith',
      company: 'Proptii Agents',
      phone: '+44 20 7123 4567',
      email: 'john@proptii.com'
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
    id: '2',
    title: 'Spacious 3 Bed House',
    price: 750000,
    type: 'sale',
    bedrooms: 3,
    bathrooms: 2,
    isAvailableNow: false,
    location: {
      address: '456 Park Road, Hampstead',
      city: 'London',
      postcode: 'NW3 2PT',
      coordinates: [51.5225, -0.1389]
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
      },
      {
        src: '/images/listings/property-dining.jpg',
        alt: 'Spacious 3 Bed House - Dining Room',
        loading: 'lazy',
        sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
      },
      {
        src: '/images/listings/property-bathroom.jpg',
        alt: 'Spacious 3 Bed House - Bathroom',
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
      company: 'Proptii Agents',
      phone: '+44 20 7123 4568',
      email: 'sarah@proptii.com'
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
    id: '3',
    title: 'Luxury 1 Bed Flat',
    price: 1800,
    type: 'rent',
    bedrooms: 1,
    bathrooms: 1,
    isAvailableNow: true,
    location: {
      address: '789 High Street, St John\'s Wood',
      city: 'London',
      postcode: 'NW8 7DH',
      coordinates: [51.5315, -0.1740]
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
      },
      {
        src: '/images/listings/property-kitchen.jpg',
        alt: 'Luxury 1 Bed Flat - Kitchen',
        loading: 'lazy',
        sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
      },
      {
        src: '/images/listings/property-bedroom.jpg',
        alt: 'Luxury 1 Bed Flat - Bedroom',
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
      company: 'Proptii Agents',
      phone: '+44 20 7123 4569',
      email: 'david@proptii.com'
    },
    amenities: {
      schools: 4,
      transport: ['St John\'s Wood Station', 'Maida Vale Station'],
      shops: ['Tesco Express', 'High Street Shops']
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [properties] = useState(mockProperties);
  const [hasResults, setHasResults] = useState(true);

  const handleSearch = (query: string) => {
    // Implement search logic
    const filteredProperties = mockProperties.filter(property =>
      property.title.toLowerCase().includes(query.toLowerCase()) ||
      property.location.address.toLowerCase().includes(query.toLowerCase())
    );
    setHasResults(filteredProperties.length > 0);
  };

  return (
    <div className="page-container mx-auto max-w-6xl px-4 py-10 min-h-screen bg-[#f5f6fa]">
      {/* Search Section */}
      <section className="search-section flex flex-col items-center mb-10">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          className="w-full max-w-2xl"
          hasResults={hasResults}
        />
      </section>

      {/* Header and Controls */}
      <section className="header-section flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Available Properties</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-gray-100'}`}
            aria-label="Grid view"
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-gray-100'}`}
            aria-label="List view"
          >
            <List className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg bg-gray-100" aria-label="Filter options">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Property Cards Grid */}
      <section className={`results-section grid gap-8 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
        {properties.map((property) => (
          <ListingCard
            key={property.id}
            property={property}
            viewMode={viewMode}
          />
        ))}
      </section>
    </div>
  );
};

export default App;
