import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Bath,
  BedDouble,
  Bell,
  Car,
  Check,
  Dumbbell,
  Home,
  Loader2,
  Lock,
  MapPin,
  MessageSquare,
  PawPrint,
  Sparkles,
  Square,
  Train,
  Trees,
  X as XIcon,
  Zap,
} from 'lucide-react';
import { useSearchBackend, type Property } from '../hooks/useSearchBackend';
import { useSavedProperties } from '../contexts/SavedPropertiesContext';
import { useGovDataLayer } from '../contexts/GovDataLayerContext';
import { maskEmail, maskPhone } from '../utils/formatters';
import { useBatchedPropertyFacts } from '../hooks/useBatchedPropertyFacts';
import { useClassifyQuery } from '../hooks/useClassifyQuery';
import { usePropertyFilters } from '../hooks/usePropertyFilters';
import { SearchFilterBar } from '../components/search/SearchFilterBar';
import { FilterPills, entitiesToPills } from '../components/search/FilterPills';
import { FiltersModal } from '../components/search/FiltersModal';
import { FactsBadgeRow } from '../components/property/FactsBadgeRow';
import { ProptiiModule } from '../components/property/ProptiiModule';
import { resolveListingId } from '../utils/listingId';
import { getPropertyDisplayTitle, getPropertyListingDescription } from '../utils/propertyDisplay';
import {
  hasPetFriendlyFeature,
  hasBillsIncludedFeature,
  hasBalconyOrGardenFeature,
  hasParkingFeature,
  hasStationNearbyFeature,
  hasGymFeature,
  hasConciergeFeature,
} from '../utils/propertyParsers';
import Footer from '../components/Footer';
import { SearchLoadingAnimation } from '../components/SearchLoadingAnimation';
import { useAuth } from '../contexts/AuthContext';
import { LocalStorageService } from '../services/LocalStorageService';
import type { FactFlag } from '../types/govData';
import { useMessagingContext } from '../contexts/MessagingContext';
import communicationService from '../services/communicationService';
import QuickRequestModal from '../components/enquiry/QuickRequestModal';
import MessageThread from '../components/messaging/MessageThread';
import ComposeBox from '../components/messaging/ComposeBox';
import type { Conversation, Message } from '../types/messaging';
import '../styles/searchResults.css';

type SortOption = 'Relevance' | 'Newest' | 'Price (low)' | 'Price (high)';

const extractLocationLabel = (query: string): string => {
  const locationMatch = query.match(
    /\b(?:in|at|near)\s+([A-Za-z][A-Za-z\s]*?)(?=\s+(?:under|over|below|above|for|with|to|pcm|pw)\b|\s*£|\s*\d|$)/i
  );
  const location = locationMatch ? locationMatch[1].trim().replace(/,+$/, '') : '';
  return location || 'this area';
};

const parsePriceValue = (price: string): number => {
  if (!price) return 0;
  const match = price.replace(/,/g, '').match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};


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

// Property Skeleton Component for loading state
const PropertySkeleton = () => (
  <div className="sr-skel" aria-hidden>
    <div className="sr-skel-img" />
    <div className="sr-skel-body">
      <div className="sr-skel-line" style={{ width: '40%', height: 20 }} />
      <div className="sr-skel-line" style={{ width: '75%' }} />
      <div className="sr-skel-line" style={{ width: '55%' }} />
    </div>
  </div>
);

// Property Card Component — handoff ListingCard (single main photo)
const PropertyCard = ({ property, onClick, isSaved, onToggleSave, factFlags, factsLoading, factsUnresolved, reportHint, reserveHintSlot, isHighlighted }: { 
  property: Property, 
  onClick: () => void,
  isSaved: boolean,
  onToggleSave: (e: React.MouseEvent) => void,
  factFlags?: FactFlag[] | null,
  factsLoading?: boolean,
  factsUnresolved?: boolean,
  reportHint?: string | null,
  reserveHintSlot?: boolean,
  isHighlighted?: boolean,
}) => {
  const [imgError, setImgError] = useState(false);
  
  const placeholderImage = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800';
  const hasImage = property.imageUrls && property.imageUrls.length > 0 && !imgError;
  const imageSrc = hasImage ? property.imageUrls[0] : placeholderImage;
  const cleanedPrice = cleanPropertyPrice(property.price);
  const pcmMatch = cleanedPrice.match(/^(£[\d,]+)\s*(pcm)?$/i);
  const priceMain = pcmMatch?.[1] || cleanedPrice;
  const showPcm = /pcm/i.test(cleanedPrice) || Boolean(pcmMatch?.[2]);
  const isRent =
    /pcm|pw|rent|let/i.test(`${property.price} ${property.propertyType}`) ||
    !/sale|buy/i.test(property.propertyType || '');
  const displayTitle = getPropertyDisplayTitle(property);
  const fullPropertyText = `${property.title || ''} ${property.description || ''} ${property.summary || ''}`;
  const isPetFriendly = hasPetFriendlyFeature(fullPropertyText, property.amenities);
  const isBillsIncluded = hasBillsIncludedFeature(fullPropertyText, property.amenities);
  const hasGarden = hasBalconyOrGardenFeature(fullPropertyText);
  const hasStation = hasStationNearbyFeature(fullPropertyText, property.amenities);
  const hasParking = hasParkingFeature(fullPropertyText);
  const hasGym = hasGymFeature(fullPropertyText, property.amenities);
  const hasConcierge = hasConciergeFeature(fullPropertyText, property.amenities);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      void navigator.share({
        title: property.title,
        text: `${property.title} — ${cleanedPrice}`,
        url: shareUrl,
      }).catch(() => {});
      return;
    }
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(`${property.title} — ${cleanedPrice} ${shareUrl}`);
    }
  };

  return (
    <div
      className={`sr-card${isHighlighted ? ' is-highlighted' : ''}`}
      onClick={onClick}
    >
      <div className="sr-card-media">
        <img
          src={imageSrc}
          alt={displayTitle}
          onError={() => setImgError(true)}
          className={!hasImage ? 'is-fallback' : undefined}
        />

        <div className="sr-card-badges">
          <span className="sr-badge brand">{isRent ? 'To Rent' : 'For Sale'}</span>
          <span className="sr-badge emerald">{property.addedOrReduced || 'Available Now'}</span>
        </div>

        <div className="sr-card-actions">
          <button
            type="button"
            onClick={onToggleSave}
            className={isSaved ? 'is-saved' : undefined}
            aria-label={isSaved ? 'Remove from saved' : 'Save property'}
          >
            <svg
              className="w-4 h-4"
              fill={isSaved ? '#DC5F12' : 'none'}
              stroke={isSaved ? '#DC5F12' : 'currentColor'}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share property"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </div>

        <div className="sr-card-body">
          <div className="sr-card-price-row">
            <p className="sr-card-price">
              {priceMain}
              {showPcm ? ' pcm' : ''}
            </p>
            <span className="sr-card-type">{property.propertyType || (isRent ? 'To rent' : 'For sale')}</span>
          </div>
          <p className="sr-card-address" title={property.location || displayTitle}>
            {property.location || displayTitle}
          </p>
          <div className="sr-card-stats">
            <span>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 9V19M22 9v10M2 14h20M7 9V7a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2"></path></svg>
              {property.bedrooms === 0 ? 'Studio' : property.bedrooms ? `${property.bedrooms} beds` : '— beds'}
            </span>
            {property.bathrooms ? (
              <span>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12h16v4a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-4z"></path><path d="M6 12V5a2 2 0 0 1 2-2h1"></path></svg>
                {property.bathrooms} bath{Number(property.bathrooms) === 1 ? '' : 's'}
              </span>
            ) : null}
            {property.squareFootage ? (
              <span>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="1"></rect></svg>
                {property.squareFootage} ft²
              </span>
            ) : null}
          </div>

          {(isPetFriendly || isBillsIncluded || hasStation || hasGarden || hasParking || hasGym || hasConcierge) && (
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              {isPetFriendly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-xs">
                  <PawPrint className="w-3 h-3 text-amber-700" aria-hidden />
                  <span>Pet Friendly</span>
                </span>
              )}
              {isBillsIncluded && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200/80 shadow-xs">
                  <Zap className="w-3 h-3 text-blue-700" aria-hidden />
                  <span>Bills Inc.</span>
                </span>
              )}
              {hasStation && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs">
                  <Train className="w-3 h-3 text-emerald-700" aria-hidden />
                  <span>Near Station</span>
                </span>
              )}
              {hasGarden && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200/80 shadow-xs">
                  <Trees className="w-3 h-3 text-teal-700" aria-hidden />
                  <span>Balcony/Garden</span>
                </span>
              )}
              {hasParking && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200/80 shadow-xs">
                  <Car className="w-3 h-3 text-indigo-700" aria-hidden />
                  <span>Parking</span>
                </span>
              )}
              {hasGym && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200/80 shadow-xs">
                  <Dumbbell className="w-3 h-3 text-purple-700" aria-hidden />
                  <span>Gym</span>
                </span>
              )}
              {hasConcierge && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-800 border border-orange-200/80 shadow-xs">
                  <Bell className="w-3 h-3 text-orange-700" aria-hidden />
                  <span>Concierge</span>
                </span>
              )}
            </div>
          )}

          {(factsLoading || factFlags || factsUnresolved) && (
            <div className="sr-card-extra" onClick={(e) => e.stopPropagation()}>
              <FactsBadgeRow
                flags={factFlags}
                isLoading={factsLoading}
                unresolvedFallback={Boolean(factsUnresolved)}
                variant="listing"
              />
            </div>
          )}

          {reserveHintSlot && (
            <div
              className="sr-card-extra h-7"
              data-testid="report-hint-slot"
              onClick={(e) => e.stopPropagation()}
            >
              {reportHint ? (
                <span className="inline-flex items-center max-w-full px-2.5 py-1 rounded-md border border-[#136C9E]/25 bg-[#136C9E]/10 text-[11px] font-semibold text-[#136C9E] truncate">
                  {reportHint}
                </span>
              ) : (
                <span className="invisible inline-flex px-2.5 py-1 text-[11px]" aria-hidden>
                  hint
                </span>
              )}
            </div>
          )}
        </div>

      <div className="sr-card-agent">
        <span className="truncate">
          <strong>{property.agent?.company || property.agent?.name || 'Agent'}</strong>
        </span>
        <span className="sr-card-cta">View details →</span>
      </div>
    </div>
  );
};

