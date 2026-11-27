import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { entitiesToPills } from './FilterPills';
import { FiltersModal } from './FiltersModal';
import type { ClassifyEntities } from '../../types/govData';
import type { Property } from '../../types/property';
import type { PropertyFilterState, SortOption as FilterSortOption } from '../../types/filter';

export type SortOption = 'Relevance' | 'Newest' | 'Price (low)' | 'Price (high)';

const FILTER_SORT_LABELS: Record<FilterSortOption, string> = {
  recommended: 'Recommended',
  newest: 'Newest listed',
  price_asc: 'Price (low to high)',
  price_desc: 'Price (high to low)',
  beds_desc: 'Most bedrooms',
};

export interface SearchPageHeaderProps {
  searchQuery: string;
  draftQuery: string;
  onDraftQueryChange: (value: string) => void;
  onSubmitSearch: () => void;
  onSaveSearch: () => void;
  searchSaved?: boolean;
  resultsCount: number;
  totalCount?: number;
  locationLabel: string;
  isCached?: boolean;
  isLoading?: boolean;
  onRefresh?: () => void;
  showMap: boolean;
  onToggleMap: () => void;
  sortOption?: SortOption;
  onSortChange?: (option: SortOption) => void;
  sortBy?: FilterSortOption;
  onSortByChange?: (option: FilterSortOption) => void;
  classificationEntities?: ClassifyEntities | null;
  isClassifying?: boolean;
  activeFilterCount?: number;
  currentFilters?: PropertyFilterState;
  quickFilters?: React.ReactNode;
  showMeta?: boolean;
  results?: Property[];
  onApplyFilters?: (query: string, matchCount: number) => void;
  onApplyClientFilters?: (
    patch: Partial<
      Pick<
        PropertyFilterState,
        | 'minPrice'
        | 'maxPrice'
        | 'bedrooms'
        | 'propertyTypes'
        | 'furnishing'
        | 'hasParking'
        | 'hasBalconyOrGarden'
        | 'isPetFriendly'
        | 'billsIncluded'
      >
    >,
    matchCount: number,
  ) => void;
}

