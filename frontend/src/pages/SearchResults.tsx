import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { Property } from '../types';

interface PropertyImageCarouselProps {
  images: string[];
  title: string;
}

function PropertyImageCarousel({ images, title }: PropertyImageCarouselProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  if (!images || images.length === 0) {
    return (
      <div className="relative h-48 overflow-hidden">
        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-3xl">
          🏠
        </div>
        {/* On the Market Badge */}
        <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 z-10">
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
          On the market
        </div>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative h-48 overflow-hidden group">
      <img
        src={images[currentImageIndex]}
        alt={`${title} - Image ${currentImageIndex + 1}`}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={(e) => {
          // If image fails to load, try next image or show placeholder
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
      
      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
          {currentImageIndex + 1} / {images.length}
        </div>
      )}
      
      {/* On the Market Badge */}
      <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 z-10">
        <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
        On the market
      </div>
      
      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
      
      {/* Image Dots Indicator */}
      {images.length > 1 && images.length <= 5 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentImageIndex ? 'bg-white' : 'bg-white/50'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const searchType = searchParams.get('type') || 'onthemarket';
  
  const [results, setResults] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newQuery, setNewQuery] = useState(query);

  useEffect(() => {
    if (query) {
      handleSearch(query);
    }
  }, [query]);

  const handleSearch = async (searchQuery: string = newQuery) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const isRental = searchQuery.toLowerCase().includes('rent') || searchQuery.toLowerCase().includes('pcm');
      const baseUrl = isRental ? 'to-rent' : 'for-sale';
      const locationMatch = searchQuery.match(/in\s+([a-zA-Z\s,]+)/i);
      let location = locationMatch ? locationMatch[1].trim().toLowerCase() : '';
      location = location
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .replace(/-for|-under/g, '');
      
      const priceMatch = searchQuery.match(/(\d+)(?:k|pcm|\s*pound)/i);
      const priceValue = priceMatch ? priceMatch[1] : '';
      const bedroomMatch = searchQuery.match(/(\d+)\s*bed/i);
      const bedrooms = bedroomMatch ? bedroomMatch[1] : '';
      
      const params = new URLSearchParams();
      if (bedrooms) {
        params.append('min-bedrooms', bedrooms);
        params.append('max-bedrooms', bedrooms);
      }
      if (priceValue) {
        if (isRental) {
          params.append('min-price', priceValue);
        } else {
          const price = searchQuery.toLowerCase().includes('k') 
            ? String(parseInt(priceValue) * 1000)
            : priceValue;
          params.append('max-price', price);
        }
      }
      params.append('view', 'grid');
      
      const searchUrl = `https://www.onthemarket.com/${baseUrl}/property/${location}/`;
      const finalUrl = params.toString() ? `${searchUrl}?${params.toString()}` : searchUrl;
      
      const endpoint = searchType === 'internet' ? 'http://localhost:3001/scrape-internet' : 'http://localhost:3001/scrape';
      
      const requestBody = searchType === 'internet' 
        ? { 
            query: searchQuery,
            apiKey: 'BSAbpHw4lHUQBBsmRTmY3pEK6WmT8Nz'
          }
        : { 
            url: finalUrl,
            apiKey: 'BSAbpHw4lHUQBBsmRTmY3pEK6WmT8Nz'
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
      
      const data = await response.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSearch = () => {
    if (newQuery.trim() && newQuery !== query) {
      navigate(`/search?q=${encodeURIComponent(newQuery)}&type=${searchType}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleNewSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold shadow">
                P
              </div>
              <h1 className="text-xl font-bold text-gray-900">Proptii</h1>
            </button>
            
            <div className="flex-1 max-w-2xl relative">
              <input
                type="text"
                value={newQuery}
                onChange={(e) => setNewQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search for properties..."
                className="w-full px-4 py-3 text-base bg-gray-50 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all placeholder-gray-500"
              />
              <button
                onClick={handleNewSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-600 hover:text-orange-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Summary */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-2xl font-bold text-gray-900">
              Search Results
            </h2>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              searchType === 'internet' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-orange-100 text-orange-700'
            }`}>
              {searchType === 'internet' ? 'Internet Search' : 'OnTheMarket'}
            </span>
          </div>
          <p className="text-gray-600">
            Showing results for: <span className="font-medium text-gray-900">"{query}"</span>
          </p>
          {!loading && results.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Found {results.length} properties
            </p>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin mb-4"></div>
            <p className="text-orange-700 font-medium">Searching for properties...</p>
          </div>
        )}

        {/* Property Results */}
        {!loading && results.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {results.map((property, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="relative">
                  {/* Property Images Carousel */}
                  <PropertyImageCarousel images={property.imageUrls} title={property.title} />
                  
                  {/* Price Badge */}
                  <div className="absolute top-3 right-3 bg-white/95 text-gray-900 font-bold px-3 py-1.5 rounded-lg shadow-lg text-lg z-10">
                    {property.price}
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-lg">
                    {property.title}
                  </h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {property.location}
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0a2 2 0 002-2h14a2 2 0 002 2v0a2 2 0 00-2 2z" />
                      </svg>
                      {property.propertyType} • {property.bedrooms} bedrooms
                    </div>
                  </div>

                  {/* Agent Information */}
                  <div className="border-t pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Listed by</p>
                        <p className="font-medium text-gray-900">{property.agent.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {property.agent.email && property.agent.email !== 'Not found' && (
                        <a
                          href={`mailto:${property.agent.email}`}
                          className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-2 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 3.26a2 2 0 001.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Contact Agent
                        </a>
                      )}
                      
                      {property.agent.website && (
                        <a
                          href={property.agent.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-600 hover:text-orange-700 text-sm font-medium hover:underline"
                        >
                          Visit Website →
                        </a>
                      )}
                      
                      <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 rounded-lg transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results State */}
        {!loading && results.length === 0 && !error && query && (
          <div className="text-center py-20">
            <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md mx-auto">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No Properties Found</h3>
              <p className="text-gray-600 mb-6">
                We couldn't find any properties matching your search criteria. Try adjusting your search or browse different areas.
              </p>
              <button
                onClick={() => navigate('/')}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Try New Search
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default SearchResults;