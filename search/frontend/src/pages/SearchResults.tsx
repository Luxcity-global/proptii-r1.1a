import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { Property } from '../types';

const DEFAULT_LOCAL_SEARCH_URL = 'http://localhost:3001';
const DEFAULT_RENDER_SEARCH_URL = 'https://proptii-r1-1a-search.onrender.com';

const NON_SEARCH_API_HOST_FRAGMENTS = [
  'railway.app',
  'proptii-r1-1a-new-backend.onrender.com',
  'proptii-r1-1a-1.onrender.com',
  'api.proptii.com',
  'api-staging.proptii.com',
];

const normalizeBackendUrl = (rawUrl: string): string => {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return DEFAULT_LOCAL_SEARCH_URL;
  }
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/$/, '');
};

const isMisconfiguredSearchBackendUrl = (url: string): boolean => {
  const lower = url.toLowerCase();
  return NON_SEARCH_API_HOST_FRAGMENTS.some((fragment) => lower.includes(fragment));
};

const resolveBackendUrl = (): string => {
  const envUrl = (import.meta.env.VITE_SEARCH_BACKEND_URL || '').trim();
  if (envUrl && !isMisconfiguredSearchBackendUrl(envUrl)) {
    return normalizeBackendUrl(envUrl);
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname.toLowerCase();
    if (
      hostname === 'proptii.co' ||
      hostname.endsWith('.proptii.co') ||
      hostname === 'proptii.com' ||
      hostname.endsWith('.proptii.com') ||
      hostname.includes('onrender.com')
    ) {
      return DEFAULT_RENDER_SEARCH_URL;
    }
  }

  return DEFAULT_LOCAL_SEARCH_URL;
};

// Function to clean up property pricing - remove "Tenancy Info" and keep only pcm pricing
const cleanPropertyPrice = (price: string): string => {
  if (!price || typeof price !== 'string') return price || '';
  const match = price.match(/£?([\d,]+)(?:\s*(?:pcm|pw|per month))?/i);
  if (match) {
    const num = parseInt(match[1].replace(/,/g, ''));
    return `£${num.toLocaleString('en-GB')}${price.toLowerCase().includes('pcm') ? ' pcm' : ''}`;
  }
  return price.trim();
};

