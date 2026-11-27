import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SearchFilterBar } from '../SearchFilterBar';
import { extractLocationLabel, formatLocationTitle } from '../LocationInsights';
import type { PropertyFilterState, FilterCounts } from '../../../types/filter';

describe('Harmonized search filters', () => {
  it('extractLocationLabel and formatLocationTitle normalize casing and pick the actual city', () => {
    expect(extractLocationLabel('3 bed house near good schools in bristol')).toBe('Bristol');
    expect(extractLocationLabel('2 bed flat in camden near station')).toBe('Camden');
    expect(extractLocationLabel('apartments near shoreditch')).toBe('Shoreditch');
    expect(formatLocationTitle('canary wharf')).toBe('Canary Wharf');
    expect(formatLocationTitle('sw10 9el')).toBe('SW10 9EL');
  });

  it('renders 3 core inline pills with inline active values, secondary modal chips, and no duplicate Sort', () => {
    const filters: PropertyFilterState = {
      minPrice: null,
      maxPrice: 2000,
      bedrooms: [3],
      propertyTypes: ['house'],
      tenure: 'rent',
      furnishing: 'furnished',
      hasParking: true,
      hasBalconyOrGarden: false,
      isPetFriendly: true,
      billsIncluded: false,
      keywords: '',
      sortBy: 'recommended',
      filterSources: {
        maxPrice: 'user',
        bedrooms: 'user',
        propertyTypes: 'user',
        furnishing: 'user',
        hasParking: 'user',
        isPetFriendly: 'user',
      },
    };
    const counts: FilterCounts = {
      total: 30,
      filtered: 27,
      hasActiveFilters: true,
      activeFilterCount: 6,
    };

    render(
      <SearchFilterBar
        variant="inline"
        showSort={false}
        filters={filters}
        counts={counts}
        setPriceRange={vi.fn()}
        toggleBedroom={vi.fn()}
        setBedrooms={vi.fn()}
        togglePropertyType={vi.fn()}
        resetFilters={vi.fn()}
        removeFilter={vi.fn()}
      />
    );

    // Core 3 quick pills reflect active values directly in pill copy
    expect(screen.getByText('Up to £2,000')).toBeInTheDocument();
    expect(screen.getByText('3 beds')).toBeInTheDocument();
    expect(screen.getByText('Houses')).toBeInTheDocument();

    // Sort dropdown is NOT duplicated inside SearchFilterBar
    expect(screen.queryByText('Sort:')).not.toBeInTheDocument();

    // Core-3 pills are NOT duplicated in sub-chips, while FiltersModal-managed options show as dismissible chips
    expect(screen.queryByText('3 Beds')).not.toBeInTheDocument();
    expect(screen.getByText('Furnished')).toBeInTheDocument();
    expect(screen.getByText('Parking Included')).toBeInTheDocument();
    expect(screen.getByText('Pet Friendly')).toBeInTheDocument();
    expect(screen.getAllByText('Clear all').length).toBeGreaterThanOrEqual(1);
  });
});
