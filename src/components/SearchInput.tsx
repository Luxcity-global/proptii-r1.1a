import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Camera, Mic, WifiOff, Search, X } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import { useDebounce } from '../hooks/useDebounce';
import { ErrorMessage } from './ErrorMessage';
import { LoadingSpinner } from './LoadingSpinner';
import { LocalStorageService } from '../services/LocalStorageService';
import { GuideTooltip } from './GuideTooltip';

interface SearchInputProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  hasResults?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  placeholder = 'AI-assisted property search...',
  className = '',
  hasResults = true,
  value,
  onChange
}) => {
  const [query, setQuery] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const localStorageService = LocalStorageService.getInstance();
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  // Commented out filter state and options
  /*
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const filterOptions = [
    '2+ Beds',
    'Houses',
    'Flats',
    '£1000-£2000',
    '£2000-£3000',
    'Pet Friendly',
    'Furnished',
  ];
  */

  const {
    suggestions: searchSuggestions,
    isLoading,
    error: searchError,
    isOffline,
    getSuggestions,
    retry,
    saveSearch,
    getSearchHistory
  } = useSearch();

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    if (debouncedQuery) {
      getSuggestions(debouncedQuery).catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      });
    }
  }, [debouncedQuery, getSuggestions]);

  useEffect(() => {
    if (searchError) {
      setError(String(searchError));
    }
  }, [searchError]);

  const handleRetry = useCallback(() => {
    setError(null);
    retry();
    if (debouncedQuery) {
      getSuggestions(debouncedQuery).catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
      });
    }
  }, [debouncedQuery, getSuggestions, retry]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setError(null);
    if (onChange) {
      onChange(newValue);
    }
  }, [onChange]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setQuery(suggestion);
    setError(null);
    if (onChange) {
      onChange(suggestion);
    }
    saveSearch(suggestion);
    onSearch(suggestion);
    setIsFocused(false);
  }, [onSearch, onChange, saveSearch]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }
    setError(null);
    saveSearch(query);
    onSearch(query);
  }, [query, onSearch, saveSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const allSuggestions = [...searchSuggestions, ...getSearchHistory().slice(0, 3)];
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsFocused(true);
      setHighlightedIndex((prev) => (prev + 1) % allSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsFocused(true);
      setHighlightedIndex((prev) => (prev - 1 + allSuggestions.length) % allSuggestions.length);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      const selected = allSuggestions[highlightedIndex];
      if (selected) {
        handleSuggestionClick(selected);
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      setHighlightedIndex(-1);
      setError(null);
    }
  }, [searchSuggestions, getSearchHistory, highlightedIndex, handleSuggestionClick]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchSuggestions, isFocused]);

  const handleClear = useCallback(() => {
    setQuery('');
    setError(null);
    if (onChange) {
      onChange('');
    }
    inputRef.current?.focus();
  }, [onChange]);

  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Commented out filter-related functions
  /*
  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };

  // Enhanced filterMap to support min/max for price and beds
  const filterMap: Record<string, any> = {
    '2+ Beds': { minBeds: 2 },
    'Houses': { propertyType: 'House' },
    'Flats': { propertyType: 'Flat' },
    '£1000-£2000': { minPrice: 1000, maxPrice: 2000 },
    '£2000-£3000': { minPrice: 2000, maxPrice: 3000 },
    'Pet Friendly': { petFriendly: true },
    'Furnished': { furnished: true },
  };

  // Build enhanced filter object from active filters
  const buildFiltersObject = () => {
    return activeFilters.reduce((acc, label) => {
      const filter = filterMap[label];
      if (!filter) return acc;
      Object.entries(filter).forEach(([key, value]) => {
        acc[key] = value;
      });
      return acc;
    }, {} as Record<string, any>);
  };

  // Build human-readable filter summary
  const buildFilterSummary = () => activeFilters.join(', ');

  // Enhanced handleFilterChange
  const handleFilterChange = (filter: string) => {
    toggleFilter(filter);
    // Build filters object and summary
    const newActiveFilters = activeFilters.includes(filter)
      ? activeFilters.filter(f => f !== filter)
      : [...activeFilters, filter];
    const filtersObj = newActiveFilters.reduce((acc, label) => {
      const filter = filterMap[label];
      if (!filter) return acc;
      Object.entries(filter).forEach(([key, value]) => {
        acc[key] = value;
      });
      return acc;
    }, {} as Record<string, any>);
    const filterSummary = newActiveFilters.join(', ');
    // Try to call onSearch with both query and filters
    if (onSearch.length >= 2) {
      // @ts-ignore
      onSearch(query, filtersObj);
    } else {
      onSearch(`${query} ${filterSummary}`.trim());
    }
  };
  */

  const renderNoResults = () => {
    if (!hasResults && query.trim() && !isLoading) {
      return (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center">
          <Search className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600 font-medium">No properties found</p>
          <p className="text-gray-500 text-sm mt-1">
            Try adjusting your search terms or browse our suggestions
          </p>
          {searchSuggestions.length > 0 && (
            <div className="mt-3">
              <p className="text-gray-500 text-sm mb-2">You might be interested in:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {searchSuggestions.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Add clearRecentSearches function
  const clearRecentSearches = () => {
    localStorageService.set('search_history', []);
    // Force re-render by updating state
    setQuery(''); // Optionally reset input
  };

  return (
    <div className={`relative ${className}`}>
      <GuideTooltip
        content="Our AI-powered search understands natural language queries. Try searching for 'modern 2-bedroom flat in Central London with parking' or 'pet-friendly house under £2000 near good schools'. The AI will analyze your requirements and find the best matching properties across multiple platforms including Rightmove, Zoopla, OpenRent, and OnTheMarket."
        title="How AI Search Works"
        position="bottom"
        maxWidth="400px"
        showIcon={false}
      >
        <form onSubmit={handleSubmit} className="relative">
          <div className="bg-white rounded-full p-2 flex items-center shadow-xl">
            {!isMobile && (
              <>
                <button
                  type="button"
                  className="p-3 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Search by image"
                >
                  <Camera className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  className="p-3 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Search by voice"
                >
                  <Mic className="w-6 h-6" />
                </button>
              </>
            )}
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                className={`w-full px-4 pr-10 py-3 bg-transparent text-gray-900 text-lg rounded-full border-none transition-all duration-150 ${isFocused ? 'bg-[#F6F6F6]' : 'bg-transparent'
                  } ${error ? 'border-red-500' : 'border-gray-300'}`}
                placeholder={placeholder}
                value={query}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={() => setTimeout(() => setIsFocused(false), 300)}
                onKeyDown={handleKeyDown}
                aria-label="Search properties"
                aria-invalid={!!error}
                aria-describedby={error ? 'search-error' : undefined}
                aria-autocomplete="list"
                aria-controls="search-suggestions-list"
                role="combobox"
                autoComplete="off"
                style={{ outline: 'none', boxShadow: 'none', border: 'none' }}
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear search"
                  tabIndex={0}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="w-2" />
            {isOffline && (
              <div className="px-3 text-yellow-600 flex items-center">
                <WifiOff className="w-5 h-5 mr-1" />
                <span className="text-sm">Offline</span>
              </div>
            )}
            <button
              className={`bg-primary text-white p-3 rounded-full transition-all shadow-md ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'
                }`}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <LoadingSpinner size="small" className="border-white" />
              ) : (
                <img
                  src="/images/ai-search-plane-icon-new-wht-1.png"
                  alt="Search"
                  className="w-9 h-9"
                />
              )}
            </button>
          </div>
        </form>
      </GuideTooltip>

      {error && (
        <div className="mt-2 flex items-center justify-between">
          <ErrorMessage
            id="search-error"
            message={error}
            className="text-sm text-red-500"
          />
          <button
            onClick={handleRetry}
            className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {renderNoResults()}

      {isFocused && (searchSuggestions.length > 0 || getSearchHistory().slice(0, 3).length > 0) && (
        <div
          ref={suggestionsRef}
          className="absolute w-full mt-2 bg-white rounded-xl shadow-lg overflow-hidden z-50 max-h-[300px] overflow-y-auto"
        >
          <ul className="py-1" id="search-suggestions-list" role="listbox">
            {searchSuggestions.map((suggestion, index) => (
              <li
                key={suggestion}
                className={`px-4 py-2 cursor-pointer text-gray-700 ${highlightedIndex === index ? 'bg-gray-100' : ''}`}
                onClick={() => handleSuggestionClick(suggestion)}
                tabIndex={0}
                role="option"
                aria-selected={highlightedIndex === index}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {suggestion}
              </li>
            ))}
            {getSearchHistory().slice(0, 3).map((item, idx) => {
              const index = searchSuggestions.length + idx;
              return (
                <li
                  key={item}
                  className={`px-4 py-2 cursor-pointer text-gray-700 ${highlightedIndex === index ? 'bg-gray-100' : ''}`}
                  onClick={() => handleSuggestionClick(item)}
                  tabIndex={0}
                  role="option"
                  aria-selected={highlightedIndex === index}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {item}
                  <span className="ml-2 text-xs text-gray-400">Recent</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center mt-4">
          <LoadingSpinner size="medium" />
        </div>
      )}

      {/* Show recent searches below input */}
      {getSearchHistory().slice(0, 3).length > 0 && (
        <div className="mt-2 bg-white rounded-xl shadow p-3 relative">
          {/* Clear history X button */}
          <button
            type="button"
            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-lg"
            aria-label="Clear recent searches"
            onClick={clearRecentSearches}
          >
            <X className="w-4 h-4" />
          </button>
          <div className="text-xs text-gray-500 mb-2">Recent Searches</div>
          <div className="flex flex-wrap gap-2">
            {getSearchHistory().slice(0, 3).map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(item)}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200"
                aria-label={`Repeat search: ${item}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interactive filter chips below input - Commented out */}
      {/*
        {filterOptions.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => handleFilterChange(filter)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleFilterChange(filter);
              }
            }}
            className={`px-3 py-1 rounded-full text-sm border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-200 ${activeFilters.includes(filter)
              ? 'bg-[#E1C387] text-black border-[#E1C387]'
              : 'bg-[#FBFBFB] text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            aria-pressed={activeFilters.includes(filter)}
            tabIndex={0}
          >
            {filter}
          </button>
        ))}
        {activeFilters.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveFilters([])}
            className="ml-2 px-3 py-1 rounded-full text-sm border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Clear all filters"
          >
            Clear Filters
          </button>
        )}
      */}
    </div>
  );
}; 