// --- NEW COMPONENT: BookViewingModal ---
function BookViewingModal({ property, isOpen, onClose }: { property: Property | null; isOpen: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    date: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  if (!isOpen || !property) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    try {
      const response = await fetch(`${resolveBackendUrl()}/api/v1/search/book-viewing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentEmail: property.agent.email,
          userName: formData.name,
          userEmail: formData.email,
          propertyName: property.title,
          propertyUrl: property.url,
          preferredDate: formData.date,
          message: formData.message
        }),
      });

      if (response.ok) {
        setStatus('success');
        setTimeout(() => {
          onClose();
          setStatus('idle');
          setFormData({ name: '', email: '', date: '', message: '' });
        }, 2000);
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="proptii-gradient p-8 text-white">
          <h2 className="text-2xl font-bold mb-1">Book a Viewing</h2>
          <p className="text-white/80 text-sm">Direct request to {property.agent.name}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {status === 'success' ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl">✓</div>
              <h3 className="text-xl font-bold text-gray-900">Request Sent!</h3>
              <p className="text-gray-600">The agent will contact you shortly.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Name</label>
                  <input 
                    required 
                    className="proptii-input py-2.5" 
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Email</label>
                  <input 
                    required 
                    type="email" 
                    className="proptii-input py-2.5" 
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Preferred Date</label>
                <input 
                  required 
                  type="date" 
                  className="proptii-input py-2.5"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Message (Optional)</label>
                <textarea 
                  className="proptii-input py-2.5 min-h-[80px]" 
                  placeholder="Tell the agent more about your requirements..."
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                />
              </div>

              {status === 'error' && <p className="text-red-500 text-sm">Failed to send request. Please try again.</p>}

              <button 
                type="submit" 
                disabled={status === 'sending'}
                className="book-viewing-btn w-full"
              >
                {status === 'sending' ? <div className="proptii-spinner-small" /> : 'Confirm Booking Request'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

// Property Details Modal Component
interface PropertyDetailsModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onBook: (property: Property) => void;
}

function PropertyDetailsModal({ property, isOpen, onClose, onBook }: PropertyDetailsModalProps) {
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
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-[10px] font-bold text-green-600 uppercase mb-1">Direct Contact Email</div>
                    <div className="text-sm font-black text-gray-900 break-all">{property.agent.email}</div>
                  </div>
                  {property.agent.website && (
                    <a 
                      href={property.agent.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-600 hover:text-gray-800 underline flex items-center gap-1"
                    >
                      Visit Official Website
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button 
                    className="w-full px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#E65D24', color: 'white' }}
                    onClick={() => onBook(property)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Book Viewing
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
function PropertyCard({ property, onBook, onView }: { property: Property; onBook: (p: Property) => void; onView: (p: Property) => void }) {
  // Explicit log for each property as it renders
  console.log(`[FRONTEND LOG] Property: "${property.title}" | Email: ${property.agent.email || 'NULL'}`);
  return (
    <div 
      onClick={() => onView(property)}
      className="bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 group flex flex-col md:flex-row shadow-sm cursor-pointer"
    >
      {/* Property Image Overlay */}
      <div className="relative md:w-80 h-72 overflow-hidden shrink-0">
        <img
          src={property.imageUrls[0] || 'https://via.placeholder.com/400x300?text=Property'}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Price Badge */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-4 py-2 rounded-2xl shadow-lg font-black text-xl text-gray-900">
          {property.price}
        </div>

        {/* Direct Contact Badge */}
        {property.agent.email && (
          <div className="absolute bottom-4 left-4 bg-green-500/90 backdrop-blur text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-white/20">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            DIRECT CONTACT
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8 flex flex-col">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-widest rounded-full">
              {property.propertyType}
            </span>
            <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              {property.location}
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-orange-600 transition-colors line-clamp-1">
            {property.title}
          </h3>

          <div className="flex gap-6 mb-8 text-sm font-semibold text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">🛏️</div>
              {property.bedrooms} Beds
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">📏</div>
              Verified Listing
            </div>
          </div>
        </div>

        {/* Agent & Actions Section */}
        <div className="border-t border-gray-100 pt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="agent-avatar-placeholder">
              {property.agent.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-black text-gray-900 line-clamp-1">{property.agent.name}</p>
              <div className="flex flex-col">
                <p className="text-[11px] font-bold text-green-600 uppercase tracking-tight">
                  Direct Email Found:
                </p>
                <p className="text-xs font-black text-gray-900 bg-green-50 px-2 py-0.5 rounded border border-green-100 break-all">
                  {property.agent.email}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <a 
              href={`tel:${property.agent.phone}`}
              className="p-3 bg-gray-50 text-gray-600 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-all border border-gray-100"
              title="Call Agent"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </a>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onBook(property);
              }}
              className="px-8 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-orange-600 transition-all duration-300 shadow-lg shadow-gray-200 btn-pulse"
            >
              Book Viewing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// Map Component
interface MapComponentProps {
  center?: { lat: number; lng: number };
  properties?: Property[];
  selectedProperty?: Property | null;
  onLocationSelect?: (location: string) => void;
}

function MapComponent({ center, properties = [], selectedProperty, onLocationSelect }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Load Google Maps script
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyChXxNp1xBJtJB9pC5WxWoZw3__7nT3djU&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeMap();
      };
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    return () => {
      // Cleanup
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !window.google || !window.google.maps) return;

    const googleMaps = window.google.maps;
    const defaultCenter = center || { lat: 51.5074, lng: -0.1278 }; // London default

    const map = new googleMaps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 13,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: googleMaps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: googleMaps.ControlPosition.TOP_LEFT,
      },
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      zoomControlOptions: {
        position: googleMaps.ControlPosition.RIGHT_BOTTOM,
      },
    });

    mapInstanceRef.current = map;
    setMapLoaded(true);

    // Add map type toggle listeners
    const mapTypeButtons = mapRef.current.parentElement?.querySelectorAll('.map-type-btn');
    mapTypeButtons?.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        const types = ['roadmap', 'satellite'];
        map.setMapTypeId(types[index] as any);
      });
    });

    // Geocode properties and add markers
    if (properties.length > 0) {
      geocodeProperties(properties, map);
    }

    // Update center when selected property changes
    if (selectedProperty) {
      geocodeAddress(selectedProperty.location, (location) => {
        if (location) {
          map.setCenter(location);
          map.setZoom(15);
        }
      });
    }
  };

  const geocodeAddress = (address: string, callback: (location: { lat: number; lng: number } | null) => void) => {
    if (!window.google?.maps?.Geocoder) {
      callback(null);
      return;
    }

    const googleMaps = window.google.maps;
    const geocoder = new googleMaps.Geocoder();
    geocoder.geocode({ address }, (results: any, status: string) => {
      if (status === 'OK' && results?.[0]) {
        const location = results[0].geometry.location;
        callback({ lat: location.lat(), lng: location.lng() });
      } else {
        callback(null);
      }
    });
  };

  const geocodeProperties = (props: Property[], map: any) => {
    if (!window.google?.maps) return;
    
    const googleMaps = window.google.maps;
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    let completedGeocodes = 0;
    const bounds = new (googleMaps as any).LatLngBounds();

    props.forEach((property) => {
      geocodeAddress(property.location, (location) => {
        if (location && map && googleMaps) {
          const marker = new googleMaps.Marker({
            position: location,
            map,
            title: property.title,
            icon: {
              url: `http://maps.google.com/mapfiles/ms/icons/red-dot.png`,
              scaledSize: new googleMaps.Size(32, 32),
            },
          });

          const infoWindow = new googleMaps.InfoWindow({
            content: `
              <div style="padding: 8px;">
                <h3 style="font-weight: bold; margin-bottom: 4px;">${property.title}</h3>
                <p style="color: #E65D24; font-weight: bold; margin: 4px 0;">${cleanPropertyPrice(property.price)}</p>
                <p style="font-size: 12px; color: #666;">${property.location}</p>
              </div>
            `,
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
            if (onLocationSelect) {
              onLocationSelect(property.location);
            }
          });

          markersRef.current.push(marker);
          bounds.extend(location);
          completedGeocodes++;

          // Fit bounds once all geocoding is complete
          if (completedGeocodes === props.length) {
            if (markersRef.current.length === 1) {
              // If only one marker, center and zoom to it
              map.setCenter(location);
              map.setZoom(15);
            } else if (markersRef.current.length > 1) {
              // Fit bounds to show all markers
              map.fitBounds(bounds);
            }
          }
        }
      });
    });
  };

  useEffect(() => {
    if (mapLoaded && mapInstanceRef.current && properties.length > 0) {
      // Geocode all properties and add markers
      geocodeProperties(properties, mapInstanceRef.current);
    }
  }, [properties, mapLoaded]);

  useEffect(() => {
    if (mapLoaded && mapInstanceRef.current && selectedProperty) {
      geocodeAddress(selectedProperty.location, (location) => {
        if (location && mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(location);
          mapInstanceRef.current.setZoom(15);
        }
      });
    }
  }, [selectedProperty, mapLoaded]);

  return (
    <div className="relative h-full w-full" style={{ height: '100%' }}>
      <div className="absolute top-2 left-2 z-10 flex gap-1 bg-white rounded shadow-sm">
        <button className="map-type-btn px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-l">
          Map
        </button>
        <button className="map-type-btn px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-r">
          Satellite
        </button>
      </div>
      <div ref={mapRef} className="w-full h-full" style={{ height: '100%' }} />
    </div>
  );
}

