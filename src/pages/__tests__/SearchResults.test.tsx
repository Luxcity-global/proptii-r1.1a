import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SearchResults from '../SearchResults';

const mockSearchProperties = vi.fn().mockResolvedValue([]);
const mockClearCache = vi.fn();

const mockBackendState = {
  results: [] as any[],
  isLoading: false,
  error: null as string | null,
  searchProperties: mockSearchProperties,
  resolvedLocation: null,
  clearCache: mockClearCache,
};

let mockClassifyState = {
  classification: null as any,
  isClassifying: true,
};

vi.mock('../../hooks/useSearchBackend', () => ({
  useSearchBackend: () => mockBackendState,
}));

vi.mock('../../hooks/useClassifyQuery', () => ({
  useClassifyQuery: () => mockClassifyState,
}));

vi.mock('../../contexts/SavedPropertiesContext', () => ({
  useSavedProperties: () => ({ isPropertySaved: () => false, toggleSaveProperty: vi.fn() }),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false, user: null, login: vi.fn() }),
}));

vi.mock('../../contexts/MessagingContext', () => ({
  useMessagingContext: () => ({ setActiveConversationId: vi.fn() }),
}));

vi.mock('../../contexts/GovDataLayerContext', () => ({
  useGovDataLayer: () => ({ enabled: false, audience: 'renter', setAudience: vi.fn() }),
}));

vi.mock('../../hooks/useBatchedPropertyFacts', () => ({
  useBatchedPropertyFacts: () => ({
    getFlagsFor: () => [],
    getHintFor: () => null,
    isFactsLoading: false,
    isUnresolved: () => false,
  }),
}));

vi.mock('../../components/Footer', () => ({
  default: () => <div data-testid="footer" />,
}));

vi.mock('../../components/search/SearchPageHeader', () => ({
  SearchPageHeader: () => <div data-testid="search-page-header" />,
}));

describe('SearchResults loading & debounce behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockBackendState.results = [];
    mockBackendState.isLoading = false;
    mockBackendState.error = null;
    mockClassifyState = { classification: null, isClassifying: true };
  });

  it('shows loading state immediately without flashing "No Properties Found" and searches once after classification settles', async () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={['/search?q=3+bed+house+in+Bristol']}>
        <Routes>
          <Route path="/search" element={<SearchResults />} />
        </Routes>
      </MemoryRouter>
    );

    // Immediately on initial mount (before search starts), loading animation shows and empty state does NOT flash
    expect(screen.getByText('Searching for properties...')).toBeInTheDocument();
    expect(screen.queryByText('No Properties Found')).not.toBeInTheDocument();
    expect(mockSearchProperties).not.toHaveBeenCalled();

    // Simulate AI classifier finishing with Bristol 3-bed entities
    mockClassifyState = {
      isClassifying: false,
      classification: {
        intent: 'property_search',
        audience: 'buyer',
        entities: { location: 'Bristol', bedrooms: 3, property_type: 'house' },
        confidence: 0.95,
        fallback: false,
        cacheHit: true,
      },
    };

    rerender(
      <MemoryRouter initialEntries={['/search?q=3+bed+house+in+Bristol']}>
        <Routes>
          <Route path="/search" element={<SearchResults />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(mockSearchProperties).toHaveBeenCalledTimes(1));
    expect(mockSearchProperties).toHaveBeenCalledWith(
      '3 bed house in Bristol',
      'onthemarket',
      expect.objectContaining({ location: 'Bristol', bedrooms: 3, propertyType: 'house' }),
      expect.objectContaining({ location: 'Bristol', bedrooms: 3 })
    );

    // Wait a moment to confirm no duplicate re-trigger happens
    await act(async () => {
      await new Promise((r) => setTimeout(r, 120));
    });
    expect(mockSearchProperties).toHaveBeenCalledTimes(1);

    // Once search has resolved with 0 results, "No Properties Found" is shown
    await waitFor(() => expect(screen.getByText('No Properties Found')).toBeInTheDocument());
  });
});
