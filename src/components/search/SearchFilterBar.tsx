import React, { useState } from 'react';
import type { 
  PropertyFilterState, 
  PropertyTypeCategory, 
  SortOption, 
  FilterCounts 
} from '../../types/filter';
import { FilterPillDropdown } from './FilterPillDropdown';
import { PriceFilterPopover } from './PriceFilterPopover';
import { BedroomsFilterPopover } from './BedroomsFilterPopover';
import { PropertyTypePopover } from './PropertyTypePopover';
import { SortDropdown } from './SortDropdown';
import { ActiveFilterChips } from './ActiveFilterChips';

interface SearchFilterBarProps {
  filters: PropertyFilterState;
  counts: FilterCounts;
  setPriceRange: (min: number | null, max: number | null) => void;
  toggleBedroom: (bed: number) => void;
  setBedrooms: (beds: number[] | 'any') => void;
  togglePropertyType: (type: PropertyTypeCategory) => void;
  setFurnishing?: (f: 'furnished' | 'unfurnished' | 'any') => void;
  toggleParking?: () => void;
  toggleBalconyOrGarden?: () => void;
  setSortBy: (sort: SortOption) => void;
  resetFilters: () => void;
  removeFilter: (key: string) => void;
  className?: string;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  filters,
  counts,
  setPriceRange,
  toggleBedroom,
  setBedrooms,
  togglePropertyType,
  setFurnishing,
  toggleParking,
  toggleBalconyOrGarden,
  setSortBy,
  resetFilters,
  removeFilter,
  className = '',
}) => {
  const [activeOpenPopover, setActiveOpenPopover] = useState<string | null>(null);

  // Price pill badge label
  let priceBadge: string | null = null;
  const isPriceActive = filters.minPrice !== null || filters.maxPrice !== null;
  if (filters.minPrice !== null && filters.maxPrice !== null) {
    priceBadge = `£${filters.minPrice}–£${filters.maxPrice}`;
  } else if (filters.minPrice !== null) {
    priceBadge = `From £${filters.minPrice}`;
  } else if (filters.maxPrice !== null) {
    priceBadge = `Up to £${filters.maxPrice}`;
  }

  // Bedroom pill badge label
  const isBedsActive = filters.bedrooms !== 'any' && Array.isArray(filters.bedrooms) && filters.bedrooms.length > 0;
  let bedsBadge: string | null = null;
  if (isBedsActive && Array.isArray(filters.bedrooms)) {
    bedsBadge = filters.bedrooms
      .map((b) => (b === 0 ? 'Studio' : b >= 4 ? '4+' : `${b}`))
      .join(', ');
  }

  // Property type badge
  const isTypesActive = filters.propertyTypes.length > 0;
  const typesBadge = isTypesActive ? `${filters.propertyTypes.length}` : null;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 transition-all ${className}`}>
      {/* Top Filter Bar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Quick Pill Popovers */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Price Popover */}
          <FilterPillDropdown
            label="Price"
            badge={priceBadge}
            isActive={isPriceActive}
            isOpen={activeOpenPopover === 'price'}
            onToggle={() => setActiveOpenPopover(activeOpenPopover === 'price' ? null : 'price')}
            onClose={() => setActiveOpenPopover(null)}
          >
            <PriceFilterPopover
              minPrice={filters.minPrice}
              maxPrice={filters.maxPrice}
              onApply={(min, max) => {
                setPriceRange(min, max);
                setActiveOpenPopover(null);
              }}
              onClear={() => {
                setPriceRange(null, null);
                setActiveOpenPopover(null);
              }}
            />
          </FilterPillDropdown>

          {/* Bedrooms Popover */}
          <FilterPillDropdown
            label="Bedrooms"
            badge={bedsBadge}
            isActive={isBedsActive}
            isOpen={activeOpenPopover === 'bedrooms'}
            onToggle={() => setActiveOpenPopover(activeOpenPopover === 'bedrooms' ? null : 'bedrooms')}
            onClose={() => setActiveOpenPopover(null)}
          >
            <BedroomsFilterPopover
              bedrooms={filters.bedrooms}
              onToggle={toggleBedroom}
              onSetAny={() => setBedrooms('any')}
              onClose={() => setActiveOpenPopover(null)}
            />
          </FilterPillDropdown>

          {/* Property Type Popover */}
          <FilterPillDropdown
            label="Property Type"
            badge={typesBadge}
            isActive={isTypesActive}
            isOpen={activeOpenPopover === 'types'}
            onToggle={() => setActiveOpenPopover(activeOpenPopover === 'types' ? null : 'types')}
            onClose={() => setActiveOpenPopover(null)}
          >
            <PropertyTypePopover
              selectedTypes={filters.propertyTypes}
              onToggle={togglePropertyType}
              onClear={() => removeFilter('propertyTypes')}
              onClose={() => setActiveOpenPopover(null)}
            />
          </FilterPillDropdown>

          {/* Furnished Quick Toggle */}
          <button
            type="button"
            onClick={() => {
              if (setFurnishing) {
                setFurnishing(filters.furnishing === 'furnished' ? 'any' : 'furnished');
              }
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all shadow-xs ${
              filters.furnishing === 'furnished'
                ? 'bg-[#136C9E] text-white border border-[#136C9E]'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span>Furnished</span>
          </button>

          {/* Parking Quick Toggle */}
          <button
            type="button"
            onClick={() => toggleParking?.()}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all shadow-xs ${
              filters.hasParking
                ? 'bg-[#136C9E] text-white border border-[#136C9E]'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span>Parking</span>
          </button>

          {/* Balcony / Garden Quick Toggle */}
          <button
            type="button"
            onClick={() => toggleBalconyOrGarden?.()}
            className={`hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all shadow-xs ${
              filters.hasBalconyOrGarden
                ? 'bg-[#136C9E] text-white border border-[#136C9E]'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span>Balcony/Garden</span>
          </button>
        </div>

        {/* Right: Sort Dropdown */}
        <div className="ml-auto">
          <SortDropdown sortBy={filters.sortBy} onSelect={setSortBy} />
        </div>
      </div>

      {/* Active Filter Chips Sub-bar */}
      <ActiveFilterChips
        filters={filters}
        counts={counts}
        onRemoveFilter={removeFilter}
        onResetAll={resetFilters}
      />
    </div>
  );
};