export const SearchPageHeader: React.FC<SearchPageHeaderProps> = ({
  searchQuery,
  draftQuery,
  onDraftQueryChange,
  onSubmitSearch,
  onSaveSearch,
  searchSaved = false,
  resultsCount,
  totalCount,
  locationLabel,
  isCached: _isCached = false,
  isLoading = false,
  onRefresh,
  showMap,
  onToggleMap,
  sortOption = 'Relevance',
  onSortChange,
  sortBy,
  onSortByChange,
  classificationEntities,
  isClassifying: _isClassifying = false,
  activeFilterCount,
  currentFilters,
  quickFilters,
  showMeta = true,
  results = [],
  onApplyFilters,
  onApplyClientFilters,
}) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [sortOpen, setSortOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const pillCount = entitiesToPills(classificationEntities).length;
  const badgeCount = activeFilterCount ?? pillCount;

  useEffect(() => {
    if (!sortOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [sortOpen]);

  const dashboardRoute =
    user?.roles?.includes('landlord') || user?.roles?.includes('agent')
      ? '/landlord'
      : user?.roles?.includes('homeowner')
      ? '/homeowner/dashboard'
      : '/dashboard';

  return (
    <>
      <header className="sr-header">
        <div className="sr-inner sr-header-top">
          <div className="sr-brand">
            <Link to="/" className="sr-logo" aria-label="Proptii home">
              <img src="/images/proptii-logo.png" alt="Proptii" />
            </Link>
            <div className="sr-crumb">
              <span className="sr-crumb-sep">/</span>
              <span className="sr-crumb-mid">Rent</span>
              <span className="sr-crumb-sep">/</span>
              <span className="sr-crumb-current">Search Results</span>
            </div>
          </div>
          <div className="sr-header-actions">
            {isAuthenticated ? (
              <Link to={dashboardRoute} className="sr-user-chip">
                {user?.name || user?.givenName || 'Dashboard'}
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  className="sr-btn-ghost"
                  onClick={() => navigate(`/login?redirect=${encodeURIComponent('/search?q=' + searchQuery)}`)}
                >
                  Sign in
                </button>
                <button type="button" className="sr-btn-register" onClick={() => navigate('/pricing')}>
                  Register
                </button>
              </>
            )}
          </div>
        </div>

        <div className="sr-controls">
          <div className="sr-inner sr-controls-inner">
            <div className="sr-search-row">
              <form
                className="sr-search-field"
                onSubmit={(e) => {
                  e.preventDefault();
                  onSubmitSearch();
                }}
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={draftQuery}
                  onChange={(e) => onDraftQueryChange(e.target.value)}
                  placeholder="Search by city, postcode, station or features..."
                  aria-label="Search properties"
                />
                {draftQuery ? (
                  <button
                    type="button"
                    className="sr-search-clear"
                    title="Clear input"
                    onClick={() => onDraftQueryChange('')}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="12" x2="18" y2="12" />
                    </svg>
                  </button>
                ) : null}
              </form>
              <button
                type="button"
                className={`sr-icon-btn${searchSaved ? ' is-saved' : ''}`}
                title="Save this search"
                onClick={onSaveSearch}
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill={searchSaved ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>
              <button
                type="button"
                className="sr-filters-btn"
                onClick={() => setFiltersOpen(true)}
                aria-haspopup="dialog"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                  <line x1="11" y1="18" x2="13" y2="18" />
                </svg>
                <span>Filters</span>
                {badgeCount > 0 ? <span className="sr-filters-badge">{badgeCount}</span> : null}
              </button>
            </div>

            {showMeta && quickFilters}

            {showMeta && (
              <div className="sr-meta">
                <div className="sr-meta-left">
                  <p className="sr-count">
                    <strong>
                      {totalCount !== undefined && totalCount > resultsCount
                        ? `${resultsCount} of ${totalCount}`
                        : resultsCount}
                    </strong>{' '}
                    <span className="sr-count-rest">properties to rent in {locationLabel}</span>
                  </p>
                  {onRefresh && (
                    <button
                      type="button"
                      className={`sr-refresh${isLoading ? ' is-loading' : ''}`}
                      onClick={onRefresh}
                      disabled={isLoading}
                      title="Refresh search results"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                      >
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38" />
                      </svg>
                      <span>Refresh</span>
                    </button>
                  )}
                </div>
                <div className="sr-meta-right">
                  <button
                    type="button"
                    className={`sr-map-toggle${showMap ? ' is-open' : ''}`}
                    onClick={onToggleMap}
                  >
                    <svg
                      className="w-4 h-4 sr-brand-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                      <line x1="8" y1="2" x2="8" y2="18" />
                      <line x1="16" y1="6" x2="16" y2="22" />
                    </svg>
                    <span>{showMap ? 'Hide map' : 'Show map'}</span>
                    <svg
                      className="w-3.5 h-3.5 sr-chevron"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <div className="sr-meta-divider" />
                  <div className="sr-sort-wrap" ref={sortRef}>
                    <button
                      type="button"
                      className="sr-sort-btn"
                      onClick={() => setSortOpen((open) => !open)}
                      aria-expanded={sortOpen}
                      aria-haspopup="listbox"
                    >
                      <span>
                        {sortBy
                          ? `Sort: ${FILTER_SORT_LABELS[sortBy]}`
                          : sortOption === 'Price (low)'
                          ? 'Price (low)'
                          : sortOption === 'Price (high)'
                          ? 'Price (high)'
                          : sortOption}
                      </span>
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                      >
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="6" y1="12" x2="18" y2="12" />
                        <line x1="9" y1="18" x2="15" y2="18" />
                      </svg>
                    </button>
                    {sortOpen && (
                      <div className="sr-sort-menu" role="listbox">
                        {sortBy && onSortByChange
                          ? (['recommended', 'newest', 'price_asc', 'price_desc', 'beds_desc'] as FilterSortOption[]).map(
                              (option) => (
                                <button
                                  key={option}
                                  type="button"
                                  role="option"
                                  aria-selected={sortBy === option}
                                  className={sortBy === option ? 'is-active' : undefined}
                                  onClick={() => {
                                    onSortByChange(option);
                                    setSortOpen(false);
                                  }}
                                >
                                  {FILTER_SORT_LABELS[option]}
                                </button>
                              )
                            )
                          : (['Relevance', 'Newest', 'Price (low)', 'Price (high)'] as SortOption[]).map(
                              (option) => (
                                <button
                                  key={option}
                                  type="button"
                                  className={sortOption === option ? 'is-active' : undefined}
                                  onClick={() => {
                                    onSortChange?.(option);
                                    setSortOpen(false);
                                  }}
                                >
                                  {option === 'Price (low)'
                                    ? 'Price (low to high)'
                                    : option === 'Price (high)'
                                    ? 'Price (high to low)'
                                    : option}
                                </button>
                              )
                            )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <FiltersModal
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        searchQuery={searchQuery}
        locationLabel={locationLabel}
        entities={classificationEntities}
        currentFilters={currentFilters}
        results={results}
        onApply={(query, matchCount) => {
          setFiltersOpen(false);
          onApplyFilters?.(query, matchCount);
        }}
        onApplyClientFilters={(patch, matchCount) => {
          setFiltersOpen(false);
          onApplyClientFilters?.(patch, matchCount);
        }}
      />
    </>
  );
};
