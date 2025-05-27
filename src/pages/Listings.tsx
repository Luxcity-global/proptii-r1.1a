import React, { useState } from 'react';
import { SearchInput } from '../components/SearchInput';
import { Grid, List, SlidersHorizontal } from 'lucide-react';
import ListingCard from '../components/listings/ListingCard';

// Mock data - replace with actual API call
const mockProperties = [
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
    images: ['https://placehold.co/600x400'],
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
    images: ['https://placehold.co/600x400'],
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
    images: ['https://placehold.co/600x400'],
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

const Listings: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [properties] = useState(mockProperties);
  const [hasResults, setHasResults] = useState(true);

  const handleSearch = (query: string) => {
    // Implement search logic
    console.log('Searching for:', query);
    // For now, we'll just filter the mock properties
    const filteredProperties = mockProperties.filter(property => 
      property.title.toLowerCase().includes(query.toLowerCase()) ||
      property.location.address.toLowerCase().includes(query.toLowerCase())
    );
    setHasResults(filteredProperties.length > 0);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          className="max-w-3xl mx-auto"
          hasResults={hasResults}
        />
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Available Properties</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${
              viewMode === 'grid' ? 'bg-primary text-white' : 'bg-gray-100'
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${
              viewMode === 'list' ? 'bg-primary text-white' : 'bg-gray-100'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg bg-gray-100">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        className={`grid gap-6 ${
          viewMode === 'grid'
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1'
        }`}
      >
        {properties.map((property) => (
          <ListingCard
            key={property.id}
            property={property}
            viewMode={viewMode}
          />
        ))}
      </div>
    </div>
  );
};

export default Listings; 