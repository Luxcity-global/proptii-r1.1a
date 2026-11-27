import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SearchFilterBar } from '../SearchFilterBar';
import { extractLocationLabel } from '../LocationInsights';
import type { PropertyFilterState, FilterCounts } from '../../../types/filter';

describe('Harmonized search filters', () => {
  it('extractLocationLabel selects the actual city in multi-preposition queries', () => {
    expect(extractLocationLabel('3 bed house near good schools in Bristol')).toBe('Bristol');
    expect(extractLocationLabel('2 bed flat in Camden near station')).toBe('Camden');
    expect(extractLocationLabel('apartments near Shoreditch')).toBe('Shoreditch');
  });

  it('renders inline SearchFilterBar without duplicating Sort dropdown or pill-owned chips', () => {
    const filters: PropertyFilterState = {
      minPrice: null,
      maxPrice: null,
      bedrooms: [3],
      propertyTypes: ['house'],
      tenure: 'rent',
      furnishing: 'any',
      hasParking: false,
      hasBalconyOrGarden: false,
      isPetFriendly: true,
      billsIncluded: false,
      keywords: '',
      sortBy: 'recommended',
      filterSources: {
        bedrooms: 'user',
        propertyTypes: 'user',
        isPetFriendly: 'user',
      },
    };
    const counts: FilterCounts = {
      total: 30,
      filtered: 27,
      hasActiveFilters: true,
      activeFilterCount: 3,
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
        setFurnishing={vi.fn()}
        toggleParking={vi.fn()}
        toggleBalconyOrGarden={vi.fn()}
        resetFilters={vi.fn()}
        removeFilter={vi.fn()}
      />
    );

    // Quick filter pills are visible
    expect(screen.getByText('Bedrooms')).toBeInTheDocument();
    expect(screen.getByText('Property Type')).toBeInTheDocument();

    // Sort dropdown is NOT duplicated inside SearchFilterBar
    expect(screen.queryByText('Sort:')).not.toBeInTheDocument();

    // Quick-pill filters (3 Beds, Houses) are NOT duplicated in ActiveFilterChips, while secondary filter (Pet Friendly) IS shown
    expect(screen.queryByText('3 Beds')).not.toBeInTheDocument();
    expect(screen.queryByText('Houses')).not.toBeInTheDocument();
    expect(screen.getByText('Pet Friendly')).toBeInTheDocument();

    // Clear all is present
    expect(screen.getAllByText('Clear all').length).toBeGreaterThanOrEqual(1);
  });
});
