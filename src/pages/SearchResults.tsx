import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSearchBackend, type Property } from '../hooks/useSearchBackend';
import { useSavedProperties } from '../contexts/SavedPropertiesContext';
import Footer from '../components/Footer';
import { getAmenityIcon } from '../utils/amenityIcons';


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

          {/* Additional Property Details (if available) */}
          {(property.bathrooms || property.squareFootage) && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              {property.bathrooms && (
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{property.bathrooms}</div>
                  <div className="text-sm text-gray-600">Bathrooms</div>
                </div>
              )}
              {property.squareFootage && (
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{property.squareFootage} sq ft</div>
                  <div className="text-sm text-gray-600">Size</div>
                </div>
              )}
            </div>
          )}
          
          {/* Property Description */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Description</h4>
            <p className="text-gray-600 leading-relaxed">
              {property.description || `This beautiful ${property.propertyType} offers ${property.bedrooms} bedrooms and is located in the desirable area of ${property.location}. The property features modern amenities and is perfect for families or professionals looking for a comfortable home.`}
            </p>
          </div>

          {/* Amenities Section */}
          {property.amenities && Array.isArray(property.amenities) && property.amenities.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities.map((amenity, index) => {
                  const icon = getAmenityIcon(amenity);
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                    >
                      <div className="text-[#E65D24] flex-shrink-0">
                        {icon}
                      </div>
                      <span className="text-sm text-gray-700 font-medium capitalize">
                        {amenity}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Listed By Section */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Listed By</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900 mb-1">{property.agent?.name || 'Agent Information'}</p>
              {property.agent?.company && (
                <p className="text-sm text-gray-600 mb-2">{property.agent.company}</p>
              )}
              {property.agent?.phone && (
                <p className="text-sm text-gray-600 mb-2">Phone: {property.agent.phone}</p>
              )}
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
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
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
  const searchType = searchTypeParam as 'onthemarket' | 'internet' | 'proptii';
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
  const markersGeocodedRef = useRef<boolean>(false);
  const lastResultsKeyRef = useRef<string | null>(null);
  const boundsFittedRef = useRef<boolean>(false); // Flag to prevent any resets after bounds are fitted
  const boundsFittedTimeRef = useRef<number>(0); // Timestamp when bounds were fitted
  
  // Helper function to safely set map center - prevents resets after bounds are fitted
  const safeSetMapCenter = (location: { lat: number; lng: number }, zoom?: number) => {
    // Check if bounds were fitted recently (within last 5 seconds) or if markers are present
    const timeSinceBoundsFitted = Date.now() - boundsFittedTimeRef.current;
    if (boundsFittedRef.current || markersGeocodedRef.current || markersRef.current.length > 0 || timeSinceBoundsFitted < 5000) {
      console.log('Preventing map center change - bounds already fitted or markers present', {
        boundsFitted: boundsFittedRef.current,
        markersGeocoded: markersGeocodedRef.current,
        markerCount: markersRef.current.length,
        timeSinceBoundsFitted
      });
      return false;
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(location);
      if (zoom !== undefined) {
        mapInstanceRef.current.setZoom(zoom);
      }
      return true;
    }
    return false;
  };
  
  // Helper function to safely set map zoom - allows zoom adjustments after bounds fitted
  const safeSetMapZoom = (zoom: number) => {
    // Always allow zoom changes - they don't reset the view like center changes do
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(zoom);
      return true;
    }
    return false;
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
            searchProperties(searchQuery, searchType);
          }
        } catch (error) {
          // If cache is corrupted, perform new search
          searchProperties(searchQuery, searchType);
        }
      } else {
        // No cache, perform new search
        searchProperties(searchQuery, searchType);
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

  // Track if we've already centered on search location for this query
  const searchLocationCenteredRef = useRef<string | null>(null);

  // Initialize map when showMap is true and script is loaded
  useEffect(() => {
    if (showMap && isMapLoaded && mapRef.current && window.google && window.google.maps) {
      // Check if map is already initialized on the SAME div
      if (mapInstanceRef.current) {
        // The Google Maps type definitions might not expose getDiv() on the Map type easily if typed as 'any',
        // but it exists on the instance.
        const mapDiv = mapInstanceRef.current.getDiv ? mapInstanceRef.current.getDiv() : null;
        
        if (mapDiv === mapRef.current) {
          console.log('Map already initialized, skipping re-initialization');
          return; // Map already initialized on correct div
        }
        
        console.log('Map instance exists but attached to different div (or div recreated). Re-initializing.');
        // We'll proceed to re-initialize which will overwrite mapInstanceRef.current
      }

      // Step 1: Initialize map centered on UK (country view)
      try {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: 54.0, lng: -2.0 }, // Center of UK
          zoom: 6, // Show entire UK
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
        });
        console.log('Map initialized - showing UK view');
        
        // Step 2: Extract and geocode search location, then zoom in (only once per query)
        // Skip if markers are already on the map or bounds are fitted
        if (searchQuery && window.google.maps && searchLocationCenteredRef.current !== searchQuery && 
            !boundsFittedRef.current && !markersGeocodedRef.current && markersRef.current.length === 0) {
          const geocoder = new window.google.maps.Geocoder();
          // Extract location from search query (e.g., "2 bedroom flats in London" -> "London")
          const locationMatch = searchQuery.match(/(?:in|at|near)\s+([A-Za-z\s]+)/i);
          const locationToGeocode = locationMatch ? locationMatch[1].trim() : searchQuery;
          
          console.log('Geocoding search location:', locationToGeocode);
          
          // Mark that we're centering for this query
          searchLocationCenteredRef.current = searchQuery;
          
          geocoder.geocode({ address: locationToGeocode }, (results, status) => {
            // CRITICAL: Don't reset map if bounds have already been fitted to markers or markers are already on the map
            if (boundsFittedRef.current || markersGeocodedRef.current || markersRef.current.length > 0) {
              console.log('Map already has markers or bounds fitted, ignoring search location geocoding result');
              return;
            }
            
            if (status === 'OK' && results && results[0] && mapInstanceRef.current) {
              const location = results[0].geometry.location;
              
              // Double-check before centering (race condition protection)
              if (boundsFittedRef.current || markersGeocodedRef.current || markersRef.current.length > 0) {
                console.log('Map state changed during geocoding, skipping search location centering');
                return;
              }
              
              // Step 3: Center and zoom on search location (only if markers aren't already placed)
              // The property geocoding effect will handle final positioning
              if (safeSetMapCenter(location, 12)) {
                console.log('Map centered and zoomed on search location:', locationToGeocode);
              }
            } else {
              console.warn('Failed to geocode search location:', locationToGeocode, status);
              // Fallback: center on London if search location geocoding fails (only if no markers and bounds not fitted)
              safeSetMapCenter({ lat: 51.5074, lng: -0.1278 }, 12);
            }
          });
        } else {
          // No search query, just show UK
          safeSetMapCenter({ lat: 54.0, lng: -2.0 }, 6);
        }
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }
  }, [showMap, isMapLoaded]); // Removed searchQuery from dependencies to prevent re-centering

  // Reset search location centering ref when search query actually changes
  useEffect(() => {
    // Reset when query changes to a different value
    if (searchLocationCenteredRef.current !== null && searchLocationCenteredRef.current !== searchQuery) {
      console.log('Search query changed, resetting search location centering ref');
      searchLocationCenteredRef.current = null;
    }
  }, [searchQuery]);

  // Geocode properties and add markers when results change
  // This runs AFTER the map is initialized and centered on search location
  useEffect(() => {
    if (showMap && isMapLoaded && mapInstanceRef.current && window.google && window.google.maps && results.length > 0) {
      // Create a unique key for this results set to prevent re-geocoding
      const resultsKey = results.map(r => `${r.location}-${r.title}`).join('|');
      
      // Skip if we've already geocoded these exact results
      if (lastResultsKeyRef.current === resultsKey && markersGeocodedRef.current) {
        console.log('Markers already geocoded for these results, skipping re-geocode...');
        return;
      }
      
      // Only proceed if this is a new set of results
      if (lastResultsKeyRef.current !== resultsKey) {
        lastResultsKeyRef.current = resultsKey;
        
        // Wait a bit for map to finish centering on search location before adding markers
        const timeoutId = setTimeout(() => {
          const geocoder = new window.google.maps.Geocoder();
          const bounds = new window.google.maps.LatLngBounds();
          
          // Clear existing markers only when starting fresh geocode
          console.log(`Clearing ${markersRef.current.length} existing markers...`);
          markersRef.current.forEach(marker => marker.setMap(null));
          markersRef.current = [];
          markersGeocodedRef.current = false;
          boundsFittedRef.current = false; // Reset bounds fitted flag when starting new geocode
        
        // Filter properties with valid addresses
        const propertiesWithAddresses = results.filter(prop => prop.location && prop.location.trim());
        const totalProperties = propertiesWithAddresses.length;
        
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
                      
                      // CRITICAL: Set flag and timestamp BEFORE fitting bounds to prevent any race conditions
                      boundsFittedRef.current = true;
                      boundsFittedTimeRef.current = Date.now();
                      
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
                          
                          // Enforce zoom constraints (allow zoom adjustments after bounds fitted)
                          if (currentZoom < 10) {
                            console.log(`Zoom too low (${currentZoom}), setting to 10`);
                            safeSetMapZoom(10);
                          } else if (currentZoom > 15) {
                            console.log(`Zoom too high (${currentZoom}), setting to 15`);
                            safeSetMapZoom(15);
                          }
                          
                          // Verify markers are still visible and attached to map
                          const visibleMarkers = markersRef.current.filter(m => m.getMap() !== null);
                          console.log(`Map idle - Zoom: ${mapInstanceRef.current.getZoom()}, Total markers: ${markersRef.current.length}, Visible on map: ${visibleMarkers.length}`);
                          
                          // Mark that bounds have been fitted - prevent any further automatic resets
                          markersGeocodedRef.current = true;
                          boundsFittedRef.current = true; // Ensure flag stays set
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
                    } else if (successfulGeocodes === 1) {
                      // Single property - center on it
                      boundsFittedRef.current = true; // Set flag before centering
                      boundsFittedTimeRef.current = Date.now();
                      const singleMarker = markersRef.current[0];
                      if (singleMarker) {
                        const position = singleMarker.getPosition();
                        if (mapInstanceRef.current) {
                          mapInstanceRef.current.setCenter(position);
                          mapInstanceRef.current.setZoom(14);
                          console.log('Map centered on single property');
                        }
                      }
                      markersGeocodedRef.current = true;
                    }
                  }
                } catch (error) {
                  console.error('Error fitting bounds:', error);
                  // Fallback: center on first marker if available
                  if (markersRef.current.length > 0) {
                    boundsFittedRef.current = true; // Set flag before centering
                    boundsFittedTimeRef.current = Date.now();
                    const firstMarker = markersRef.current[0];
                    const position = firstMarker.getPosition();
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.setCenter(position);
                      mapInstanceRef.current.setZoom(12);
                      console.log('Fallback: Map centered on first marker');
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
                
                // Create marker with animation
                const marker = new window.google.maps.Marker({
                  position: location,
                  map: mapInstanceRef.current,
                  title: property.title,
                  animation: window.google.maps.Animation.DROP,
                  optimized: false, // Force markers to render
                });

                // Create unique ID for this property's info window
                const propertyId = `prop-${index}-${Date.now()}`;
                const imageUrls = property.imageUrls || [];
                const imageUrlsJson = JSON.stringify(imageUrls);
                const firstImageUrl = imageUrls.length > 0 ? imageUrls[0] : '';
                
                // Create info window with property details and image navigation
                const infoWindow = new window.google.maps.InfoWindow({
                  content: `
                    <div style="max-width: 280px; padding: 0;">
                      ${firstImageUrl ? `
                        <div style="position: relative; width: 100%; height: 150px; overflow: hidden; border-radius: 8px 8px 0 0; background-color: #f0f0f0;">
                          <img id="info-img-${propertyId}" src="${firstImageUrl}" alt="Property" style="width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s;" />
                          ${imageUrls.length > 1 ? `
                            <button id="prev-btn-${propertyId}" style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 18px; line-height: 1; padding: 0; z-index: 10; transition: background 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.8)'" onmouseout="this.style.background='rgba(0,0,0,0.6)'">‹</button>
                            <button id="next-btn-${propertyId}" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 18px; line-height: 1; padding: 0; z-index: 10; transition: background 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.8)'" onmouseout="this.style.background='rgba(0,0,0,0.6)'">›</button>
                            <div id="img-counter-${propertyId}" style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.6); color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; z-index: 10;">1/${imageUrls.length}</div>
                          ` : ''}
                        </div>
                      ` : ''}
                      <div style="padding: 12px;">
                        <h4 style="font-weight: bold; margin: 0 0 8px 0; font-size: 15px; color: #1a1a1a; display: flex; align-items: start;">
                          <svg width="14" height="14" style="margin-right: 6px; margin-top: 2px; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span style="flex: 1;">${property.location}</span>
                        </h4>
                        <p style="margin: 0 0 8px 0; font-size: 13px; color: #666;">${property.title || 'Property'}</p>
                        <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: bold; color: #E65D24;">${property.price || 'N/A'}</p>
                        <p style="margin: 0; font-size: 12px; color: #666;">
                          <strong>${property.bedrooms || 'N/A'}</strong> bedrooms • <strong>${property.propertyType || 'Property'}</strong>
                        </p>
                      </div>
                    </div>
                  `,
                });

                // Set up image navigation when info window is ready
                window.google.maps.event.addListener(infoWindow, 'domready', () => {
                  const imgEl = document.getElementById(`info-img-${propertyId}`) as HTMLImageElement;
                  const prevBtn = document.getElementById(`prev-btn-${propertyId}`) as HTMLButtonElement;
                  const nextBtn = document.getElementById(`next-btn-${propertyId}`) as HTMLButtonElement;
                  const counterEl = document.getElementById(`img-counter-${propertyId}`) as HTMLDivElement;
                  
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
                  
                  updateImage();
                });

                marker.addListener('click', () => {
                  // Close all other info windows
                  markersRef.current.forEach(m => {
                    if (m.infoWindow) m.infoWindow.close();
                  });
                  infoWindow.open(mapInstanceRef.current, marker);
                });

                marker.infoWindow = infoWindow;
                markersRef.current.push(marker);
                bounds.extend(location);
                successfulGeocodes++;
                
                console.log(`✓ Geocoded property ${index + 1}/${totalProperties}: ${address} (Total markers: ${markersRef.current.length})`);
              } else {
                console.warn(`✗ Failed to geocode address ${index + 1}/${totalProperties}: ${address}`, status);
              }
              
              checkAndFitBounds();
            });
          }, index * 150); // 150ms delay between each geocode request
        });
        }, 500); // Wait 500ms after map initialization before starting geocoding

        return () => {
          clearTimeout(timeoutId);
        };
      }
    }
  }, [showMap, isMapLoaded, results]);
  
  // Reset geocoded flag when map is hidden
  useEffect(() => {
    if (!showMap) {
      console.log('Map hidden - clearing all markers');
      markersGeocodedRef.current = false;
      boundsFittedRef.current = false; // Reset bounds fitted flag
      boundsFittedTimeRef.current = 0; // Reset timestamp
      lastResultsKeyRef.current = null;
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      mapInstanceRef.current = null; // Reset map instance to force re-initialization when shown again
    }
  }, [showMap]);
  
  // Debug: Log marker count changes
  useEffect(() => {
    console.log(`Current marker count: ${markersRef.current.length}, Geocoded flag: ${markersGeocodedRef.current}`);
  }, [markersRef.current.length]);

  const openModal = (property: Property) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProperty(null);
  };

  const handleNewSearch = () => {
    clearCache(); // Clear cached results when starting a new search
    navigate('/');
  };

  const handleMessageClick = async (property: Property) => {
    setIsNavigatingToBooking(true);
    
    // Log the property data to debug email issue
    console.log('📧 [SearchResults] Property agent data:', {
      agent: property.agent,
      email: property.agent?.email,
      name: property.agent?.name,
      source: property.source
    });
    
    // Prepare property data for BookViewing page
    // Use extended fields if available (from Proptii properties), otherwise parse from location
    const propertyData = {
      id: property.title || `property-${Date.now()}`, // Generate ID if not available
      street: property.street || property.location?.split(',')[0]?.trim() || property.location || '',
      town: property.town || property.location?.split(',')[1]?.trim() || '',
      city: property.city || property.location?.split(',')[0]?.trim() || property.location || '',
      postcode: property.postcode || property.location?.split(',')[2]?.trim() || '',
      agent: {
        id: property.agent?.id || property.agent?.name || `agent-${Date.now()}`,
        name: property.agent?.name || property.source || 'Estate Agent',
        email: property.agent?.email || '',
        phone: property.agent?.phone || '',
        company: property.agent?.company || property.source || 'Estate Agency'
      }
    };
    
    // Log the prepared property data
    console.log('📧 [SearchResults] Prepared property data for BookViewing:', {
      agentEmail: propertyData.agent.email,
      agentName: propertyData.agent.name,
      agentId: propertyData.agent.id
    });
    
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
                    <span className="text-gray-900">
                      {searchTypeParam === 'onthemarket' ? 'On the Market' : 
                       searchTypeParam === 'proptii' ? 'Proptii' : 
                       'Internet Search'}
                    </span>
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
                  onClick={() => searchProperties(searchQuery, searchType)}
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
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => openModal(property)}
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
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                      onClick={() => openModal(property)}
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

              {/* Map Container */}
              {showMap && (
                <div className="space-y-6">
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

                  {/* Location Insights Section - Below Map */}
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

