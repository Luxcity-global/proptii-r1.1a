import React from 'react';
import { PawPrint, Zap, Car, Trees } from 'lucide-react';
import type { PropertyFilterState, FilterCounts } from '../../types/filter';

interface ActiveFilterChipsProps {
  filters: PropertyFilterState;
  counts: FilterCounts;
  onRemoveFilter: (key: string) => void;
  onResetAll: () => void;
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  filters,
  counts,
  onRemoveFilter,
  onResetAll,
}) => {
  if (!counts.hasActiveFilters) {
    return null;
  }

  const chips: { key: string; label: string; icon?: React.ReactNode }[] = [];

  // Price Chip
  if (filters.minPrice !== null && filters.maxPrice !== null) {
    chips.push({
      key: 'price',
      label: `£${filters.minPrice.toLocaleString('en-GB')} – £${filters.maxPrice.toLocaleString('en-GB')}`,
    });
  } else if (filters.minPrice !== null) {
    chips.push({
      key: 'price',
      label: `From £${filters.minPrice.toLocaleString('en-GB')}`,
    });
  } else if (filters.maxPrice !== null) {
    chips.push({
      key: 'price',
      label: `Up to £${filters.maxPrice.toLocaleString('en-GB')}`,
    });
  }

  // Bedroom Chips
  if (filters.bedrooms !== 'any' && Array.isArray(filters.bedrooms)) {
    filters.bedrooms.forEach((bed) => {
      const label = bed === 0 ? 'Studio' : bed >= 4 ? '4+ Beds' : `${bed} ${bed === 1 ? 'Bed' : 'Beds'}`;
      chips.push({ key: `bedroom_${bed}`, label });
    });
  }

  // Property Type Chips
  filters.propertyTypes.forEach((type) => {
    const labels: Record<string, string> = {
      flat: 'Flats',
      house: 'Houses',
      studio: 'Studios',
      bungalow: 'Bungalows',
    };
    chips.push({ key: `type_${type}`, label: labels[type] || type });
  });

  // Furnishing Chip
  if (filters.furnishing && filters.furnishing !== 'any') {
    chips.push({
      key: 'furnishing',
      label: filters.furnishing === 'furnished' ? 'Furnished' : 'Unfurnished',
    });
  }

  // Parking Chip
  if (filters.hasParking) {
    chips.push({
      key: 'parking',
      label: 'Parking Included',
      icon: <Car className="w-3.5 h-3.5 text-[#136C9E]" aria-hidden="true" />,
    });
  }

  // Balcony / Garden Chip
  if (filters.hasBalconyOrGarden) {
    chips.push({
      key: 'outside',
      label: 'Balcony / Garden',
      icon: <Trees className="w-3.5 h-3.5 text-[#136C9E]" aria-hidden="true" />,
    });
  }

  // Pet Friendly Chip
  if (filters.isPetFriendly) {
    chips.push({
      key: 'pets',
      label: 'Pet Friendly',
      icon: <PawPrint className="w-3.5 h-3.5 text-[#136C9E]" aria-hidden="true" />,
    });
  }

  // Bills Included Chip
  if (filters.billsIncluded) {
    chips.push({
      key: 'bills',
      label: 'Bills Included',
      icon: <Zap className="w-3.5 h-3.5 text-[#136C9E]" aria-hidden="true" />,
    });
  }

  // Keyword Chip
  if (filters.keywords.trim()) {
    chips.push({
      key: 'keywords',
      label: `"${filters.keywords.trim()}"`,
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-3 pb-1 border-t border-gray-100">
      <div className="text-xs font-semibold text-gray-500 mr-1 flex items-center gap-1.5">
        <span>Active filters:</span>
        <span className="text-gray-900 font-bold">
          {counts.filtered} of {counts.total} shown
        </span>
      </div>

      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#136C9E]/10 text-[#136C9E] border border-[#136C9E]/20"
        >
          {chip.icon && <span className="flex-shrink-0">{chip.icon}</span>}
          <span>{chip.label}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter(chip.key)}
            className="hover:text-[#E65D24] p-0.5 rounded-full transition-colors focus:outline-none"
            aria-label={`Remove ${chip.label} filter`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={onResetAll}
        className="text-xs font-semibold text-[#E65D24] hover:underline ml-1 transition-all"
      >
        Clear all
      </button>
    </div>
  );
};
