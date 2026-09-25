import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Property } from '../types/property';
import type {
  PropertyFilterState,
  PropertyTypeCategory,
  SortOption,
  FilterCounts,
  FilterSource,
} from '../types/filter';
import type { ClassifyEntities } from '../types/govData';
import {
  matchPrice,
  matchBedrooms,
  matchPropertyType,
  matchKeywords,
  sortProperties,
  matchFurnishing,
  matchParking,
  matchBalconyOrGarden,
  matchPetFriendly,
  matchBillsIncluded,
} from '../utils/filterPredicates';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns true when the filter source is a hard constraint (user or url),
 * meaning the predicate should actively drop non-matching results.
 */
function isHardConstraint(source: FilterSource | undefined): boolean {
  return source === 'user' || source === 'url';
}

/**
 * Resolve amenity booleans from ClassifyEntities, checking both
 * first-class typed fields and the legacy amenities[] array.
 */
function resolveAmenityBool(
  entities: ClassifyEntities,
  field: 'pet_friendly' | 'bills_included' | 'parking' | 'balcony_or_garden',
): boolean {
  if (entities[field] === true || (entities as any)[field] === 'true') return true;
  return Boolean(entities.amenities?.includes(field));
}

// ─── Initial state ───────────────────────────────────────────────────────────

