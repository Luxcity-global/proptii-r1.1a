import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSearchBackend, type Property } from '../hooks/useSearchBackend';
import { useSavedProperties } from '../contexts/SavedPropertiesContext';
import Footer from '../components/Footer';


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
  onMessageClick: (property: Property) => void;
  isNavigatingToBooking: boolean;
}

function PropertyDetailsModal({ property, isOpen, onClose, onMessageClick, isNavigatingToBooking }: PropertyDetailsModalProps) {
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
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
        style={{ maxWidth: '900px' }}
      >
        {/* Modal Header - Fixed at top */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
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

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto">
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
              <div className="p-4 border-b border-gray-200">
                <div className="flex gap-2 overflow-x-auto">
                  {property.imageUrls.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        index === currentImageIndex ? 'border-[#E65D24]' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Property Details */}
        <div className="p-6">
          {/* Property Title */}
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{property.title}</h3>
          
          {/* Location with map pin icon */}
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-gray-600">at {property.location}</span>
          </div>

          {/* Price */}
                          <div className="text-3xl font-bold text-[#E65D24] mb-6">{cleanPropertyPrice(property.price)}</div>

          {/* Property Details Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{property.bedrooms}</div>
              <div className="text-sm text-gray-600">Bedrooms</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{property.propertyType}</div>
              <div className="text-sm text-gray-600">Property Type</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">Available</div>
              <div className="text-sm text-gray-600">Status</div>
            </div>
          </div>
          
          {/* Property Description */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Description</h4>
            <p className="text-gray-600 leading-relaxed">
              This beautiful {property.propertyType} offers {property.bedrooms} bedrooms and is located in the desirable area of {property.location}. 
              The property features modern amenities and is perfect for families or professionals looking for a comfortable home.
            </p>
          </div>

          {/* Listed By Section */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Listed By</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900 mb-2">{property.agent?.name || 'Agent Information'}</p>
              {property.agent?.website && (
                <a 
                  href={property.agent.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#E65D24] hover:underline text-sm"
                >
                  View Agency Website
                </a>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">
                <button className="bg-[#E65D24] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Chat
                </button>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call
                </button>
                <button
                  onClick={() => onMessageClick(property)}
                  disabled={isNavigatingToBooking}
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isNavigatingToBooking ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                  {isNavigatingToBooking ? 'Loading...' : 'Message'}
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

// Location Insights Component
function LocationInsights({ searchQuery, propertyCount }: { searchQuery: string; propertyCount: number }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'strengths' | 'recommendations' | 'amenities'>('overview');

  // Extract location from search query
  const locationMatch = searchQuery.match(/(?:in|at|near)\s+([A-Za-z\s,]+)/i);
  const location = locationMatch ? locationMatch[1].trim() : searchQuery;

  return (
    <div className="mt-4 bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-[#136C9E] to-[#1a8cc9]">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Location Insights - {location}
        </h3>
        <p className="text-sm text-blue-50 mt-1">{propertyCount} properties found in this area</p>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
            activeTab === 'overview'
              ? 'text-[#E65D24] bg-white border-b-2 border-[#E65D24]'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <span>📊</span>
            Overview
          </span>
        </button>
        <button
          onClick={() => setActiveTab('strengths')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
            activeTab === 'strengths'
              ? 'text-[#E65D24] bg-white border-b-2 border-[#E65D24]'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <span>💪</span>
            Strengths
          </span>
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
            activeTab === 'recommendations'
              ? 'text-[#E65D24] bg-white border-b-2 border-[#E65D24]'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <span>💡</span>
            Tips
          </span>
        </button>
        <button
          onClick={() => setActiveTab('amenities')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
            activeTab === 'amenities'
              ? 'text-[#E65D24] bg-white border-b-2 border-[#E65D24]'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <span>🏪</span>
            Amenities
          </span>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🏘️</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">Area Assessment</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {location} is a well-connected residential area with good access to public transport 
                    and local amenities. The neighborhood offers a balanced mix of residential properties 
                    and essential services, making it suitable for both families and professionals.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold text-green-900">Transport Links</span>
                </div>
                <p className="text-sm text-green-700">Excellent access to public transport networks and major routes</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="font-semibold text-purple-900">Education</span>
                </div>
                <p className="text-sm text-purple-700">Multiple schools and educational facilities in the vicinity</p>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="font-semibold text-orange-900">Shopping</span>
                </div>
                <p className="text-sm text-orange-700">Convenient access to supermarkets and retail outlets</p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="font-semibold text-blue-900">Healthcare</span>
                </div>
                <p className="text-sm text-blue-700">Medical facilities and pharmacies readily available</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'strengths' && (
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🎯</span>
                <h4 className="font-semibold text-gray-900">Property Availability</h4>
                <span className="ml-auto px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">High</span>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Impact:</strong> Excellent selection of properties
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                <li>{propertyCount} properties currently available in this area</li>
                <li>Diverse range of property types and price points</li>
                <li>Multiple landlords offering competitive pricing</li>
              </ul>
            </div>

            <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🚉</span>
                <h4 className="font-semibold text-gray-900">Connectivity</h4>
                <span className="ml-auto px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">Excellent</span>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Impact:</strong> Easy commuting and accessibility
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                <li>Well-served by public transport</li>
                <li>Close to major road networks</li>
                <li>Good walkability score</li>
              </ul>
            </div>

            <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🏪</span>
                <h4 className="font-semibold text-gray-900">Local Amenities</h4>
                <span className="ml-auto px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">Good</span>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Impact:</strong> Convenient daily living
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                <li>Multiple supermarkets and shops nearby</li>
                <li>Restaurants and cafes in walking distance</li>
                <li>Parks and recreational facilities available</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">💡</span>
                <h4 className="font-semibold text-gray-900">Viewing Tips</h4>
                <span className="ml-auto px-2 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded">High Priority</span>
              </div>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Schedule viewings during different times of day to assess noise levels and lighting</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Check water pressure, heating systems, and inspect for any dampness</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Ask about council tax band, utility costs, and any additional fees</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">📍</span>
                <h4 className="font-semibold text-gray-900">Location Research</h4>
                <span className="ml-auto px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">Medium Priority</span>
              </div>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">→</span>
                  <span>Visit the area at different times to get a feel for the neighborhood</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">→</span>
                  <span>Check local crime statistics and community reviews</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">→</span>
                  <span>Research future development plans that might affect the area</span>
                </li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">⚡</span>
                <h4 className="font-semibold text-gray-900">Quick Actions</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-white rounded border border-green-200">
                  <span className="text-gray-700">Compare prices with similar properties</span>
                  <span className="text-xs text-green-600 font-medium">Important</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded border border-green-200">
                  <span className="text-gray-700">Read landlord reviews if available</span>
                  <span className="text-xs text-green-600 font-medium">Recommended</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded border border-green-200">
                  <span className="text-gray-700">Prepare questions about tenancy terms</span>
                  <span className="text-xs text-green-600 font-medium">Essential</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'amenities' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏫</span>
                  <span className="font-medium text-gray-900">Schools & Education</span>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Nearby</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏥</span>
                  <span className="font-medium text-gray-900">Hospitals & Clinics</span>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Accessible</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🛒</span>
                  <span className="font-medium text-gray-900">Shopping Centers</span>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Within 1km</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🍽️</span>
                  <span className="font-medium text-gray-900">Restaurants & Cafes</span>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Nearby</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌳</span>
                  <span className="font-medium text-gray-900">Parks & Recreation</span>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Available</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚇</span>
                  <span className="font-medium text-gray-900">Public Transport</span>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Excellent</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💪</span>
                  <span className="font-medium text-gray-900">Gyms & Fitness</span>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Available</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg border border-pink-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎬</span>
                  <span className="font-medium text-gray-900">Entertainment</span>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">Moderate</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get('q') || '';
  const searchTypeParam = searchParams.get('type') || 'internet';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isNavigatingToBooking, setIsNavigatingToBooking] = useState(false);

  const { results, isLoading, error, retry, searchProperties, clearCache } = useSearchBackend();
  const { isPropertySaved, toggleSaveProperty } = useSavedProperties();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const serviceMarkersRef = useRef<any[]>([]);
  const searchLocationMarkerRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const markersGeocodedRef = useRef<boolean>(false);
  const lastResultsKeyRef = useRef<string | null>(null);
  const searchLocationRef = useRef<any>(null);
  const propertyToMarkerMapRef = useRef<Map<number, any>>(new Map()); // Maps property index to marker
  const markerToPropertyIndexMapRef = useRef<Map<any, number>>(new Map()); // Maps marker to property index

  // Function to discover nearby services
  const discoverNearbyServices = (location: any) => {
    if (!placesServiceRef.current || !mapInstanceRef.current) return;
    
    // Service categories to discover
    const serviceTypes = [
      { type: 'transit_station', category: 'Transport', icon: '🚇', color: '#2196F3' },
      { type: 'school', category: 'Education', icon: '🎓', color: '#4CAF50' },
      { type: 'hospital', category: 'Healthcare', icon: '🏥', color: '#F44336' },
      { type: 'grocery_or_supermarket', category: 'Shopping', icon: '🛒', color: '#FF9800' },
      { type: 'park', category: 'Recreation', icon: '🌳', color: '#4CAF50' },
      { type: 'restaurant', category: 'Dining', icon: '🍽️', color: '#9C27B0' },
    ];
    
    // Clear existing service markers
    serviceMarkersRef.current.forEach(marker => marker.setMap(null));
    serviceMarkersRef.current = [];
    
    // Discover services for each type
    serviceTypes.forEach((serviceType, index) => {
      setTimeout(() => {
        const request = {
          location: location,
          radius: 2000, // 2km radius
          type: serviceType.type,
        };
        
        placesServiceRef.current.nearbySearch(request, (results: any[], status: string) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            // Limit to top 5 results per category
            const topResults = results.slice(0, 5);
            
            topResults.forEach((place: any) => {
              const marker = new window.google.maps.Marker({
                position: place.geometry.location,
                map: mapInstanceRef.current,
                title: place.name,
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: serviceType.color,
                  fillOpacity: 0.8,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 2,
                },
                zIndex: 500,
              });
              
              // Create info window for service
              const infoWindow = new window.google.maps.InfoWindow({
                content: `
                  <div style="padding: 8px; max-width: 200px;">
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                      <span style="font-size: 16px;">${serviceType.icon}</span>
                      <h4 style="margin: 0; font-size: 13px; font-weight: bold; color: ${serviceType.color};">${place.name}</h4>
                    </div>
                    <p style="margin: 0; font-size: 11px; color: #666;">${place.vicinity || place.formatted_address || ''}</p>
                    ${place.rating ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: #666;">⭐ ${place.rating}/5 (${place.user_ratings_total || 0} reviews)</p>` : ''}
                  </div>
                `,
              });
              
              marker.addListener('click', () => {
                // Close all other info windows
                serviceMarkersRef.current.forEach(m => {
                  if (m.infoWindow) m.infoWindow.close();
                });
                markersRef.current.forEach(m => {
                  if (m.infoWindow) m.infoWindow.close();
                });
                infoWindow.open(mapInstanceRef.current, marker);
              });
              
              marker.infoWindow = infoWindow;
              marker.serviceCategory = serviceType.category;
              serviceMarkersRef.current.push(marker);
            });
          }
        });
      }, index * 200); // Stagger requests to avoid rate limiting
    });
  };

  // Perform search when component mounts or search params change
  useEffect(() => {
    if (searchQuery) {
      // Check if we have cached results for this exact query
      const cachedData = sessionStorage.getItem('searchResults');
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          // Only perform new search if the query or search type has changed
          if (parsed.query !== searchQuery || parsed.searchType !== searchTypeParam) {
            searchProperties(searchQuery, searchTypeParam as 'onthemarket' | 'internet');
          }
        } catch (error) {
          // If cache is corrupted, perform new search
          searchProperties(searchQuery, searchTypeParam as 'onthemarket' | 'internet');
        }
      } else {
        // No cache, perform new search
        searchProperties(searchQuery, searchTypeParam as 'onthemarket' | 'internet');
      }
    }
  }, [searchQuery, searchTypeParam, searchProperties]);

  // Reset navigation state when component mounts (when returning from BookViewing)
  useEffect(() => {
    setIsNavigatingToBooking(false);
  }, []);

  // Load Google Maps API script
  useEffect(() => {
    const loadGoogleMapsScript = () => {
      if (window.google && window.google.maps) {
        setIsMapLoaded(true);
        return;
      }

      if (!document.getElementById('google-maps-script')) {
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyChXxNp1xBJtJB9pC5WxWoZw3__7nT3djU&libraries=places';
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          setIsMapLoaded(true);
        };
        
        script.onerror = () => {
          console.error('Failed to load Google Maps script');
        };
        
        document.head.appendChild(script);
      } else {
        // Script already exists, check if Google Maps is ready
        const checkInterval = setInterval(() => {
          if (window.google && window.google.maps) {
            setIsMapLoaded(true);
            clearInterval(checkInterval);
          }
        }, 100);
        
        // Clear interval after 10 seconds to prevent infinite checking
        setTimeout(() => clearInterval(checkInterval), 10000);
      }
    };

    loadGoogleMapsScript();
  }, []);

  // Initialize map when showMap is true and script is loaded
  useEffect(() => {
    if (!showMap || !isMapLoaded || !mapRef.current) {
      return;
    }

    // Wait a bit to ensure DOM is ready
    const initTimeout = setTimeout(() => {
      if (!window.google || !window.google.maps || !mapRef.current) {
        console.error('Google Maps not available or map container not ready');
        return;
      }

      // If map is already initialized, just update search location and services
      if (mapInstanceRef.current) {
        console.log('Map already initialized, updating search location...');
        
        // Clear previous search location marker and service markers
        if (searchLocationMarkerRef.current) {
          searchLocationMarkerRef.current.setMap(null);
          searchLocationMarkerRef.current = null;
        }
        serviceMarkersRef.current.forEach(marker => marker.setMap(null));
        serviceMarkersRef.current = [];
        
        // Re-geocode search location and discover services
        if (searchQuery && window.google.maps) {
          const geocoder = new window.google.maps.Geocoder();
          const locationMatch = searchQuery.match(/(?:in|at|near)\s+([A-Za-z\s]+)/i);
          const locationToGeocode = locationMatch ? locationMatch[1].trim() : searchQuery;
          
          geocoder.geocode({ address: locationToGeocode }, (results, status) => {
            if (status === 'OK' && results && results[0] && mapInstanceRef.current) {
              const location = results[0].geometry.location;
              searchLocationRef.current = location;
              
              // Add search location marker
              searchLocationMarkerRef.current = new window.google.maps.Marker({
                position: location,
                map: mapInstanceRef.current,
                title: `Search Location: ${locationToGeocode}`,
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 12,
                  fillColor: '#136C9E',
                  fillOpacity: 1,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 3,
                },
                zIndex: 1000,
              });
              
              const searchInfoWindow = new window.google.maps.InfoWindow({
                content: `
                  <div style="padding: 8px; max-width: 200px;">
                    <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold; color: #136C9E;">📍 Search Location</h4>
                    <p style="margin: 0; font-size: 12px; color: #666;">${locationToGeocode}</p>
                  </div>
                `,
              });
              
              searchLocationMarkerRef.current.addListener('click', () => {
                searchInfoWindow.open(mapInstanceRef.current, searchLocationMarkerRef.current);
              });
              
              mapInstanceRef.current.setCenter(location);
              mapInstanceRef.current.setZoom(12);
              
              // Discover nearby services
              discoverNearbyServices(location);
            }
          });
        }
        return;
      }

      // Step 1: Initialize map centered on UK (country view)
      try {
        if (!mapRef.current) {
          console.error('Map container element not found');
          return;
        }

        // Ensure the container has dimensions
        const container = mapRef.current;
        if (container.offsetWidth === 0 || container.offsetHeight === 0) {
          console.warn('Map container has no dimensions, retrying in 200ms...');
          setTimeout(() => {
            if (mapRef.current && mapRef.current.offsetWidth > 0 && mapRef.current.offsetHeight > 0 && !mapInstanceRef.current) {
              try {
                mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
                  center: { lat: 54.0, lng: -2.0 },
                  zoom: 6,
                  mapTypeControl: true,
                  streetViewControl: true,
                  fullscreenControl: true,
                  zoomControl: true,
                });
                placesServiceRef.current = new window.google.maps.places.PlacesService(mapInstanceRef.current);
                console.log('Map initialized successfully (retry)');
                window.google.maps.event.trigger(mapInstanceRef.current, 'resize');
              } catch (err) {
                console.error('Error creating map instance (retry):', err);
              }
            }
          }, 200);
          return;
        }

        try {
          mapInstanceRef.current = new window.google.maps.Map(container, {
            center: { lat: 54.0, lng: -2.0 }, // Center of UK
            zoom: 6, // Show entire UK
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            zoomControl: true,
          });
          
          // Initialize Places Service
          placesServiceRef.current = new window.google.maps.places.PlacesService(mapInstanceRef.current);
          
          console.log('Map initialized successfully - showing UK view');
          
          // Trigger resize event to ensure map renders properly
          setTimeout(() => {
            if (mapInstanceRef.current) {
              window.google.maps.event.trigger(mapInstanceRef.current, 'resize');
              
              // Reattach any existing markers to the new map instance (fix for reload issue)
              if (markersRef.current.length > 0) {
                console.log(`Reattaching ${markersRef.current.length} markers to map after initialization`);
                markersRef.current.forEach(marker => {
                  if (marker.getMap() !== mapInstanceRef.current) {
                    marker.setMap(mapInstanceRef.current);
                  }
                });
              }
            }
          }, 100);
        } catch (err) {
          console.error('Error creating map instance:', err);
        }
        
        // Step 2: Extract and geocode search location, then zoom in
        if (searchQuery && window.google.maps) {
          const geocoder = new window.google.maps.Geocoder();
          // Extract location from search query (e.g., "2 bedroom flats in London" -> "London")
          const locationMatch = searchQuery.match(/(?:in|at|near)\s+([A-Za-z\s]+)/i);
          const locationToGeocode = locationMatch ? locationMatch[1].trim() : searchQuery;
          
          console.log('Geocoding search location:', locationToGeocode);
          
          geocoder.geocode({ address: locationToGeocode }, (results, status) => {
            if (status === 'OK' && results && results[0] && mapInstanceRef.current) {
              const location = results[0].geometry.location;
              searchLocationRef.current = location;
              
              // Places Service should already be initialized in map initialization
              if (!placesServiceRef.current && mapInstanceRef.current) {
                placesServiceRef.current = new window.google.maps.places.PlacesService(mapInstanceRef.current);
              }
              
              // Add search location marker (prominent marker)
              if (searchLocationMarkerRef.current) {
                searchLocationMarkerRef.current.setMap(null);
              }
              
              searchLocationMarkerRef.current = new window.google.maps.Marker({
                position: location,
                map: mapInstanceRef.current,
                title: `Search Location: ${locationToGeocode}`,
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 12,
                  fillColor: '#136C9E',
                  fillOpacity: 1,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 3,
                },
                zIndex: 1000,
                animation: window.google.maps.Animation.DROP,
              });
              
              // Add info window for search location
              const searchInfoWindow = new window.google.maps.InfoWindow({
                content: `
                  <div style="padding: 8px; max-width: 200px;">
                    <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold; color: #136C9E;">📍 Search Location</h4>
                    <p style="margin: 0; font-size: 12px; color: #666;">${locationToGeocode}</p>
                  </div>
                `,
              });
              
              searchLocationMarkerRef.current.addListener('click', () => {
                searchInfoWindow.open(mapInstanceRef.current, searchLocationMarkerRef.current);
              });
              
              // Step 3: Center and zoom on search location
              mapInstanceRef.current.setCenter(location);
              mapInstanceRef.current.setZoom(12); // Zoom into city level
              console.log('Map centered and zoomed on search location:', locationToGeocode);
              
              // Discover nearby services
              discoverNearbyServices(location);
            } else {
              console.warn('Failed to geocode search location:', locationToGeocode, status);
              // Fallback: center on London if search location geocoding fails
              const fallbackLocation = { lat: 51.5074, lng: -0.1278 };
              searchLocationRef.current = new window.google.maps.LatLng(fallbackLocation.lat, fallbackLocation.lng);
              mapInstanceRef.current.setCenter(fallbackLocation);
              mapInstanceRef.current.setZoom(12);
            }
          });
        } else {
          // No search query, just show UK
          mapInstanceRef.current.setCenter({ lat: 54.0, lng: -2.0 });
          mapInstanceRef.current.setZoom(6);
        }
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }, 100); // Small delay to ensure DOM is ready

    return () => {
      clearTimeout(initTimeout);
    };
  }, [showMap, isMapLoaded, searchQuery]);

  // Function to recreate markers from cached positions
  const recreateMarkersFromCache = useCallback((properties: Property[], map: any) => {
    if (!window.google || !window.google.maps || !map) return false;
    
    const markerCacheKey = 'mapMarkerPositions';
    const cachedMarkers = sessionStorage.getItem(markerCacheKey);
    if (!cachedMarkers) return false;
    
    try {
      const markerPositions: Array<{ propertyIndex: number; lat: number; lng: number; address: string }> = JSON.parse(cachedMarkers);
      if (!Array.isArray(markerPositions) || markerPositions.length === 0) return false;
      
      console.log(`Recreating ${markerPositions.length} markers from cache...`);
      
      const bounds = new window.google.maps.LatLngBounds();
      let recreatedCount = 0;
      
      markerPositions.forEach((cachedMarker) => {
        const propertyIndex = cachedMarker.propertyIndex;
        if (propertyIndex >= 0 && propertyIndex < properties.length) {
          const property = properties[propertyIndex];
          
          // Verify the cached address matches the current property address
          if (property.location.trim() === cachedMarker.address) {
            const location = new window.google.maps.LatLng(cachedMarker.lat, cachedMarker.lng);
            
            // Create marker with pin/pointer icon
            const pinSvgString = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><path d="M16 0C7.163 0 0 7.163 0 16c0 11.25 16 24 16 24s16-12.75 16-24C32 7.163 24.837 0 16 0zm0 9c2.209 0 4 1.791 4 4s-1.791 4-4 4-4-1.791-4-4 1.791-4 4-4z" fill="#E65D24" stroke="#FFFFFF" stroke-width="2"/></svg>';
            
            const markerIcon = {
              url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(pinSvgString),
              scaledSize: new window.google.maps.Size(32, 40),
              anchor: new window.google.maps.Point(16, 40),
            };
            
            const marker = new window.google.maps.Marker({
              position: location,
              map: map,
              title: property.title,
              animation: window.google.maps.Animation.DROP,
              optimized: false,
              icon: markerIcon,
              zIndex: 600,
            });
            
            marker.originalIcon = markerIcon;
            
            // Verify marker is attached to map
            if (marker.getMap() !== map) {
              console.warn(`Marker for property ${propertyIndex} not attached to map, reattaching...`);
              marker.setMap(map);
            }
            
            // Create info window (same as in geocoding)
            const propertyId = `prop-${propertyIndex}-${Date.now()}`;
            const imageUrls = property.imageUrls || [];
            const firstImageUrl = imageUrls.length > 0 ? imageUrls[0] : '';
            const cleanedPrice = cleanPropertyPrice(property.price || 'N/A');
            
            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="max-width: 320px; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; cursor: pointer;" id="info-card-${propertyId}">
                  ${firstImageUrl ? `
                    <div style="position: relative; width: 100%; height: 180px; overflow: hidden; border-radius: 12px 12px 0 0; background-color: #f0f0f0;">
                      <img id="info-img-${propertyId}" src="${firstImageUrl}" alt="Property" style="width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s;" />
                      ${imageUrls.length > 1 ? `
                        <button id="prev-btn-${propertyId}" style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 18px; line-height: 1; padding: 0; z-index: 10; transition: background 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.8)'" onmouseout="this.style.background='rgba(0,0,0,0.6)'">‹</button>
                        <button id="next-btn-${propertyId}" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 18px; line-height: 1; padding: 0; z-index: 10; transition: background 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.8)'" onmouseout="this.style.background='rgba(0,0,0,0.6)'">›</button>
                        <div id="img-counter-${propertyId}" style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.6); color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; z-index: 10;">1/${imageUrls.length}</div>
                      ` : ''}
                      <div style="position: absolute; top: 12px; left: 12px; background: #E65D24; color: white; padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 13px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                        ${cleanedPrice}
                      </div>
                      ${property.source ? `
                        <div style="position: absolute; bottom: 12px; left: 12px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px;">
                          ${property.source}
                        </div>
                      ` : ''}
                    </div>
                  ` : `
                    <div style="position: relative; width: 100%; height: 180px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); display: flex; align-items: center; justify-content: center; border-radius: 12px 12px 0 0;">
                      <svg width="48" height="48" style="color: #9ca3af;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div style="position: absolute; top: 12px; left: 12px; background: #E65D24; color: white; padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 13px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                        ${cleanedPrice}
                      </div>
                    </div>
                  `}
                  <div style="padding: 16px; background: white; border-radius: 0 0 12px 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <h3 style="font-weight: 600; margin: 0 0 12px 0; font-size: 16px; color: #1a1a1a; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                      ${property.location}
                    </h3>
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 12px; color: #4b5563; font-size: 13px;">
                      <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${property.title || 'Property Listing'}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 16px; font-size: 13px; color: #4b5563;">
                      <div style="display: flex; align-items: center; gap: 4px;">
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                        </svg>
                        <span style="font-weight: 500;">${property.bedrooms || 'N/A'}</span>
                      </div>
                      <div style="display: flex; align-items: center; gap: 4px;">
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span style="font-weight: 500;">${property.propertyType || 'Property'}</span>
                      </div>
                    </div>
                    ${property.agent && property.agent.name ? `
                      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
                        Agent: ${property.agent.name}
                      </div>
                    ` : ''}
                  </div>
                </div>
              `,
            });
            
            // Set up info window handlers (simplified version)
            window.google.maps.event.addListener(infoWindow, 'domready', () => {
              const infoCard = document.getElementById(`info-card-${propertyId}`) as HTMLElement;
              if (infoCard) {
                infoCard.style.cursor = 'pointer';
                infoCard.addEventListener('click', () => {
                  infoWindow.close();
                  const event = new CustomEvent('openPropertyModal', { 
                    detail: { property, propertyIndex } 
                  });
                  window.dispatchEvent(event);
                });
              }
            });
            
            marker.addListener('click', () => {
              markersRef.current.forEach(m => {
                if (m.infoWindow) m.infoWindow.close();
              });
              infoWindow.open(map, marker);
            });
            
            marker.infoWindow = infoWindow;
            marker.propertyIndex = propertyIndex;
            
            propertyToMarkerMapRef.current.set(propertyIndex, marker);
            markerToPropertyIndexMapRef.current.set(marker, propertyIndex);
            
            markersRef.current.push(marker);
            bounds.extend(location);
            recreatedCount++;
          }
        }
      });
      
      if (recreatedCount > 0) {
        // Verify all markers are actually on the map
        const visibleMarkers = markersRef.current.filter(m => m.getMap() !== null && m.getMap() === map).length;
        console.log(`Recreated ${recreatedCount} markers, ${visibleMarkers} are visible on map`);
        
        // Fit bounds to show all recreated markers
        setTimeout(() => {
          if (recreatedCount === 1) {
            const singleMarker = markersRef.current.find(m => m.getMap() === map);
            if (singleMarker) {
              const position = singleMarker.getPosition();
              map.setCenter(position);
              map.setZoom(14);
            }
          } else if (recreatedCount > 1) {
            // Create new bounds from visible markers only
            const visibleBounds = new window.google.maps.LatLngBounds();
            markersRef.current.forEach(marker => {
              if (marker.getMap() === map) {
                visibleBounds.extend(marker.getPosition());
              }
            });
            if (!visibleBounds.isEmpty()) {
              map.fitBounds(visibleBounds, {
                top: 80,
                right: 80,
                bottom: 80,
                left: 80
              });
            }
          }
          markersGeocodedRef.current = true;
          console.log(`✓ Recreated ${recreatedCount} markers from cache (${visibleMarkers} visible)`);
        }, 300);
        return true;
      } else {
        console.log('No markers were recreated from cache');
      }
    } catch (e) {
      console.error('Error recreating markers from cache:', e);
      sessionStorage.removeItem(markerCacheKey);
    }
    
    return false;
  }, []);
  
  // Geocode properties and add markers when results change
  // This runs AFTER the map is initialized and centered on search location
  useEffect(() => {
    console.log('Property markers useEffect triggered:', {
      showMap,
      isMapLoaded,
      hasMapInstance: !!mapInstanceRef.current,
      hasGoogleMaps: !!(window.google && window.google.maps),
      resultsCount: results.length
    });
    
    // Check if all conditions are met for marker creation
    const conditionsMet = showMap && isMapLoaded && mapInstanceRef.current && window.google && window.google.maps && results.length > 0;
    
    if (conditionsMet) {
      // Create a unique key for this results set to prevent re-geocoding
      const resultsKey = results.map(r => `${r.location}-${r.title}`).join('|');
      
      console.log('Checking if markers need to be created:', {
        currentKey: lastResultsKeyRef.current,
        newKey: resultsKey,
        alreadyGeocoded: markersGeocodedRef.current
      });
      
      // Skip if we've already geocoded these exact results AND markers actually exist on the map
      const existingMarkersCount = markersRef.current.filter(m => m.getMap() !== null).length;
      if (lastResultsKeyRef.current === resultsKey && markersGeocodedRef.current && existingMarkersCount > 0) {
        console.log('Markers already geocoded and exist on map, skipping re-geocode...', {
          existingMarkersCount,
          totalMarkers: markersRef.current.length
        });
        return;
      }
      
      // If markers were supposed to be created but don't exist, try cache first
      if (markersGeocodedRef.current && existingMarkersCount === 0) {
        console.log('Markers were marked as geocoded but none exist on map - trying cache...');
        const recreated = recreateMarkersFromCache(results, mapInstanceRef.current);
        if (recreated) {
          return; // Successfully recreated from cache
        }
        markersGeocodedRef.current = false;
      }
      
      // Try to recreate from cache before geocoding (only if we have cache and results match)
      if (!markersGeocodedRef.current || lastResultsKeyRef.current !== resultsKey) {
        const recreated = recreateMarkersFromCache(results, mapInstanceRef.current);
        if (recreated) {
          // Successfully recreated from cache - verify markers are on map
          const visibleMarkers = markersRef.current.filter(m => m.getMap() !== null).length;
          if (visibleMarkers > 0) {
            console.log(`Successfully recreated ${visibleMarkers} markers from cache`);
            lastResultsKeyRef.current = resultsKey;
            markersGeocodedRef.current = true;
            return;
          } else {
            console.warn('Cache recreation returned true but no markers are visible - will geocode instead');
            // Clear invalid cache and continue with geocoding
            sessionStorage.removeItem('mapMarkerPositions');
            markersRef.current = [];
          }
        }
      }
      
      // Update the results key
      const previousKey = lastResultsKeyRef.current;
      const resultsChanged = previousKey !== resultsKey;
      
      // If results changed significantly, clear old marker cache
      if (resultsChanged && previousKey) {
        console.log('Results changed - clearing old marker cache');
        sessionStorage.removeItem('mapMarkerPositions');
        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
        propertyToMarkerMapRef.current.clear();
        markerToPropertyIndexMapRef.current.clear();
      }
      
      lastResultsKeyRef.current = resultsKey;
      console.log('Processing results to create markers...', {
        resultsKey,
        previousKey,
        resultsCount: results.length,
        willCreateMarkers: resultsChanged || !markersGeocodedRef.current,
        markersAlreadyGeocoded: markersGeocodedRef.current
      });
      
      // Wait a bit for map to finish centering on search location before adding markers
      console.log('Setting timeout for marker creation (500ms delay)...');
      let timeoutId: NodeJS.Timeout | null = null;
      
      timeoutId = setTimeout(() => {
        console.log('Timeout executed - starting marker creation process...', {
          hasMapInstance: !!mapInstanceRef.current,
          hasGoogleMaps: !!(window.google && window.google.maps),
          resultsCount: results.length
        });
        
        if (!mapInstanceRef.current) {
          console.error('Map instance not available in timeout - retrying in 500ms');
          setTimeout(() => {
            if (mapInstanceRef.current && showMap) {
              // Retry marker creation by triggering the effect again
              console.log('Retrying marker creation after map instance available');
              // Force re-trigger by updating a dependency
              markersGeocodedRef.current = false;
            }
          }, 500);
          return;
        }
        
        if (!window.google || !window.google.maps) {
          console.error('Google Maps not available in timeout');
          return;
        }
        
        // Double-check: if we have no markers but should have them, ensure we create them
        const currentMarkerCount = markersRef.current.filter(m => m.getMap() !== null).length;
        if (currentMarkerCount === 0 && results.length > 0) {
          console.log('No markers visible - proceeding with geocoding to create markers');
        }
        
        const geocoder = new window.google.maps.Geocoder();
        const bounds = new window.google.maps.LatLngBounds();
        
        // Clear existing markers only when starting fresh geocode
        console.log(`Clearing ${markersRef.current.length} existing property markers...`);
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
        markersGeocodedRef.current = false;
        // Clear property-marker mappings
        propertyToMarkerMapRef.current.clear();
        markerToPropertyIndexMapRef.current.clear();
        
        // Note: We keep service markers and search location marker as they're based on search query, not results
      
        // Filter properties with valid addresses
        const propertiesWithAddresses = results.filter(prop => prop.location && prop.location.trim());
        const totalProperties = propertiesWithAddresses.length;
        
        console.log('Properties filtered:', {
          totalResults: results.length,
          withAddresses: totalProperties,
          sampleLocations: propertiesWithAddresses.slice(0, 3).map(p => p.location)
        });
        
        if (totalProperties === 0) {
          console.warn('No properties with valid addresses to geocode');
          return;
        }

        console.log(`Starting to geocode ${totalProperties} properties...`);
        let completedCount = 0;
        let successfulGeocodes = 0;

        // Helper function to check if we should fit bounds
        const checkAndFitBounds = () => {
          completedCount++;
          
          if (completedCount === totalProperties) {
            console.log(`Geocoding complete: ${successfulGeocodes} successful out of ${totalProperties}`);
            
            if (successfulGeocodes > 0) {
              // Wait a bit to ensure all markers are rendered
              setTimeout(() => {
                try {
                  const ne = bounds.getNorthEast();
                  const sw = bounds.getSouthWest();
                  
                  // Validate bounds
                  if (ne && sw) {
                    const latDiff = Math.abs(ne.lat() - sw.lat());
                    const lngDiff = Math.abs(ne.lng() - sw.lng());
                    
                    // Check if bounds are valid (not a single point)
                    if (latDiff > 0.001 || lngDiff > 0.001) {
                      // Calculate center point
                      const centerLat = (ne.lat() + sw.lat()) / 2;
                      const centerLng = (ne.lng() + sw.lng()) / 2;
                      
                      // Calculate appropriate zoom level based on bounds
                      const maxLatDiff = Math.max(latDiff, 0.01);
                      const maxLngDiff = Math.max(lngDiff, 0.01);
                      
                      // Determine zoom level (larger bounds = lower zoom)
                      let targetZoom = 12;
                      if (maxLatDiff > 0.5 || maxLngDiff > 0.5) {
                        targetZoom = 10; // Very spread out
                      } else if (maxLatDiff > 0.2 || maxLngDiff > 0.2) {
                        targetZoom = 11;
                      } else if (maxLatDiff < 0.05 && maxLngDiff < 0.05) {
                        targetZoom = 14; // Very close together
                      }
                      
                      // Fit bounds with padding
                      mapInstanceRef.current.fitBounds(bounds, {
                        top: 80,
                        right: 80,
                        bottom: 80,
                        left: 80
                      });
                      
                      // Wait for map to finish adjusting, then ensure proper zoom
                      const idleListener = window.google.maps.event.addListenerOnce(
                        mapInstanceRef.current,
                        'idle',
                        () => {
                          const currentZoom = mapInstanceRef.current.getZoom();
                          
                          // Enforce zoom constraints
                          if (currentZoom < 10) {
                            console.log(`Zoom too low (${currentZoom}), setting to 10`);
                            mapInstanceRef.current.setZoom(10);
                          } else if (currentZoom > 15) {
                            console.log(`Zoom too high (${currentZoom}), setting to 15`);
                            mapInstanceRef.current.setZoom(15);
                          }
                          
                          // Verify markers are still visible and attached to map
                          const visibleMarkers = markersRef.current.filter(m => m.getMap() !== null);
                          console.log(`Map idle - Zoom: ${mapInstanceRef.current.getZoom()}, Total markers: ${markersRef.current.length}, Visible on map: ${visibleMarkers.length}`);
                          
                          // Reattach any markers that are not on the map (fix for reload issue)
                          if (visibleMarkers.length < markersRef.current.length && mapInstanceRef.current) {
                            console.warn(`Some markers are not attached to map (${visibleMarkers.length}/${markersRef.current.length}), reattaching...`);
                            markersRef.current.forEach(marker => {
                              if (marker.getMap() !== mapInstanceRef.current) {
                                marker.setMap(mapInstanceRef.current);
                              }
                            });
                          }
                        }
                      );
                      
                      console.log('Map bounds fitted:', {
                        center: { lat: centerLat, lng: centerLng },
                        targetZoom: targetZoom,
                        bounds: { ne: { lat: ne.lat(), lng: ne.lng() }, sw: { lat: sw.lat(), lng: sw.lng() } },
                        totalMarkers: markersRef.current.length
                      });
                      
                      // Mark as geocoded
                      markersGeocodedRef.current = true;
                      
                      // Final verification: ensure all markers are visible
                      const finalVisibleCount = markersRef.current.filter(m => m.getMap() === mapInstanceRef.current).length;
                      console.log(`✓ Marker creation complete: ${finalVisibleCount}/${markersRef.current.length} markers visible on map`);
                      if (finalVisibleCount < markersRef.current.length) {
                        console.warn(`⚠ Some markers are not visible - reattaching...`);
                        markersRef.current.forEach(marker => {
                          if (marker.getMap() !== mapInstanceRef.current) {
                            marker.setMap(mapInstanceRef.current);
                          }
                        });
                      }
                    } else if (successfulGeocodes === 1) {
                      // Single property - center on it
                      const singleMarker = markersRef.current[0];
                      if (singleMarker) {
                        const position = singleMarker.getPosition();
                        mapInstanceRef.current.setCenter(position);
                        mapInstanceRef.current.setZoom(14);
                        console.log('Map centered on single property');
                        
                        // Verify marker is visible
                        if (singleMarker.getMap() !== mapInstanceRef.current) {
                          singleMarker.setMap(mapInstanceRef.current);
                        }
                      }
                      markersGeocodedRef.current = true;
                    }
                  }
                } catch (error) {
                  console.error('Error fitting bounds:', error);
                  // Fallback: center on first marker if available
                  if (markersRef.current.length > 0) {
                    const firstMarker = markersRef.current[0];
                    const position = firstMarker.getPosition();
                    mapInstanceRef.current.setCenter(position);
                    mapInstanceRef.current.setZoom(12);
                    console.log('Fallback: Map centered on first marker');
                    
                    // Ensure marker is visible
                    if (firstMarker.getMap() !== mapInstanceRef.current) {
                      firstMarker.setMap(mapInstanceRef.current);
                    }
                  }
                  markersGeocodedRef.current = true;
                }
              }, 300); // Small delay to ensure markers are rendered
            }
          }
        };

        // Step 4: Geocode each property and add markers
        propertiesWithAddresses.forEach((property, index) => {
          const address = property.location.trim();
          
          // Add delay between requests to avoid rate limiting
          setTimeout(() => {
            geocoder.geocode({ address: address }, (geocodeResults, status) => {
              if (status === 'OK' && geocodeResults && geocodeResults[0]) {
                const location = geocodeResults[0].geometry.location;
                
                // Create marker with pin/pointer icon - distinct style for properties
                // Use a proper location pin icon that points to the location
                // Simple, reliable pin icon using SVG string
                const pinSvgString = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><path d="M16 0C7.163 0 0 7.163 0 16c0 11.25 16 24 16 24s16-12.75 16-24C32 7.163 24.837 0 16 0zm0 9c2.209 0 4 1.791 4 4s-1.791 4-4 4-4-1.791-4-4 1.791-4 4-4z" fill="#E65D24" stroke="#FFFFFF" stroke-width="2"/></svg>';
                
                const markerIcon = {
                  url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(pinSvgString),
                  scaledSize: new window.google.maps.Size(32, 40),
                  anchor: new window.google.maps.Point(16, 40), // Pin tip points to location
                };
                
                const marker = new window.google.maps.Marker({
                  position: location,
                  map: mapInstanceRef.current,
                  title: property.title,
                  animation: window.google.maps.Animation.DROP,
                  optimized: false, // Force markers to render
                  icon: markerIcon,
                  zIndex: 600,
                });
                
                // Store original icon for hover effect
                marker.originalIcon = markerIcon;
                
                // Ensure marker is attached to map (fix for reload issue)
                if (marker.getMap() !== mapInstanceRef.current && mapInstanceRef.current) {
                  console.log(`Reattaching marker to map for property ${index + 1}`);
                  marker.setMap(mapInstanceRef.current);
                }
                
                // Debug: Verify icon is set correctly
                console.log(`✓ Pin marker created for property ${index + 1}: ${property.title} at ${address}`, {
                  icon: markerIcon,
                  position: location,
                  marker: marker,
                  attachedToMap: marker.getMap() !== null
                });
                
                // Verify marker icon was set and marker is visible
                setTimeout(() => {
                  const actualIcon = marker.getIcon();
                  const isOnMap = marker.getMap() !== null;
                  console.log(`Marker verification for property ${index + 1}:`, {
                    icon: actualIcon,
                    onMap: isOnMap,
                    mapInstance: !!mapInstanceRef.current
                  });
                  
                  // If marker is not on map, reattach it
                  if (!isOnMap && mapInstanceRef.current) {
                    console.warn(`Marker ${index + 1} not on map, reattaching...`);
                    marker.setMap(mapInstanceRef.current);
                  }
                }, 500);

                // Create unique ID for this property's info window
                const propertyId = `prop-${index}-${Date.now()}`;
                const imageUrls = property.imageUrls || [];
                const imageUrlsJson = JSON.stringify(imageUrls);
                const firstImageUrl = imageUrls.length > 0 ? imageUrls[0] : '';
                
                // Create info window with mini listing card design
                const cleanedPrice = cleanPropertyPrice(property.price || 'N/A');
                const infoWindow = new window.google.maps.InfoWindow({
                  content: `
                    <div style="max-width: 320px; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; cursor: pointer;" id="info-card-${propertyId}">
                      ${firstImageUrl ? `
                        <div style="position: relative; width: 100%; height: 180px; overflow: hidden; border-radius: 12px 12px 0 0; background-color: #f0f0f0;">
                          <img id="info-img-${propertyId}" src="${firstImageUrl}" alt="Property" style="width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s;" />
                          ${imageUrls.length > 1 ? `
                            <button id="prev-btn-${propertyId}" style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 18px; line-height: 1; padding: 0; z-index: 10; transition: background 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.8)'" onmouseout="this.style.background='rgba(0,0,0,0.6)'">‹</button>
                            <button id="next-btn-${propertyId}" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 18px; line-height: 1; padding: 0; z-index: 10; transition: background 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.8)'" onmouseout="this.style.background='rgba(0,0,0,0.6)'">›</button>
                            <div id="img-counter-${propertyId}" style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.6); color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; z-index: 10;">1/${imageUrls.length}</div>
                          ` : ''}
                          <!-- Price Badge -->
                          <div style="position: absolute; top: 12px; left: 12px; background: #E65D24; color: white; padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 13px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                            ${cleanedPrice}
                          </div>
                          ${property.source ? `
                            <div style="position: absolute; bottom: 12px; left: 12px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px;">
                              ${property.source}
                            </div>
                          ` : ''}
                        </div>
                      ` : `
                        <div style="position: relative; width: 100%; height: 180px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); display: flex; align-items: center; justify-content: center; border-radius: 12px 12px 0 0;">
                          <svg width="48" height="48" style="color: #9ca3af;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <div style="position: absolute; top: 12px; left: 12px; background: #E65D24; color: white; padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 13px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                            ${cleanedPrice}
                          </div>
                        </div>
                      `}
                      <div style="padding: 16px; background: white; border-radius: 0 0 12px 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <h3 style="font-weight: 600; margin: 0 0 12px 0; font-size: 16px; color: #1a1a1a; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                          ${property.location}
                        </h3>
                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 12px; color: #4b5563; font-size: 13px;">
                          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${property.title || 'Property Listing'}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 16px; font-size: 13px; color: #4b5563;">
                          <div style="display: flex; align-items: center; gap: 4px;">
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                            </svg>
                            <span style="font-weight: 500;">${property.bedrooms || 'N/A'}</span>
                          </div>
                          <div style="display: flex; align-items: center; gap: 4px;">
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span style="font-weight: 500;">${property.propertyType || 'Property'}</span>
                          </div>
                        </div>
                        ${property.agent && property.agent.name ? `
                          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
                            Agent: ${property.agent.name}
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  `,
                });

                // Set up image navigation and click handler when info window is ready
                window.google.maps.event.addListener(infoWindow, 'domready', () => {
                  const imgEl = document.getElementById(`info-img-${propertyId}`) as HTMLImageElement;
                  const prevBtn = document.getElementById(`prev-btn-${propertyId}`) as HTMLButtonElement;
                  const nextBtn = document.getElementById(`next-btn-${propertyId}`) as HTMLButtonElement;
                  const counterEl = document.getElementById(`img-counter-${propertyId}`) as HTMLDivElement;
                  const infoCard = document.getElementById(`info-card-${propertyId}`) as HTMLElement;
                  
                  // Add click handler to open full property modal
                  if (infoCard) {
                    infoCard.style.cursor = 'pointer';
                    infoCard.addEventListener('click', (e) => {
                      // Don't trigger if clicking on image navigation elements (buttons or counter)
                      const target = e.target as HTMLElement;
                      if (target.id === `prev-btn-${propertyId}` || target.id === `next-btn-${propertyId}` || 
                          target.id === `img-counter-${propertyId}` ||
                          target.closest(`#prev-btn-${propertyId}`) || target.closest(`#next-btn-${propertyId}`) ||
                          target.closest(`#img-counter-${propertyId}`)) {
                        return;
                      }
                      // Close info window and open full modal
                      infoWindow.close();
                      // Dispatch custom event to open modal (will be handled by component)
                      const event = new CustomEvent('openPropertyModal', { 
                        detail: { property, propertyIndex: index } 
                      });
                      window.dispatchEvent(event);
                    });
                  }
                  
                  if (!imgEl || imageUrls.length <= 1) {
                    if (prevBtn) prevBtn.style.display = 'none';
                    if (nextBtn) nextBtn.style.display = 'none';
                    return;
                  }
                  
                  let currentIndex = 0;
                  
                  const updateImage = () => {
                    if (imgEl) {
                      imgEl.src = imageUrls[currentIndex];
                    }
                    if (counterEl) {
                      counterEl.textContent = `${currentIndex + 1}/${imageUrls.length}`;
                    }
                    if (prevBtn) {
                      prevBtn.style.display = currentIndex > 0 ? 'flex' : 'none';
                    }
                    if (nextBtn) {
                      nextBtn.style.display = currentIndex < imageUrls.length - 1 ? 'flex' : 'none';
                    }
                  };
                  
                  if (prevBtn) {
                    prevBtn.addEventListener('click', (e) => {
                      e.stopPropagation();
                      if (currentIndex > 0) {
                        currentIndex--;
                        updateImage();
                      }
                    });
                  }
                  
                  if (nextBtn) {
                    nextBtn.addEventListener('click', (e) => {
                      e.stopPropagation();
                      if (currentIndex < imageUrls.length - 1) {
                        currentIndex++;
                        updateImage();
                      }
                    });
                  }
                  
                  // Prevent image counter from triggering modal
                  if (counterEl) {
                    counterEl.addEventListener('click', (e) => {
                      e.stopPropagation();
                    });
                  }
                  
                  updateImage();
                });

                marker.addListener('click', () => {
                  // Close all other info windows
                  markersRef.current.forEach(m => {
                    if (m.infoWindow) m.infoWindow.close();
                  });
                  // Open the mini listing card (InfoWindow) - no scrolling
                  infoWindow.open(mapInstanceRef.current, marker);
                });

                marker.infoWindow = infoWindow;
                marker.propertyIndex = index; // Store property index on marker
                
                // Store bidirectional mapping
                propertyToMarkerMapRef.current.set(index, marker);
                markerToPropertyIndexMapRef.current.set(marker, index);
                
                markersRef.current.push(marker);
                bounds.extend(location);
                successfulGeocodes++;
                
                // Verify marker is actually on the map
                const markerMap = marker.getMap();
                if (markerMap !== mapInstanceRef.current) {
                  console.warn(`Marker ${index + 1} not properly attached to map, fixing...`);
                  marker.setMap(mapInstanceRef.current);
                }
                
                // Cache marker position for persistence on reload
                const markerCacheKey = 'mapMarkerPositions';
                const cachedMarkers = sessionStorage.getItem(markerCacheKey);
                let markerPositions: Array<{ propertyIndex: number; lat: number; lng: number; address: string }> = [];
                
                if (cachedMarkers) {
                  try {
                    markerPositions = JSON.parse(cachedMarkers);
                  } catch (e) {
                    console.warn('Error parsing cached marker positions:', e);
                    markerPositions = [];
                  }
                }
                
                // Update or add marker position for this property
                const existingIndex = markerPositions.findIndex(m => m.propertyIndex === index);
                const markerData = {
                  propertyIndex: index,
                  lat: location.lat(),
                  lng: location.lng(),
                  address: address
                };
                
                if (existingIndex >= 0) {
                  markerPositions[existingIndex] = markerData;
                } else {
                  markerPositions.push(markerData);
                }
                
                // Save updated cache
                sessionStorage.setItem(markerCacheKey, JSON.stringify(markerPositions));
                
                console.log(`✓ Geocoded property ${index + 1}/${totalProperties}: ${address} (Total markers: ${markersRef.current.length})`);
              } else {
                console.warn(`✗ Failed to geocode address ${index + 1}/${totalProperties}: ${address}`, status);
              }
              
              checkAndFitBounds();
            });
          }, index * 150); // 150ms delay between each geocode request
        });
        }, 500); // Wait 500ms after map initialization before starting geocoding

      // Return cleanup function for this timeout
      return () => {
        if (timeoutId) {
          console.log('Cleaning up marker creation timeout');
          clearTimeout(timeoutId);
        }
      };
    } else {
      // Conditions not met - log why
      const missingConditions = [];
      if (!showMap) missingConditions.push('showMap=false');
      if (!isMapLoaded) missingConditions.push('isMapLoaded=false');
      if (!mapInstanceRef.current) missingConditions.push('mapInstance=null');
      if (!window.google || !window.google.maps) missingConditions.push('GoogleMaps=not loaded');
      if (results.length === 0) missingConditions.push('results=empty');
      
      console.log('Conditions not met for marker creation:', {
        showMap,
        isMapLoaded,
        hasMapInstance: !!mapInstanceRef.current,
        hasGoogleMaps: !!(window.google && window.google.maps),
        resultsLength: results.length,
        missing: missingConditions.join(', ')
      });
      
      // If we have results and map will be shown, ensure flags are reset so markers will be created when conditions are met
      if (results.length > 0 && showMap && (!isMapLoaded || !mapInstanceRef.current)) {
        console.log('Map will be ready soon - ensuring markers will be created when conditions are met');
        // Don't reset flags here - let the map show/hide effect handle it
      }
    }
  }, [showMap, isMapLoaded, results, recreateMarkersFromCache]);
  
  // Reset geocoded flag when map is hidden, and ensure markers are recreated when map is shown
  useEffect(() => {
    if (!showMap) {
      console.log('Map hidden - removing markers from map (keeping cache)');
      // Only remove markers from map visually, but keep them in refs and cache
      markersRef.current.forEach(marker => marker.setMap(null));
      serviceMarkersRef.current.forEach(marker => marker.setMap(null));
      if (searchLocationMarkerRef.current) {
        searchLocationMarkerRef.current.setMap(null);
      }
      // Don't clear markersRef.current, lastResultsKeyRef, or markersGeocodedRef
      // Don't clear the cache - it persists across hide/show
      // Don't clear mapInstanceRef - we want to reuse it when map is shown again
    } else {
      // When map is shown, restore markers from refs if they exist
      if (results.length > 0) {
        if (markersRef.current.length > 0) {
          console.log(`Map shown - reattaching ${markersRef.current.length} existing markers to map`);
          markersRef.current.forEach(marker => {
            if (mapInstanceRef.current && marker.getMap() !== mapInstanceRef.current) {
              marker.setMap(mapInstanceRef.current);
            }
          });
          // Also restore service markers
          serviceMarkersRef.current.forEach(marker => {
            if (mapInstanceRef.current && marker.getMap() !== mapInstanceRef.current) {
              marker.setMap(mapInstanceRef.current);
            }
          });
          // Restore search location marker
          if (searchLocationMarkerRef.current && mapInstanceRef.current) {
            searchLocationMarkerRef.current.setMap(mapInstanceRef.current);
          }
        } else {
          // No markers in refs, try to recreate from cache first
          console.log('Map shown with results but no markers - trying to recreate from cache...');
          if (mapInstanceRef.current && results.length > 0 && isMapLoaded) {
            const recreated = recreateMarkersFromCache(results, mapInstanceRef.current);
            if (!recreated) {
              console.log('Cache recreation failed - resetting flags to trigger new marker creation');
              // Reset flags to force marker creation - the marker creation useEffect will run
              // because isMapLoaded is in its dependencies and will trigger when map becomes ready
              markersGeocodedRef.current = false;
              lastResultsKeyRef.current = null;
              
              // If all conditions are already met, the marker creation useEffect should run
              // If not, it will run when isMapLoaded becomes true
              console.log('Flags reset - marker creation will happen when conditions are met', {
                showMap,
                isMapLoaded,
                hasMapInstance: !!mapInstanceRef.current,
                resultsLength: results.length
              });
            }
          } else {
            // Map not ready yet, reset flags so markers will be created when map is ready
            console.log('Map not ready yet - will create markers when map is initialized', {
              hasMapInstance: !!mapInstanceRef.current,
              isMapLoaded,
              resultsLength: results.length
            });
            markersGeocodedRef.current = false;
            lastResultsKeyRef.current = null;
          }
        }
      }
    }
  }, [showMap, results.length, isMapLoaded, recreateMarkersFromCache]);
  
  // Function to center map on a property's marker
  const centerMapOnProperty = (propertyIndex: number) => {
    if (!showMap || !isMapLoaded || !mapInstanceRef.current) return;
    
    const marker = propertyToMarkerMapRef.current.get(propertyIndex);
    if (marker) {
      const position = marker.getPosition();
      mapInstanceRef.current.setCenter(position);
      mapInstanceRef.current.setZoom(15);
      
      // Highlight the marker temporarily
      marker.setAnimation(window.google.maps.Animation.BOUNCE);
      setTimeout(() => {
        marker.setAnimation(null);
      }, 2000);
      
      // Open the info window
      if (marker.infoWindow) {
        // Close all other info windows
        markersRef.current.forEach(m => {
          if (m.infoWindow && m !== marker) m.infoWindow.close();
        });
        marker.infoWindow.open(mapInstanceRef.current, marker);
      }
    }
  };
  
  // Debug: Log marker count changes
  useEffect(() => {
    console.log(`Current marker count: ${markersRef.current.length}, Geocoded flag: ${markersGeocodedRef.current}`);
  }, [markersRef.current.length]);

  const openModal = (property: Property, propertyIndex?: number) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
    
    // If map is shown and property index is provided, center on the marker
    if (showMap && propertyIndex !== undefined) {
      centerMapOnProperty(propertyIndex);
    }
  };

  // Listen for custom event from InfoWindow mini listing cards
  useEffect(() => {
    const handleOpenPropertyModal = (event: CustomEvent) => {
      const { property, propertyIndex } = event.detail;
      if (property) {
        setSelectedProperty(property);
        setIsModalOpen(true);
        
        // If map is shown and property index is provided, center on the marker
        if (showMap && propertyIndex !== undefined && mapInstanceRef.current) {
          const marker = propertyToMarkerMapRef.current.get(propertyIndex);
          if (marker) {
            const position = marker.getPosition();
            mapInstanceRef.current.setCenter(position);
            mapInstanceRef.current.setZoom(15);
            
            // Highlight the marker temporarily
            marker.setAnimation(window.google.maps.Animation.BOUNCE);
            setTimeout(() => {
              marker.setAnimation(null);
            }, 2000);
            
            // Open the info window
            if (marker.infoWindow) {
              // Close all other info windows
              markersRef.current.forEach(m => {
                if (m.infoWindow && m !== marker) m.infoWindow.close();
              });
              marker.infoWindow.open(mapInstanceRef.current, marker);
            }
          }
        }
      }
    };

    window.addEventListener('openPropertyModal', handleOpenPropertyModal as EventListener);

    return () => {
      window.removeEventListener('openPropertyModal', handleOpenPropertyModal as EventListener);
    };
  }, [showMap]);

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProperty(null);
  };

  const handleNewSearch = () => {
    clearCache(); // Clear cached results when starting a new search
    // Also clear marker positions cache
    sessionStorage.removeItem('mapMarkerPositions');
    navigate('/');
  };

  const handleMessageClick = async (property: Property) => {
    setIsNavigatingToBooking(true);
    
    // Prepare property data for BookViewing page
    const propertyData = {
      id: property.title || `property-${Date.now()}`, // Generate ID if not available
      street: property.location || '',
      town: property.location?.split(',')[1]?.trim() || '',
      city: property.location?.split(',')[0]?.trim() || '',
      postcode: property.location?.split(',')[2]?.trim() || '',
      agent: {
        id: property.agent?.name || `agent-${Date.now()}`,
        name: property.agent?.name || property.source || 'Estate Agent',
        email: property.agent?.email || '',
        phone: '',
        company: property.source || 'Estate Agency'
      }
    };
    
    // Store in sessionStorage for BookViewing page
    sessionStorage.setItem('prefilledProperty', JSON.stringify(propertyData));
    
    // Note: We don't clear the search cache here because we want to preserve results
    // when user comes back from BookViewing page
    
    // Small delay for smooth transition
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Navigate to booking page
    navigate('/bookviewing');
  };

  const goToHome = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col font-nunito">
        {/* Custom Header with navigation */}
        <header className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            {/* Left side: Back to Home */}
            <button
              onClick={goToHome}
              className="flex items-center px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              <img src="/images/Proptii-logo-icon.png" alt="Proptii Logo" className="h-6 w-6 mr-2" />
              <span>Back to Home</span>
            </button>

            {/* Right side: Search Results title */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Search Results</h1>
            </div>
          </div>
        </header>
        <div className="flex-1 bg-gray-50 pt-20 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#E65D24] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Searching for properties...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col font-nunito">
        {/* Custom Header with navigation */}
        <header className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            {/* Left side: Back to Home */}
            <button
              onClick={goToHome}
              className="flex items-center px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              <img src="/images/Proptii-logo-icon.png" alt="Proptii Logo" className="h-6 w-6 mr-2" />
              <span>Back to Home</span>
            </button>

            {/* Right side: Search Results title */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Search Results</h1>
            </div>
          </div>
        </header>
        <div className="flex-1 bg-gray-50 pt-20 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Search Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            
            {/* Network connectivity check */}
            {error.includes('Network connection') || error.includes('connect') && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left">
                <h4 className="font-medium text-blue-900 mb-2">Troubleshooting Tips:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Check your internet connection</li>
                  <li>• Try refreshing the page</li>
                  <li>• Switch to "Internet Search" mode</li>
                  <li>• Try a different search query</li>
                </ul>
              </div>
            )}
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={retry}
                className="bg-[#E65D24] text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleNewSearch}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
              >
                New Search
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-nunito">
      {/* Custom Header with navigation */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          {/* Left side: Back to Home */}
          <button
            onClick={goToHome}
            className="flex items-center px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            <img src="/images/Proptii-logo-icon.png" alt="Proptii Logo" className="h-6 w-6 mr-2" />
            <span>Back to Home</span>
          </button>

          {/* Right side: Search Results title */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">Search Results</h1>
          </div>
        </div>
      </header>
      
      <div className="flex-1 bg-gray-50 pt-8">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Enhanced Header Section */}
          <div className="mb-8">
            {/* Top Row: Buttons and Search Summary */}
            <div className="flex items-center justify-between mb-6 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              {/* Left Side: Search Summary */}
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <div className="w-2 h-8 bg-gradient-to-b from-[#136C9E] to-[#0F5A8A] rounded-full mr-4"></div>
                  <h2 className="text-xl font-bold text-gray-900">Search Summary</h2>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-gray-500 font-medium w-20">Query:</span>
                    <span className="text-gray-900 font-semibold">{searchQuery}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 font-medium w-20">Platform:</span>
                    <span className="text-gray-900">{searchTypeParam === 'onthemarket' ? 'On the Market' : 'Internet Search'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 font-medium w-20">Results:</span>
                    <span className="text-gray-900 font-semibold">{results.length} properties found</span>
                    {sessionStorage.getItem('searchResults') && (
                      <span className="ml-2 px-2 py-1 bg-[#136C9E]/10 text-[#136C9E] text-xs font-medium rounded-full">cached</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right Side: Action Buttons */}
              <div className="flex gap-3 ml-8">
                <button
                  onClick={() => {
                    setShowMap(!showMap);
                    // Scroll to map if showing
                    if (!showMap) {
                      setTimeout(() => {
                        document.getElementById('map-container')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }
                  }}
                  className={`flex items-center px-6 py-3 ${
                    showMap 
                      ? 'bg-gradient-to-r from-[#E65D24] to-[#D54D14]' 
                      : 'bg-gradient-to-r from-[#136C9E] to-[#0F5A8A]'
                  } text-white rounded-lg hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  {showMap ? 'Hide Map' : 'Show Map'}
                </button>
                <button
                  onClick={() => searchProperties(searchQuery, searchTypeParam as 'onthemarket' | 'internet')}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-[#136C9E] to-[#0F5A8A] text-white rounded-lg hover:from-[#0F5A8A] hover:to-[#0D4A7A] transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Results
                </button>
                <button
                  onClick={handleNewSearch}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-[#E65D24] to-[#D54D14] text-white rounded-lg hover:from-[#D54D14] hover:to-[#C43D04] transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  New Search
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          {results.length === 0 ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Properties Found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search criteria or try a different location.</p>
                <button
                  onClick={handleNewSearch}
                  className="bg-[#E65D24] text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  New Search
                </button>
              </div>
            </div>
          ) : (
            <div className={showMap ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : ""}>
              {/* Property Listings */}
              <div className={showMap ? "" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}>
                {showMap ? (
                  // When map is shown, display in single column
                  <div className="grid grid-cols-1 gap-6">
                    {results.map((property, index) => (
                <div
                  key={index}
                  data-property-index={index}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => openModal(property, index)}
                  onMouseEnter={() => {
                    // Highlight marker on hover
                    if (showMap && isMapLoaded) {
                      const marker = propertyToMarkerMapRef.current.get(index);
                      if (marker && marker.originalIcon) {
                        // Create a larger version of the pin icon for hover
                        const originalIcon = marker.originalIcon;
                        if (originalIcon && originalIcon.url) {
                          // Parse the size from the original icon and increase it
                          const scaledSize = originalIcon.scaledSize || new window.google.maps.Size(32, 40);
                          marker.setIcon({
                            ...originalIcon,
                            scaledSize: new window.google.maps.Size(
                              scaledSize.width * 1.3,
                              scaledSize.height * 1.3
                            ),
                          });
                        }
                      }
                    }
                  }}
                  onMouseLeave={() => {
                    // Restore marker size on mouse leave
                    if (showMap && isMapLoaded) {
                      const marker = propertyToMarkerMapRef.current.get(index);
                      if (marker && marker.originalIcon) {
                        marker.setIcon(marker.originalIcon);
                      }
                    }
                  }}
                >
                  {/* Property Image */}
                  <div className="relative h-48 overflow-hidden">
                    {property.imageUrls && property.imageUrls.length > 0 ? (
                      <img
                        src={property.imageUrls[0]}
                        alt={property.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Price Badge */}
                    <div className="absolute top-4 left-4 bg-[#E65D24] text-white px-3 py-1 rounded-full font-semibold text-sm">
                      {cleanPropertyPrice(property.price)}
                    </div>
                    
                    {/* Heart Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const propertyId = `${property.title}-${property.location}-${property.price}`;
                        const wasSaved = isPropertySaved(propertyId);
                        toggleSaveProperty(property);
                        setToastMessage(wasSaved ? 'Property removed from saved' : 'Property saved!');
                        setShowToast(true);
                        setTimeout(() => setShowToast(false), 3000);
                      }}
                      className="absolute top-4 right-4 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
                    >
                      <svg 
                        className={`w-5 h-5 transition-colors ${
                          isPropertySaved(`${property.title}-${property.location}-${property.price}`) 
                            ? 'text-red-500 fill-red-500' 
                            : 'text-gray-600 hover:text-red-500'
                        }`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                    
                    {/* Source Badge */}
                    {property.source && (
                      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        {property.source}
                      </div>
                    )}
                  </div>

                  {/* Property Details */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{property.title}</h3>
                    
                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm">{property.location}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                          </svg>
                          <span>{property.bedrooms}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span>{property.propertyType}</span>
                        </div>
                      </div>
                      
                      {property.agent && (
                        <div className="text-xs text-gray-500">
                          {property.agent.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
                  </div>
                ) : (
                  // When map is hidden, display in grid
                  results.map((property, index) => (
                    <div
                      key={index}
                      data-property-index={index}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                      onClick={() => openModal(property, index)}
                    >
                      {/* Property Image */}
                      <div className="relative h-48 overflow-hidden">
                        {property.imageUrls && property.imageUrls.length > 0 ? (
                          <img
                            src={property.imageUrls[0]}
                            alt={property.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        
                        {/* Price Badge */}
                        <div className="absolute top-4 left-4 bg-[#E65D24] text-white px-3 py-1 rounded-full font-semibold text-sm">
                          {cleanPropertyPrice(property.price)}
                        </div>
                        
                        {/* Heart Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const propertyId = `${property.title}-${property.location}-${property.price}`;
                            const wasSaved = isPropertySaved(propertyId);
                            toggleSaveProperty(property);
                            setToastMessage(wasSaved ? 'Property removed from saved' : 'Property saved!');
                            setShowToast(true);
                            setTimeout(() => setShowToast(false), 3000);
                          }}
                          className="absolute top-4 right-4 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
                        >
                          <svg 
                            className={`w-5 h-5 transition-colors ${
                              isPropertySaved(`${property.title}-${property.location}-${property.price}`) 
                                ? 'text-red-500 fill-red-500' 
                                : 'text-gray-600 hover:text-red-500'
                            }`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                        
                        {/* Source Badge */}
                        {property.source && (
                          <div className="absolute bottom-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-xs">
                            {property.source}
                          </div>
                        )}
                      </div>

                      {/* Property Details */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{property.title}</h3>
                        
                        <div className="flex items-center gap-2 text-gray-600 mb-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-sm">{property.location}</span>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                              </svg>
                              <span>{property.bedrooms}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span>{property.propertyType}</span>
                            </div>
                          </div>
                          
                          {property.agent && (
                            <div className="text-xs text-gray-500">
                              {property.agent.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Map Container and Location Insights - Same Column */}
              {showMap && (
                <div className="flex flex-col gap-4">
                  <div id="map-container" className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {!isMapLoaded ? (
                      <div 
                        className="w-full flex items-center justify-center bg-gray-50"
                        style={{ height: 'calc(100vh - 300px)', minHeight: '600px' }}
                      >
                        <div className="text-center">
                          <div className="w-16 h-16 border-4 border-[#136C9E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-gray-600">Loading map...</p>
                        </div>
                      </div>
                    ) : (
                      <div 
                        ref={mapRef}
                        className="w-full"
                        style={{ height: 'calc(100vh - 300px)', minHeight: '600px' }}
                      ></div>
                    )}
                  </div>

                  {/* Location Insights Section - Now under the map */}
                  <LocationInsights searchQuery={searchQuery} propertyCount={results.length} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Property Details Modal */}
      <PropertyDetailsModal
        property={selectedProperty}
        isOpen={isModalOpen}
        onClose={closeModal}
        onMessageClick={handleMessageClick}
        isNavigatingToBooking={isNavigatingToBooking}
      />

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg px-6 py-4 flex items-center gap-3 animate-in slide-in-from-right">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-gray-900 font-medium">{toastMessage}</span>
          <button
            onClick={() => setShowToast(false)}
            className="ml-2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default SearchResults;

