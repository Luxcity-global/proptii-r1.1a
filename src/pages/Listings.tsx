import React, { useState } from 'react';
import { SearchInput } from '../components/SearchInput';
import { Grid, List, SlidersHorizontal } from 'lucide-react';
import ListingCard from '../components/listings/ListingCard';

import apiService from '../services/api';

const Listings: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [properties, setProperties] = useState<any[]>([]);
  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [hasResults, setHasResults] = useState(true);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await apiService.get<any>('/native-properties/search?limit=100');
        if (res.success && res.data?.results) {
          setProperties(res.data.results);
          setAllProperties(res.data.results);
          setHasResults(res.data.results.length > 0);
        }
      } catch (err) {
        console.error('Failed to load listings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setProperties(allProperties);
      setHasResults(allProperties.length > 0);
      return;
    }
    const filteredProperties = allProperties.filter(property =>
      (property.title || '').toLowerCase().includes(query.toLowerCase()) ||
      (property.location || '').toLowerCase().includes(query.toLowerCase()) ||
      (property.city || '').toLowerCase().includes(query.toLowerCase())
    );
    setProperties(filteredProperties);
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
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-gray-100'
              }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-gray-100'
              }`}
          >
            <List className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg bg-gray-100">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : !hasResults ? (
        <div className="text-center text-gray-500 py-12">
          No properties found matching your search criteria.
        </div>
      ) : (
        <div
          className={`grid gap-6 ${viewMode === 'grid'
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
      )}
    </div>
  );
};

export default Listings; 