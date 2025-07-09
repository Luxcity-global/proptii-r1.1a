import React, { useState, useEffect } from 'react';
import { ExternalLink, BedDouble, Bath, Building2, Home } from 'lucide-react';
import { Tooltip } from './Tooltip';
import ListingCard from './listings/ListingCard';

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Map backend property objects to ListingCard Property structure
  const mapToListingCardProperty = (property: any, idx: number) => {
    // Fallbacks for missing fields
    const defaultImage = {
      src: property.image || '/images/listing-placeholder.jpg',
      alt: property.title || 'Property image',
      loading: 'lazy',
      sizes: '400px',
    };
    return {
      id: property.id || `${property.title}-${idx}`,
      title: property.title || 'Untitled Property',
      price: Number(property.price?.toString().replace(/[^\d.]/g, '')) || 0,
      type: property.type || (property.searchPrice?.includes('/month') ? 'rent' : 'sale'),
      bedrooms: property.bedrooms || property.specs?.beds || 0,
      bathrooms: property.bathrooms || property.specs?.baths || 0,
      location: {
        address: property.location || property.searchLocation || 'Unknown address',
        city: property.city || '',
        postcode: property.postcode || '',
        coordinates: [0, 0],
      },
      images: property.images && property.images.length > 0 ? property.images : [defaultImage],
      features: property.features || [],
      description: property.description || property.exampleListing?.description || '',
      agent: {
        name: property.agent?.name || 'Agent',
        company: property.agent?.company || 'Proptii Agents',
        phone: property.agent?.phone || '',
        email: property.agent?.email || '',
      },
      amenities: property.amenities || { schools: 0, transport: [], shops: [] },
      createdAt: property.createdAt || new Date().toISOString(),
      updatedAt: property.updatedAt || new Date().toISOString(),
      isAvailableNow: property.isAvailableNow || false,
    };
  };

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {mappedResults.map((property, idx) => (
          <ListingCard
            key={property.id}
            property={mapToListingCardProperty(property, idx)}
            viewMode="grid"
          />
        ))}
      </div>
    </div>
  );
}; 