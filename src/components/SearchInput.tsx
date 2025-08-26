import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface SearchInputProps {
  onSearch?: (query: string) => void;
  value?: string;
  onChange?: (value: string) => void;
  hasResults?: boolean;
  onHeightChange?: (height: number) => void;
}

export const SearchInput = ({ 
  onSearch, 
  value = '', 
  onChange, 
  hasResults = true,
  onHeightChange 
}: SearchInputProps) => {
  const [query, setQuery] = useState(value);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<'onthemarket' | 'internet'>('onthemarket');
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPlatformDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update internal query when value prop changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to minimum first
      textareaRef.current.style.height = '50px';
      
      // Calculate new height based on content
      const scrollHeight = textareaRef.current.scrollHeight;
      const newHeight = Math.min(Math.max(50, scrollHeight), 120);
      
      // Set the new height
      textareaRef.current.style.height = `${newHeight}px`;
      
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
      // Always navigate to search results page with the query and search type
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

  const handlePlatformSelect = (platform: 'onthemarket' | 'internet') => {
    setSearchType(platform);
    setShowPlatformDropdown(false);
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'onthemarket':
        return 'On the Market';
      case 'internet':
        return 'Internet Search';
      default:
        return 'Select Platform';
    }
  };

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    setError(''); // Clear error when user types
    
    if (onChange) {
      onChange(newQuery);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-0">
      <div className="relative w-full">
        <div className="bg-white rounded-3xl p-3 shadow-xl">
          {/* Input Field */}
          <div className="px-4 py-2">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="AI-assisted property search..."
              className={`w-full text-lg rounded-2xl border-0 focus:outline-none resize-none transition-all duration-150 ${
                error ? 'border-red-500' : ''
              }`}
              style={{ 
                color: '#111827', // text-gray-900
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '18px',
                fontWeight: '400',
                lineHeight: '24px',
                minHeight: '50px',
                maxHeight: '120px',
                backgroundColor: isFocused ? '#F6F6F6' : '#FFFFFF',
                padding: '8px 16px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = '50px';
                target.style.height = Math.min(Math.max(50, target.scrollHeight), 120) + 'px';
                if (onHeightChange) {
                  onHeightChange(Math.min(Math.max(50, target.scrollHeight), 120));
                }
              }}
            />
          </div>

          {/* Icons Row */}
          <div className="px-4 pb-2 pt-1 flex items-center justify-between">
            {/* Left Side Icons */}
            <div className="flex items-center gap-3">
              {/* Camera Icon */}
              <button className="p-2 transition-colors rounded-lg hover:bg-gray-50" style={{ color: '#888' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Microphone Icon */}
              <button className="p-2 transition-colors rounded-lg hover:bg-gray-50" style={{ color: '#888' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>

              {/* Platform Selector with Plus Icon */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
                  className="p-2 rounded-lg transition-all hover:bg-gray-50 flex items-center gap-2"
                  style={{ color: '#888' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-sm" style={{ fontSize: '14px' }}>
                    {getPlatformName(searchType)}
                  </span>
                </button>

                {/* Platform Dropdown */}
                {showPlatformDropdown && (
                  <div 
                    className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-lg border py-2 min-w-48 z-50"
                    style={{ 
                      borderColor: '#e5e7eb',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}
                  >
                    {/* On the Market Option */}
                    <button
                      onClick={() => handlePlatformSelect('onthemarket')}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                      style={{ color: searchType === 'onthemarket' ? '#E65D24' : '#23272f' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <div>
                        <div className="font-medium" style={{ fontSize: '14px' }}>On the Market</div>
                        <div className="text-xs" style={{ color: '#888' }}>Official property portal</div>
                      </div>
                    </button>

                    {/* Internet Search Option */}
                    <button
                      onClick={() => handlePlatformSelect('internet')}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                      style={{ color: searchType === 'internet' ? '#E65D24' : '#23272f' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
                      </svg>
                      <div>
                        <div className="font-medium" style={{ fontSize: '14px' }}>Internet Search</div>
                        <div className="text-xs" style={{ color: '#888' }}>Search across web</div>
                      </div>
                    </button>
                  </div>
                )}
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