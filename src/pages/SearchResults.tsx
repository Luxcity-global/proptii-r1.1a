import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSearchBackend, type Property } from '../hooks/useSearchBackend';
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

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get('q') || '';
  const searchTypeParam = searchParams.get('type') || 'internet';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isNavigatingToBooking, setIsNavigatingToBooking] = useState(false);

  const { results, isLoading, error, retry, searchProperties, clearCache } = useSearchBackend();

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    
                    {/* Source Badge */}
                    {property.source && (
                      <div className="absolute top-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-xs">
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

      <Footer />
    </div>
  );
};

export default SearchResults;