export const INITIAL_FILTER_STATE: PropertyFilterState = {
  minPrice: null,
  maxPrice: null,
  bedrooms: 'any',
  propertyTypes: [],
  tenure: 'any',
  furnishing: 'any',
  hasParking: false,
  hasBalconyOrGarden: false,
  isPetFriendly: false,
  billsIncluded: false,
  keywords: '',
  sortBy: 'recommended',
  filterSources: {},
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export function usePropertyFilters(
  properties: Property[],
  classifiedEntities?: ClassifyEntities | null,
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initializedFromClassifierRef = useRef(false);
  const userModifiedFieldsRef = useRef<Set<string>>(new Set());

  // Initialize filter state from URL search params or defaults
  const [filters, setFilters] = useState<PropertyFilterState>(() => {
    const minP = searchParams.get('minPrice');
    const maxP = searchParams.get('maxPrice');
    const beds = searchParams.get('beds');
    const types = searchParams.get('types');
    const sort = searchParams.get('sortBy') as SortOption | null;
    const kw = searchParams.get('filterKw');
    const furn = searchParams.get('furnishing') as 'furnished' | 'unfurnished' | null;
    const park = searchParams.get('parking') === 'true';
    const outside = searchParams.get('outside') === 'true';
    const pets = searchParams.get('pets') === 'true';
    const bills = searchParams.get('bills') === 'true';

    const parsedBeds = beds
      ? beds === 'any'
        ? 'any'
        : beds.split(',').map((b) => parseInt(b, 10)).filter(Number.isFinite)
      : 'any';
    let parsedTypes = types ? (types.split(',').filter(Boolean) as PropertyTypeCategory[]) : [];

    // Deduplicate studio if both beds=0 and types=studio are passed
    if (Array.isArray(parsedBeds) && parsedBeds.includes(0) && parsedTypes.includes('studio')) {
      parsedTypes = parsedTypes.filter((t) => t !== 'studio');
    }

    // Track URL-restored fields as 'url' source — treated as hard constraints
    const sources: PropertyFilterState['filterSources'] = {};
    if (minP || maxP) sources.minPrice = sources.maxPrice = 'url';
    if (beds && beds !== 'any') sources.bedrooms = 'url';
    if (types) sources.propertyTypes = 'url';
    if (furn) sources.furnishing = 'url';
    if (park) sources.hasParking = 'url';
    if (outside) sources.hasBalconyOrGarden = 'url';
    if (pets) sources.isPetFriendly = 'url';
    if (bills) sources.billsIncluded = 'url';

    return {
      minPrice: minP ? parseInt(minP, 10) : null,
      maxPrice: maxP ? parseInt(maxP, 10) : null,
      bedrooms: parsedBeds,
      propertyTypes: parsedTypes,
      tenure: (searchParams.get('tenure') as 'rent' | 'buy') || 'any',
      furnishing: furn || 'any',
      hasParking: park,
      hasBalconyOrGarden: outside,
      isPetFriendly: pets,
      billsIncluded: bills,
      keywords: kw || '',
      sortBy: sort || 'recommended',
      filterSources: sources,
    };
  });

  // Pre-seed from classifier entities if user hasn't explicitly customized yet.
  // AI-seeded fields are marked 'ai' source — they display as chips but do NOT
  // hard-filter results (the scraper already used them for portal URL construction).
  useEffect(() => {
    if (initializedFromClassifierRef.current || !classifiedEntities) return;

    // If URL already had parameters, those are 'url' sources — don't overwrite
    const hasUrlParams =
      searchParams.has('minPrice') ||
      searchParams.has('maxPrice') ||
      searchParams.has('beds') ||
      searchParams.has('types');

    if (hasUrlParams) {
      initializedFromClassifierRef.current = true;
      return;
    }

    let changed = false;
    const next = { ...filters };
    const sources: PropertyFilterState['filterSources'] = { ...filters.filterSources };

    // Price max
    const rawMax = classifiedEntities.price_max ?? (classifiedEntities as any).maxPrice;
    if (rawMax != null && next.maxPrice === null && !userModifiedFieldsRef.current.has('price')) {
      const parsed =
        typeof rawMax === 'string'
          ? parseInt(rawMax.replace(/[^0-9]/g, ''), 10)
          : Number(rawMax);
      if (!isNaN(parsed) && parsed > 0) {
        next.maxPrice = parsed;
        sources.maxPrice = 'ai';
        changed = true;
      }
    }

    // Price min
    const rawMin = classifiedEntities.price_min ?? (classifiedEntities as any).minPrice;
    if (rawMin != null && next.minPrice === null && !userModifiedFieldsRef.current.has('price')) {
      const parsed =
        typeof rawMin === 'string'
          ? parseInt(rawMin.replace(/[^0-9]/g, ''), 10)
          : Number(rawMin);
      if (!isNaN(parsed) && parsed > 0) {
        next.minPrice = parsed;
        sources.minPrice = 'ai';
        changed = true;
      }
    }

    // Bedrooms
    if (
      classifiedEntities.bedrooms != null &&
      next.bedrooms === 'any' &&
      !userModifiedFieldsRef.current.has('bedrooms')
    ) {
      const parsedBed =
        typeof classifiedEntities.bedrooms === 'string'
          ? parseInt(classifiedEntities.bedrooms, 10)
          : Number(classifiedEntities.bedrooms);
      if (!isNaN(parsedBed) && parsedBed >= 0) {
        next.bedrooms = [parsedBed];
        sources.bedrooms = 'ai';
        changed = true;
      }
    }

    // Property type
    const rawType =
      classifiedEntities.property_type ?? (classifiedEntities as any).propertyType;
    if (
      rawType != null &&
      next.propertyTypes.length === 0 &&
      !userModifiedFieldsRef.current.has('propertyTypes')
    ) {
      const pType = String(rawType).toLowerCase();
      if (['flat', 'house', 'studio', 'bungalow'].includes(pType)) {
        if (pType === 'studio' && Array.isArray(next.bedrooms) && next.bedrooms.includes(0)) {
          // Already captured via bedrooms: 0 — skip duplicate chip
        } else if (pType === 'studio' && next.bedrooms === 'any') {
          next.bedrooms = [0];
          sources.bedrooms = 'ai';
          changed = true;
        } else {
          next.propertyTypes = [pType as PropertyTypeCategory];
          sources.propertyTypes = 'ai';
          changed = true;
        }
      }
    }

    // Tenure
    if (
      classifiedEntities.tenure != null &&
      next.tenure === 'any' &&
      !userModifiedFieldsRef.current.has('tenure')
    ) {
      next.tenure = classifiedEntities.tenure;
      sources.tenure = 'ai';
      changed = true;
    }

    // Furnishing
    if (
      classifiedEntities.furnished != null &&
      next.furnishing === 'any' &&
      !userModifiedFieldsRef.current.has('furnishing')
    ) {
      next.furnishing = classifiedEntities.furnished;
      sources.furnishing = 'ai';
      changed = true;
    }

    // Pet friendly
    const hasPet = resolveAmenityBool(classifiedEntities, 'pet_friendly');
    if (hasPet && !next.isPetFriendly && !userModifiedFieldsRef.current.has('pets')) {
      next.isPetFriendly = true;
      sources.isPetFriendly = 'ai';
      changed = true;
    }

    // Bills included
    const hasBills = resolveAmenityBool(classifiedEntities, 'bills_included');
    if (hasBills && !next.billsIncluded && !userModifiedFieldsRef.current.has('bills')) {
      next.billsIncluded = true;
      sources.billsIncluded = 'ai';
      changed = true;
    }

    // Balcony / garden
    const hasOutside =
      resolveAmenityBool(classifiedEntities, 'balcony_or_garden') ||
      classifiedEntities.amenities?.includes('garden') ||
      classifiedEntities.amenities?.includes('balcony');
    if (hasOutside && !next.hasBalconyOrGarden && !userModifiedFieldsRef.current.has('outside')) {
      next.hasBalconyOrGarden = true;
      sources.hasBalconyOrGarden = 'ai';
      changed = true;
    }

    // Parking
    const hasPark = resolveAmenityBool(classifiedEntities, 'parking');
    if (hasPark && !next.hasParking && !userModifiedFieldsRef.current.has('parking')) {
      next.hasParking = true;
      sources.hasParking = 'ai';
      changed = true;
    }

    if (changed) {
      next.filterSources = sources;
      setFilters(next);
      initializedFromClassifierRef.current = true;
    }
  }, [classifiedEntities, searchParams]);

  // Sync state to URL params (shallow replace to avoid cluttering history stack)
  useEffect(() => {
    setSearchParams(
      (prevParams) => {
        const next = new URLSearchParams(prevParams);

        if (filters.minPrice != null) next.set('minPrice', String(filters.minPrice));
        else next.delete('minPrice');

        if (filters.maxPrice != null) next.set('maxPrice', String(filters.maxPrice));
        else next.delete('maxPrice');

        if (
          filters.bedrooms !== 'any' &&
          Array.isArray(filters.bedrooms) &&
          filters.bedrooms.length > 0
        ) {
          next.set('beds', filters.bedrooms.join(','));
        } else {
          next.delete('beds');
        }

        if (filters.propertyTypes.length > 0) {
          next.set('types', filters.propertyTypes.join(','));
        } else {
          next.delete('types');
        }

        if (filters.furnishing !== 'any') next.set('furnishing', filters.furnishing);
        else next.delete('furnishing');

        if (filters.hasParking) next.set('parking', 'true');
        else next.delete('parking');

        if (filters.hasBalconyOrGarden) next.set('outside', 'true');
        else next.delete('outside');

        if (filters.isPetFriendly) next.set('pets', 'true');
        else next.delete('pets');

        if (filters.billsIncluded) next.set('bills', 'true');
        else next.delete('bills');

        if (filters.sortBy !== 'recommended') next.set('sortBy', filters.sortBy);
        else next.delete('sortBy');

        if (filters.keywords.trim()) next.set('filterKw', filters.keywords.trim());
        else next.delete('filterKw');

        return next;
      },
      { replace: true },
    );
  }, [filters, setSearchParams]);

  // ─── Filtering pipeline ────────────────────────────────────────────────────
  //
  // DESIGN PRINCIPLE:
  //   - 'user' / 'url' sourced fields → hard filter (predicate drops non-matches)
  //   - 'ai' sourced fields           → soft signal (predicate skipped; scraper
  //                                     already baked these into the portal URL)
  //
  // Pet-friendly special rule (confirmed):
  //   - Listings with pet policy = 'forbidden' are always dropped when isPetFriendly
  //     is set, regardless of source.
  //   - Listings with unknown policy: dropped only when source is 'user'; shown with
  //     a badge when source is 'ai' (unknown policy ≠ forbidden).
  //
  const filteredProperties = useMemo(() => {
    if (!properties || properties.length === 0) return [];

    const src = filters.filterSources;

    let base = properties;

    // Price — hard filter only when user/url set it
    if (isHardConstraint(src.minPrice) || isHardConstraint(src.maxPrice)) {
      base = base.filter((p) => matchPrice(p, filters.minPrice, filters.maxPrice));
    }

    // Bedrooms — hard filter only when user/url set it
    if (isHardConstraint(src.bedrooms)) {
      base = base.filter((p) => matchBedrooms(p, filters.bedrooms));
    }

    // Property type — hard filter only when user/url set it
    if (isHardConstraint(src.propertyTypes)) {
      base = base.filter((p) => matchPropertyType(p, filters.propertyTypes));
    }

    // Furnishing — hard filter only when user/url set it
    if (isHardConstraint(src.furnishing)) {
      base = base.filter((p) => matchFurnishing(p, filters.furnishing));
    }

    // Parking — hard filter only when user/url set it
    if (filters.hasParking && isHardConstraint(src.hasParking)) {
      base = base.filter((p) => matchParking(p, true));
    }

    // Balcony/garden — hard filter only when user/url set it
    if (filters.hasBalconyOrGarden && isHardConstraint(src.hasBalconyOrGarden)) {
      base = base.filter((p) => matchBalconyOrGarden(p, true));
    }

    // Bills included — hard filter only when user/url set it
    if (filters.billsIncluded && isHardConstraint(src.billsIncluded)) {
      base = base.filter((p) => matchBillsIncluded(p, true));
    }

    // Keywords — always hard (user-typed field, no AI source possible)
    base = base.filter((p) => matchKeywords(p, filters.keywords));

    // Pet-friendly — special handling regardless of source:
    //   1. Always drop explicitly forbidden listings.
    //   2. Unknown policy: drop when source is 'user'; keep (with badge) when 'ai'.
    if (filters.isPetFriendly) {
      const allowUnconfirmed = src.isPetFriendly === 'ai';
      const strictMatches = base.filter((p) => matchPetFriendly(p, true, false));
      if (strictMatches.length > 0) {
        base = strictMatches;
      } else {
        // No explicitly-allowed listings — fall back gracefully
        base = base.filter((p) => matchPetFriendly(p, true, allowUnconfirmed));
      }
    }

    return base.sort((a, b) => sortProperties(a, b, filters.sortBy));
  }, [properties, filters]);

  /**
   * True when the pet filter is active but no listings explicitly allow pets
   * (we've relaxed to showing unknown-policy listings).
   */
  const isPetRelaxed = useMemo(() => {
    if (!filters.isPetFriendly || !properties || properties.length === 0) return false;
    const strictCount = filteredProperties.filter((p) =>
      matchPetFriendly(p, true, false),
    ).length;
    return strictCount === 0 && filteredProperties.length > 0;
  }, [filters.isPetFriendly, properties, filteredProperties]);

  // ─── Filter count statistics ───────────────────────────────────────────────
  const counts: FilterCounts = useMemo(() => {
    let active = 0;
    if (filters.minPrice !== null || filters.maxPrice !== null) active++;
    if (filters.bedrooms !== 'any' && filters.bedrooms.length > 0) active++;
    if (filters.propertyTypes.length > 0) active++;
    if (filters.furnishing !== 'any') active++;
    if (filters.hasParking) active++;
    if (filters.hasBalconyOrGarden) active++;
    if (filters.isPetFriendly) active++;
    if (filters.billsIncluded) active++;
    if (filters.keywords.trim()) active++;
    if (filters.sortBy !== 'recommended') active++;

    return {
      total: properties.length,
      filtered: filteredProperties.length,
      hasActiveFilters: active > 0,
      activeFilterCount: active,
    };
  }, [properties.length, filteredProperties.length, filters]);

  // ─── Granular user actions — always mark source as 'user' ─────────────────

  const setMinPrice = useCallback((min: number | null) => {
    userModifiedFieldsRef.current.add('price');
    setFilters((prev) => ({
      ...prev,
      minPrice: min,
      filterSources: { ...prev.filterSources, minPrice: 'user' },
    }));
  }, []);

  const setMaxPrice = useCallback((max: number | null) => {
    userModifiedFieldsRef.current.add('price');
    setFilters((prev) => ({
      ...prev,
      maxPrice: max,
      filterSources: { ...prev.filterSources, maxPrice: 'user' },
    }));
  }, []);

  const setPriceRange = useCallback((min: number | null, max: number | null) => {
    userModifiedFieldsRef.current.add('price');
    setFilters((prev) => ({
      ...prev,
      minPrice: min,
      maxPrice: max,
      filterSources: { ...prev.filterSources, minPrice: 'user', maxPrice: 'user' },
    }));
  }, []);

  const toggleBedroom = useCallback((bed: number) => {
    userModifiedFieldsRef.current.add('bedrooms');
    setFilters((prev) => {
      const current = prev.bedrooms === 'any' ? [] : prev.bedrooms;
      const exists = current.includes(bed);
      const next = exists ? current.filter((b) => b !== bed) : [...current, bed];
      return {
        ...prev,
        bedrooms: next.length === 0 ? 'any' : next,
        filterSources: { ...prev.filterSources, bedrooms: 'user' },
      };
    });
  }, []);

  const setBedrooms = useCallback((bedrooms: number[] | 'any') => {
    userModifiedFieldsRef.current.add('bedrooms');
    setFilters((prev) => ({
      ...prev,
      bedrooms,
      filterSources: { ...prev.filterSources, bedrooms: 'user' },
    }));
  }, []);

  const togglePropertyType = useCallback((type: PropertyTypeCategory) => {
    userModifiedFieldsRef.current.add('propertyTypes');
    setFilters((prev) => {
      const exists = prev.propertyTypes.includes(type);
      const next = exists
        ? prev.propertyTypes.filter((t) => t !== type)
        : [...prev.propertyTypes, type];
      return {
        ...prev,
        propertyTypes: next,
        filterSources: { ...prev.filterSources, propertyTypes: 'user' },
      };
    });
  }, []);

  const setPropertyTypes = useCallback((types: PropertyTypeCategory[]) => {
    userModifiedFieldsRef.current.add('propertyTypes');
    setFilters((prev) => ({
      ...prev,
      propertyTypes: types,
      filterSources: { ...prev.filterSources, propertyTypes: 'user' },
    }));
  }, []);

  const setKeywords = useCallback((keywords: string) => {
    userModifiedFieldsRef.current.add('keywords');
    setFilters((prev) => ({ ...prev, keywords }));
  }, []);

  const setSortBy = useCallback((sortBy: SortOption) => {
    userModifiedFieldsRef.current.add('sortBy');
    setFilters((prev) => ({ ...prev, sortBy }));
  }, []);

  const setFurnishing = useCallback((furnishing: 'furnished' | 'unfurnished' | 'any') => {
    userModifiedFieldsRef.current.add('furnishing');
    setFilters((prev) => ({
      ...prev,
      furnishing,
      filterSources: { ...prev.filterSources, furnishing: 'user' },
    }));
  }, []);

  const toggleParking = useCallback(() => {
    userModifiedFieldsRef.current.add('parking');
    setFilters((prev) => ({
      ...prev,
      hasParking: !prev.hasParking,
      filterSources: { ...prev.filterSources, hasParking: 'user' },
    }));
  }, []);

  const toggleBalconyOrGarden = useCallback(() => {
    userModifiedFieldsRef.current.add('outside');
    setFilters((prev) => ({
      ...prev,
      hasBalconyOrGarden: !prev.hasBalconyOrGarden,
      filterSources: { ...prev.filterSources, hasBalconyOrGarden: 'user' },
    }));
  }, []);

  const togglePetFriendly = useCallback(() => {
    userModifiedFieldsRef.current.add('pets');
    setFilters((prev) => ({
      ...prev,
      isPetFriendly: !prev.isPetFriendly,
      filterSources: { ...prev.filterSources, isPetFriendly: 'user' },
    }));
  }, []);

  const toggleBillsIncluded = useCallback(() => {
    userModifiedFieldsRef.current.add('bills');
    setFilters((prev) => ({
      ...prev,
      billsIncluded: !prev.billsIncluded,
      filterSources: { ...prev.filterSources, billsIncluded: 'user' },
    }));
  }, []);

  const resetFilters = useCallback(() => {
    // Mark all as user-modified so classifier won't re-seed after a reset
    ['price', 'bedrooms', 'propertyTypes', 'tenure', 'furnishing', 'parking', 'outside', 'pets', 'bills'].forEach(
      (f) => userModifiedFieldsRef.current.add(f),
    );
    initializedFromClassifierRef.current = true;
    setFilters(INITIAL_FILTER_STATE);
  }, []);

  const removeFilter = useCallback((key: string) => {
    setFilters((prev) => {
      const newSources = { ...prev.filterSources };
      if (key === 'price') {
        delete newSources.minPrice;
        delete newSources.maxPrice;
        return { ...prev, minPrice: null, maxPrice: null, filterSources: newSources };
      }
      if (key === 'bedrooms') {
        delete newSources.bedrooms;
        return { ...prev, bedrooms: 'any', filterSources: newSources };
      }
      if (key.startsWith('bedroom_')) {
        const bedNum = parseInt(key.replace('bedroom_', ''), 10);
        if (prev.bedrooms === 'any') return prev;
        const next = prev.bedrooms.filter((b) => b !== bedNum);
        if (next.length === 0) delete newSources.bedrooms;
        return { ...prev, bedrooms: next.length === 0 ? 'any' : next, filterSources: newSources };
      }
      if (key === 'propertyTypes') {
        delete newSources.propertyTypes;
        return { ...prev, propertyTypes: [], filterSources: newSources };
      }
      if (key.startsWith('type_')) {
        const typeName = key.replace('type_', '') as PropertyTypeCategory;
        const next = prev.propertyTypes.filter((t) => t !== typeName);
        if (next.length === 0) delete newSources.propertyTypes;
        return { ...prev, propertyTypes: next, filterSources: newSources };
      }
      if (key === 'furnishing') {
        delete newSources.furnishing;
        return { ...prev, furnishing: 'any', filterSources: newSources };
      }
      if (key === 'parking') {
        delete newSources.hasParking;
        return { ...prev, hasParking: false, filterSources: newSources };
      }
      if (key === 'outside') {
        delete newSources.hasBalconyOrGarden;
        return { ...prev, hasBalconyOrGarden: false, filterSources: newSources };
      }
      if (key === 'pets') {
        delete newSources.isPetFriendly;
        return { ...prev, isPetFriendly: false, filterSources: newSources };
      }
      if (key === 'bills') {
        delete newSources.billsIncluded;
        return { ...prev, billsIncluded: false, filterSources: newSources };
      }
      if (key === 'keywords') return { ...prev, keywords: '' };
      if (key === 'sortBy') return { ...prev, sortBy: 'recommended' };
      return prev;
    });
  }, []);

  /**
   * Promotes an AI-sourced filter chip to a hard user constraint.
   * Call this when the user clicks an AI chip to "lock it in".
   */
  const promoteAiFilter = useCallback((key: keyof PropertyFilterState['filterSources']) => {
    userModifiedFieldsRef.current.add(String(key));
    setFilters((prev) => ({
      ...prev,
      filterSources: { ...prev.filterSources, [key]: 'user' },
    }));
  }, []);

  return {
    filters,
    filteredProperties,
    counts,
    setMinPrice,
    setMaxPrice,
    setPriceRange,
    toggleBedroom,
    setBedrooms,
    togglePropertyType,
    setPropertyTypes,
    setFurnishing,
    toggleParking,
    toggleBalconyOrGarden,
    togglePetFriendly,
    toggleBillsIncluded,
    setKeywords,
    setSortBy,
    resetFilters,
    removeFilter,
    promoteAiFilter,
    isPetRelaxed,
  };
}
