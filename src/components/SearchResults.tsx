import React from 'react';
import { ExternalLink, BedDouble, Bath, Building2, Home } from 'lucide-react';
import { GuideTooltip } from './GuideTooltip';

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
  furnished?: boolean;
  petFriendly?: boolean;
  garden?: boolean;
  parking?: boolean;
  // Additional properties that might come from backend
  bedrooms?: number;
  baths?: number;
  propertyType?: string;
  description?: string;
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
  // Map backend property objects to a consistent structure for rendering
  const mappedResults = (searchResponse || []).map((property, idx) => {
    // If property.specs exists, use it; otherwise, map flat fields
    const specs = property.specs || {
      beds: property.bedrooms ?? 'N/A',
      baths: property.baths ?? 'N/A',
      propertyType: property.propertyType ?? 'N/A',
    };
    return {
      ...property,
      specs,
      id: property.id || `${property.title}-${idx}`,
      exampleListing: property.exampleListing || {
        title: property.title,
        price: property.price,
        description: property.description || '',
      },
      propertyTypes: property.propertyTypes || (property.propertyType ? [property.propertyType] : []),
      searchLocation: property.searchLocation || property.location || '',
      searchPrice: property.searchPrice || property.price || '',
    };
  });

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
    <div className="space-y-8" role="region" aria-label="Property search results">
      <h2 className="text-2xl font-semibold mb-6" tabIndex={0}>Search Results</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mappedResults.map((property) => (
          <GuideTooltip
            key={property.id}
            content="Found a property you're interested in? Come back to our site with the agent's contact information, and we'll help you proceed with booking a viewing or starting the referencing process. We streamline the entire journey from property discovery to securing your new home."
            title="Next Steps"
            position="top"
            maxWidth="350px"
            showIcon={false}
          >
            <div className="bg-white rounded-lg shadow-lg overflow-hidden" tabIndex={0} aria-label={`Property card: ${property.title}`}>
              {/* Fixed height header section */}
              <div className="bg-[#f2f1eb] px-6 py-4 border-b h-[120px] flex items-center justify-between">
                <img
                  src={SITE_LOGOS[property.site]}
                  alt={`${property.site} logo`}
                  className={`object-contain ${property.site === 'zoopla'
                    ? 'h-[40px]' // Reduced from 61.5px by 6 points
                    : 'h-[100px]' // Previous 50px doubled
                    }`}
                />
              </div>

              <div className="p-6">
                {/* Location and Price Badges */}
                <div className="flex flex-wrap gap-2 mb-4 justify-center sm:justify-start">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {property.searchLocation}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {property.searchPrice}
                  </span>
                </div>

                {/* Property Types */}
                <div className="flex flex-wrap gap-2 mb-4 justify-center sm:justify-start">
                  {property.propertyTypes.map((type, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {type}
                    </span>
                  ))}
                </div>

                {/* Feature Badges */}
                <div className="flex flex-wrap gap-2 mb-4 justify-center sm:justify-start">
                  {property.furnished && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Furnished</span>
                  )}
                  {property.petFriendly && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Pet Friendly</span>
                  )}
                  {property.garden && (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Garden</span>
                  )}
                  {property.parking && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Parking</span>
                  )}
                  {/* Add more feature badges as needed */}
                </div>

                {/* Property Specs */}
                <div className="flex flex-wrap items-center gap-4 mb-4 text-gray-600 justify-center sm:justify-start">
                  <div className="flex items-center gap-1">
                    <BedDouble className="w-5 h-5" />
                    <span>{property.specs?.beds ?? 'N/A'} beds</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath className="w-5 h-5" />
                    <span>{property.specs?.baths ?? 'N/A'} baths</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Building2 className="w-5 h-5" />
                    <span>{property.specs?.propertyType ?? 'N/A'}</span>
                  </div>
                </div>

                {/* Example Listing */}
                <div className="mb-6 text-center sm:text-left">
                  <h3 className="text-lg font-semibold mb-2">{property.exampleListing.title}</h3>
                  <p className="text-gray-600 text-sm">{property.exampleListing.description}</p>
                </div>

                {/* External Link */}
                <div className="flex justify-center sm:justify-start">
                  <a
                    href={property.searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-all"
                    aria-label={`View listings for ${property.title} on ${property.site}`}
                  >
                    <Home className="w-4 h-4" />
                    View Listings on {property.site.charAt(0).toUpperCase() + property.site.slice(1)}
                  </a>
                </div>
              </div>
            </div>
          </GuideTooltip>
        ))}
      </div>
    </div>
  );
}; 