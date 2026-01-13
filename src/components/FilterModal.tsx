import React, { useState } from 'react';
import { 
  Filter, 
  ChevronDown, 
  DollarSign, 
  Search, 
  Check,
  Wifi,
  Cloud,
  UtensilsCrossed,
  Wind,
  Droplets,
  Refrigerator
} from 'lucide-react';

// Types
export type FilterOption = 'Price' | 'Rooms and beds' | 'Type' | 'Amenities' | 'Book options';

export type AmenityType = 'WIFI' | 'Weather' | 'Kitchen' | 'Air conditioner' | 'Water heater' | 'Refrigerator';

export interface Amenity {
  id: AmenityType;
  label: string;
  icon: React.ReactNode;
}

export interface FilterModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  selectedFilters?: FilterOption[];
  selectedAmenities?: AmenityType[];
  onFilterChange?: (filters: FilterOption[]) => void;
  onAmenityToggle?: (amenity: AmenityType) => void;
  onReset?: () => void;
  onApply?: (filters: FilterOption[], amenities: AmenityType[]) => void;
  resultCount?: number;
  className?: string;
  withOverlay?: boolean;
}

// Amenity configurations
const amenities: Amenity[] = [
  { id: 'WIFI', label: 'WIFI', icon: <Wifi className="w-6 h-6" /> },
  { id: 'Weather', label: 'Weather', icon: <Cloud className="w-6 h-6" /> },
  { id: 'Kitchen', label: 'Kitchen', icon: <UtensilsCrossed className="w-6 h-6" /> },
  { id: 'Air conditioner', label: 'Air conditioner', icon: <Wind className="w-6 h-6" /> },
  { id: 'Water heater', label: 'Water heater', icon: <Droplets className="w-6 h-6" /> },
  { id: 'Refrigerator', label: 'Refrigerator', icon: <Refrigerator className="w-6 h-6" /> },
];

// AmenitiesButton Component
interface AmenitiesButtonProps {
  amenity: Amenity;
  isChecked: boolean;
  onClick: () => void;
  className?: string;
}

