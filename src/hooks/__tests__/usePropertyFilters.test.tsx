import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { usePropertyFilters } from '../usePropertyFilters';
import type { Property } from '../../types/property';

const mockProperties: Property[] = [
  {
    title: '3 bedroom semi-detached house',
    price: '£2,200 pcm',
    location: 'Bristol BS1',
    bedrooms: 3,
    propertyType: 'House',
    imageUrls: [],
  },
  {
    title: '2 bedroom modern apartment',
    price: '£1,800 pcm',
    location: 'Bristol BS2',
    bedrooms: 2,
    propertyType: 'Flat',
    imageUrls: [],
  },
  {
    title: 'Spacious 3 bed flat with parking',
    price: '£2,400 pcm',
    location: 'Bristol BS8',
    bedrooms: 3,
    propertyType: 'Flat',
    imageUrls: [],
    description: 'Electricity, water, and heating bills included in rent',
  },
  {
    title: 'Studio apartment to rent',
    price: '£1,100 pcm',
    location: 'Bristol BS1',
    bedrooms: 0,
    propertyType: 'Studio',
    imageUrls: [],
    amenities: ['Pet friendly', 'Furnished'],
  },
];

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/search?q=3+bed+in+bristol']}>
    {children}
  </MemoryRouter>
);

describe('usePropertyFilters', () => {
  it('correctly filters by classified string bedrooms without dropping all results to 0', () => {
    // classifier.service returns strings like { bedrooms: "3" }
    const classifiedEntities = {
      bedrooms: "3" as any,
    };

    const { result } = renderHook(() => usePropertyFilters(mockProperties, classifiedEntities), {
      wrapper,
    });

    // Should find the 2 properties with 3 bedrooms, not 0!
    expect(result.current.filteredProperties.length).toBe(2);
    expect(result.current.filteredProperties.every((p) => p.bedrooms === 3)).toBe(true);
    expect(result.current.filters.bedrooms).toEqual([3]);
  });

  it('correctly filters by classified string price_max without dropping results', () => {
    const classifiedEntities = {
      price_max: "2000" as any,
    };

    const { result } = renderHook(() => usePropertyFilters(mockProperties, classifiedEntities), {
      wrapper,
    });

    // Should find properties <= 2000 (£1800, £1100)
    expect(result.current.filteredProperties.length).toBe(2);
    expect(result.current.filters.maxPrice).toBe(2000);
  });

  it('resets filters and returns all properties when resetFilters is called', () => {
    const classifiedEntities = {
      bedrooms: "3" as any,
    };

    const { result } = renderHook(() => usePropertyFilters(mockProperties, classifiedEntities), {
      wrapper,
    });

    expect(result.current.filteredProperties.length).toBe(2);

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.filteredProperties.length).toBe(mockProperties.length);
    expect(result.current.filters.bedrooms).toBe('any');
  });

  it('does not overwrite user-selected filters when classifier results arrive later', () => {
    let entities: any = null;
    const { result, rerender } = renderHook(
      () => usePropertyFilters(mockProperties, entities),
      { wrapper }
    );

    // User explicitly selects 2 bedrooms before classifier returns
    act(() => {
      result.current.toggleBedroom(2);
    });
    expect(result.current.filters.bedrooms).toEqual([2]);

    // Later, classifier returns 3 bedrooms
    entities = { bedrooms: "3" };
    rerender();

    // The user's selection of 2 bedrooms MUST be preserved!
    expect(result.current.filters.bedrooms).toEqual([2]);
  });

  it('correctly filters by pet friendly toggle and pre-seeds from classifier', () => {
    // 1. Pre-seeded from classifier
    const { result } = renderHook(
      () => usePropertyFilters(mockProperties, { pet_friendly: 'true' } as any),
      { wrapper }
    );

    expect(result.current.filters.isPetFriendly).toBe(true);
    expect(result.current.filteredProperties.length).toBe(1);
    expect(result.current.filteredProperties[0].title).toBe('Studio apartment to rent');

    // 2. Toggle off
    act(() => {
      result.current.togglePetFriendly();
    });
    expect(result.current.filters.isPetFriendly).toBe(false);
    expect(result.current.filteredProperties.length).toBe(mockProperties.length);
  });

  it('correctly filters by bills included toggle', () => {
    const { result } = renderHook(
      () => usePropertyFilters(mockProperties, null),
      { wrapper }
    );

    expect(result.current.filters.billsIncluded).toBe(false);
    expect(result.current.filteredProperties.length).toBe(mockProperties.length);

    act(() => {
      result.current.toggleBillsIncluded();
    });

    expect(result.current.filters.billsIncluded).toBe(true);
    expect(result.current.filteredProperties.length).toBe(1);
    expect(result.current.filteredProperties[0].title).toBe('Spacious 3 bed flat with parking');
  });
});
