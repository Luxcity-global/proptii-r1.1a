export type PropertyTypeCategory = 
  | 'flat'        // Flat, Apartment, Maisonette
  | 'house'       // Detached, Semi-Detached, Terraced, End-terrace
  | 'studio'      // Studio flats
  | 'bungalow';   // Bungalows

export type SortOption = 
  | 'recommended' 
  | 'price_asc' 
  | 'price_desc' 
  | 'beds_desc' 
  | 'newest';

export interface PropertyFilterState {
  minPrice: number | null;
  maxPrice: number | null;
  bedrooms: number[] | 'any'; // [0] for studio, [1, 2] for 1 or 2 beds, or 'any'
  propertyTypes: PropertyTypeCategory[];
  tenure: 'rent' | 'buy' | 'any';
  furnishing: 'furnished' | 'unfurnished' | 'any';
  hasParking: boolean;
  hasBalconyOrGarden: boolean;
  isPetFriendly: boolean;
  billsIncluded: boolean;
  keywords: string;
  sortBy: SortOption;
}

export interface FilterCounts {
  total: number;
  filtered: number;
  hasActiveFilters: boolean;
  activeFilterCount: number;
}