const AmenitiesButton: React.FC<AmenitiesButtonProps> = ({ 
  amenity, 
  isChecked, 
  onClick,
  className = '' 
}) => {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-between px-5 py-3.5 rounded-[64px] transition-all duration-200 w-full ${
        isChecked
          ? 'bg-[#f6faff] border border-[#136c9e]'
          : 'bg-white border border-[#e5e0dd]'
      } ${className}`}
    >
      <div className="flex items-center gap-6">
        <div
          className={`flex items-center justify-center p-4 rounded-[64px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] ${
            isChecked
              ? 'bg-gradient-to-br from-[#136c9e] to-[#2f7db0]'
              : 'bg-white border border-[#e5e0dd]'
          }`}
        >
          <div className={isChecked ? 'text-white' : 'text-[#374957]'}>
            {amenity.icon}
          </div>
        </div>
        <p
          className={`font-['Inter'] text-base ${
            isChecked ? 'text-[#374957]' : 'text-[#374957]'
          }`}
        >
          {amenity.label}
        </p>
      </div>
      {isChecked && (
        <div className="relative w-[25px] h-[25px] flex items-center justify-center flex-shrink-0">
          <div className="w-[15px] h-[15px] flex items-center justify-center">
            <Check className="w-full h-full text-[#136c9e]" strokeWidth={3} />
          </div>
        </div>
      )}
    </button>
  );
};

// FilterModal Component
const FilterModal: React.FC<FilterModalProps> = ({
  isOpen = true,
  onClose,
  selectedFilters = [],
  selectedAmenities = [],
  onFilterChange,
  onAmenityToggle,
  onReset,
  onApply,
  resultCount = 72,
  className = '',
  withOverlay = false,
}) => {
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isShowMoreOpen, setIsShowMoreOpen] = useState(false);
  const [localSelectedFilters, setLocalSelectedFilters] = useState<FilterOption[]>(selectedFilters);
  const [localSelectedAmenities, setLocalSelectedAmenities] = useState<AmenityType[]>(selectedAmenities);

  const filterOptions: FilterOption[] = ['Price', 'Rooms and beds', 'Type', 'Amenities', 'Book options'];

  const handleFilterToggle = (filter: FilterOption) => {
    const newFilters = localSelectedFilters.includes(filter)
      ? localSelectedFilters.filter((f) => f !== filter)
      : [...localSelectedFilters, filter];
    
    setLocalSelectedFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleAmenityToggle = (amenity: AmenityType) => {
    const newAmenities = localSelectedAmenities.includes(amenity)
      ? localSelectedAmenities.filter((a) => a !== amenity)
      : [...localSelectedAmenities, amenity];
    
    setLocalSelectedAmenities(newAmenities);
    onAmenityToggle?.(amenity);
  };

  const handleReset = () => {
    setLocalSelectedFilters([]);
    setLocalSelectedAmenities([]);
    onReset?.();
  };

  const handleApply = () => {
    onApply?.(localSelectedFilters, localSelectedAmenities);
  };

  if (!isOpen) return null;

  const content = (
    <div className={`bg-white flex flex-col gap-[46px] items-start p-8 rounded-[58px] w-[820px] ${className}`}>
      {/* Filter Header Section */}
      <div className="flex flex-col gap-[46px] items-start w-full">
        <div className="border-b border-[#d9d9d9] flex flex-col gap-[41px] h-[111px] items-start w-[674px]">
          {/* Filter Dropdown */}
          <div className="bg-white flex gap-[3px] items-center pl-4 pr-1 py-0 rounded-lg">
            <div className="flex gap-2 items-center justify-center w-[51px]">
              <div className="overflow-clip w-3 h-3">
                <Filter className="w-3 h-3 text-[#7d8992]" />
              </div>
              <div className="flex items-center justify-center py-2">
                <p className="font-['Archivo'] font-medium text-[#7d8992] text-[13px]">
                  Filter
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className="flex items-center p-2"
            >
              <ChevronDown className="w-[15px] h-[15px] text-[#374957]" />
            </button>
          </div>

          {/* Filter Options */}
          <div className="flex gap-[23px] items-center w-full flex-wrap">
            {filterOptions.map((option) => {
              const isSelected = localSelectedFilters.includes(option);
              const isAmenities = option === 'Amenities';
              
              return (
                <button
                  key={option}
                  type="button"
                  className="flex gap-[7px] items-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleFilterToggle(option)}
                >
                  <div className="flex gap-[7px] items-center">
                    {isAmenities ? (
                      <DollarSign
                        className={`w-[18px] h-[18px] ${
                          isSelected ? 'text-[#dc5f12]' : 'text-[#dc5f12]'
                        }`}
                      />
                    ) : (
                      <DollarSign
                        className={`w-[18px] h-[18px] ${
                          isSelected ? 'text-[#dc5f12]' : 'text-[#7d8992]'
                        }`}
                      />
                    )}
                    <p
                      className={`font-['Inter'] text-base ${
                        isAmenities
                          ? 'font-semibold text-[#374957]'
                          : isSelected
                          ? 'font-semibold text-[#374957]'
                          : 'font-normal text-[#7d8992]'
                      }`}
                    >
                      {option}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="relative w-3 h-3 flex items-center justify-center">
                      <div className="w-[7.2px] h-[7.2px]">
                        <Check className="w-full h-full text-[#dc5f12]" strokeWidth={3} />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Amenities Section */}
        <div className="flex flex-col gap-[17px] items-start w-full">
          <p className="font-['Archivo'] font-medium text-[#374957] text-xl w-full">
            Amenities
          </p>
          <div className="grid grid-cols-2 gap-[57px] w-full">
            {amenities.map((amenity) => (
              <AmenitiesButton
                key={amenity.id}
                amenity={amenity}
                isChecked={localSelectedAmenities.includes(amenity.id)}
                onClick={() => handleAmenityToggle(amenity.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Actions Section */}
      <div className="flex flex-col gap-[46px] items-start w-full">
        {/* Show More Button */}
        <button
          onClick={() => setIsShowMoreOpen(!isShowMoreOpen)}
          className="bg-white border border-[#d9d9d9] flex gap-[3px] h-[50px] items-center pl-4 pr-1 py-0 rounded-[32px]"
        >
          <div className="flex items-center justify-center">
            <div className="flex items-center justify-center py-2">
              <p className="font-['Archivo'] font-medium text-[#7d8992] text-[13px]">
                Show More
              </p>
            </div>
          </div>
          <div className="flex items-center p-2">
            <ChevronDown className="w-[15px] h-[15px] text-[#374957]" />
          </div>
        </button>

        {/* Reset and Apply Buttons */}
        <div className="border-t border-[#e5e0dd] flex h-[75px] items-center justify-between w-full">
          <button
            onClick={handleReset}
            className="bg-white border border-[#d9d9d9] flex h-[50px] items-center justify-center px-4 py-0 rounded-[32px] w-[96px]"
          >
            <div className="flex items-center justify-center">
              <div className="flex items-center justify-center py-2">
                <p className="font-['Archivo'] font-medium text-[#7d8992] text-[13px]">
                  Reset
                </p>
              </div>
            </div>
          </button>
          <button
            onClick={handleApply}
            className="bg-[#dc5f12] flex gap-[3px] h-[50px] items-center pl-4 pr-[25px] py-0 rounded-[32px]"
          >
            <div className="flex items-center p-2">
              <Search className="w-[15px] h-[15px] text-white" />
            </div>
            <div className="flex items-center justify-center">
              <div className="flex items-center justify-center py-2">
                <p className="font-['Archivo'] font-medium text-[13px] text-white">
                  Find {resultCount} results
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  if (withOverlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />
        {/* Modal Content */}
        <div className="relative">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default FilterModal;

