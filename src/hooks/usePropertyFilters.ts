import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Property } from '../types/property';
import type { 
  PropertyFilterState, 
  PropertyTypeCategory, 
  SortOption, 
  FilterCounts 
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
  matchBillsIncluded
} from '../utils/filterPredicates';

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
};

export function usePropertyFilters(
  properties: Property[],
  classifiedEntities?: ClassifyEntities | null
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

    return {
      minPrice: minP ? parseInt(minP, 10) : null,
      maxPrice: maxP ? parseInt(maxP, 10) : null,
      bedrooms: beds ? (beds === 'any' ? 'any' : beds.split(',').map((b) => parseInt(b, 10)).filter(Number.isFinite)) : 'any',
      propertyTypes: types ? (types.split(',').filter(Boolean) as PropertyTypeCategory[]) : [],
      tenure: (searchParams.get('tenure') as 'rent' | 'buy') || 'any',
      furnishing: furn || 'any',
      hasParking: park,
      hasBalconyOrGarden: outside,
      isPetFriendly: pets,
      billsIncluded: bills,
      keywords: kw || '',
      sortBy: sort || 'recommended',
    };
  });

  // Pre-seed from classifier entities if user hasn't explicitly customized yet
  useEffect(() => {
    if (initializedFromClassifierRef.current || !classifiedEntities) return;

    // Check if URL already had parameters
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

    const rawMax = classifiedEntities.price_max ?? (classifiedEntities as any).maxPrice;
    if (
      rawMax != null &&
      next.maxPrice === null &&
      !userModifiedFieldsRef.current.has('price')
    ) {
      const parsedPrice = typeof rawMax === 'string'
        ? parseInt(rawMax.replace(/[^0-9]/g, ''), 10)
        : Number(rawMax);
      if (!isNaN(parsedPrice) && parsedPrice > 0) {
        next.maxPrice = parsedPrice;
        changed = true;
      }
    }

    const rawMin = classifiedEntities.price_min ?? (classifiedEntities as any).minPrice;
    if (
      rawMin != null &&
      next.minPrice === null &&
      !userModifiedFieldsRef.current.has('price')
    ) {
      const parsedMin = typeof rawMin === 'string'
        ? parseInt(rawMin.replace(/[^0-9]/g, ''), 10)
        : Number(rawMin);
      if (!isNaN(parsedMin) && parsedMin > 0) {
        next.minPrice = parsedMin;
        changed = true;
      }
    }

    if (
      classifiedEntities.bedrooms != null &&
      next.bedrooms === 'any' &&
      !userModifiedFieldsRef.current.has('bedrooms')
    ) {
      const parsedBed = typeof classifiedEntities.bedrooms === 'string'
        ? parseInt(classifiedEntities.bedrooms, 10)
        : Number(classifiedEntities.bedrooms);
      if (!isNaN(parsedBed) && parsedBed >= 0) {
        next.bedrooms = [parsedBed];
        changed = true;
      }
    }

    const rawType = classifiedEntities.property_type ?? (classifiedEntities as any).propertyType;
    if (
      rawType != null &&
      next.propertyTypes.length === 0 &&
      !userModifiedFieldsRef.current.has('propertyTypes')
    ) {
      const pType = String(rawType).toLowerCase();
      if (['flat', 'house', 'studio', 'bungalow'].includes(pType)) {
        next.propertyTypes = [pType as PropertyTypeCategory];
        changed = true;
      }
    }

    if (
      classifiedEntities.tenure != null &&
      next.tenure === 'any' &&
      !userModifiedFieldsRef.current.has('tenure')
    ) {
      next.tenure = classifiedEntities.tenure;
      changed = true;
    }

    const hasPet =
      (classifiedEntities as any)?.pet_friendly === 'true' ||
      classifiedEntities?.pet_friendly === true ||
      classifiedEntities?.amenities?.includes('pet_friendly');
    if (hasPet && !next.isPetFriendly && !userModifiedFieldsRef.current.has('pets')) {
      next.isPetFriendly = true;
      changed = true;
    }

    const hasBills =
      (classifiedEntities as any)?.bills_included === 'true' ||
      classifiedEntities?.bills_included === true ||
      classifiedEntities?.amenities?.includes('bills_included');
    if (hasBills && !next.billsIncluded && !userModifiedFieldsRef.current.has('bills')) {
      next.billsIncluded = true;
      changed = true;
    }

    const hasBalconyGarden =
      (classifiedEntities as any)?.balcony_or_garden === true ||
      classifiedEntities?.amenities?.includes('balcony_or_garden') ||
      classifiedEntities?.amenities?.includes('garden') ||
      classifiedEntities?.amenities?.includes('balcony');
    if (hasBalconyGarden && !next.hasBalconyOrGarden && !userModifiedFieldsRef.current.has('outside')) {
      next.hasBalconyOrGarden = true;
      changed = true;
    }

    const hasParking =
      (classifiedEntities as any)?.parking === true ||
      classifiedEntities?.amenities?.includes('parking');
    if (hasParking && !next.hasParking && !userModifiedFieldsRef.current.has('parking')) {
      next.hasParking = true;
      changed = true;
    }

    if (changed) {
      setFilters(next);
      initializedFromClassifierRef.current = true;
    }
  }, [classifiedEntities, searchParams]);

  // Sync state to URL params (shallow replace to avoid cluttering history stack)
  useEffect(() => {
    setSearchParams((prevParams) => {
      const next = new URLSearchParams(prevParams);

      if (filters.minPrice != null) next.set('minPrice', String(filters.minPrice));
      else next.delete('minPrice');

      if (filters.maxPrice != null) next.set('maxPrice', String(filters.maxPrice));
      else next.delete('maxPrice');

      if (filters.bedrooms !== 'any' && Array.isArray(filters.bedrooms) && filters.bedrooms.length > 0) {
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
    }, { replace: true });
  }, [filters, setSearchParams]);

  // Pure filtering and sorting pipeline
  const filteredProperties = useMemo(() => {
    if (!properties || properties.length === 0) return [];

    return properties
      .filter((prop) => matchPrice(prop, filters.minPrice, filters.maxPrice))
      .filter((prop) => matchBedrooms(prop, filters.bedrooms))
      .filter((prop) => matchPropertyType(prop, filters.propertyTypes))
      .filter((prop) => matchFurnishing(prop, filters.furnishing))
      .filter((prop) => matchParking(prop, filters.hasParking))
      .filter((prop) => matchBalconyOrGarden(prop, filters.hasBalconyOrGarden))
      .filter((prop) => matchPetFriendly(prop, filters.isPetFriendly))
      .filter((prop) => matchBillsIncluded(prop, filters.billsIncluded))
      .filter((prop) => matchKeywords(prop, filters.keywords))
      .sort((a, b) => sortProperties(a, b, filters.sortBy));
  }, [properties, filters]);

  // Filter count statistics
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

  // Granular Actions
  const setMinPrice = useCallback((min: number | null) => {
    userModifiedFieldsRef.current.add('price');
    setFilters((prev) => ({ ...prev, minPrice: min }));
  }, []);

  const setMaxPrice = useCallback((max: number | null) => {
    userModifiedFieldsRef.current.add('price');
    setFilters((prev) => ({ ...prev, maxPrice: max }));
  }, []);

  const setPriceRange = useCallback((min: number | null, max: number | null) => {
    userModifiedFieldsRef.current.add('price');
    setFilters((prev) => ({ ...prev, minPrice: min, maxPrice: max }));
  }, []);

  const toggleBedroom = useCallback((bed: number) => {
    userModifiedFieldsRef.current.add('bedrooms');
    setFilters((prev) => {
      if (prev.bedrooms === 'any') {
        return { ...prev, bedrooms: [bed] };
      }
      const exists = prev.bedrooms.includes(bed);
      const next = exists ? prev.bedrooms.filter((b) => b !== bed) : [...prev.bedrooms, bed];
      return { ...prev, bedrooms: next.length === 0 ? 'any' : next };
    });
  }, []);

  const setBedrooms = useCallback((bedrooms: number[] | 'any') => {
    userModifiedFieldsRef.current.add('bedrooms');
    setFilters((prev) => ({ ...prev, bedrooms }));
  }, []);

  const togglePropertyType = useCallback((type: PropertyTypeCategory) => {
    userModifiedFieldsRef.current.add('propertyTypes');
    setFilters((prev) => {
      const exists = prev.propertyTypes.includes(type);
      const next = exists 
        ? prev.propertyTypes.filter((t) => t !== type) 
        : [...prev.propertyTypes, type];
      return { ...prev, propertyTypes: next };
    });
  }, []);

  const setPropertyTypes = useCallback((types: PropertyTypeCategory[]) => {
    userModifiedFieldsRef.current.add('propertyTypes');
    setFilters((prev) => ({ ...prev, propertyTypes: types }));
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
    setFilters((prev) => ({ ...prev, furnishing }));
  }, []);

  const toggleParking = useCallback(() => {
    userModifiedFieldsRef.current.add('parking');
    setFilters((prev) => ({ ...prev, hasParking: !prev.hasParking }));
  }, []);

  const toggleBalconyOrGarden = useCallback(() => {
    userModifiedFieldsRef.current.add('outside');
    setFilters((prev) => ({ ...prev, hasBalconyOrGarden: !prev.hasBalconyOrGarden }));
  }, []);

  const togglePetFriendly = useCallback(() => {
    userModifiedFieldsRef.current.add('pets');
    setFilters((prev) => ({ ...prev, isPetFriendly: !prev.isPetFriendly }));
  }, []);

  const toggleBillsIncluded = useCallback(() => {
    userModifiedFieldsRef.current.add('bills');
    setFilters((prev) => ({ ...prev, billsIncluded: !prev.billsIncluded }));
  }, []);

  const resetFilters = useCallback(() => {
    userModifiedFieldsRef.current.add('price');
    userModifiedFieldsRef.current.add('bedrooms');
    userModifiedFieldsRef.current.add('propertyTypes');
    userModifiedFieldsRef.current.add('tenure');
    userModifiedFieldsRef.current.add('furnishing');
    userModifiedFieldsRef.current.add('parking');
    userModifiedFieldsRef.current.add('outside');
    userModifiedFieldsRef.current.add('pets');
    userModifiedFieldsRef.current.add('bills');
    initializedFromClassifierRef.current = true;
    setFilters(INITIAL_FILTER_STATE);
  }, []);

  const removeFilter = useCallback((key: string) => {
    setFilters((prev) => {
      if (key === 'price') return { ...prev, minPrice: null, maxPrice: null };
      if (key === 'bedrooms') return { ...prev, bedrooms: 'any' };
      if (key.startsWith('bedroom_')) {
        const bedNum = parseInt(key.replace('bedroom_', ''), 10);
        if (prev.bedrooms === 'any') return prev;
        const next = prev.bedrooms.filter((b) => b !== bedNum);
        return { ...prev, bedrooms: next.length === 0 ? 'any' : next };
      }
      if (key === 'propertyTypes') return { ...prev, propertyTypes: [] };
      if (key.startsWith('type_')) {
        const typeName = key.replace('type_', '') as PropertyTypeCategory;
        return { ...prev, propertyTypes: prev.propertyTypes.filter((t) => t !== typeName) };
      }
      if (key === 'furnishing') return { ...prev, furnishing: 'any' };
      if (key === 'parking') return { ...prev, hasParking: false };
      if (key === 'outside') return { ...prev, hasBalconyOrGarden: false };
      if (key === 'pets') return { ...prev, isPetFriendly: false };
      if (key === 'bills') return { ...prev, billsIncluded: false };
      if (key === 'keywords') return { ...prev, keywords: '' };
      if (key === 'sortBy') return { ...prev, sortBy: 'recommended' };
      return prev;
    });
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
  };
}
