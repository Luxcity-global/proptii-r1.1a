import React from 'react';
import { Building2, Bath, BedDouble, Home } from 'lucide-react';

// Logo imports
const SITE_LOGOS = {
  rightmove: '/images/rightmove-logo.png',
  zoopla: '/images/zoopla-logo.png',
  openrent: '/images/openrent-logo.png',
  onthemarket: '/images/onthemarket-logo.png'
} as const;

// Mock data for testing property cards
const mockProperties = [
  {
    id: 'rm-1',
    site: 'rightmove' as const,
    searchLocation: 'Watford',
    searchPrice: '£2,500',
    propertyTypes: ['Flats', 'Apartments'],
    searchUrl: 'https://www.rightmove.co.uk/properties-to-rent/in-watford/?maxPrice=2500&minBedrooms=2',
    specs: {
      beds: 2,
      baths: 1,
      propertyType: 'Flat'
    },
    exampleListing: {
      title: 'Modern 2-bedroom flat in Watford town centre',
      price: '£2,400 pcm',
      description: 'Bright and spacious flat with open-plan living, close to Watford Junction station.'
    }
  },
  {
    id: 'zp-1',
    site: 'zoopla' as const,
    searchLocation: 'Watford',
    searchPrice: '£2,500',
    propertyTypes: ['Flats', 'Apartments'],
    searchUrl: 'https://www.zoopla.co.uk/to-rent/property/watford/?price_max=2500&beds_min=2',
    specs: {
      beds: 2,
      baths: 1,
      propertyType: 'Flat'
    },
    exampleListing: {
      title: 'Stylish 2-bed apartment in Watford',
      price: '£2,350 pcm',
      description: 'Recently renovated flat with a balcony and allocated parking space.'
    }
  },
  {
    id: 'or-1',
    site: 'openrent' as const,
    searchLocation: 'Watford',
    searchPrice: '£2,500',
    propertyTypes: ['Flats', 'Apartments'],
    searchUrl: 'https://www.openrent.co.uk/properties-to-rent/watford?term=watford&prices_max=2500&bedrooms_min=2',
    specs: {
      beds: 2,
      baths: 1,
      propertyType: 'Flat'
    },
    exampleListing: {
      title: 'Spacious 2-bed flat in Watford',
      price: '£2,300 pcm',
      description: 'Features a modern kitchen, en-suite master bedroom, and walking distance to local amenities.'
    }
  },
  {
    id: 'otm-1',
    site: 'onthemarket' as const,
    searchLocation: 'Watford',
    searchPrice: '£2,500',
    propertyTypes: ['Flats', 'Apartments'],
    searchUrl: 'https://www.onthemarket.com/to-rent/property/watford/?max-price=2500&min-beds=2',
    specs: {
      beds: 2,
      baths: 1,
      propertyType: 'Flat'
    },
    exampleListing: {
      title: '2-bedroom apartment near Cassiobury Park, Watford',
      price: '£2,450 pcm',
      description: 'Located in a quiet area, includes private parking and garden access.'
    }
  }
];

const SearchTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Property Search Results Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Cases</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Responsive 2-column layout (desktop/tablet) to 1-column (mobile)</li>
            <li>Property site cards with company logos</li>
            <li>Search location and price badges</li>
            <li>Property type badges</li>
            <li>Room and bathroom icons</li>
            <li>Example listings with prices and descriptions</li>
          </ul>
        </div>

        {/* Grid container with responsive columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockProperties.map((property) => (
            <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Header with logo */}
              <div className="bg-[#f2f1eb] px-6 py-4 border-b flex items-center justify-between">
                <img 
                  src={SITE_LOGOS[property.site]}
                  alt={`${property.site} logo`}
                  className={`object-contain ${
                    property.site === 'zoopla' 
                      ? 'h-[61.5px]' // Previous 41px + 50%
                      : 'h-[100px]' // Previous 50px doubled
                  }`}
                />
              </div>

              {/* Main content */}
              <div className="p-6">
                {/* Location and price */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    {property.searchLocation} Properties
                  </h2>
                  <span className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium">
                    {property.searchPrice}
                  </span>
                </div>

                {/* Property type badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {property.propertyTypes.map((type) => (
                    <span 
                      key={type}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      {type}
                    </span>
                  ))}
                </div>

                {/* Specs with icons */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <BedDouble className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700">{property.specs.beds} beds</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700">{property.specs.baths} bath</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700">{property.specs.propertyType}</span>
                  </div>
                </div>

                {/* Example listing */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold mb-2">{property.exampleListing.title}</h3>
                  <p className="text-primary font-medium mb-2">{property.exampleListing.price}</p>
                  <p className="text-gray-600 text-sm">{property.exampleListing.description}</p>
                </div>

                {/* Search link */}
                <a
                  href={property.searchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary-dark transition-colors"
                >
                  View all {property.searchLocation} properties
                  <Home className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchTest; 