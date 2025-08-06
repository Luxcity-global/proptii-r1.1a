import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<'onthemarket' | 'internet'>('onthemarket');
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-orange-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              P
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Proptii</h1>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#" className="text-gray-600 hover:text-orange-600 transition-colors">About</a>
            <a href="#" className="text-gray-600 hover:text-orange-600 transition-colors">Help</a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center px-6 py-20">
        {/* Logo and Title */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl mx-auto mb-6">
            P
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">Proptii</h1>
          <p className="text-xl text-gray-600 max-w-lg mx-auto leading-relaxed">
            Find your perfect property with intelligent search. Ask anything about homes for sale or rent.
          </p>
        </div>

        {/* Search Interface */}
        <div className="w-full max-w-3xl">
          {/* Search Type Toggle */}
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-xl p-2 shadow-lg border border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setSearchType('onthemarket')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    searchType === 'onthemarket'
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-orange-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    OnTheMarket
                  </div>
                  <p className="text-xs mt-1 opacity-75">Official property portal</p>
                </button>
                <button
                  onClick={() => setSearchType('internet')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    searchType === 'internet'
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-orange-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
                    </svg>
                    Internet Search
                  </div>
                  <p className="text-xs mt-1 opacity-75">Search across web</p>
                </button>
              </div>
            </div>
          </div>

          <div className="relative mb-6">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask anything about properties... e.g., '3 bedroom houses for sale in Manchester under £400k'"
              className="w-full min-h-[120px] p-6 text-lg bg-white rounded-2xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all resize-none placeholder-gray-500 shadow-lg"
              style={{ fontFamily: 'inherit' }}
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              </div>
              <button
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-orange-600 rounded-full animate-spin" />
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

          {/* Example Queries */}
          <div className="text-center">
            <p className="text-gray-500 mb-4">Try asking:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {exampleQueries.map((q, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(q)}
                  className="px-4 py-2 text-sm bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors border border-orange-100 shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-20">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Intelligent Search</h3>
            <p className="text-gray-600 text-sm">Ask in natural language and get exactly what you're looking for</p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Location Focused</h3>
            <p className="text-gray-600 text-sm">Search by specific areas, neighborhoods, or proximity to amenities</p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 3.26a2 2 0 001.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Direct Contact</h3>
            <p className="text-gray-600 text-sm">Get verified agent contact details for every property</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;