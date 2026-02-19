import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<'onthemarket' | 'internet'>('onthemarket');
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  const exampleQueries = [
    '3 bedroom houses for sale in Manchester under £400k',
    '2 bedroom flats for sale in London under £500k', 
    '2 bedroom flats to rent in Leeds for 1200pcm',
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    // Navigate to search results page with the query and search type
    navigate(`/search?q=${encodeURIComponent(query)}&type=${searchType}`);
    setLoading(false);
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20" style={{ backgroundColor: '#f7f8fa' }}>
      <div className="w-full max-w-4xl text-center">
        {/* Main Heading */}
        <div className="mb-16">
          <h1 
            className="mb-6 leading-tight"
            style={{ 
              color: '#23272f', 
              fontSize: '48px', 
              fontWeight: '700', 
              letterSpacing: '-0.01em',
              lineHeight: '1.1'
            }}
          >
            Let's Get You into Your New Home
          </h1>
          <p 
            className="max-w-2xl mx-auto leading-relaxed"
            style={{ 
              color: '#888', 
              fontSize: '20px',
              fontWeight: '400'
            }}
          >
            AI-powered property search. Try '2 bed flat in Bromley' or 'rent under £1500'
          </p>
        </div>

        {/* Search Interface */}
        <div className="w-full max-w-4xl mx-auto mb-12">
          {/* Rectangle Search Box */}
          <div className="relative">
            <div 
              className="bg-white rounded-2xl shadow-lg border overflow-hidden"
              style={{ borderColor: '#e5e7eb' }}
            >
              {/* Input Area */}
              <div className="px-6 pt-6 pb-4">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="AI-powered property search... Try '2 bed flat in Bromley' or 'rent under £1500'"
                  className="w-full text-lg bg-transparent border-0 focus:outline-none"
                  style={{ 
                    color: '#23272f',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: '18px',
                    fontWeight: '400',
                    minHeight: '32px'
                  }}
                />
              </div>

              {/* Icons Row */}
              <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t" style={{ borderColor: '#f5f5f5' }}>
                {/* Left Side Icons */}
                <div className="flex items-center gap-3">
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

                  {/* Microphone Icon */}
                  <button className="p-2 transition-colors rounded-lg hover:bg-gray-50" style={{ color: '#888' }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                </div>

                {/* Right Side - Search Button */}
                <button
                  onClick={handleSearch}
                  disabled={loading || !query.trim()}
                  className="text-white px-8 py-3 rounded-xl font-semibold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  style={{ 
                    backgroundColor: '#E65D24',
                    fontSize: '16px',
                    fontWeight: '600'
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
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Example Queries */}
        <div className="mb-20">
          <p className="mb-6" style={{ color: '#888', fontSize: '16px', fontWeight: '500' }}>Try asking:</p>
          <div className="flex flex-wrap justify-center gap-4">
            {exampleQueries.map((q, index) => (
              <button
                key={index}
                onClick={() => setQuery(q)}
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

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
          <div className="text-center">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm"
              style={{ backgroundColor: '#E65D24' + '15', color: '#E65D24' }}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 
              className="mb-4"
              style={{ 
                color: '#23272f', 
                fontSize: '24px', 
                fontWeight: '700',
                lineHeight: '1.3'
              }}
            >
              Intelligent Search
            </h3>
            <p style={{ 
              color: '#888', 
              fontSize: '16px',
              lineHeight: '1.6'
            }}>
              Ask in natural language and get exactly what you're looking for
            </p>
          </div>
          
          <div className="text-center">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm"
              style={{ backgroundColor: '#E65D24' + '15', color: '#E65D24' }}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 
              className="mb-4"
              style={{ 
                color: '#23272f', 
                fontSize: '24px', 
                fontWeight: '700',
                lineHeight: '1.3'
              }}
            >
              Location Focused
            </h3>
            <p style={{ 
              color: '#888', 
              fontSize: '16px',
              lineHeight: '1.6'
            }}>
              Search by specific areas, neighborhoods, or proximity to amenities
            </p>
          </div>
          
          <div className="text-center">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm"
              style={{ backgroundColor: '#E65D24' + '15', color: '#E65D24' }}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 3.26a2 2 0 001.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 
              className="mb-4"
              style={{ 
                color: '#23272f', 
                fontSize: '24px', 
                fontWeight: '700',
                lineHeight: '1.3'
              }}
            >
              Direct Contact
            </h3>
            <p style={{ 
              color: '#888', 
              fontSize: '16px',
              lineHeight: '1.6'
            }}>
              Get verified agent contact details for every property
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;