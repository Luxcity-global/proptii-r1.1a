import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { Property } from '../types';

// Function to clean up property pricing - remove "Tenancy Info" and keep only pcm pricing
const cleanPropertyPrice = (price: string): string => {
  if (!price || typeof price !== 'string') {
    return price || '';
  }
  
  // Remove "Tenancy info" text
  let cleanedPrice = price.replace(/Tenancy info£?/gi, '');
  
  // Remove pw pricing - match patterns like "(£375 pw)" or " (£375 pw)"
  cleanedPrice = cleanedPrice.replace(/\s*\(£[\d,]+\s*pw\)/gi, '');
  
  // Extract only the pcm pricing
  const pcmMatch = cleanedPrice.match(/£[\d,]+ pcm/i);
  if (pcmMatch) {
    return pcmMatch[0];
  }
  
  // If no pcm found, try to add pound sign if missing
  if (cleanedPrice.trim()) {
    const trimmedPrice = cleanedPrice.trim();
    // If it doesn't start with £, add it
    if (!trimmedPrice.startsWith('£')) {
      // Check if it's a number or contains numbers
      if (/\d/.test(trimmedPrice)) {
        return `£${trimmedPrice}`;
      }
    }
    return trimmedPrice;
  }
  
  return cleanedPrice.trim();
};

// Property Details Modal Component
interface PropertyDetailsModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

