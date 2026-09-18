import React, { useEffect } from 'react';
import { PawPrint, Zap } from 'lucide-react';
import type { 
  PropertyFilterState, 
  PropertyTypeCategory, 
  SortOption, 
  FilterCounts 
} from '../../types/filter';

interface FilterDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: PropertyFilterState;
  counts: FilterCounts;
  setMinPrice: (min: number | null) => void;
  setMaxPrice: (max: number | null) => void;
  toggleBedroom: (bed: number) => void;
  setBedrooms: (beds: number[] | 'any') => void;
  togglePropertyType: (type: PropertyTypeCategory) => void;
  setFurnishing?: (f: 'furnished' | 'unfurnished' | 'any') => void;
  toggleParking?: () => void;
  toggleBalconyOrGarden?: () => void;
  togglePetFriendly?: () => void;
  toggleBillsIncluded?: () => void;
  setKeywords: (kw: string) => void;
  setSortBy: (sort: SortOption) => void;
  resetFilters: () => void;
}

const BEDROOMS = [
  { label: 'Studio', value: 0 },
  { label: '1 Bed', value: 1 },
  { label: '2 Beds', value: 2 },
  { label: '3 Beds', value: 3 },
  { label: '4+ Beds', value: 4 },
];

const PROPERTY_TYPES: { label: string; value: PropertyTypeCategory }[] = [
  { label: 'Flats & Apartments', value: 'flat' },
  { label: 'Houses', value: 'house' },
  { label: 'Studios', value: 'studio' },
  { label: 'Bungalows', value: 'bungalow' },
];

export const FilterDrawerModal: React.FC<FilterDrawerModalProps> = ({
  isOpen,
  onClose,
  filters,
  counts,
  setMinPrice,
  setMaxPrice,
  toggleBedroom,
  setBedrooms,
  togglePropertyType,
  setFurnishing,
  toggleParking,
  toggleBalconyOrGarden,
  togglePetFriendly,
  toggleBillsIncluded,
  setKeywords,
  resetFilters,
}) => {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isBedsAny = filters.bedrooms === 'any' || (Array.isArray(filters.bedrooms) && filters.bedrooms.length === 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">All Filters</h2>
              {counts.hasActiveFilters && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#E65D24] text-white">
                  {counts.activeFilterCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {counts.hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-semibold text-gray-500 hover:text-[#E65D24] transition-colors"
                >
                  Reset all
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Keyword Search */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">Keyword Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Balcony, Garden, Parking, Furnished..."
                  value={filters.keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#136C9E]/30 focus:border-[#136C9E]"
                />
                {filters.keywords && (
                  <button
                    type="button"
                    onClick={() => setKeywords('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">Price Range (Monthly pcm)</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-xs text-gray-500 mb-1 font-medium">Min (£ pcm)</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="No min"
                    value={filters.minPrice != null ? String(filters.minPrice) : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setMinPrice(val ? parseInt(val, 10) : null);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#136C9E]/30 focus:border-[#136C9E]"
                  />
                </div>
                <div>
                  <span className="block text-xs text-gray-500 mb-1 font-medium">Max (£ pcm)</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="No max"
                    value={filters.maxPrice != null ? String(filters.maxPrice) : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setMaxPrice(val ? parseInt(val, 10) : null);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#136C9E]/30 focus:border-[#136C9E]"
                  />
                </div>
              </div>
            </div>

            {/* Bedrooms */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">Bedrooms</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBedrooms('any')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                    isBedsAny
                      ? 'bg-[#136C9E] text-white border-[#136C9E]'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Any
                </button>
                {BEDROOMS.map((bed) => {
                  const selected = !isBedsAny && Array.isArray(filters.bedrooms) && filters.bedrooms.includes(bed.value);
                  return (
                    <button
                      key={bed.value}
                      type="button"
                      onClick={() => toggleBedroom(bed.value)}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                        selected
                          ? 'bg-[#136C9E] text-white border-[#136C9E]'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {bed.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Property Types */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">Property Type</label>
              <div className="space-y-2">
                {PROPERTY_TYPES.map((t) => {
                  const checked = filters.propertyTypes.includes(t.value);
                  return (
                    <label
                      key={t.value}
                      className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${
                        checked
                          ? 'bg-[#136C9E]/5 border-[#136C9E]/40'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePropertyType(t.value)}
                        className="h-4 w-4 text-[#136C9E] rounded border-gray-300 focus:ring-[#136C9E]"
                      />
                      <span className="ml-3 text-xs font-semibold text-gray-800">{t.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Furnishing Preference */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">Furnishing</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Any', value: 'any' },
                  { label: 'Furnished', value: 'furnished' },
                  { label: 'Unfurnished', value: 'unfurnished' },
                ].map((f) => {
                  const selected = filters.furnishing === f.value;
                  return (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setFurnishing?.(f.value as any)}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                        selected
                          ? 'bg-[#136C9E] text-white border-[#136C9E]'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amenities & Outside Space */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">Amenities & Outside Space</label>
              <div className="space-y-2">
                <label className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${
                  filters.hasParking ? 'bg-[#136C9E]/5 border-[#136C9E]/40' : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}>
                  <input
                    type="checkbox"
                    checked={filters.hasParking}
                    onChange={() => toggleParking?.()}
                    className="h-4 w-4 text-[#136C9E] rounded border-gray-300 focus:ring-[#136C9E]"
                  />
                  <span className="ml-3 text-xs font-semibold text-gray-800">Parking Included</span>
                </label>
                <label className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${
                  filters.hasBalconyOrGarden ? 'bg-[#136C9E]/5 border-[#136C9E]/40' : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}>
                  <input
                    type="checkbox"
                    checked={filters.hasBalconyOrGarden}
                    onChange={() => toggleBalconyOrGarden?.()}
                    className="h-4 w-4 text-[#136C9E] rounded border-gray-300 focus:ring-[#136C9E]"
                  />
                  <span className="ml-3 text-xs font-semibold text-gray-800">Balcony / Terrace / Garden</span>
                </label>
                <label className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${
                  filters.isPetFriendly ? 'bg-[#136C9E]/5 border-[#136C9E]/40' : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}>
                  <input
                    type="checkbox"
                    checked={filters.isPetFriendly}
                    onChange={() => togglePetFriendly?.()}
                    className="h-4 w-4 text-[#136C9E] rounded border-gray-300 focus:ring-[#136C9E]"
                  />
                  <span className="ml-3 text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                    <PawPrint className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                    <span>Pet-Friendly Only</span>
                  </span>
                </label>
                <label className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${
                  filters.billsIncluded ? 'bg-[#136C9E]/5 border-[#136C9E]/40' : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}>
                  <input
                    type="checkbox"
                    checked={filters.billsIncluded}
                    onChange={() => toggleBillsIncluded?.()}
                    className="h-4 w-4 text-[#136C9E] rounded border-gray-300 focus:ring-[#136C9E]"
                  />
                  <span className="ml-3 text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                    <span>Bills Included in Rent</span>
                  </span>
                </label>
              </div>
            </div>

          </div>

          {/* Footer CTA */}
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-[#136C9E] to-[#0F5A8A] hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Show {counts.filtered} {counts.filtered === 1 ? 'Property' : 'Properties'}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
