export type PropertyTypeCategory = 
  | 'flat'        // Flat, Apartment, Maisonette
  | 'house'       // Detached, Semi-Detached, Terraced, End-terrace
  | 'studio'      // Studio flats
  | 'bungalow';   // Bungalows

/**
 * Tracks who set each filter field.
 * - 'user'  → user toggled the UI control; predicate applies as a hard filter.
 * - 'ai'    → extracted from query by the AI classifier; shown as a chip, soft signal only.
 * - 'url'   → restored from URL params on page load; treated as 'user' intent.
 * - 'none'  → not set.
 */
export type FilterSource = 'user' | 'ai' | 'url' | 'none';

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
  /**
   * Per-field source tracking. Fields with source 'ai' are displayed as soft chips
   * but do NOT hard-filter results — the AI already asked the portal for matching
   * properties at query time. Fields with source 'user' or 'url' are hard constraints.
   */
  filterSources: Partial<Record<keyof Omit<PropertyFilterState, 'filterSources' | 'sortBy'>, FilterSource>>;
}

export interface FilterCounts {
  total: number;
  filtered: number;
  hasActiveFilters: boolean;
  activeFilterCount: number;
}
