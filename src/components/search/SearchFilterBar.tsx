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
  setSortBy?: (sort: SortOption) => void;
  resetFilters: () => void;
  removeFilter: (key: string) => void;
  variant?: 'inline' | 'card';
  showSort?: boolean;
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
  variant = 'inline',
  showSort = false,
  className = '',
}) => {
  const [activeOpenPopover, setActiveOpenPopover] = useState<string | null>(null);

  // Price inline pill label (replaces raw label + count badge when active)
  const isPriceActive = filters.minPrice !== null || filters.maxPrice !== null;
  let priceLabel = 'Price';
  if (filters.minPrice !== null && filters.maxPrice !== null) {
    priceLabel = `£${filters.minPrice.toLocaleString('en-GB')}–£${filters.maxPrice.toLocaleString('en-GB')}`;
  } else if (filters.minPrice !== null) {
    priceLabel = `From £${filters.minPrice.toLocaleString('en-GB')}`;
  } else if (filters.maxPrice !== null) {
    priceLabel = `Up to £${filters.maxPrice.toLocaleString('en-GB')}`;
  }

  // Bedroom inline pill label
  const isBedsActive = filters.bedrooms !== 'any' && Array.isArray(filters.bedrooms) && filters.bedrooms.length > 0;
  let bedsLabel = 'Bedrooms';
  if (isBedsActive && Array.isArray(filters.bedrooms)) {
    const formatted = filters.bedrooms.map((b) => (b === 0 ? 'Studio' : b >= 4 ? '4+' : `${b}`));
    bedsLabel =
      formatted.length === 1 && formatted[0] === 'Studio'
        ? 'Studio'
        : `${formatted.join(', ')} ${filters.bedrooms.length === 1 && filters.bedrooms[0] === 1 ? 'bed' : 'beds'}`;
  }

  // Property type inline pill label
  const isTypesActive = filters.propertyTypes.length > 0;
  const TYPE_LABELS: Record<PropertyTypeCategory, string> = {
    flat: 'Flats',
    house: 'Houses',
    studio: 'Studios',
    bungalow: 'Bungalows',
  };
  const typesLabel = isTypesActive
    ? filters.propertyTypes.length === 1
      ? TYPE_LABELS[filters.propertyTypes[0]] || 'Property Type'
      : `${filters.propertyTypes.length} types`
    : 'Property Type';

  const containerClass =
    variant === 'card'
      ? `max-sm:relative bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 transition-all ${className}`
      : `max-sm:relative pt-2.5 border-t border-slate-100 transition-all ${className}`;

  return (
    <div className={containerClass}>
      {/* Top Filter Bar Controls — 3 core facets (Price, Bedrooms, Property Type) + Clear all */}
      <div className="flex items-center justify-between gap-2.5 flex-wrap">
        <div className="flex flex-wrap items-center gap-2 max-sm:w-full">
          {/* Price Popover */}
          <FilterPillDropdown
            label={priceLabel}
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
            label={bedsLabel}
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
            label={typesLabel}
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
        </div>

        {/* Right: Reset action (or Sort when explicitly enabled) */}
        <div className="ml-auto flex items-center gap-3 max-sm:ml-0">
          {counts.hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-semibold text-[#136C9E] hover:text-[#0f5a85] hover:underline px-2 py-1 rounded-md transition-colors"
            >
              Clear all
            </button>
          )}
          {showSort && setSortBy && <SortDropdown sortBy={filters.sortBy} onSelect={setSortBy} />}
        </div>
      </div>

      {/* Active Filter Chips Sub-bar (only secondary/modal filters in harmonized inline mode) */}
      <ActiveFilterChips
        filters={filters}
        counts={counts}
        onRemoveFilter={removeFilter}
        onResetAll={resetFilters}
        secondaryOnly={variant === 'inline'}
      />
    </div>
  );
};
