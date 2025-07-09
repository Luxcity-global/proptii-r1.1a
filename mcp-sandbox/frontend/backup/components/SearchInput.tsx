import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Camera, Mic, Search, X } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

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

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('search_history');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (e) {
        setSearchHistory([]);
      }
    }
  }, []);

  const saveSearchHistory = (searchTerm: string) => {
    const newHistory = [searchTerm, ...searchHistory.filter(item => item !== searchTerm)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('search_history', JSON.stringify(newHistory));
  };

  const getSearchHistory = () => searchHistory;

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setError(null);
    if (onChange) {
      onChange(newValue);
    }
  }, [onChange]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }
    setError(null);
    setIsLoading(true);
    saveSearchHistory(query);
    onSearch(query);
    setIsLoading(false);
  }, [query, onSearch]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setQuery(suggestion);
    setError(null);
    if (onChange) {
      onChange(suggestion);
    }
    saveSearchHistory(suggestion);
    onSearch(suggestion);
    setIsFocused(false);
  }, [onSearch, onChange]);

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

  const renderNoResults = () => {
    if (!hasResults && query.trim() && !isLoading) {
      return (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center">
          <Search className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600 font-medium">No properties found</p>
          <p className="text-gray-500 text-sm mt-1">
            Try adjusting your search terms or browse our suggestions
          </p>
        </div>
      );
    }
    return null;
  };

  const clearRecentSearches = () => {
    setSearchHistory([]);
    localStorage.removeItem('search_history');
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative w-full">
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
          <button
            className={`bg-primary text-white p-3 rounded-full transition-all shadow-md ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'
              }`}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Search className="w-6 h-6" />
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-2 flex items-center justify-between">
          <div id="search-error" className="text-sm text-red-500">
            {error}
          </div>
          <button
            onClick={() => setError(null)}
            className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
          >
            Dismiss
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
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
    </div>
  );
}; 