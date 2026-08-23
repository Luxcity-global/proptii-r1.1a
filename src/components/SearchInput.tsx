import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  X,
  ChevronDown
} from 'lucide-react';
import { AudienceLens } from '../data/audienceLensCopy';

export interface ParsedFilterPill {
  id: string;
  category: 'location' | 'beds' | 'price' | 'type' | 'feature';
  label: string;
}

interface SearchInputProps {
  onSearch?: (query: string, audience?: AudienceLens) => void;
  value?: string;
  onChange?: (value: string) => void;
  onFilterChange?: (pills: ParsedFilterPill[]) => void;
  hasResults?: boolean;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  value = '',
  onChange,
  onFilterChange,
  className = ''
}) => {
  const [query, setQuery] = useState(value);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState('');
  
  // Sprint 2.1: Classifier state machine & staggered pill extraction
  const [classifierInFlight, setClassifierInFlight] = useState(false);
  const [filterPills, setFilterPills] = useState<ParsedFilterPill[]>([]);
  const [showOverflowDropdown, setShowOverflowDropdown] = useState(false);
  
  const overflowRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const classifierTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  // Close overflow dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(event.target as Node)) {
        setShowOverflowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync internal query with external value prop
  useEffect(() => {
    setQuery(value);
    if (value.trim()) {
      const parsed = parseQueryToPills(value);
      setFilterPills(parsed);
      if (onFilterChange) onFilterChange(parsed);
    } else {
      setFilterPills([]);
      if (onFilterChange) onFilterChange([]);
    }
  }, [value]);

  // Natural language classifier for filter extraction matching screenshot format
  const parseQueryToPills = (text: string): ParsedFilterPill[] => {
    const pills: ParsedFilterPill[] = [];
    const lower = text.toLowerCase();

    // 1. Bedroom count (e.g. "2 bedrooms")
    const bedMatch = lower.match(/(\d+)\s*(?:bed|bedroom|br|bedrooms)/i);
    if (bedMatch) {
      pills.push({
        id: 'beds',
        category: 'beds',
        label: `${bedMatch[1]} bedroom${bedMatch[1] === '1' ? '' : 's'}`
      });
    }

    // 2. Property Type (e.g. "Flat", "House", "Studio")
    if (lower.includes('flat') || lower.includes('apartment')) {
      pills.push({ id: 'type', category: 'type', label: 'Flat' });
    } else if (lower.includes('house') || lower.includes('terrace') || lower.includes('semi')) {
      pills.push({ id: 'type', category: 'type', label: 'House' });
    } else if (lower.includes('studio')) {
      pills.push({ id: 'type', category: 'type', label: 'Studio' });
    }

    // 3. Location (e.g. "Near: Clapham Junction", "Near: Leeds")
    const locMatch =
      lower.match(/(?:in|near|at|around)\s+([a-zA-Z\s]+?)(?:\s+(?:under|for|with|near|pcm|£)|$)/i) ||
      lower.match(/(clapham junction|clapham|leeds|manchester|bristol|london|birmingham|sheffield|liverpool|newcastle|edinburgh)/i);
    if (locMatch) {
      const rawLoc = locMatch[1].trim();
      if (rawLoc.length >= 2) {
        const formattedLoc = rawLoc
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
        pills.push({
          id: 'loc',
          category: 'location',
          label: `Near: ${formattedLoc}`
        });
      }
    }

    // 4. Price ceiling (e.g. "Under: £1,200/mo")
    const priceMatch = lower.match(/(?:under|max|for|below)?\s*(?:£|gbp)?\s*(\d{3,5})\s*(?:pcm|pm|\/mo)?/i);
    if (priceMatch && parseInt(priceMatch[1], 10) >= 300) {
      pills.push({
        id: 'price',
        category: 'price',
        label: `Under: £${Number(priceMatch[1]).toLocaleString()}/mo`
      });
    }

    // 5. Special features / criteria
    if (lower.includes('pet') || lower.includes('dog') || lower.includes('cat')) {
      pills.push({ id: 'pet', category: 'feature', label: 'Pet-friendly' });
    }
    if (lower.includes('school') || lower.includes('education')) {
      pills.push({ id: 'school', category: 'feature', label: 'Near good schools' });
    }
    if (lower.includes('garden') || lower.includes('balcony')) {
      pills.push({ id: 'garden', category: 'feature', label: 'Garden' });
    }
    if (lower.includes('parking') || lower.includes('garage')) {
      pills.push({ id: 'parking', category: 'feature', label: 'Parking' });
    }

    return pills;
  };

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    setError('');
    if (onChange) onChange(newQuery);

    if (classifierTimeoutRef.current) {
      clearTimeout(classifierTimeoutRef.current);
    }

    if (newQuery.trim().length > 2) {
      setClassifierInFlight(true);
      classifierTimeoutRef.current = setTimeout(() => {
        try {
          const parsed = parseQueryToPills(newQuery);
          setFilterPills(parsed);
          if (onFilterChange) onFilterChange(parsed);
        } catch {
          // Sprint 2.1: Silent failure fallback
          setFilterPills([]);
        } finally {
          setClassifierInFlight(false);
        }
      }, 350);
    } else {
      setClassifierInFlight(false);
      setFilterPills([]);
      if (onFilterChange) onFilterChange([]);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a location or describe your ideal home');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (onSearch) {
        onSearch(query);
      } else {
        navigate(`/search?q=${encodeURIComponent(query)}&type=internet`);
      }
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleRemovePill = (id: string) => {
    const updated = filterPills.filter((p) => p.id !== id);
    setFilterPills(updated);
    if (onFilterChange) onFilterChange(updated);
  };

  const clearQuery = () => {
    setQuery('');
    setFilterPills([]);
    setClassifierInFlight(false);
    if (onChange) onChange('');
    if (onFilterChange) onFilterChange([]);
    if (inputRef.current) inputRef.current.focus();
  };

  // Up to 3 visible pills in the primary row; if > 3, show +N more dropdown
  const maxVisible = 3;
  const visiblePills = filterPills.slice(0, maxVisible);
  const overflowPills = filterPills.slice(maxVisible);

  return (
    <div className={`w-full max-w-4xl mx-auto font-nunito ${className}`}>
      
      {/* Primary Floating Capsule Search Bar (Matches Reference Screenshot) */}
      <div className="relative">
        <div
          className={`flex items-center bg-white rounded-full p-2 shadow-2xl transition-all duration-200 border-2 ${
            isFocused
              ? 'border-[#136C9E] shadow-blue-900/25 ring-4 ring-[#136C9E]/10'
              : 'border-transparent'
          }`}
        >
          {/* Search Icon */}
          <div className="pl-4 pr-2 text-gray-400 flex items-center justify-center flex-shrink-0">
            <Search className="w-5 h-5 text-gray-400" />
          </div>

          {/* Search Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="2-bed flat near Clapham Junction"
            data-demo-hero-search-input
            className="w-full py-2.5 px-2 text-gray-800 placeholder-gray-400 bg-transparent text-base md:text-lg font-medium focus:outline-none"
          />

          {/* Clear button if typed */}
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors mr-2 flex-shrink-0"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Orange Pill Search Button (Matches Screenshot: Search →) */}
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            data-demo-hero-search-button
            className="flex items-center justify-center gap-2 px-7 md:px-9 py-3.5 rounded-full bg-[#E65D24] hover:bg-[#D54A1A] text-white font-bold text-base shadow-lg shadow-orange-500/30 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Search</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </>
            )}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-2 text-center text-red-200 text-xs font-semibold bg-red-950/50 py-1 px-4 rounded-full inline-block backdrop-blur-md">
            {error}
          </div>
        )}
      </div>

      {/* In-Flight State: "understanding your search" with animated orange dots (Beneath Search Bar, matching media_1787487324998.png) */}
      {classifierInFlight && (
        <div className="flex items-center justify-center gap-2.5 mt-4 text-white/90 text-sm font-medium animate-in fade-in duration-150">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E65D24] animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#E65D24] animate-pulse [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#E65D24] animate-pulse [animation-delay:300ms]" />
          </span>
          <span className="tracking-wide">understanding your search</span>
        </div>
      )}

      {/* Staggered Filter Pills (Styled matching media_1787487348765.png: Dark Navy Blue capsules with ✕) */}
      {!classifierInFlight && filterPills.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Render Up to 4 Main Visible Pills */}
          {visiblePills.map((pill, idx) => (
            <div
              key={pill.id}
              style={{ animationDelay: `${idx * 40}ms` }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0B3B5B] text-white text-sm font-normal shadow-lg border border-[#18537D] backdrop-blur-md transition-all hover:bg-[#0d456b]"
            >
              <span>{pill.label}</span>
              <button
                type="button"
                onClick={() => handleRemovePill(pill.id)}
                className="text-white/70 hover:text-white ml-1 font-bold text-xs p-0.5 rounded-full hover:bg-white/20 transition-colors"
                title="Remove filter"
              >
                ✕
              </button>
            </div>
          ))}

          {/* Overflow '+N' pill with Dropdown for 5+ criteria */}
          {overflowPills.length > 0 && (
            <div className="relative" ref={overflowRef}>
              <button
                type="button"
                onClick={() => setShowOverflowDropdown(!showOverflowDropdown)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0B3B5B] text-white text-sm font-medium shadow-lg border border-[#18537D] hover:bg-[#0d456b] transition-all"
                title="View additional extracted filters"
              >
                <span>+{overflowPills.length} more</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showOverflowDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Overflow Dropdown Card (Opens downwards) */}
              {showOverflowDropdown && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-60 bg-[#0B3B5B] rounded-2xl shadow-2xl border border-[#18537D] p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-white/60 uppercase tracking-wider border-b border-white/10 mb-1">
                    Additional Filters
                  </div>
                  <div className="space-y-1">
                    {overflowPills.map((pill) => (
                      <div
                        key={pill.id}
                        className="flex items-center justify-between px-3 py-1.5 rounded-xl text-sm text-white hover:bg-white/10"
                      >
                        <span className="font-normal">{pill.label}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePill(pill.id)}
                          className="text-white/70 hover:text-red-400 font-bold p-0.5"
                          title="Remove filter"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchInput;
