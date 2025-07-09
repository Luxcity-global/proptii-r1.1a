import React, { useState } from 'react';
import { Search, MapPin, Filter, Grid, List } from 'lucide-react';
import { ExternalCollectionsSearchRequest } from '../../types/externalCollections';
import FeatureGate from '../common/FeatureGate';
import { EXTERNAL_COLLECTIONS_FEATURES } from '../../config/featureFlags';

interface ExternalCollectionsSearchProps {
  onSearch: (request: ExternalCollectionsSearchRequest) => void;
  isLoading?: boolean;
  hasResults?: boolean;
  className?: string;
}

const ExternalCollectionsSearch: React.FC<ExternalCollectionsSearchProps> = ({
  onSearch,
  isLoading = false,
  hasResults = true,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState<string>('');
  const [bedrooms, setBedrooms] = useState<number | ''>('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);

  const propertyTypes = [
    'Any',
    'Apartment',
    'House',
    'Studio',
    'Maisonette',
    'Penthouse',
    'Townhouse'
  ];

  const bedroomOptions = [
    { value: '', label: 'Any' },
    { value: 1, label: '1 bed' },
    { value: 2, label: '2 beds' },
    { value: 3, label: '3 beds' },
    { value: 4, label: '4+ beds' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      return;
    }

    const request: ExternalCollectionsSearchRequest = {
      query: searchQuery.trim(),
      location: location.trim() || undefined,
      propertyType: propertyType && propertyType !== 'Any' ? [propertyType] : undefined,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      priceRange: priceRange.min || priceRange.max ? {
        min: priceRange.min ? Number(priceRange.min) : 0,
        max: priceRange.max ? Number(priceRange.max) : 1000000
      } : undefined,
    };

    onSearch(request);
  };

  const clearFilters = () => {
    setLocation('');
    setPropertyType('');
    setBedrooms('');
    setPriceRange({ min: '', max: '' });
  };

  return (
    <FeatureGate externalCollectionsFeature={EXTERNAL_COLLECTIONS_FEATURES.ENABLE_SEARCH}>
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              id="harvesting-search-query"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for properties (e.g., '2 bed flat in London')"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {/* Quick Filters Toggle */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            
            {showFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-primary transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              {/* Location */}
              <div>
                <label htmlFor="harvesting-location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    id="harvesting-location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City or area"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Property Type */}
              <div>
                <label htmlFor="harvesting-property-type" className="block text-sm font-medium text-gray-700 mb-1">
                  Property Type
                </label>
                <select
                  id="harvesting-property-type"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                >
                  {propertyTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bedrooms */}
              <div>
                <label htmlFor="harvesting-bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                  Bedrooms
                </label>
                <select
                  id="harvesting-bedrooms"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                >
                  {bedroomOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    id="harvesting-price-min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    placeholder="Min"
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  />
                  <input
                    type="number"
                    id="harvesting-price-max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    placeholder="Max"
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Search Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              id="harvesting-search-button"
              disabled={isLoading || !searchQuery.trim()}
              className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search Properties
                </>
              )}
            </button>
          </div>

          {/* No Results Message */}
          {!hasResults && searchQuery && (
            <div className="text-center text-gray-500 py-4">
              No properties found for "{searchQuery}". Try adjusting your search criteria.
            </div>
          )}
        </form>
      </div>
    </FeatureGate>
  );
};

export default ExternalCollectionsSearch; 