// Main SearchResults Component
function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const searchType = searchParams.get('type') || 'internet';
  
  const [results, setResults] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newQuery, setNewQuery] = useState(query);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  // Progressive streaming state
  const [providers, setProviders] = useState<string[]>([]);
  const [completedProviders, setCompletedProviders] = useState<Set<string>>(new Set());
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addDebugLog = (msg: string) => {
    console.log(msg);
    setDebugLogs(prev => [msg, ...prev].slice(0, 10));
  };

  const resultsPerPage = 10;
  const totalPages = Math.ceil(results.length / resultsPerPage);
  const currentResults = results.slice((currentPage - 1) * resultsPerPage, currentPage * resultsPerPage);
  const pendingProviders = providers.filter(p => !completedProviders.has(p));

  useEffect(() => {
    const controller = new AbortController();
    if (query) {
      handleSearch(query, controller.signal);
    }
    return () => controller.abort();
  }, [query]);

  const handleSearch = async (searchQuery: string = newQuery, signal?: AbortSignal) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setProviders([]);
    setCompletedProviders(new Set());
    setCurrentPage(1);

    try {
      const backendBaseUrl = resolveBackendUrl().replace(/\/$/, '');
      const endpoint = `${backendBaseUrl}/api/v1/search`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, filters: {} }),
        signal: signal,
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('ReadableStream not supported');

      const decoder = new TextDecoder();
      let buffer = '';
      let allResults: Property[] = [];

      while (true) {
        const { done, value } = await reader.read();
        
        if (value) {
          buffer += decoder.decode(value, { stream: true });
        }

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          
          try {
            const event = JSON.parse(trimmed.slice(6));
            addDebugLog(`[SSE] Received: ${event.type} from ${event.provider || 'system'}`);

            if (event.type === 'providers') {
              setProviders(event.providers as string[]);

            } else if (event.type === 'initial') {
              const incoming = (event.data as any[]).map(p => ({
                ...p,
                price: cleanPropertyPrice(p.price),
              }));
              addDebugLog(`[SSE] Initial valid results: ${incoming.length}`);
              
              // Log agent emails for each property
              incoming.forEach(p => {
                if (p.agent?.email) {
                  addDebugLog(`Property Email: ${p.agent.email}`);
                }
              });

              setResults(incoming);

            } else if (event.type === 'results') {
              const incoming = (event.data as any[]).map(p => ({
                ...p,
                price: cleanPropertyPrice(p.price),
              }));
              
              setResults(prev => {
                const seen = new Set(prev.map(r => r.url));
                const fresh = incoming.filter(p => !seen.has(p.url));
                
                if (fresh.length > 0) {
                  addDebugLog(`[SSE] Added ${fresh.length} new results from ${event.provider}`);
                  // Log emails for fresh results
                  fresh.forEach(p => {
                    if (p.agent?.email) {
                      addDebugLog(`Property Email: ${p.agent.email}`);
                    }
                  });
                }
                return [...prev, ...fresh];
              });

            } else if (event.type === 'provider_done') {
              setCompletedProviders(prev => new Set([...prev, event.provider as string]));

            } else if (event.type === 'done') {
              setLoading(false);
              addDebugLog('[SSE] Search finished');

            } else if (event.type === 'error') {
              setError(event.message || 'Search failed');
              setLoading(false);
            }
          } catch (parseErr) {
            console.error('Error parsing SSE event:', parseErr, 'Line was:', trimmed);
          }
        }
        
        if (done) {
          // Process any remaining partial line in buffer if it's a complete valid JSON chunk
          if (buffer.trim().startsWith('data: ')) {
            try {
              const event = JSON.parse(buffer.trim().slice(6));
              if (event.type === 'done') {
                setLoading(false);
                addDebugLog('[SSE] Search finished from trailing buffer');
              }
            } catch (e) {
              // Ignore trailing garbage
            }
          }
          addDebugLog(`[SSE] Stream closed by browser (done=true).`);
          break;
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        addDebugLog('[SSE] Search aborted (component unmounted).');
        return;
      }
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(msg);
      addDebugLog(`[ERROR] Fetch threw: ${msg}`);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
      addDebugLog(`[SSE] Exited handleSearch flow.`);
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
            {loading && results.length > 0 && (
              <p className="text-sm text-orange-500 mt-1 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                {results.length} found so far • {pendingProviders.length} source{pendingProviders.length !== 1 ? 's' : ''} still loading…
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

        {/* Loading State — only shown when no results yet */}
        {loading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin mb-6"></div>
            <h2 style={{ color: '#E65D24' }} className="text-xl font-bold mb-2">Searching across multiple portals...</h2>
            <p className="text-gray-600 mb-8 max-w-md">
              Results will appear as each source completes — no waiting required.
            </p>
            {providers.length > 0 && (
              <div className="flex flex-wrap gap-3 justify-center">
                {providers.map(p => (
                  <div key={p} className="flex items-center gap-2 bg-white border border-orange-100 rounded-full px-4 py-2 text-sm shadow-sm">
                    <div className="w-3 h-3 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-600">{p}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Live Provider Status Banner — shown while loading with some results */}
        {loading && results.length > 0 && providers.length > 0 && (
          <div className="mb-6 bg-orange-50 border border-orange-100 rounded-xl px-5 py-3 flex flex-wrap items-center gap-3">
            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin shrink-0" />
            <span className="text-sm font-semibold text-orange-800 mr-1">Still searching:</span>
            {providers.map(p => {
              const done = completedProviders.has(p);
              return (
                <span
                  key={p}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    done
                      ? 'bg-green-100 text-green-700'
                      : 'bg-white border border-orange-200 text-orange-700'
                  }`}
                >
                  {done ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                  )}
                  {p}
                </span>
              );
            })}
          </div>
        )}

        {/* Property Results — shown as soon as ANY results arrive */}
        {results.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mb-8">
              {/* Left Column - Property Listings */}
            <div className="space-y-6">
                {/* Search Summary Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Search Summary</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><span className="font-medium">Query:</span> {query}</p>
                        <p><span className="font-medium">Platform:</span> {searchType === 'internet' ? 'Internet Search' : 'On the Market'}</p>
                        <p>
                          <span className="font-medium">Results in state:</span> {results.length}
                          {loading && <span className="text-orange-500 ml-2 animate-pulse">• scraping...</span>}
                        </p>
                      </div>
                    </div>
                    <button
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors text-sm"
                      onClick={() => {
                        const mapElement = document.getElementById('map-container');
                        mapElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      Show Map
                    </button>
                  </div>
                </div>

                {/* Property Listings */}
                <div className="space-y-4">
                  {currentResults.map((property, index) => (
                    <PropertyCard
                      key={index}
                      property={property}
                      onBook={(prop) => {
                        setSelectedProperty(prop);
                        setIsBookingOpen(true);
                      }}
                      onView={handleViewDetails}
                    />
                  ))}

                  {/* Skeleton cards for pending providers */}
                  {loading && pendingProviders.map(provider => (
                    <div key={provider} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse" style={{ boxShadow: '0 2px 12px rgba(44,62,80,0.06)' }}>
                      <div className="md:flex">
                        <div className="md:w-96 h-60 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
                        <div className="flex-1 p-6 space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-orange-300 animate-pulse" />
                            <div className="text-xs text-orange-500 font-medium">Searching {provider}…</div>
                          </div>
                          <div className="h-5 bg-gray-200 rounded w-3/4" />
                          <div className="h-7 bg-orange-100 rounded w-1/3" />
                          <div className="h-4 bg-gray-100 rounded w-1/2" />
                          <div className="flex gap-4 mt-2">
                            <div className="h-4 bg-gray-100 rounded w-16" />
                            <div className="h-4 bg-gray-100 rounded w-20" />
                          </div>
                          <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                            <div className="h-4 bg-gray-100 rounded w-24" />
                            <div className="flex gap-2">
                              <div className="h-8 w-16 bg-orange-100 rounded-lg" />
                              <div className="h-8 w-16 bg-gray-100 rounded-lg" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
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
              </div>

              {/* Right Sidebar - Map Only */}
              <div className="sticky top-24">
              <div id="map-container" className="h-[calc(100vh-150px)] min-h-[600px] rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <MapComponent 
                  properties={currentResults} 
                  selectedProperty={selectedProperty}
                  onLocationSelect={(location) => {
                    // Optional: handle map pin click if needed
                  }}
                />
              </div>
              </div>
            </div>
          </>
        )}

        {/* No Results State — only after all scrapers have finished */}
        {!loading && results.length === 0 && !error && query && providers.length > 0 && pendingProviders.length === 0 && (
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

      {/* Property Details Modal fallback */}
      <PropertyDetailsModal
        property={selectedProperty}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProperty(null);
        }}
        onBook={(p) => {
          setIsModalOpen(false);
          setSelectedProperty(p);
          setIsBookingOpen(true);
        }}
      />

      {/* NEW: Book Viewing Modal */}
      <BookViewingModal
        property={selectedProperty}
        isOpen={isBookingOpen}
        onClose={() => {
          setIsBookingOpen(false);
          setSelectedProperty(null);
        }}
      />


    </div>
  );
}

export default SearchResults;