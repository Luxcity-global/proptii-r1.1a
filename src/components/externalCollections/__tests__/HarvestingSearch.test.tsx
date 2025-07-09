import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HarvestingSearch from '../HarvestingSearch';
import { HarvestingSearchRequest } from '../../../types/harvesting';

// Mock the FeatureGate component
vi.mock('../../common/FeatureGate', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock the feature flags
vi.mock('../../../config/featureFlags', () => ({
  HARVESTING_FEATURES: {
    ENABLE_SEARCH: true
  }
}));

describe('HarvestingSearch', () => {
  const mockOnSearch = vi.fn();

  beforeEach(() => {
    mockOnSearch.mockClear();
  });

  it('renders search form when feature is enabled', () => {
    render(<HarvestingSearch onSearch={mockOnSearch} />);
    
    expect(screen.getByPlaceholderText(/Search for properties/)).toBeInTheDocument();
    expect(screen.getByText('Show Filters')).toBeInTheDocument();
    expect(screen.getByText('Search Properties')).toBeInTheDocument();
  });

  it('calls onSearch with correct data when form is submitted', async () => {
    render(<HarvestingSearch onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByPlaceholderText(/Search for properties/);
    const searchButton = screen.getByText('Search Properties');
    
    fireEvent.change(searchInput, { target: { value: '2 bed flat in London' } });
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith({
        query: '2 bed flat in London',
        location: undefined,
        propertyType: undefined,
        bedrooms: undefined,
        priceRange: undefined,
      });
    });
  });

  it('shows loading state when isLoading is true', () => {
    render(<HarvestingSearch onSearch={mockOnSearch} isLoading={true} />);
    
    expect(screen.getByText('Searching...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Searching.../ })).toBeDisabled();
  });

  it('shows no results message when hasResults is false and search query exists', () => {
    render(
      <HarvestingSearch 
        onSearch={mockOnSearch} 
        hasResults={false} 
      />
    );
    
    // Set a search query first
    const searchInput = screen.getByPlaceholderText(/Search for properties/);
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    // Now the no results message should appear
    expect(screen.getByText(/No properties found/)).toBeInTheDocument();
  });

  it('toggles filters when filter button is clicked', () => {
    render(<HarvestingSearch onSearch={mockOnSearch} />);
    
    const filterButton = screen.getByText('Show Filters');
    fireEvent.click(filterButton);
    
    expect(screen.getByText('Hide Filters')).toBeInTheDocument();
    expect(screen.getByLabelText('Location')).toBeInTheDocument();
    expect(screen.getByLabelText('Property Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Bedrooms')).toBeInTheDocument();
  });

  it('includes filter values in search request', async () => {
    render(<HarvestingSearch onSearch={mockOnSearch} />);
    
    // Show filters
    const filterButton = screen.getByText('Show Filters');
    fireEvent.click(filterButton);
    
    // Fill in filters
    const searchInput = screen.getByPlaceholderText(/Search for properties/);
    const locationInput = screen.getByLabelText('Location');
    const propertyTypeSelect = screen.getByLabelText('Property Type');
    const bedroomsSelect = screen.getByLabelText('Bedrooms');
    
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    fireEvent.change(locationInput, { target: { value: 'London' } });
    fireEvent.change(propertyTypeSelect, { target: { value: 'Apartment' } });
    fireEvent.change(bedroomsSelect, { target: { value: '2' } });
    
    // Submit search
    const searchButton = screen.getByText('Search Properties');
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith({
        query: 'test search',
        location: 'London',
        propertyType: ['Apartment'],
        bedrooms: 2,
        priceRange: undefined,
      });
    });
  });
}); 