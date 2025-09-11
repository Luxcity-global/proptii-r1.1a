import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, PoundSterling, Bed, Clock, Target } from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
  value: any;
  type: 'price_range' | 'bedrooms' | 'property_type' | 'location' | 'smart';
  confidence?: number;
  isActive: boolean;
}

interface IntelligentFilterPanelProps {
  onFiltersChange: (filters: any) => void;
  searchQuery: string;
  propertyCount: number;
  isVisible: boolean;
  onClose: () => void;
}

const IntelligentFilterPanel: React.FC<IntelligentFilterPanelProps> = ({
  onFiltersChange,
  searchQuery,
  propertyCount,
  isVisible,
  onClose,
}) => {
  const [activeFilters, setActiveFilters] = useState<FilterOption[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<FilterOption[]>([]);

  // Generate smart filter suggestions based on search query and results
  useEffect(() => {
    const suggestions: FilterOption[] = [];
    const lowerQuery = searchQuery.toLowerCase();

    // Smart price suggestions based on query
    const priceMatch = lowerQuery.match(/£?(\d+)(k|m)?/i);
    if (priceMatch) {
      const amount = parseInt(priceMatch[1]);
      const unit = priceMatch[2]?.toLowerCase();
      const maxPrice = unit === 'k' ? amount * 1000 : unit === 'm' ? amount * 1000000 : amount;
      
      suggestions.push({
        id: 'price_under',
        label: `Under £${unit === 'k' ? amount + 'k' : unit === 'm' ? amount + 'm' : amount.toLocaleString()}`,
        value: { maxPrice },
        type: 'price_range',
        confidence: 0.9,
        isActive: false,
      });
    }

    // Smart bedroom suggestions
    const bedroomMatch = lowerQuery.match(/(\d+)\s*(bed|bedroom)/);
    if (bedroomMatch) {
      const beds = parseInt(bedroomMatch[1]);
      suggestions.push({
        id: 'bedrooms_exact',
        label: `${beds} bedroom${beds > 1 ? 's' : ''}`,
        value: { bedrooms: beds },
        type: 'bedrooms',
        confidence: 0.85,
        isActive: false,
      });
    }

    // Smart property type suggestions
    if (lowerQuery.includes('rent') || lowerQuery.includes('let')) {
      suggestions.push({
        id: 'property_type_rent',
        label: 'To Rent',
        value: { propertyType: 'rent' },
        type: 'property_type',
        confidence: 0.95,
        isActive: false,
      });
    }
    if (lowerQuery.includes('buy') || lowerQuery.includes('sale')) {
      suggestions.push({
        id: 'property_type_buy',
        label: 'For Sale',
        value: { propertyType: 'sale' },
        type: 'property_type',
        confidence: 0.95,
        isActive: false,
      });
    }

    // Smart location suggestions
    const locations = ['Bromley', 'Orpington', 'London', 'Swiss Cottage', 'Camden'];
    locations.forEach(location => {
      if (lowerQuery.includes(location.toLowerCase())) {
        suggestions.push({
          id: `location_${location.toLowerCase()}`,
          label: `In ${location}`,
          value: { location },
          type: 'location',
          confidence: 0.8,
          isActive: false,
        });
      }
    });

    // AI-powered suggestions based on common patterns
    if (propertyCount > 20) {
      suggestions.push({
        id: 'popular_areas',
        label: 'Popular areas',
        value: { sortBy: 'popularity' },
        type: 'smart',
        confidence: 0.7,
        isActive: false,
      });
    }

    if (propertyCount > 50) {
      suggestions.push({
        id: 'new_listings',
        label: 'New listings',
        value: { sortBy: 'date' },
        type: 'smart',
        confidence: 0.6,
        isActive: false,
      });
    }

    setSmartSuggestions(suggestions);
  }, [searchQuery, propertyCount]);

  const handleFilterToggle = (filter: FilterOption) => {
    const updatedFilters = activeFilters.filter(f => f.id !== filter.id);
    
    if (!filter.isActive) {
      const newFilter = { ...filter, isActive: true };
      updatedFilters.push(newFilter);
    }
    
    setActiveFilters(updatedFilters);
    
    // Combine all active filters
    const combinedFilters = updatedFilters.reduce((acc, filter) => {
      return { ...acc, ...filter.value };
    }, {});
    
    console.log('🎯 [INTELLIGENT_FILTERS] Filters updated:', combinedFilters);
    onFiltersChange(combinedFilters);
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    onFiltersChange({});
    console.log('🎯 [INTELLIGENT_FILTERS] All filters cleared');
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '20px',
    }} onClick={onClose}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Sparkles style={{ width: 24, height: 24, color: '#E65D24' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#23272f', margin: 0 }}>
              Smart Filters
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
            }}
          >
            <span style={{ fontSize: '24px', color: '#888' }}>×</span>
          </button>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#23272f' }}>
                Active Filters ({activeFilters.length})
              </span>
              <button
                onClick={clearAllFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#E65D24',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Clear all
              </button>
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
            }}>
              {activeFilters.map(filter => (
                <span
                  key={filter.id}
                  style={{
                    background: '#E65D24',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {filter.label}
                  <button
                    onClick={() => handleFilterToggle(filter)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Suggestions */}
        {smartSuggestions.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}>
              <Target style={{ width: 16, height: 16, color: '#E65D24' }} />
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#23272f' }}>
                AI Suggestions
              </span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
            }}>
              {smartSuggestions.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => handleFilterToggle(filter)}
                  style={{
                    background: filter.isActive ? '#E65D24' : '#f8f9fa',
                    color: filter.isActive ? '#fff' : '#23272f',
                    border: '1px solid',
                    borderColor: filter.isActive ? '#E65D24' : '#e5e5e5',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  <span>{filter.label}</span>
                  <span style={{
                    background: filter.isActive ? 'rgba(255,255,255,0.2)' : '#e5e5e5',
                    color: filter.isActive ? '#fff' : '#888',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}>
                    {Math.round((filter.confidence || 0) * 100)}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Filters */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
          }}>
            <TrendingUp style={{ width: 16, height: 16, color: '#E65D24' }} />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#23272f' }}>
              Quick Filters
            </span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px',
          }}>
            <button
              onClick={() => handleFilterToggle({
                id: 'price_under_1000',
                label: 'Under £1,000',
                value: { maxPrice: 1000 },
                type: 'price_range',
                isActive: false,
              })}
              style={{
                background: '#f8f9fa',
                border: '1px solid #e5e5e5',
                borderRadius: '12px',
                padding: '12px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#23272f',
              }}
            >
              <PoundSterling style={{ width: 16, height: 16, color: '#E65D24' }} />
              Under £1,000
            </button>
            <button
              onClick={() => handleFilterToggle({
                id: 'bedrooms_2',
                label: '2+ Bedrooms',
                value: { minBedrooms: 2 },
                type: 'bedrooms',
                isActive: false,
              })}
              style={{
                background: '#f8f9fa',
                border: '1px solid #e5e5e5',
                borderRadius: '12px',
                padding: '12px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#23272f',
              }}
            >
              <Bed style={{ width: 16, height: 16, color: '#E65D24' }} />
              2+ Bedrooms
            </button>
            <button
              onClick={() => handleFilterToggle({
                id: 'new_listings',
                label: 'New Listings',
                value: { sortBy: 'date' },
                type: 'smart',
                isActive: false,
              })}
              style={{
                background: '#f8f9fa',
                border: '1px solid #e5e5e5',
                borderRadius: '12px',
                padding: '12px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#23272f',
              }}
            >
              <Clock style={{ width: 16, height: 16, color: '#E65D24' }} />
              New Listings
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div style={{
          background: '#f8f9fa',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#23272f', marginBottom: '4px' }}>
            {propertyCount} properties found
          </div>
          <div style={{ fontSize: '14px', color: '#888' }}>
            {activeFilters.length > 0 
              ? `Filtered by ${activeFilters.length} criteria`
              : 'Showing all properties'
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntelligentFilterPanel; 