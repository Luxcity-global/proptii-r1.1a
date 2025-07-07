import React from 'react';
import { X, BedDouble, Bath, Building2, Home, ExternalLink } from 'lucide-react';

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
  bedrooms?: number;
  baths?: number;
  propertyType?: string;
  description?: string;
}

interface SearchResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
}

const SITE_LOGOS: Record<string, string> = {
  rightmove: '/images/rightmove-logo.png',
  zoopla: '/images/zoopla-logo.png',
  openrent: '/images/openrent-logo.png',
  onthemarket: '/images/onthemarket-logo.png'
};

const SearchResultsModal: React.FC<SearchResultsModalProps> = ({
  isOpen,
  onClose,
  property
}) => {
  if (!isOpen || !property) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img
              src={SITE_LOGOS[property.site]}
              alt={`${property.site} logo`}
              className={`object-contain ${property.site === 'zoopla'
                ? 'h-[30px]'
                : 'h-[40px]'
                }`}
            />
            <h2 className="text-2xl font-bold text-gray-800">
              {property.site.charAt(0).toUpperCase() + property.site.slice(1)} Listings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          <div className="space-y-6">
            {/* Property Image Placeholder */}
            <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">Property Image</span>
            </div>

            {/* Property Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-4">{property.exampleListing.title}</h3>
                
                {/* Location and Price */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {property.searchLocation}
                  </span>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                    {property.searchPrice}
                  </span>
                </div>

                {/* Property Types */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {property.propertyTypes.map((type, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {type}
                    </span>
                  ))}
                </div>

                {/* Property Specs */}
                <div className="flex flex-wrap items-center gap-4 mb-4 text-gray-600">
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

                {/* Feature Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
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
                </div>
              </div>

              <div>
                {/* Description */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-2">Description</h4>
                  <p className="text-gray-600 leading-relaxed">
                    {property.exampleListing.description || 'No description available.'}
                  </p>
                </div>

                {/* Contact Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-2">Interested in this property?</h4>
                  <p className="text-gray-600 mb-4 text-sm">
                    Visit the original listing on {property.site.charAt(0).toUpperCase() + property.site.slice(1)} for more details and contact information.
                  </p>
                  
                  {property.searchUrl && (
                    <a
                      href={property.searchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-all text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on {property.site.charAt(0).toUpperCase() + property.site.slice(1)}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResultsModal; 