// Property Details Modal Component
interface PropertyDetailsModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onBookClick: (property: Property) => void;
  onChatClick: (property: Property) => void;
  isNavigatingToBooking: boolean;
  isChatLoading: boolean;
  chatError: string | null;
  isAuthenticated: boolean;
  govDataEnabled?: boolean;
  audience?: import('../types/govData').Audience | null;
  onAudienceChange?: (audience: import('../types/govData').Audience) => void;
}

function PropertyDetailsModal({
  property,
  isOpen,
  onClose,
  onBookClick,
  onChatClick,
  isNavigatingToBooking,
  isChatLoading,
  chatError,
  isAuthenticated,
  govDataEnabled = false,
  audience = null,
  onAudienceChange,
}: PropertyDetailsModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [property?.title, property?.location, property?.price]);

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

  const images = property.imageUrls?.length
    ? property.imageUrls
    : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800'];
  const cleanedPrice = cleanPropertyPrice(property.price);
  const pcmMatch = cleanedPrice.match(/^(£[\d,]+)\s*(pcm)?$/i);
  const priceMain = pcmMatch?.[1] || cleanedPrice;
  const showPcm = /pcm/i.test(cleanedPrice) || Boolean(pcmMatch?.[2]);
  const isRent =
    /pcm|pw|rent|let/i.test(`${property.price} ${property.propertyType}`) ||
    !/sale|buy/i.test(property.propertyType || '');
  const displayTitle = getPropertyDisplayTitle(property);
  const reportAddress =
    [property.street, property.town || property.city, property.postcode]
      .map((part) => (part || '').trim())
      .filter(Boolean)
      .join(', ') || property.location;
  const listingDescription = getPropertyListingDescription(property);
  const rawAmenities = (property.amenities || [])
    .map((a: any) => (typeof a === 'string' ? a : (a?.description || a?.htmlDescription || a?.title || '')).trim())
    .filter(Boolean);
  const featureItems =
    rawAmenities.length > 0
      ? rawAmenities.slice(0, 12)
      : [
          property.description?.split('.')[0]?.trim(),
          property.propertyType ? `Property type: ${property.propertyType}` : null,
          property.location ? `Located in ${property.location}` : null,
        ].filter(Boolean) as string[];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 text-gray-900"
      >
        {/* Image carousel — handoff Step 2 */}
        <div className="relative p-2">
          <div className="relative h-[22rem] sm:h-[26rem] rounded-2xl overflow-hidden bg-gray-100">
            <img
              src={images[currentImageIndex]}
              alt={`${displayTitle} - Image ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800';
              }}
            />

            <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
              <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#136C9E] text-white shadow-md">
                {isRent ? 'To Rent' : 'For Sale'}
              </span>
              <span className="bg-emerald-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md">
                {property.addedOrReduced || 'Available Now'}
              </span>
            </div>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 text-white p-2.5 rounded-full hover:bg-black/80 transition-all"
                  aria-label="Previous photo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 text-white p-2.5 rounded-full hover:bg-black/80 transition-all"
                  aria-label="Next photo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-semibold">
              {currentImageIndex + 1} / {images.length} Photos
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 text-gray-700"
            aria-label="Close property details"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
            <div className="min-w-0">
              <h2
                className="text-xl font-semibold text-gray-900 tracking-tight"
                style={{ fontFamily: 'Archivo, sans-serif' }}
              >
                {displayTitle}
              </h2>
              <div className="flex items-center text-gray-500 text-xs mt-1">
                <MapPin className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" aria-hidden />
                <span>{property.location}</span>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-[#F15A22]">
              {priceMain}{' '}
              {showPcm && <span className="text-xs text-gray-500 font-normal">pcm</span>}
            </p>
          </div>

          {(() => {
            const fullModalText = `${property.title || ''} ${property.description || ''} ${property.summary || ''}`;
            const mPet = hasPetFriendlyFeature(fullModalText, property.amenities);
            const mBills = hasBillsIncludedFeature(fullModalText, property.amenities);
            const mGarden = hasBalconyOrGardenFeature(fullModalText);
            const mStation = hasStationNearbyFeature(fullModalText, property.amenities);
            const mParking = hasParkingFeature(fullModalText);
            const mGym = hasGymFeature(fullModalText, property.amenities);
            const mConcierge = hasConciergeFeature(fullModalText, property.amenities);

            if (!mPet && !mBills && !mGarden && !mStation && !mParking && !mGym && !mConcierge) {
              return null;
            }

            return (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {mPet && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-xs">
                    <PawPrint className="w-3.5 h-3.5 text-amber-700" aria-hidden />
                    <span>Pet Friendly</span>
                  </span>
                )}
                {mBills && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200/80 shadow-xs">
                    <Zap className="w-3.5 h-3.5 text-blue-700" aria-hidden />
                    <span>Bills Included</span>
                  </span>
                )}
                {mStation && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs">
                    <Train className="w-3.5 h-3.5 text-emerald-700" aria-hidden />
                    <span>Near Station</span>
                  </span>
                )}
                {mGarden && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200/80 shadow-xs">
                    <Trees className="w-3.5 h-3.5 text-teal-700" aria-hidden />
                    <span>Balcony / Garden</span>
                  </span>
                )}
                {mParking && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200/80 shadow-xs">
                    <Car className="w-3.5 h-3.5 text-indigo-700" aria-hidden />
                    <span>Parking</span>
                  </span>
                )}
                {mGym && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200/80 shadow-xs">
                    <Dumbbell className="w-3.5 h-3.5 text-purple-700" aria-hidden />
                    <span>Gym / Fitness</span>
                  </span>
                )}
                {mConcierge && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-800 border border-orange-200/80 shadow-xs">
                    <Bell className="w-3.5 h-3.5 text-orange-700" aria-hidden />
                    <span>Concierge</span>
                  </span>
                )}
              </div>
            );
          })()}

          {govDataEnabled && (
            <ProptiiModule
              listingId={resolveListingId(property)}
              propertyUrl={property.url}
              uprn={property.uprn}
              audience={audience}
              onAudienceChange={onAudienceChange}
              addressLabel={reportAddress}
              propertyTitle={property.title}
              propertyLocation={reportAddress}
              propertyPrice={`${priceMain}${showPcm ? ' pcm' : ''}`}
              propertyStreet={property.street}
              propertyPostcode={property.postcode}
              coordinates={
                property.coordinates ??
                (typeof property.latitude === 'number' &&
                typeof property.longitude === 'number' &&
                Number.isFinite(property.latitude) &&
                Number.isFinite(property.longitude)
                  ? { lat: property.latitude, lng: property.longitude }
                  : null)
              }
            />
          )}

          {/* Features — handoff two-column layout */}
          <div className="mb-6">
            <h3
              className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3"
              style={{ fontFamily: 'Archivo, sans-serif' }}
            >
              Property Features &amp; Key Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs space-y-2">
                {featureItems.length > 0 ? (
                  featureItems.map((item, index) => (
                    <div key={index} className="flex items-center text-gray-700 gap-2">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" aria-hidden />
                      <span className="capitalize leading-relaxed">{item}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No feature details listed yet.</p>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs space-y-2.5">
                <div className="flex items-center gap-2 text-gray-700">
                  <BedDouble className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden />
                  <span>
                    <strong>
                      {property.bedrooms === 0
                        ? 'Studio'
                        : property.bedrooms
                        ? `${property.bedrooms} ${Number(property.bedrooms) === 1 ? 'Bedroom' : 'Bedrooms'}`
                        : 'Beds unspecified'}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Bath className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden />
                  <span>
                    <strong>{property.bathrooms || '—'}</strong>&nbsp;Bathroom
                    {property.bathrooms && Number(property.bathrooms) !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Square className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden />
                  <span>
                    <strong>{property.squareFootage || '—'}</strong>
                    {property.squareFootage ? <>&nbsp;sq ft approx.</> : <>&nbsp;sq ft</>}
                  </span>
                </div>
                {property.propertyType && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Home className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden />
                    <span className="capitalize">
                      <strong>{property.propertyType}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {listingDescription && (
            <div className="mb-6">
              <h3
                className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3"
                style={{ fontFamily: 'Archivo, sans-serif' }}
              >
                Description
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{listingDescription}</p>
            </div>
          )}

          {/* Listed By + existing actions preserved */}
          <div className="border-t border-gray-100 pt-6">
            <h3
              className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3"
              style={{ fontFamily: 'Archivo, sans-serif' }}
            >
              Listed By
            </h3>
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
              <p className="font-medium text-gray-900 mb-1">
                {property.agent?.name || 'Agent Information'}
              </p>
              {property.agent?.company && (
                <p className="text-sm text-gray-600 mb-2">{property.agent.company}</p>
              )}
              {property.agent?.phone && (
                <p className="text-sm text-gray-600 mb-2 font-mono tracking-wide">
                  {maskPhone(property.agent.phone)}
                </p>
              )}
              {property.agent?.website && (
                <a
                  href={property.agent.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#136C9E] hover:underline text-sm font-semibold"
                >
                  View Agency Website
                </a>
              )}

              <div className="flex flex-wrap gap-3 mt-4">
                {/* Chat — unauthenticated shows "Send Enquiry" and opens ghost form */}
                <button
                  type="button"
                  onClick={() => onChatClick(property)}
                  disabled={isChatLoading || isNavigatingToBooking}
                  className="bg-[#F15A22] text-white px-4 py-2 rounded-full hover:bg-[#D54A1A] transition-colors flex items-center gap-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChatLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                  {isChatLoading
                    ? 'Starting chat…'
                    : isAuthenticated
                    ? 'Chat'
                    : 'Send Enquiry'}
                </button>

                {/* Book Viewing — requires a logged-in account */}
                <div className="flex flex-col items-start gap-1">
                  <button
                    type="button"
                    onClick={() => onBookClick(property)}
                    disabled={!isAuthenticated || isNavigatingToBooking || isChatLoading}
                    title={!isAuthenticated ? 'Sign in to book a viewing' : undefined}
                    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isNavigatingToBooking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : !isAuthenticated ? (
                      <Lock className="w-4 h-4 text-gray-400" />
                    ) : null}
                    {isNavigatingToBooking ? 'Loading…' : 'Book Viewing'}
                  </button>
                  {!isAuthenticated && (
                    <p className="text-[11px] text-gray-400 pl-1">
                      Sign in to book a viewing
                    </p>
                  )}
                </div>
              </div>
              {chatError && (
                <p className="mt-2 text-xs text-red-600">{chatError}</p>
              )}
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

  const location = extractLocationLabel(searchQuery);
  const locationLabel = location || 'this area';

  return (
    <div className="sr-intel">
      <div className="sr-intel-head">
        <div className="sr-intel-title-row">
          <div className="sr-intel-title">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path>
            </svg>
            <span>Local Area Intelligence — {locationLabel}</span>
          </div>
          <span className="sr-intel-chip">{propertyCount} listings</span>
        </div>
        <div className="sr-intel-tabs">
          <button type="button" className={`sr-intel-tab${activeTab === 'overview' ? ' is-active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
          <button type="button" className={`sr-intel-tab${activeTab === 'strengths' ? ' is-active' : ''}`} onClick={() => setActiveTab('strengths')}>Strengths</button>
          <button type="button" className={`sr-intel-tab${activeTab === 'recommendations' ? ' is-active' : ''}`} onClick={() => setActiveTab('recommendations')}>Tips</button>
          <button type="button" className={`sr-intel-tab${activeTab === 'amenities' ? ' is-active' : ''}`} onClick={() => setActiveTab('amenities')}>Amenities</button>
        </div>
      </div>

      <div className="sr-intel-body">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="sr-gauge-card" title="Area snapshot based on connectivity and local amenities">
              <div className="sr-gauge">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72" aria-hidden>
                  <circle cx="36" cy="36" r="28" fill="none" stroke="#E2E8F0" strokeWidth="5.5"></circle>
                  <circle cx="36" cy="36" r="28" fill="none" stroke="#22C55E" strokeWidth="5.5" strokeDasharray="175.9" strokeDashoffset="35" strokeLinecap="round"></circle>
                </svg>
                <div className="sr-gauge-center">
                  <span className="sr-gauge-score">{propertyCount}</span>
                  <span className="sr-gauge-denom">listings</span>
                </div>
              </div>
              <div className="sr-gauge-copy">
                <h3>
                  Area snapshot
                  <span className="sr-live-dot" />
                </h3>
                <p>
                  {locationLabel} is a well-connected residential area with good access to public transport
                  and local amenities, suitable for both families and professionals.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="sr-metric-row" title="Excellent access to public transport networks and major routes">
                <div className="sr-metric-left">
                  <div className="sr-metric-icon emerald">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="3" width="16" height="16" rx="2"></rect><path d="M4 11h16"></path><path d="M12 3v8"></path></svg>
                  </div>
                  <div>
                    <span className="sr-metric-name">Public Transport</span>
                    <div className="sr-metric-bars">
                      <span className="on emerald" /><span className="on emerald" /><span className="on emerald" /><span className="on emerald" /><span className="on emerald" />
                    </div>
                  </div>
                </div>
                <div className="sr-metric-right">
                  <span className="sr-metric-label emerald">Excellent</span>
                </div>
              </div>
              <div className="sr-metric-row" title="Multiple schools and educational facilities in the vicinity">
                <div className="sr-metric-left">
                  <div className="sr-metric-icon blue">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"></path></svg>
                  </div>
                  <div>
                    <span className="sr-metric-name">Schools & Universities</span>
                    <div className="sr-metric-bars">
                      <span className="on blue" /><span className="on blue" /><span className="on blue" /><span className="on blue" /><span />
                    </div>
                  </div>
                </div>
                <div className="sr-metric-right">
                  <span className="sr-metric-label blue">Strong</span>
                </div>
              </div>
              <div className="sr-metric-row" title="Convenient access to supermarkets and retail outlets">
                <div className="sr-metric-left">
                  <div className="sr-metric-icon orange">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line></svg>
                  </div>
                  <div>
                    <span className="sr-metric-name">Shopping</span>
                    <div className="sr-metric-bars">
                      <span className="on orange" /><span className="on orange" /><span className="on orange" /><span className="on orange" /><span />
                    </div>
                  </div>
                </div>
                <div className="sr-metric-right">
                  <span className="sr-metric-label orange">Convenient</span>
                </div>
              </div>
              <div className="sr-metric-row" title="Medical facilities and pharmacies readily available">
                <div className="sr-metric-left">
                  <div className="sr-metric-icon teal">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                  </div>
                  <div>
                    <span className="sr-metric-name">Healthcare</span>
                    <div className="sr-metric-bars">
                      <span className="on teal" /><span className="on teal" /><span className="on teal" /><span /><span />
                    </div>
                  </div>
                </div>
                <div className="sr-metric-right">
                  <span className="sr-metric-label teal">Available</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'strengths' && (
          <div className="space-y-3">
            <div className="sr-insight-card">
              <span className="sr-insight-mark check">✓</span>
              <div>
                <h4>Property availability</h4>
                <p>{propertyCount} properties currently available, with a diverse range of types and price points.</p>
              </div>
            </div>
            <div className="sr-insight-card">
              <span className="sr-insight-mark check">✓</span>
              <div>
                <h4>Connectivity</h4>
                <p>Well-served by public transport, close to major road networks, and a good walkability score.</p>
              </div>
            </div>
            <div className="sr-insight-card">
              <span className="sr-insight-mark check">✓</span>
              <div>
                <h4>Local amenities</h4>
                <p>Supermarkets, restaurants, cafes, parks and recreational facilities within easy reach.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-3">
            <div className="sr-insight-card tip">
              <span className="sr-insight-mark warn">!</span>
              <div>
                <h4>Viewing tips</h4>
                <p>Schedule viewings at different times of day, check water pressure and heating, and ask about council tax and extra fees.</p>
              </div>
            </div>
            <div className="sr-insight-card tip">
              <span className="sr-insight-mark warn">!</span>
              <div>
                <h4>Location research</h4>
                <p>Visit the area at different times, review local community feedback, and look into nearby development plans.</p>
              </div>
            </div>
            <div className="sr-insight-card tip">
              <span className="sr-insight-mark warn">!</span>
              <div>
                <h4>Quick actions</h4>
                <p>Compare prices with similar properties, read landlord reviews if available, and prepare tenancy questions in advance.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'amenities' && (
          <div>
            <div className="sr-amenity-group">
              <h4>Nearby</h4>
              <ul>
                <li>Schools & education</li>
                <li>Hospitals & clinics</li>
                <li>Shopping centres</li>
                <li>Restaurants & cafes</li>
                <li>Parks & recreation</li>
                <li>Public transport</li>
                <li>Gyms & fitness</li>
                <li>Entertainment</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface SearchPageHeaderProps {
  searchQuery: string;
  draftQuery: string;
  onDraftQueryChange: (value: string) => void;
  onSubmitSearch: () => void;
  onSaveSearch: () => void;
  searchSaved?: boolean;
  resultsCount: number;
  locationLabel: string;
  isCached?: boolean;
  isLoading?: boolean;
  onRefresh?: () => void;
  showMap: boolean;
  onToggleMap: () => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  classificationEntities?: import('../types/govData').ClassifyEntities | null;
  isClassifying?: boolean;
  showMeta?: boolean;
  results?: import('../types/property').Property[];
  onApplyFilters?: (query: string, matchCount: number) => void;
}

function SearchPageHeader({
  searchQuery,
  draftQuery,
  onDraftQueryChange,
  onSubmitSearch,
  onSaveSearch,
  searchSaved = false,
  resultsCount,
  locationLabel,
  isCached = false,
  isLoading = false,
  onRefresh,
  showMap,
  onToggleMap,
  sortOption,
  onSortChange,
  classificationEntities,
  isClassifying = false,
  showMeta = true,
  results = [],
  onApplyFilters,
}: SearchPageHeaderProps) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [sortOpen, setSortOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const pillCount = entitiesToPills(classificationEntities).length;

  useEffect(() => {
    if (!sortOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [sortOpen]);

  const dashboardRoute = user?.roles?.includes('landlord') || user?.roles?.includes('agent')
    ? '/landlord'
    : user?.roles?.includes('homeowner')
      ? '/homeowner/dashboard'
      : '/dashboard';

  return (
    <>
    <header className="sr-header">
      <div className="sr-inner sr-header-top">
        <div className="sr-brand">
          <Link to="/" className="sr-logo" aria-label="Proptii home">
            <img src="/images/proptii-logo.png" alt="Proptii" />
          </Link>
          <div className="sr-crumb">
            <span className="sr-crumb-sep">/</span>
            <span className="sr-crumb-mid">Rent</span>
            <span className="sr-crumb-sep">/</span>
            <span className="sr-crumb-current">Search Results</span>
          </div>
        </div>
        <div className="sr-header-actions">
          {isAuthenticated ? (
            <Link to={dashboardRoute} className="sr-user-chip">
              {user?.name || user?.givenName || 'Dashboard'}
            </Link>
          ) : (
            <>
              <button
                type="button"
                className="sr-btn-ghost"
                onClick={() => navigate(`/login?redirect=${encodeURIComponent('/search?q=' + searchQuery)}`)}
              >
                Sign in
              </button>
              <button type="button" className="sr-btn-register" onClick={() => navigate('/pricing')}>
                Register
              </button>
            </>
          )}
        </div>
      </div>

      <div className="sr-controls">
        <div className="sr-inner sr-controls-inner">
          <div className="sr-search-row">
            <form
              className="sr-search-field"
              onSubmit={(e) => {
                e.preventDefault();
                onSubmitSearch();
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                value={draftQuery}
                onChange={(e) => onDraftQueryChange(e.target.value)}
                placeholder="Search by city, postcode, station or features..."
                aria-label="Search properties"
              />
              {draftQuery ? (
                <button
                  type="button"
                  className="sr-search-clear"
                  title="Clear input"
                  onClick={() => onDraftQueryChange('')}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              ) : null}
            </form>
            <button
              type="button"
              className={`sr-icon-btn${searchSaved ? ' is-saved' : ''}`}
              title="Save this search"
              onClick={onSaveSearch}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill={searchSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
            <button
              type="button"
              className="sr-filters-btn"
              onClick={() => setFiltersOpen(true)}
              aria-haspopup="dialog"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <line x1="4" y1="6" x2="20" y2="6"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
                <line x1="11" y1="18" x2="13" y2="18"></line>
              </svg>
              <span>Filters</span>
              {pillCount > 0 ? <span className="sr-filters-badge">{pillCount}</span> : null}
            </button>
          </div>

          <div className="sr-chips-row">
            <FilterPills
              entities={classificationEntities}
              isClassifying={isClassifying}
              variant="chip"
              maxVisible={8}
              showClearAll
            />
          </div>

          {showMeta && (
            <div className="sr-meta">
              <div className="sr-meta-left">
                <p className="sr-count">
                  <strong>{resultsCount}</strong>{' '}
                  <span className="sr-count-rest">properties to rent in {locationLabel}</span>
                </p>
                {isCached && <span className="sr-cached">cached</span>}
                {onRefresh && (
                  <button
                    type="button"
                    className={`sr-refresh${isLoading ? ' is-loading' : ''}`}
                    onClick={onRefresh}
                    disabled={isLoading}
                    title="Refresh search results"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"></path>
                    </svg>
                    <span>Refresh results</span>
                  </button>
                )}
              </div>
              <div className="sr-meta-right">
                <button
                  type="button"
                  className={`sr-map-toggle${showMap ? ' is-open' : ''}`}
                  onClick={onToggleMap}
                >
                  <svg className="w-4 h-4 sr-brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                    <line x1="8" y1="2" x2="8" y2="18"></line>
                    <line x1="16" y1="6" x2="16" y2="22"></line>
                  </svg>
                  <span>{showMap ? 'Hide map' : 'Show map'}</span>
                  <svg className="w-3.5 h-3.5 sr-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div className="sr-meta-divider" />
                <div className="sr-sort-wrap" ref={sortRef}>
                  <button type="button" className="sr-sort-btn" onClick={() => setSortOpen((open) => !open)}>
                    <span>{sortOption === 'Price (low)' ? 'Price (low)' : sortOption === 'Price (high)' ? 'Price (high)' : sortOption}</span>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <line x1="6" y1="12" x2="18" y2="12"></line>
                      <line x1="9" y1="18" x2="15" y2="18"></line>
                    </svg>
                  </button>
                  {sortOpen && (
                    <div className="sr-sort-menu">
                      {(['Relevance', 'Newest', 'Price (low)', 'Price (high)'] as SortOption[]).map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={sortOption === option ? 'is-active' : undefined}
                          onClick={() => {
                            onSortChange(option);
                            setSortOpen(false);
                          }}
                        >
                          {option === 'Price (low)' ? 'Price (low to high)' : option === 'Price (high)' ? 'Price (high to low)' : option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
    <FiltersModal
      isOpen={filtersOpen}
      onClose={() => setFiltersOpen(false)}
      searchQuery={searchQuery}
      locationLabel={locationLabel}
      entities={classificationEntities}
      results={results}
      onApply={(query, matchCount) => {
        setFiltersOpen(false);
        onApplyFilters?.(query, matchCount);
      }}
    />
    </>
  );
}

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get('q') || '';
  const rawSearchTypeParam = searchParams.get('type');
  const searchTypeParam =
    rawSearchTypeParam === 'proptii' || rawSearchTypeParam === 'onthemarket'
      ? rawSearchTypeParam
      : 'onthemarket';
  const searchType = searchTypeParam as 'onthemarket' | 'proptii';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isNavigatingToBooking, setIsNavigatingToBooking] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [loginPromptAction, setLoginPromptAction] = useState<'booking' | 'chat'>('booking');
  const [quickRequestProperty, setQuickRequestProperty] = useState<Property | null>(null);

  const { results, isLoading, error, retry, searchProperties, clearCache, resolvedLocation } = useSearchBackend();
  const { isPropertySaved, toggleSaveProperty } = useSavedProperties();
  const { enabled: govDataEnabled, audience, setAudience } = useGovDataLayer();
  const { user, isAuthenticated, login } = useAuth();
  const { setActiveConversationId } = useMessagingContext();
  const { getFlagsFor, getHintFor, isUnresolved, isFactsLoading } = useBatchedPropertyFacts(
    govDataEnabled,
    results,
  );
  const { classification, isClassifying } = useClassifyQuery({
    enabled: Boolean(searchQuery),
    query: searchQuery,
  });

  const {
    filters,
    filteredProperties,
    counts: filterCounts,
    setPriceRange,
    toggleBedroom,
    setBedrooms,
    togglePropertyType,
    setFurnishing,
    toggleParking,
    toggleBalconyOrGarden,
    setSortBy,
    resetFilters,
    removeFilter,
  } = usePropertyFilters(results, classification?.entities);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('Relevance');
  const [draftQuery, setDraftQuery] = useState(searchQuery);
  const [searchSaved, setSearchSaved] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  // Use state for map node to detect DOM updates/remounts
  const [mapNode, setMapNode] = useState<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const openPropertyFromMapRef = useRef<(property: Property) => void>(() => {});
  const markersGeocodedRef = useRef<boolean>(false);
  const lastResultsKeyRef = useRef<string | null>(null);
  const boundsFittedRef = useRef<boolean>(false); // Flag to prevent any resets after bounds are fitted
  const boundsFittedTimeRef = useRef<number>(0); // Timestamp when bounds were fitted
  
  // Helper function to safely set map center - prevents resets after bounds are fitted
  const safeSetMapCenter = (location: { lat: number; lng: number } | google.maps.LatLng, zoom?: number) => {
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

  // ─── Macro Filter Server-Side Sync ──────────────────────────────────────────
  const urlBeds = searchParams.get('beds');
  const urlMinPrice = searchParams.get('minPrice');
  const urlMaxPrice = searchParams.get('maxPrice');
  const urlTypes = searchParams.get('types');
  const urlTenure = searchParams.get('tenure');

  const macroFilters = useMemo(() => {
    const f: Record<string, any> = {};
    if (urlBeds && urlBeds !== 'any') {
      const bedList = urlBeds.split(',').map((b) => parseInt(b, 10)).filter(Number.isFinite);
      if (bedList.length === 1) {
        f.minBeds = bedList[0];
        f.maxBeds = bedList[0];
        f.bedrooms = bedList[0];
      } else if (bedList.length > 1) {
        f.minBeds = Math.min(...bedList);
        f.maxBeds = Math.max(...bedList);
      }
    }
    if (urlMinPrice) f.minPrice = parseInt(urlMinPrice, 10);
    if (urlMaxPrice) f.maxPrice = parseInt(urlMaxPrice, 10);
    if (urlTypes) f.propertyType = urlTypes.split(',')[0];
    if (urlTenure) f.channel = urlTenure;
    if (classification?.entities?.location) {
      f.location = classification.entities.location;
    }
    return f;
  }, [urlBeds, urlMinPrice, urlMaxPrice, urlTypes, urlTenure, classification?.entities?.location]);

  const macroSignature = useMemo(() => {
    return `${searchQuery.trim().toLowerCase()}|${searchTypeParam}|beds:${urlBeds || ''}|minP:${urlMinPrice || ''}|maxP:${urlMaxPrice || ''}|types:${urlTypes || ''}|tenure:${urlTenure || ''}|loc:${classification?.entities?.location || ''}`;
  }, [searchQuery, searchTypeParam, urlBeds, urlMinPrice, urlMaxPrice, urlTypes, urlTenure, classification?.entities?.location]);

  const lastExecutedMacroSigRef = useRef<string | null>(null);

  // Perform debounced server-side search whenever query or macro filters change
  useEffect(() => {
    if (!searchQuery) return;

    if (lastExecutedMacroSigRef.current === macroSignature) {
      return;
    }

    const timer = setTimeout(() => {
      lastExecutedMacroSigRef.current = macroSignature;

      // Check if session cache already has this exact macroSignature
      const cachedData = sessionStorage.getItem('searchResults');
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          if (
            parsed.query?.toLowerCase() === searchQuery.toLowerCase() &&
            parsed.searchType === searchTypeParam &&
            parsed.macroSignature === macroSignature &&
            Array.isArray(parsed.results) &&
            parsed.results.length > 0
          ) {
            // Already cached for this exact macro combination
            return;
          }
        } catch {}
      }

      searchProperties(searchQuery, searchType, macroFilters);
    }, 450);

    return () => clearTimeout(timer);
  }, [macroSignature, searchQuery, searchTypeParam, searchType, macroFilters, searchProperties]);

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
        script.src = `https://maps.googleapis.com/maps/api/js?key=${(import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || ''}&libraries=places`;
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
    if (showMap && isMapLoaded && mapNode && window.google && window.google.maps) {
      // Check if map is already initialized on the SAME div
      if (mapInstanceRef.current) {
        // The Google Maps type definitions might not expose getDiv() on the Map type easily if typed as 'any',
        // but it exists on the instance.
        const mapDiv = mapInstanceRef.current.getDiv ? mapInstanceRef.current.getDiv() : null;
        
        if (mapDiv === mapNode) {
          console.log('Map already initialized on correct div');
          return; // Map already initialized on correct div
        }
        
        console.log('Map instance exists but attached to different div. Re-initializing and resetting state.');
        // Reset all flags to force geocoding/marker logic to re-run
        markersGeocodedRef.current = false;
        boundsFittedRef.current = false;
        boundsFittedTimeRef.current = 0;
        lastResultsKeyRef.current = null;
        searchLocationCenteredRef.current = null;
        // Clear markers ref
        markersRef.current = [];
      }

      // Step 1: Initialize map centered on UK (country view)
      try {
        mapInstanceRef.current = new window.google.maps.Map(mapNode, {
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
  }, [showMap, isMapLoaded, mapNode]); // Re-run if map node changes (e.g. re-render)

  // Reset search location centering ref when search query actually changes
  useEffect(() => {
    // Reset when query changes to a different value
    if (searchLocationCenteredRef.current !== null && searchLocationCenteredRef.current !== searchQuery) {
      console.log('Search query changed, resetting search location centering ref');
      searchLocationCenteredRef.current = null;
    }
  }, [searchQuery]);

  // Instantly center map when backend resolvedLocation arrives via Postcodes Architecture (SSE)
  useEffect(() => {
    if (showMap && isMapLoaded && mapInstanceRef.current && resolvedLocation?.coordinates) {
      if (!boundsFittedRef.current && (!markersGeocodedRef.current || markersRef.current.length === 0)) {
        console.log('Centering map on backend resolved location:', resolvedLocation.displayName, resolvedLocation.coordinates);
        safeSetMapCenter(resolvedLocation.coordinates, 13);
        searchLocationCenteredRef.current = searchQuery;
      }
    }
  }, [resolvedLocation, showMap, isMapLoaded, searchQuery]);

  // Geocode properties and add markers when results change
  // This runs AFTER the map is initialized and centered on search location
  useEffect(() => {
    if (showMap && isMapLoaded && mapInstanceRef.current && window.google && window.google.maps && filteredProperties.length > 0) {
      // Create a unique key for this results set to prevent re-geocoding
      const resultsKey = filteredProperties.map(r => `${r.location}-${r.title}-${r.price}`).join('|');
      
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
        const propertiesWithAddresses = filteredProperties.filter(prop => prop.location && prop.location.trim());
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

        // Helper to construct marker and info window
        const createMarkerForProperty = (
          location: google.maps.LatLng | google.maps.LatLngLiteral,
          property: any,
          index: number
        ) => {
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
          const firstImageUrl = imageUrls.length > 0 ? imageUrls[0] : '';
          
          // Create info window with property details and image navigation
          const infoWindow = new window.google.maps.InfoWindow({
            headerDisabled: true,
            content: `
              <div id="map-iw-${propertyId}" class="sr-map-iw">
                ${firstImageUrl ? `
                  <div style="position: relative; width: 100%; height: 150px; overflow: hidden; border-radius: 12px 12px 0 0; background-color: #f0f0f0;">
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
                    <strong>${property.bedrooms === 0 ? 'Studio' : (property.bedrooms ? `${property.bedrooms} beds` : 'Beds unspecified')}</strong> • <strong>${property.propertyType || 'Property'}</strong>
                  </p>
                </div>
              </div>
            `,
          });

          // Set up image navigation when info window is ready
          window.google.maps.event.addListener(infoWindow, 'domready', () => {
            const card = document.getElementById(`map-iw-${propertyId}`);
            const iwContainer = card?.closest('.gm-style-iw-c') as HTMLElement | null;
            const iwInner = card?.closest('.gm-style-iw-d') as HTMLElement | null;

            if (iwContainer) {
              iwContainer.style.padding = '0';
              iwContainer.style.overflow = 'visible';
            }
            if (iwInner) {
              iwInner.style.overflowX = 'hidden';
              iwInner.style.overflowY = 'auto';
              iwInner.style.padding = '0';
              const keepScrollOnCard = (event: Event) => event.stopPropagation();
              iwInner.addEventListener('wheel', keepScrollOnCard, { passive: true });
              iwInner.addEventListener('touchmove', keepScrollOnCard, { passive: true });
            }
            iwContainer?.querySelectorAll('.gm-style-iw-chr, .gm-ui-hover-effect').forEach((node) => {
              (node as HTMLElement).style.display = 'none';
            });

            // Sit the close control on the box corner, outside the scrolling content.
            if (iwContainer && !iwContainer.querySelector('.sr-map-iw-close')) {
              const closeBtn = document.createElement('button');
              closeBtn.type = 'button';
              closeBtn.className = 'sr-map-iw-close';
              closeBtn.setAttribute('aria-label', 'Close listing');
              closeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" d="M6 6l12 12M18 6L6 18" /></svg>';
              closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                infoWindow.close();
              });
              iwContainer.appendChild(closeBtn);
            }
            card?.addEventListener('click', (e) => {
              const target = e.target as HTMLElement | null;
              if (target?.closest('button')) return;
              openPropertyFromMapRef.current(property);
            });

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

          (marker as any).infoWindow = infoWindow;
          markersRef.current.push(marker);
          bounds.extend(location);
          successfulGeocodes++;
        };

        // Step 4: Add markers — Fast path for native coordinates, fallback to Geocoder
        let fallbackGeocodeDelay = 0;

        propertiesWithAddresses.forEach((property, index) => {
          // Fast Path: Check if property already has coordinates
          if (
            property.coordinates &&
            typeof property.coordinates.lat === 'number' &&
            typeof property.coordinates.lng === 'number' &&
            !isNaN(property.coordinates.lat) &&
            !isNaN(property.coordinates.lng)
          ) {
            createMarkerForProperty(property.coordinates, property, index);
            checkAndFitBounds();
            return;
          }

          // Slow Fallback Path: Only call Google Geocoder when coordinates are missing
          const address = property.location.trim();
          fallbackGeocodeDelay++;
          setTimeout(() => {
            geocoder.geocode({ address: address }, (geocodeResults, status) => {
              if (status === 'OK' && geocodeResults && geocodeResults[0]) {
                const location = geocodeResults[0].geometry.location;
                createMarkerForProperty(location, property, index);
              } else {
                console.warn(`Geocoding failed for ${address}: ${status}`);
              }
              checkAndFitBounds();
            });
          }, fallbackGeocodeDelay * 150);
        });
      }, 500);

        return () => {
          clearTimeout(timeoutId);
        };
      }
    }
  }, [showMap, isMapLoaded, filteredProperties, mapNode]);
  
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
  openPropertyFromMapRef.current = openModal;

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProperty(null);
  };

  const handleBookViewingClick = async (property: Property) => {
    if (!isAuthenticated) {
      setLoginPromptAction('booking');
      setIsLoginPromptOpen(true);
      return;
    }


    setIsNavigatingToBooking(true);

    // Prepare property data for BookViewing page.
    // Prefer explicit structured fields; fall back to parsing the location string.
    const propertyData = {
      id: property.title || `property-${Date.now()}`,
      street: property.street || property.location?.split(',')[0]?.trim() || property.location || '',
      town: property.town || property.location?.split(',')[1]?.trim() || '',
      city: property.city || property.location?.split(',')[0]?.trim() || property.location || '',
      postcode: property.postcode || property.location?.split(',')[2]?.trim() || '',
      title: property.title,
      description: property.description,
      imageUrls: property.imageUrls || [],
      agent: {
        id: property.agent?.id || property.agent?.name || `agent-${Date.now()}`,
        name: property.agent?.name || property.source || 'Estate Agent',
        email: property.agent?.email || '',
        phone: property.agent?.phone || '',
        company: property.agent?.company || property.source || 'Estate Agency',
      },
    };

    sessionStorage.setItem('prefilledProperty', JSON.stringify(propertyData));
    // Short delay for visual feedback before navigating
    await new Promise((resolve) => setTimeout(resolve, 600));
    // Navigate to the viewings dashboard section — it auto-opens the booking
    // modal because it reads 'prefilledProperty' from sessionStorage on mount.
    navigate('/dashboard/viewings', {
      state: { openBookingModal: true, prefilledProperty: propertyData },
    });
  };

  // ─── Chat / Message Agent ────────────────────────────────────────────────────
  // Unauthenticated users get the QuickRequestModal (ghost enquiry flow — no
  // account required). Authenticated users get a real conversation created via
  // the communication service and are navigated to their messages dashboard.
  const handleChatClick = async (property: Property) => {
    if (!isAuthenticated || !user) {
      // Ghost/unauthenticated path: show QuickRequestModal (same as ListingDetailsModal)
      setQuickRequestProperty(property);
      return;
    }

    setChatError(null);
    setIsChatLoading(true);

    try {
      // Properties on the search page may be scraped listings (no landlordId).
      // We use 'UNCLAIMED' as the sentinel value and pass the agent email so
      // the backend can later link the conversation when the landlord registers.
      const landlordId = property.agent?.id || 'UNCLAIMED';
      const isUnclaimed = !property.agent?.id;
      const agentEmail = isUnclaimed ? (property.agent?.email || undefined) : undefined;

      const conversation = await communicationService.getOrCreateConversation({
        // Use the listing URL as a stable property ID for scraped properties,
        // falling back to title-based ID if URL is absent.
        propertyId: property.id || property.url || `scraped-${encodeURIComponent(property.title || Date.now().toString())}`,
        tenantId: user.id,
        landlordId,
        agentEmail,
        propertyTitle: property.title,
        tenantName: user.name || user.email,
        // Pass a snapshot for unclaimed/scraped listings so the landlord can
        // see property context when they eventually claim the account.
        scrapedPropertySnapshot: isUnclaimed
          ? {
              url: property.url || '',
              title: property.title,
              location: property.location,
              price: property.price,
              bedrooms: typeof property.bedrooms === 'number' ? property.bedrooms : undefined,
              bathrooms: typeof property.bathrooms === 'number' ? property.bathrooms : undefined,
              propertyType: property.propertyType,
              imageUrls: property.imageUrls,
              agent: {
                name: property.agent?.name,
                email: property.agent?.email || '',
                website: property.agent?.website,
              },
            }
          : undefined,
      });

      setActiveConversationId(conversation.id);
      // Close the modal before navigating so the user doesn't see a flash
      setIsModalOpen(false);
      setSelectedProperty(null);

      navigate('/dashboard/messages', {
        state: {
          conversationId: conversation.id,
          conversation,
          prefilledMessage: 'I would like to enquire about this property.',
        },
      });
    } catch {
      setChatError('Could not start a conversation. Please try again.');
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    setDraftQuery(searchQuery);
  }, [searchQuery]);

  const locationLabel = extractLocationLabel(searchQuery);
  const isCached = Boolean(typeof sessionStorage !== 'undefined' && sessionStorage.getItem('searchResults'));

  const displayedResults = useMemo(() => {
    const list = [...filteredProperties];
    if (sortOption === 'Price (low)') {
      list.sort((a, b) => parsePriceValue(a.price) - parsePriceValue(b.price));
    } else if (sortOption === 'Price (high)') {
      list.sort((a, b) => parsePriceValue(b.price) - parsePriceValue(a.price));
    }
    return list;
  }, [filteredProperties, sortOption]);

  const notify = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2600);
  };

  const handleSubmitSearch = () => {
    const nextQuery = draftQuery.trim();
    if (!nextQuery) return;
    clearCache();
    navigate(`/search?q=${encodeURIComponent(nextQuery)}&type=${encodeURIComponent(searchTypeParam || 'proptii')}`);
  };

  const handleApplyFilters = useCallback((nextQuery: string, matchCount: number) => {
    setDraftQuery(nextQuery);
    clearCache();
    navigate(`/search?q=${encodeURIComponent(nextQuery)}&type=${encodeURIComponent(searchTypeParam || 'proptii')}`);
    setToastMessage(`Showing ${matchCount} ${matchCount === 1 ? 'property' : 'properties'} matching all filters`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2600);
  }, [clearCache, navigate, searchTypeParam]);

  const handleSaveSearch = () => {
    if (!searchQuery.trim()) return;
    const localStorageService = LocalStorageService.getInstance();
    const historyKey = 'search_history';
    const history = localStorageService.get<string[]>(historyKey) || [];
    const nextHistory = [searchQuery, ...history.filter((q) => q !== searchQuery)].slice(0, 10);
    localStorageService.set(historyKey, nextHistory);
    setSearchSaved(true);
    notify('Saved search to your proptii account');
  };

  const headerProps: SearchPageHeaderProps = {
    searchQuery,
    draftQuery,
    onDraftQueryChange: setDraftQuery,
    onSubmitSearch: handleSubmitSearch,
    onSaveSearch: handleSaveSearch,
    searchSaved,
    resultsCount: displayedResults.length,
    locationLabel,
    isCached,
    isLoading,
    onRefresh: () => searchProperties(searchQuery, searchType),
    showMap,
    onToggleMap: () => {
      setShowMap((prev) => {
        const next = !prev;
        if (next) {
          setTimeout(() => {
            document.getElementById('map-container')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
        return next;
      });
    },
    sortOption,
    onSortChange: setSortOption,
    classificationEntities: classification?.entities,
    isClassifying,
    results,
    onApplyFilters: handleApplyFilters,
  };

  const renderPropertyCard = (property: Property, index: number) => (
    <PropertyCard
      key={index}
      property={property}
      onClick={() => openModal(property)}
      isSaved={isPropertySaved(`${property.title}-${property.location}-${property.price}`)}
      onToggleSave={(e) => {
        e.stopPropagation();
        const propertyId = `${property.title}-${property.location}-${property.price}`;
        const wasSaved = isPropertySaved(propertyId);
        toggleSaveProperty(property);
        notify(wasSaved ? 'Property removed from saved' : 'Saved to your favourites');
      }}
      factFlags={govDataEnabled ? getFlagsFor(property) : undefined}
      factsLoading={govDataEnabled && isFactsLoading}
      factsUnresolved={govDataEnabled && isUnresolved(property)}
      reserveHintSlot={govDataEnabled}
      reportHint={govDataEnabled ? getHintFor(property) : null}
      isHighlighted={
        Boolean(
          selectedProperty &&
            selectedProperty.title === property.title &&
            selectedProperty.location === property.location &&
            selectedProperty.price === property.price
        )
      }
    />
  );

  if (isLoading && results.length === 0) {
    return (
      <div className="sr-page">
        <SearchPageHeader {...headerProps} showMeta={false} />
        <div className="flex-1 flex">
          <SearchLoadingAnimation query={searchQuery} />
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    // Only show "format error" guidance when the query is genuinely unparseable.
    // A scraper 500, empty results, or any backend failure is NOT a format problem.
    const isNetworkError =
      error.includes('Network connection') ||
      error.includes('Failed to fetch') ||
      error.includes('ERR_CONNECTION_REFUSED') ||
      error.includes('timeout') ||
      error.includes('connect') ||
      error.includes('500') ||
      error.includes('Internal Server') ||
      error.includes('503') ||
      error.includes('502');

    // Only treat it as a format error if the message is explicitly about the query
    // syntax/structure — empty results should correctly show "No Results Found".
    const isFormatError =
      !isNetworkError &&
      (error.toLowerCase().includes('format') ||
        error.toLowerCase().includes('invalid query') ||
        error.toLowerCase().includes('enter a search query'));

    return (
      <div className="sr-page">
        <SearchPageHeader {...headerProps} showMeta={false} />
        <div className="flex-1 sr-main">
          <div className="sr-inner sr-empty">
            <div className="flex flex-col items-center text-center">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-b from-[#136C9E]/10 to-[#E65D24]/10 flex items-center justify-center shadow-sm">
                <svg className="w-12 h-12 sm:w-14 sm:h-14 text-[#136C9E]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              <h2 className="mt-6 text-2xl sm:text-4xl font-bold" style={{ color: '#23272f' }}>
                {isFormatError
                  ? 'Please Use the Correct Search Format'
                  : isNetworkError
                  ? 'Search Service Unavailable'
                  : 'No Results Found'}
              </h2>
              <p className="mt-3 max-w-2xl text-gray-600">
                {isFormatError
                  ? "We couldn't process your search. Please try using a clear property search format with location, bedrooms, and property type."
                  : isNetworkError
                  ? error
                  : "We couldn't find properties matching your search right now. Try refining your search or try again in a moment."}
              </p>
            </div>

            {isFormatError && (
              <>
                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                    <div className="w-11 h-11 rounded-full bg-[#136C9E]/10 text-[#136C9E] flex items-center justify-center mx-auto mb-4">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">Include Property Details</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      Specify bedrooms, property type (flat, house, apartment), and location in your search.
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                    <div className="w-11 h-11 rounded-full bg-[#E65D24]/10 text-[#E65D24] flex items-center justify-center mx-auto mb-4">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11a2 2 0 100-4 2 2 0 000 4z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">Add a Location</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      Always include a location like "in London", "in Manchester", or "in Leeds" to get relevant results.
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                    <div className="w-11 h-11 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">Use Natural Language</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      Write your search like you're talking: "2 bedroom flats to rent in London" works perfectly.
                    </p>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-gray-100">
                  <p className="text-center text-sm text-gray-500 mb-4">
                    Try these example searches:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      { label: '2 bedroom flats in London', query: '2 bedroom flats to rent in London' },
                      { label: '3 bed house in Manchester', query: '3 bedroom house to rent in Manchester' },
                      { label: '1 bed apartment in Leeds', query: '1 bedroom apartment to rent in Leeds' },
                      { label: 'Studio in Birmingham', query: 'studio flat to rent in Birmingham' },
                      { label: 'Properties under £1500', query: 'properties to rent in London under 1500pcm' },
                    ].map((chip) => (
                      <button
                        key={chip.label}
                        onClick={() => {
                          clearCache();
                          navigate(`/search?q=${encodeURIComponent(chip.query)}&type=${encodeURIComponent(searchTypeParam || 'onthemarket')}`);
                        }}
                        className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {isNetworkError && (
              <>
                <div className="mt-10 bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-2xl mx-auto">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Troubleshooting Tips
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Check your internet connection and try again</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Refresh the page or wait a moment and retry</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Try a different search query with proper format</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 max-w-2xl mx-auto">
                  <p className="text-center text-sm font-medium text-gray-700 mb-4">Try this: correct method</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: '2 bedroom flats in London', query: '2 bedroom flats to rent in London' },
                      { label: '3 bed house in Manchester', query: '3 bedroom house to rent in Manchester' },
                      { label: '1 bed apartment in Leeds', query: '1 bedroom apartment to rent in Leeds' },
                    ].map((example, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          clearCache();
                          navigate(`/search?q=${encodeURIComponent(example.query)}&type=${encodeURIComponent(searchTypeParam || 'onthemarket')}`);
                        }}
                        className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:border-[#E65D24] hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#136C9E]/10 text-[#136C9E] flex items-center justify-center flex-shrink-0 group-hover:bg-[#E65D24]/10 group-hover:text-[#E65D24] transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 group-hover:text-[#E65D24] transition-colors">
                              {example.label}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <button
                onClick={() => {
                  const currentPlatform = searchTypeParam === 'proptii' ? 'proptii' : 'proptii';
                  clearCache();
                  navigate(`/?q=${encodeURIComponent(searchQuery)}&type=${currentPlatform}`);
                }}
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-[#E65D24] to-[#D54D14] hover:opacity-95 transition-all shadow-md"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Start New Search
              </button>

              {isNetworkError && (
                <button
                  onClick={() => {
                    const currentPlatform = searchTypeParam === 'proptii' ? 'proptii' : 'proptii';
                    clearCache();
                    navigate(`/?q=${encodeURIComponent(searchQuery)}&type=${currentPlatform}`);
                  }}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 transition-all"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="sr-page">
      <SearchPageHeader {...headerProps} />
      
      <div className="sr-main">
        <div className="sr-inner">

          {/* Interactive Search Filter Bar */}
          {results.length > 0 && (
            <div className="mb-8">
              <SearchFilterBar
                filters={filters}
                counts={filterCounts}
                setPriceRange={setPriceRange}
                toggleBedroom={toggleBedroom}
                setBedrooms={setBedrooms}
                togglePropertyType={togglePropertyType}
                setFurnishing={setFurnishing}
                toggleParking={toggleParking}
                toggleBalconyOrGarden={toggleBalconyOrGarden}
                setSortBy={setSortBy}
                resetFilters={resetFilters}
                removeFilter={removeFilter}
              />
            </div>
          )}

          {/* Results */}
          {results.length === 0 ? (
            <div className="py-16 sm:py-20">
              <div className="max-w-5xl mx-auto px-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-b from-[#136C9E]/10 to-[#E65D24]/10 flex items-center justify-center shadow-sm">
                    <svg className="w-12 h-12 sm:w-14 sm:h-14 text-[#136C9E]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  <h2 className="mt-6 text-2xl sm:text-4xl font-bold" style={{ color: '#23272f' }}>
                    No Properties Found
                  </h2>
                  <p className="mt-3 max-w-2xl text-gray-600">
                    We couldn't find any properties matching your search criteria. Don&apos;t worry though – there are plenty of options available!
                  </p>
                </div>

                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                    <div className="w-11 h-11 rounded-full bg-[#136C9E]/10 text-[#136C9E] flex items-center justify-center mx-auto mb-4">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">Adjust Your Filters</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      Try broadening your search criteria like price range, number of bedrooms, or apartment type.
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                    <div className="w-11 h-11 rounded-full bg-[#E65D24]/10 text-[#E65D24] flex items-center justify-center mx-auto mb-4">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11a2 2 0 100-4 2 2 0 000 4z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">Try Different Location</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      Consider searching in nearby areas or neighborhoods that might have similar properties.
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                    <div className="w-11 h-11 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">Check Back Later</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      New properties are added daily. Save your search and we&apos;ll notify you when new matches appear.
                    </p>
                  </div>
                </div>

                <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      const currentPlatform = searchTypeParam === 'proptii' ? 'proptii' : 'proptii';
                      clearCache();
                      navigate(`/?q=${encodeURIComponent(searchQuery)}&type=${currentPlatform}`);
                    }}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-[#E65D24] to-[#D54D14] hover:opacity-95 transition-all shadow-md"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Start New Search
                  </button>

                  <button
                    onClick={() => {
                      const currentPlatform = searchTypeParam === 'proptii' ? 'proptii' : 'proptii';
                      const nextPlatform = currentPlatform === 'proptii' ? 'onthemarket' : 'proptii';
                      clearCache();
                      navigate(`/?q=${encodeURIComponent(searchQuery)}&type=${nextPlatform}`);
                    }}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 transition-all"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 10a1 1 0 011-1h10a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm14-5a1 1 0 011-1h2a1 1 0 011 1v10a1 1 0 01-1 1h-2a1 1 0 01-1-1V9z" />
                    </svg>
                    {searchTypeParam === 'proptii' ? 'Try On The Market' : 'Try Proptii'}
                  </button>
                </div>

                {(() => {
                  const locationMatch = searchQuery.match(/(?:in|at|near)\s+([A-Za-z\s,]+)/i);
                  const locationLabel = (locationMatch?.[1]?.trim() || '').replace(/\s{2,}/g, ' ');
                  const hasLocation = Boolean(locationLabel);
                  const baseLocation = hasLocation ? locationLabel : 'London';
                  const chips = [
                    { label: '1 Bed Apartments', query: `1 bedroom apartments to rent in ${baseLocation}` },
                    { label: '2 Bed Houses', query: `2 bedroom houses to rent in ${baseLocation}` },
                    { label: 'Studio Flats', query: `studio flats to rent in ${baseLocation}` },
                    { label: 'Properties under £1500', query: `properties to rent in ${baseLocation} under 1500pcm` },
                    { label: 'Central London', query: `properties to rent in Central London` },
                    { label: 'Pet-Friendly', query: `pet friendly properties to rent in ${baseLocation}` },
                  ];

                  return (
                    <div className="mt-10 pt-8 border-t border-gray-100">
                      <p className="text-center text-sm text-gray-500 mb-4">
                        Popular searches{hasLocation ? ` in ${locationLabel}` : ''}:
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {chips.map((chip) => (
                          <button
                            key={chip.label}
                            onClick={() => {
                              clearCache();
                              navigate(`/search?q=${encodeURIComponent(chip.query)}&type=${encodeURIComponent(searchTypeParam || 'onthemarket')}`);
                            }}
                            className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="py-16 sm:py-20">
              <div className="max-w-xl mx-auto px-4 text-center bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#136C9E]/10 text-[#136C9E] flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  No Properties Match Your Active Filters
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  We found {results.length} {results.length === 1 ? 'property' : 'properties'} for this search, but none match your current filter criteria.
                </p>
                <div className="mt-6 flex flex-col items-center gap-3">
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                    {filters.bedrooms !== 'any' && Array.isArray(filters.bedrooms) && (
                      <button
                        type="button"
                        onClick={() => removeFilter('bedrooms')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        <span>Remove {filters.bedrooms.join('/')} bed filter</span>
                        <XIcon className="w-3.5 h-3.5 text-gray-500" aria-hidden />
                      </button>
                    )}
                    {filters.maxPrice !== null && (
                      <button
                        type="button"
                        onClick={() => removeFilter('price')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        <span>Remove max £{filters.maxPrice.toLocaleString('en-GB')} filter</span>
                        <XIcon className="w-3.5 h-3.5 text-gray-500" aria-hidden />
                      </button>
                    )}
                    {filters.propertyTypes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => removeFilter('propertyTypes')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        <span>Remove {filters.propertyTypes.join(', ')} filter</span>
                        <XIcon className="w-3.5 h-3.5 text-gray-500" aria-hidden />
                      </button>
                    )}
                    {filters.isPetFriendly && (
                      <button
                        type="button"
                        onClick={() => removeFilter('pets')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
                      >
                        <PawPrint className="w-3.5 h-3.5 text-amber-700" aria-hidden />
                        <span>Remove Pet Friendly filter</span>
                        <XIcon className="w-3.5 h-3.5 text-amber-600" aria-hidden />
                      </button>
                    )}
                    {filters.billsIncluded && (
                      <button
                        type="button"
                        onClick={() => removeFilter('bills')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors"
                      >
                        <Zap className="w-3.5 h-3.5 text-blue-700" aria-hidden />
                        <span>Remove Bills Included filter</span>
                        <XIcon className="w-3.5 h-3.5 text-blue-600" aria-hidden />
                      </button>
                    )}
                    {filters.hasBalconyOrGarden && (
                      <button
                        type="button"
                        onClick={() => removeFilter('outside')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 transition-colors"
                      >
                        <Trees className="w-3.5 h-3.5 text-teal-700" aria-hidden />
                        <span>Remove Balcony/Garden filter</span>
                        <XIcon className="w-3.5 h-3.5 text-teal-600" aria-hidden />
                      </button>
                    )}
                    {filters.hasParking && (
                      <button
                        type="button"
                        onClick={() => removeFilter('parking')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                      >
                        <Car className="w-3.5 h-3.5 text-indigo-700" aria-hidden />
                        <span>Remove Parking filter</span>
                        <XIcon className="w-3.5 h-3.5 text-indigo-600" aria-hidden />
                      </button>
                    )}
                    {Boolean(filters.keywords) && (
                      <button
                        type="button"
                        onClick={() => removeFilter('keywords')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        <span>Remove &quot;{filters.keywords}&quot; filter</span>
                        <XIcon className="w-3.5 h-3.5 text-gray-500" aria-hidden />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#136C9E] to-[#0F5A8A] hover:opacity-95 transition-all shadow-sm text-sm w-full sm:w-auto"
                    >
                      Clear All Filters & Show All {results.length} Properties
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        clearCache();
                        searchProperties(searchQuery, searchType, {
                          ...macroFilters,
                          pet_friendly: filters.isPetFriendly ? true : undefined,
                          bills_included: filters.billsIncluded ? true : undefined,
                          balcony_or_garden: filters.hasBalconyOrGarden ? true : undefined,
                          parking: filters.hasParking ? true : undefined,
                          keywords: filters.keywords || undefined,
                        });
                      }}
                      className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#E65D24] to-[#D54D14] hover:opacity-95 transition-all shadow-sm text-sm w-full sm:w-auto"
                    >
                      <Sparkles className="w-4 h-4 mr-2" aria-hidden />
                      Re-query Portals With These Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {showMap && (
                <div className="sr-map-collapse">
                  <div className="sr-map-intel">
                    <div id="map-container" className="sr-map-frame">
                      {!isMapLoaded ? (
                        <div className="sr-map-loading">
                          <div className="text-center">
                            <div className="w-16 h-16 border-4 border-[#136C9E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading map...</p>
                          </div>
                        </div>
                      ) : (
                        <div
                          ref={setMapNode}
                          className="sr-map-canvas"
                          style={{ height: '100%', minHeight: 360 }}
                        ></div>
                      )}
                      <div className="sr-map-pill">
                        <span className="sr-dot" />
                        <span>Showing active properties in {locationLabel}</span>
                      </div>
                    </div>
                    <LocationInsights searchQuery={searchQuery} propertyCount={results.length} />
                  </div>
                </div>
              )}

              <div className="sr-grid">
                {displayedResults.map((property, index) => renderPropertyCard(property, index))}
                {isLoading && [1, 2, 3].map((i) => (
                  <PropertySkeleton key={`skeleton-grid-${i}`} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Property Details Modal */}
      <PropertyDetailsModal
        property={selectedProperty}
        isOpen={isModalOpen}
        onClose={closeModal}
        onBookClick={handleBookViewingClick}
        onChatClick={handleChatClick}
        isNavigatingToBooking={isNavigatingToBooking}
        isChatLoading={isChatLoading}
        chatError={chatError}
        isAuthenticated={isAuthenticated}
        govDataEnabled={govDataEnabled}
        audience={audience}
        onAudienceChange={setAudience}
      />

      {/* Login Required Modal — shown when an unauthenticated user clicks Book */}
      {isLoginPromptOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-prompt-title"
          onClick={() => setIsLoginPromptOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-7 shadow-2xl border border-gray-100 relative"
            style={{ fontFamily: '"Nunito Sans", sans-serif' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsLoginPromptOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#136C9E] to-[#0d4f74] flex items-center justify-center mb-5 shadow-lg shadow-blue-900/20">
              {loginPromptAction === 'chat' ? (
                <MessageSquare className="w-6 h-6 text-white" />
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>

            <h3
              id="login-prompt-title"
              className="text-xl font-extrabold text-gray-900 mb-2"
              style={{ fontFamily: 'Archivo, sans-serif' }}
            >
              {loginPromptAction === 'chat' ? 'Sign in to chat with the agent' : 'Sign in to book a viewing'}
            </h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              {loginPromptAction === 'chat'
                ? 'Create a free account to message agents directly and track all your property conversations in one place.'
                : 'Create a free account to request and manage property viewings, and keep track of your applications.'}
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setIsLoginPromptOpen(false);
                  void login();
                }}
                className="w-full py-3 px-6 rounded-full bg-[#F15A22] hover:bg-[#D54A1A] text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ghost enquiry modal — unauthenticated users clicking Chat on a scraped listing */}
      {quickRequestProperty && (
        <QuickRequestModal
          isOpen={Boolean(quickRequestProperty)}
          onClose={() => setQuickRequestProperty(null)}
          listingId={quickRequestProperty.url || quickRequestProperty.title || `property-${Date.now()}`}
          listingTitle={quickRequestProperty.title}
          listingSource={quickRequestProperty.agent?.id ? 'native' : 'scraped'}
          landlordId={quickRequestProperty.agent?.id}
          agentEmail={quickRequestProperty.agent?.email}
          agentName={quickRequestProperty.agent?.name}
          sourcePlatform={quickRequestProperty.source}
        />
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="sr-toast">
          <span className="sr-toast-dot" />
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setShowToast(false)} aria-label="Dismiss notification">
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

