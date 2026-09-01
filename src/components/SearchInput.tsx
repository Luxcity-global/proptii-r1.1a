import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClassifyQuery } from '../hooks/useClassifyQuery';
import { FilterPills } from './search/FilterPills';

type SearchPlatform = 'onthemarket' | 'proptii';

interface SearchInputProps {
  onSearch?: (query: string) => void;
  value?: string;
  onChange?: (value: string) => void;
  hasResults?: boolean;
  onHeightChange?: (height: number) => void;
  placeholder?: string;
  className?: string;
  initialSearchType?: SearchPlatform;
  /** Simplified hero layout: single-line bar, magnifier + mic + camera, "Search" button with original icon, Try pills */
  simplified?: boolean;
}

const SIMPLIFIED_PLACEHOLDER = 'Describe your ideal home...';
const SIMPLIFIED_TRY_QUERIES = [
  '2 bedroom flat in Leeds under 1200pcm',
  'Pet-friendly studios in Manchester',
  '3 bed house near good schools in Bristol',
];

export const SearchInput = ({ 
  onSearch, 
  value = '', 
  onChange, 
  hasResults = true,
  onHeightChange,
  placeholder = 'AI-assisted property search...',
  className = '',
  initialSearchType = 'onthemarket',
  simplified = false,
}: SearchInputProps) => {
  const [query, setQuery] = useState(value);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<SearchPlatform>(initialSearchType);
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { classification, isClassifying } = useClassifyQuery({
    enabled: Boolean(query.trim().length >= 3),
    query,
  });

  // Update internal query when value prop changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Set initial height to 50px (standard) or fixed for simplified
  useEffect(() => {
    if (simplified && onHeightChange) {
      onHeightChange(68);
      return;
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = '50px';
      if (onHeightChange) {
        onHeightChange(50);
      }
    }
  }, [simplified, onHeightChange]);

  // Core Resizing Algorithm
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      
      // If no content, keep at 50px
      if (!query.trim()) {
        textarea.style.height = '50px';
        textarea.style.overflowY = 'hidden';
        if (onHeightChange) {
          onHeightChange(50);
        }
        return;
      }
      
      // Step 1: Reset height to 'auto' to get natural content height
      textarea.style.height = 'auto';
      
      // Step 2: Calculate dimensions
      const scrollHeight = textarea.scrollHeight;  // Natural content height
      const lineHeight = 24;                       // Line height in pixels
      const maxLines = 4;                          // Maximum allowed lines (changed from 5 to 4)
      const maxHeight = lineHeight * maxLines;     // 96px maximum height
      
      // Step 3: Determine new height
      let newHeight;
      if (scrollHeight <= maxHeight) {
        // Content fits within max height
        newHeight = Math.max(scrollHeight, 50);    // At least 50px, or content height
        textarea.style.overflowY = 'hidden';       // Hide scrollbar
      } else {
        // Content exceeds max height
        newHeight = maxHeight;                      // Cap at 96px
        textarea.style.overflowY = 'auto';         // Show scrollbar
      }
      
      // Step 4: Apply new height
      textarea.style.height = `${newHeight}px`;
      
      // Step 5: Notify parent component
      if (onHeightChange) {
        onHeightChange(newHeight);
      }
    }
  }, [query, onHeightChange]);

  const exampleQueries = [
    '2 bedroom flats to rent in Leeds for 1200pcm',
  ];

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      if (onSearch) {
        await Promise.resolve(onSearch(query));
        return;
      }

      // Navigate to search results page with the query and search type
      navigate(`/search?q=${encodeURIComponent(query)}&type=${searchType}`);
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const handlePlatformSelect = (platform: SearchPlatform) => {
    setSearchType(platform);
  };

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    setError(''); // Clear error when user types
    
    if (onChange) {
      onChange(newQuery);
    }
  };

  // Simplified hero layout: single bar + Search button with original icon + Try pills
  if (simplified) {
    return (
      <div className={`max-w-2xl mx-auto px-2 md:px-0 ${className}`}>
        <div className="relative w-full">
          <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/20">
            {/* Input area: magnifier + input + mic + camera */}
            <div className="flex items-center gap-3 px-5 py-4 min-w-0">
              <span className="shrink-0 text-gray-400" aria-hidden>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyDown={handleKeyPress}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={SIMPLIFIED_PLACEHOLDER}
                className="flex-1 min-w-0 text-base border-0 focus:outline-none focus:ring-0 bg-transparent"
                style={{ color: '#111827' }}
              />
              <button
                type="button"
                className="hidden"
                aria-label="Voice search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <button
                type="button"
                className="hidden"
                aria-label="Image search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              {/* Search button: orange, "Search" + original icon (no arrow) */}
              <button
                type="button"
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                className="h-9 shrink-0 flex items-center justify-center gap-2 px-5 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#F15A22' }}
                onMouseEnter={(e) => {
                  const t = e.currentTarget;
                  if (!t.disabled) t.style.backgroundColor = '#E65D24';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F15A22';
                }}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="hidden sm:inline">Search</span>
                    <img src="/images/ai-search-plane-icon-new-wht-1.png" alt="" className="w-4 h-4 sm:ml-2" aria-hidden />
                  </>
                )}
              </button>
            </div>
          </div>
          {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}

          {/* Live NLP Query Classification Filter Pills */}
          {(isClassifying || (classification?.entities && Object.keys(classification.entities).length > 0)) && (
            <div className="mt-3 flex justify-center">
              <FilterPills
                entities={classification?.entities}
                isClassifying={isClassifying}
                onDark
              />
            </div>
          )}
        </div>
        {/* Try pills */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
          <span className="text-white/85 font-medium">Try:</span>
          {SIMPLIFIED_TRY_QUERIES.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleQueryChange(q)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-colors border"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                borderColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-3xl mx-auto px-2 md:px-0 ${className}`}>
      <div className="relative w-full">
        <div className="bg-white rounded-3xl p-2 shadow-xl">
          {/* Input Field */}
          <div className="px-2 py-2">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              className={`w-full text-lg rounded-2xl border-0 focus:outline-none focus:ring-0 resize-none transition-all duration-150 ${
                error ? 'border-red-500' : ''
              }`}
              style={{ 
                color: '#111827', // text-gray-900
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '18px',
                fontWeight: '400',
                lineHeight: '24px',
                height: '50px', // Initial height
                minHeight: '50px',
                maxHeight: '96px', // 4 lines * 24px line height
                backgroundColor: isFocused ? '#FFFFFF' : '#FFFFFF',
                padding: '8px 12px',
                outline: 'none',
                border: 'none'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                
                // Step 1: Reset height to 'auto' to get natural content height
                target.style.height = 'auto';
                
                // Step 2: Calculate dimensions
                const scrollHeight = target.scrollHeight;  // Natural content height
                const lineHeight = 24;                     // Line height in pixels
                const maxLines = 4;                        // Maximum allowed lines
                const maxHeight = lineHeight * maxLines;   // 96px maximum height
                
                // Step 3: Determine new height
                let newHeight;
                if (scrollHeight <= maxHeight) {
                  // Content fits within max height
                  newHeight = Math.max(scrollHeight, 50);  // At least 50px, or content height
                  target.style.overflowY = 'hidden';       // Hide scrollbar
                } else {
                  // Content exceeds max height
                  newHeight = maxHeight;                    // Cap at 96px
                  target.style.overflowY = 'auto';         // Show scrollbar
                }
                
                // Step 4: Apply new height
                target.style.height = `${newHeight}px`;
                
                // Step 5: Notify parent component
                if (onHeightChange) {
                  onHeightChange(newHeight);
                }
              }}
            />
          </div>

          {/* Icons Row */}
          <div className="px-2 pb-2 pt-1 flex items-center justify-between">
            {/* Left Side Icons */}
            <div className="flex items-center gap-3">
              {/* Camera Icon - Hidden for now */}
              <button className="hidden p-2 transition-colors rounded-lg hover:bg-gray-50" style={{ color: '#888' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Microphone Icon - Hidden for now */}
              <button className="hidden p-2 transition-colors rounded-lg hover:bg-gray-50" style={{ color: '#888' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>

              {/* Platform Lineup (icons) */}
              <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-1">
                <button
                  type="button"
                  onClick={() => handlePlatformSelect('proptii')}
                  aria-label="Proptii"
                  aria-pressed={searchType === 'proptii'}
                  title="Proptii"
                  className={`h-10 px-2 rounded-lg flex items-center justify-center transition-all border ${
                    searchType === 'proptii'
                      ? 'bg-white border-[#E65D24] shadow-sm'
                      : 'bg-transparent border-transparent hover:bg-white hover:border-gray-200'
                  }`}
                >
                  <img
                    src="/images/proptii-logo.png"
                    alt="Proptii"
                    className="h-7 w-auto object-contain"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => handlePlatformSelect('onthemarket')}
                  aria-label="On the Market"
                  aria-pressed={searchType === 'onthemarket'}
                  title="On the Market"
                  className={`h-10 px-2 rounded-lg flex items-center justify-center transition-all border ${
                    searchType === 'onthemarket'
                      ? 'bg-white border-[#E65D24] shadow-sm'
                      : 'bg-transparent border-transparent hover:bg-white hover:border-gray-200'
                  }`}
                >
                  <img
                    src="/images/OTM-logo_final_full-col.png"
                    alt="On the Market"
                    className="h-5 w-auto object-contain"
                  />
                </button>
              </div>
            </div>

            {/* Right Side - Circular Search Button */}
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="w-12 h-12 rounded-full text-white shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              style={{ 
                backgroundColor: '#E65D24',
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLButtonElement;
                if (!target.disabled) {
                  target.style.backgroundColor = '#D54A1A';
                }
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLButtonElement;
                if (!target.disabled) {
                  target.style.backgroundColor = '#E65D24';
                }
              }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <img 
                  src="/images/ai-search-plane-icon-new-wht-1.png" 
                  alt="Search" 
                  className="w-6 h-6"
                />
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-2 text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Live NLP Query Classification Filter Pills */}
        {(isClassifying || (classification?.entities && Object.keys(classification.entities).length > 0)) && (
          <div className="mt-3 flex justify-center">
            <FilterPills
              entities={classification?.entities}
              isClassifying={isClassifying}
            />
          </div>
        )}
      </div>

      {/* Example Queries */}
      <div className="mt-6">
        <p className="mb-4 text-center" style={{ color: '#888', fontSize: '16px', fontWeight: '500' }}>Try asking:</p>
        <div className="flex flex-wrap justify-center gap-4">
          {exampleQueries.map((q, index) => (
            <button
              key={index}
              onClick={() => handleQueryChange(q)}
              className="px-6 py-3 rounded-xl transition-colors border shadow-sm"
              style={{ 
                backgroundColor: '#ffffff',
                color: '#E65D24',
                borderColor: '#E65D24' + '30',
                fontSize: '14px',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.backgroundColor = '#E65D24' + '10';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.backgroundColor = '#ffffff';
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}; 