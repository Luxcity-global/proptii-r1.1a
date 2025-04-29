import React from 'react';
import { ExternalLink, BedDouble, Bath, Building2, Home } from 'lucide-react';

interface PropertySpecs {
  beds: number;
  baths: number;
  area: string;
  propertyType: string;
}

interface Property {
  id: string;
  title: string;
  price: string;
  location: string;
  image: string;
  specs?: PropertySpecs;
  propertyUrl?: string;
  site: 'rightmove' | 'zoopla' | 'openrent' | 'onthemarket';
  searchLocation: string;
  searchPrice: string;
  propertyTypes: string[];
  exampleListing: {
    title: string;
    price: string;
    description: string;
  };
  searchUrl?: string;
}

interface SearchResultsProps {
  searchResponse: Property[];
  isLoading: boolean;
  error: string | null;
}

const SITE_LOGOS: Record<string, string> = {
  rightmove: '/images/rightmove-logo.png',
  zoopla: '/images/zoopla-logo.png',
  openrent: '/images/openrent-logo.png',
  onthemarket: '/images/onthemarket-logo.png'
};

export const SearchResults: React.FC<SearchResultsProps> = ({
  searchResponse,
  isLoading,
  error
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-8">{error}</div>
    );
  }

  if (!searchResponse || searchResponse.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No results found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold mb-6">Search Results</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {searchResponse.map((property) => (
          <div key={property.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Fixed height header section */}
            <div className="bg-[#f2f1eb] px-6 py-4 border-b h-[120px] flex items-center justify-between">
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

            <div className="p-6">
              {/* Location and Price Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {property.searchLocation}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {property.searchPrice}
                </span>
              </div>

              {/* Property Types */}
              <div className="flex flex-wrap gap-2 mb-4">
                {property.propertyTypes.map((type, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {type}
                  </span>
                ))}
              </div>

              {/* Property Specs */}
              <div className="flex items-center gap-4 mb-4 text-gray-600">
                <div className="flex items-center gap-1">
                  <BedDouble className="w-5 h-5" />
                  <span>{property.specs.beds} beds</span>
                </div>
                <div className="flex items-center gap-1">
                  <Bath className="w-5 h-5" />
                  <span>{property.specs.baths} baths</span>
                </div>
                <div className="flex items-center gap-1">
                  <Building2 className="w-5 h-5" />
                  <span>{property.specs.propertyType}</span>
                </div>
              </div>

              {/* Example Listing */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">{property.exampleListing.title}</h3>
                <p className="text-gray-600 text-sm">{property.exampleListing.description}</p>
              </div>

              {/* External Link */}
              <a 
                href={property.searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-all"
              >
                <Home className="w-4 h-4" />
                View Listings on {property.site.charAt(0).toUpperCase() + property.site.slice(1)}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 