function PropertyDetailsModal({ property, isOpen, onClose }: PropertyDetailsModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      const handleArrows = (e: KeyboardEvent) => {
        if (!property?.imageUrls?.length) return;
        if (e.key === 'ArrowLeft') {
          setCurrentImageIndex(prev => prev > 0 ? prev - 1 : property.imageUrls.length - 1);
        } else if (e.key === 'ArrowRight') {
          setCurrentImageIndex(prev => (prev + 1) % property.imageUrls.length);
        }
      };
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleArrows);
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('keydown', handleArrows);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, onClose, property]);

  if (!isOpen || !property) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
        style={{ maxWidth: '900px' }}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Property Details</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Image Gallery */}
        {property.imageUrls && property.imageUrls.length > 0 && (
          <div className="relative">
            <div className="h-96 overflow-hidden">
              <img
                src={property.imageUrls[currentImageIndex]}
                alt={`${property.title} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Navigation Arrows */}
            {property.imageUrls.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : property.imageUrls.length - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentImageIndex(prev => (prev + 1) % property.imageUrls.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Thumbnail Strip */}
            {property.imageUrls.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 rounded-lg p-2">
                {property.imageUrls.slice(0, 8).map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-12 h-8 rounded overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex ? 'border-white' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
                {property.imageUrls.length > 8 && (
                  <div className="w-12 h-8 bg-black/50 rounded flex items-center justify-center text-white text-xs">
                    +{property.imageUrls.length - 8}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Property Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Details */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{property.title}</h1>
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {property.location}
                </div>
                <div className="text-3xl font-bold" style={{ color: '#E65D24' }}>{cleanPropertyPrice(property.price)}</div>
              </div>

              {/* Property Specifications */}
              <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-600 mb-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0a2 2 0 002-2h14a2 2 0 002 2v0a2 2 0 00-2 2z" />
                    </svg>
                    <span className="text-sm">Bedrooms</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">{property.bedrooms}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-600 mb-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                    </svg>
                    <span className="text-sm">Property Type</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">{property.propertyType}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-600 mb-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-sm">Status</span>
                  </div>
                  <div className="text-lg font-bold text-green-600">Available</div>
                </div>
              </div>

              {/* Description - Only show if description exists */}
              {property.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Property Description</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {property.description}
                  </p>
                </div>
              )}
            </div>

            {/* Agent Info & Actions */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Listed By</h3>
                <div className="mb-6">
                  <div className="text-lg font-bold text-gray-900">{property.agent.name}</div>
                  {property.agent.website && (
                    <a 
                      href={property.agent.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      View Agency Website
                    </a>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button 
                    className="w-full px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#E65D24', color: 'white' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Chat
                  </button>
                  
                  <button className="w-full bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call
                  </button>
                  
                  {property.agent.email && property.agent.email !== 'Not found' && (
                    <a
                      href={`mailto:${property.agent.email}`}
                      className="w-full bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 3.26a2 2 0 001.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Message
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Smart Search Bar Component
interface SmartSearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  loading: boolean;
}

function SmartSearchBar({ query, onQueryChange, onSearch, loading }: SmartSearchBarProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  
  const suggestions = [
    { text: "2 bedroom flat in Bromley under £300k", confidence: 95 },
    { text: "3 bedroom house in Manchester under £400k", confidence: 90 },
    { text: "Studio apartment in London under £250k", confidence: 85 },
  ];

  const recentSearches = [
    "2 bedroom flats for sale in London",
    "Houses to rent in Manchester",
    "Properties under £500k in Birmingham"
  ];

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div 
        className={`bg-white rounded-full shadow-lg border-2 transition-all ${
          hasFocus ? 'border-orange-400' : 'border-transparent'
        }`}
        style={{ 
          height: '64px',
          boxShadow: '0 8px 24px rgba(44,62,80,0.08)'
        }}
      >
        <div className="flex items-center h-full px-6">
          {/* AI Sparkles Icon */}
          <div className="mr-4" style={{ color: '#E65D24' }}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>

          {/* Search Input */}
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => {
              setHasFocus(true);
              setShowSuggestions(true);
            }}
            onBlur={() => {
              setHasFocus(false);
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            placeholder="AI-powered property search... Try '2 bed flat in Bromley' or 'rent under £1500'"
            className="flex-1 text-lg bg-transparent border-0 focus:outline-none placeholder-gray-500"
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          />

          {/* Clear Button */}
          {query && (
            <button
              onClick={() => onQueryChange('')}
              className="mr-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Voice Search Button */}
          <button className="mr-3 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>

          {/* Search Button */}
          <button
            onClick={onSearch}
            disabled={loading || !query.trim()}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all disabled:opacity-50"
            style={{ backgroundColor: '#E65D24' }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (query.length > 0 || true) && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        >
          {query.length > 0 && (
            <div className="px-4 py-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">AI Suggestions</div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onQueryChange(suggestion.text);
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">{suggestion.text}</span>
                    <span className="text-xs text-green-600 font-medium">{suggestion.confidence}% match</span>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          <div className="border-t border-gray-100 px-4 py-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent Searches</div>
            {recentSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => {
                  onQueryChange(search);
                  setShowSuggestions(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-700">{search}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Property Card Component
interface PropertyCardProps {
  property: Property;
  onViewDetails: (property: Property) => void;
}

function PropertyCard({ property, onViewDetails }: PropertyCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const images = property.imageUrls || [];
  const hasImages = images.length > 0;

  return (
    <div 
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer max-w-6xl"
      style={{ boxShadow: '0 2px 12px rgba(44,62,80,0.10)' }}
      onClick={() => onViewDetails(property)}
    >
      <div className="md:flex">
        {/* Image Gallery Section */}
        <div className="md:w-96 h-60 relative overflow-hidden">
          {hasImages ? (
            <>
              <img
                src={images[currentImageIndex]}
                alt={property.title}
                className="w-full h-full object-cover"
                style={{ borderRadius: '16px 0 0 16px' }}
              />
              
              {/* Favorite Icon */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFavorite(!isFavorite);
                }}
                className="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
              >
                <svg 
                  className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-600'}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>

              {/* Badges */}
              <div className="absolute top-4 left-4 space-y-2">
                <div className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                  {cleanPropertyPrice(property.price).includes('pcm') ? 'To Rent' : 'For Sale'}
                </div>
                <div className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                  Available Now
                </div>
              </div>

              {/* View Label */}
              <div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs px-2 py-1 rounded">
                Street View
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 space-y-3">
                  {images.slice(0, 4).map((img, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(index);
                      }}
                      className={`w-16 h-12 rounded overflow-hidden border-2 transition-colors ${
                        index === currentImageIndex ? 'border-white' : 'border-transparent'
                      }`}
                    >
                      <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-4xl">
              🏠
            </div>
          )}
        </div>

        {/* Property Details Section */}
        <div className="flex-1 p-6">
          {/* Title and Price */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                {property.title}
              </h3>
              <div className="text-2xl font-semibold mb-2" style={{ color: '#E65D24' }}>
                {cleanPropertyPrice(property.price)}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-center gap-2 text-gray-600 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{property.location}</span>
          </div>

          {/* Specifications */}
          <div className="flex items-center gap-6 mb-4 text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0a2 2 0 002-2h14a2 2 0 002 2v0a2 2 0 00-2 2z" />
              </svg>
              <span>{property.bedrooms} bed</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
              <span>{property.propertyType}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 pt-4 mb-4"></div>

          {/* Agent Info and Actions */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Listed by</p>
              <p className="font-semibold text-gray-900">{property.agent.name}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                className="px-4 py-2 rounded-lg font-semibold transition-colors"
                style={{ backgroundColor: '#E65D24', color: 'white' }}
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle chat action
                }}
              >
                Chat
              </button>
              <button 
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle call action
                }}
              >
                Call
              </button>
              {property.agent.email && property.agent.email !== 'Not found' && (
                <a
                  href={`mailto:${property.agent.email}`}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  Message
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main SearchResults Component
function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const searchType = searchParams.get('type') || 'onthemarket';
  
  const [results, setResults] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newQuery, setNewQuery] = useState(query);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const resultsPerPage = 10;
  const totalPages = Math.ceil(results.length / resultsPerPage);
  const currentResults = results.slice((currentPage - 1) * resultsPerPage, currentPage * resultsPerPage);

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
      

      
      // Ensure we always use HTTP protocol for the backend
      const backendBaseUrl = import.meta.env.VITE_SEARCH_BACKEND_URL || 'http://localhost:3001';
      const backendUrl = backendBaseUrl.startsWith('http://') ? backendBaseUrl : `http://${backendBaseUrl.replace(/^https?:\/\//, '')}`;
      
      let endpoint = `${backendUrl}/scrape-api`;
      
      // Debug logging
      console.log('Environment variable VITE_SEARCH_BACKEND_URL:', import.meta.env.VITE_SEARCH_BACKEND_URL);
      console.log('Backend Base URL:', backendBaseUrl);
      console.log('Backend URL:', backendUrl);
      console.log('Final endpoint:', endpoint);
      let requestBody: any;

      if (searchType === 'internet') {
        endpoint = `${backendUrl}/scrape-api`;
        requestBody = { 
          query: searchQuery
        };
      } else {
        // Default to API-based search
        requestBody = { 
          query: searchQuery
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
      
      const data = await response.json();
      // Clean the pricing for all properties
      const cleanedData = Array.isArray(data) ? data.map(property => ({
        ...property,
        price: cleanPropertyPrice(property.price)
      })) : [];
      setResults(cleanedData);
      setCurrentPage(1);
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

  const handleViewDetails = (property: Property) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f8fa' }}>
      {/* Compact Header with Search Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="proptii-gradient w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow">
                P
              </div>
              <h1 className="text-xl font-bold" style={{ color: '#23272f' }}>Proptii</h1>
            </button>
            
            {/* Smart Search Bar */}
            <div className="flex-1">
              <SmartSearchBar 
                query={newQuery}
                onQueryChange={setNewQuery}
                onSearch={handleNewSearch}
                loading={loading}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold" style={{ color: '#23272f' }}>
                Search Results
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                searchType === 'internet' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {searchType === 'internet' ? 'Internet Search' : 'On the Market'}
              </span>
            </div>
            <p className="text-gray-600">
              Showing results for: <span className="font-medium" style={{ color: '#23272f' }}>"{query}"</span>
            </p>
            {!loading && results.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Found {results.length} properties • Page {currentPage} of {totalPages}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI Insights
            </button>
            <button className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              Smart Filters
            </button>
          </div>
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
            <p style={{ color: '#E65D24' }} className="font-medium">Searching for properties...</p>
          </div>
        )}

        {/* Property Results */}
        {!loading && results.length > 0 && (
          <>
            <div className="space-y-6">
              {currentResults.map((property, index) => (
                <PropertyCard
                  key={index}
                  property={property}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      page === currentPage
                        ? 'text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                    style={{ 
                      backgroundColor: page === currentPage ? '#E65D24' : 'transparent'
                    }}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* No Results State */}
        {!loading && results.length === 0 && !error && query && (
          <div className="text-center py-20">
            <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md mx-auto">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: '#23272f' }}>No Properties Found</h3>
              <p className="text-gray-600 mb-6">
                We couldn't find any properties matching your search criteria. Try adjusting your search or browse different areas.
              </p>
              <button
                onClick={() => navigate('/')}
                className="text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                style={{ backgroundColor: '#E65D24' }}
              >
                Try New Search
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating AI Assistant Button */}
      <button
        onClick={() => setShowAIAssistant(!showAIAssistant)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-all hover:scale-105 z-30"
        style={{ backgroundColor: '#E65D24' }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {/* Property Details Modal */}
      <PropertyDetailsModal
        property={selectedProperty}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProperty(null);
        }}
      />
    </div>
  );
}

export default SearchResults;