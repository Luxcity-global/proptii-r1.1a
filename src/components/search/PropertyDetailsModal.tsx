import React, { useState, useEffect, useRef } from 'react';
import {
  Bath,
  BedDouble,
  Calendar,
  Check,
  Clock,
  Home,
  Loader2,
  Lock,
  MapPin,
  MessageSquare,
  Square,
  Tag,
} from 'lucide-react';
import type { Property } from '../../hooks/useSearchBackend';
import type { Audience } from '../../types/govData';
import { ProptiiModule } from '../property/ProptiiModule';
import { resolveListingId } from '../../utils/listingId';
import { getPropertyDisplayTitle, getPropertyListingDescription } from '../../utils/propertyDisplay';
import { getPropertyDateInfo } from '../../utils/propertyDates';
import { getPropertyDynamicFeatures } from '../../utils/propertyFeatures';
import { maskEmail, maskPhone } from '../../utils/formatters';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800';

export const cleanPropertyPrice = (price: string): string => {
  if (!price || typeof price !== 'string') return price || '';
  let cleanedPrice = price.replace(/Tenancy info£?/gi, '');
  cleanedPrice = cleanedPrice.replace(/\s*\(£[\d,]+\s*pw\)/gi, '');
  const pcmMatch = cleanedPrice.match(/£[\d,]+ pcm/i);
  if (pcmMatch) return pcmMatch[0];
  if (cleanedPrice.trim()) {
    const trimmedPrice = cleanedPrice.trim();
    if (!trimmedPrice.startsWith('£') && /\d/.test(trimmedPrice)) {
      return `£${trimmedPrice}`;
    }
    return trimmedPrice;
  }
  return cleanedPrice.trim();
};

/** Optional listing fields some sources send that are not part of the shared Property type. */
type ExtendedListingFields = {
  rentAmount?: number | string;
  tenure?: string;
  furnished_state?: string;
  council_tax_band?: string;
  keyFeatures?: string[];
};

export interface PropertyDetailsModalProps {
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
  audience?: Audience | null;
  onAudienceChange?: (audience: Audience) => void;
}

export function PropertyDetailsModal({
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
          setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : property.imageUrls.length - 1));
        } else if (e.key === 'ArrowRight') {
          setCurrentImageIndex((prev) => (prev + 1) % property.imageUrls.length);
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

  const extra = property as Property & ExtendedListingFields;
  const images = property.imageUrls?.length ? property.imageUrls : [PLACEHOLDER_IMAGE];
  const cleanedPrice = cleanPropertyPrice(property.price);
  const pcmMatch = cleanedPrice.match(/^(£[\d,]+)\s*(pcm)?$/i);
  const priceMain = pcmMatch?.[1] || cleanedPrice;
  const showPcm = /pcm/i.test(cleanedPrice) || Boolean(pcmMatch?.[2]);
  const isRent =
    Boolean(extra.rentAmount) ||
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
  const keyFeatures = Array.isArray(extra.keyFeatures) ? extra.keyFeatures.filter(Boolean) : [];
  const featureItems =
    keyFeatures.length > 0
      ? keyFeatures.slice(0, 12)
      : rawAmenities.length > 0
      ? rawAmenities.slice(0, 12)
      : ([
          property.description?.split('.')[0]?.trim(),
          property.propertyType ? `Property type: ${property.propertyType}` : null,
          property.location ? `Located in ${property.location}` : null,
        ].filter(Boolean) as string[]);

  const drawerBaths =
    property.bathroom_count ??
    (property.bathrooms !== undefined && property.bathrooms !== null && property.bathrooms !== '' && property.bathrooms !== '—'
      ? Number(property.bathrooms)
      : undefined);
  const drawerSqFt =
    property.sq_ft ??
    (property.squareFootage && property.squareFootage !== '—'
      ? Number(String(property.squareFootage).replace(/[^0-9]/g, ''))
      : undefined);

  const modalDateInfo = getPropertyDateInfo(property);
  const modalFeatures = getPropertyDynamicFeatures(property);

  const listingInfo = [
    extra.tenure ? { label: 'Tenure', value: extra.tenure } : null,
    extra.furnished_state ? { label: 'Furnishing', value: extra.furnished_state } : null,
    extra.council_tax_band ? { label: 'Council Tax', value: `Band ${extra.council_tax_band}` } : null,
    property.source ? { label: 'Source', value: property.source } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 text-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image carousel — handoff Step 2 */}
        <div className="relative p-2">
          <div className="relative h-[22rem] sm:h-[26rem] rounded-2xl overflow-hidden bg-gray-100">
            <img
              src={images[currentImageIndex]}
              alt={`${displayTitle} - Image ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
              }}
            />

            <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
              <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#136C9E] text-white shadow-md">
                {isRent ? 'To Rent' : 'For Sale'}
              </span>
              <span
                className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-md text-white ${
                  modalDateInfo.badgeVariant === 'rose'
                    ? 'bg-rose-600'
                    : modalDateInfo.badgeVariant === 'blue'
                    ? 'bg-blue-600'
                    : modalDateInfo.badgeVariant === 'amber'
                    ? 'bg-amber-600'
                    : 'bg-emerald-600'
                }`}
                title={modalDateInfo.modifiedLabel || modalDateInfo.publishedLabel}
              >
                {modalDateInfo.badgeText}
              </span>
            </div>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 text-white p-2.5 rounded-full hover:bg-black/80 transition-all"
                  aria-label="Previous photo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 text-white p-2.5 rounded-full hover:bg-black/80 transition-all"
                  aria-label="Next photo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-gray-900 tracking-tight" style={{ fontFamily: 'Archivo, sans-serif' }}>
                {displayTitle}
              </h2>
              <div className="flex items-center text-gray-500 text-xs mt-1">
                <MapPin className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" aria-hidden />
                <span>{property.location}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-[#F15A22]">
                {priceMain} {showPcm && <span className="text-xs text-gray-500 font-normal">pcm</span>}
              </p>
              {extra.tenure && (
                <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                  {extra.tenure}
                </span>
              )}
            </div>
          </div>

          {/* Exact publication & modification status */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-500 mb-4 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200/80 text-gray-700">
              <Calendar className="w-3.5 h-3.5 text-gray-500" aria-hidden />
              <span>{modalDateInfo.publishedLabel}</span>
            </div>
            {modalDateInfo.isModified && modalDateInfo.modifiedLabel && (
              <div className="flex items-center gap-1.5 font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <Clock className="w-3.5 h-3.5 text-amber-600" aria-hidden />
                <span>{modalDateInfo.modifiedLabel}</span>
              </div>
            )}
          </div>

          {modalFeatures.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {modalFeatures.map((feat) => {
                const IconComponent = feat.Icon;
                return (
                  <span
                    key={feat.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs ${feat.badgeClass}`}
                  >
                    <IconComponent className={`w-3.5 h-3.5 ${feat.iconColorClass}`} aria-hidden />
                    <span>{feat.label}</span>
                  </span>
                );
              })}
            </div>
          )}

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
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3" style={{ fontFamily: 'Archivo, sans-serif' }}>
              Property Features &amp; Key Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs space-y-2">
                {modalFeatures.length > 0 ? (
                  modalFeatures.map((feat) => {
                    const IconComponent = feat.Icon;
                    return (
                      <div key={feat.id} className="flex items-center text-gray-700 gap-2">
                        <IconComponent className={`w-4 h-4 flex-shrink-0 ${feat.iconColorClass}`} aria-hidden />
                        <span className="capitalize leading-relaxed font-medium">{feat.label}</span>
                      </div>
                    );
                  })
                ) : featureItems.length > 0 ? (
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
                {drawerBaths !== undefined && !isNaN(drawerBaths) && drawerBaths > 0 && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Bath className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden />
                    <span>
                      <strong>{drawerBaths}</strong>&nbsp;Bathroom{drawerBaths !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {drawerSqFt !== undefined && !isNaN(drawerSqFt) && drawerSqFt > 0 && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Square className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden />
                    <span>
                      <strong>{drawerSqFt.toLocaleString('en-GB')}</strong>&nbsp;sq ft approx.
                    </span>
                  </div>
                )}
                {property.propertyType && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Home className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden />
                    <span className="capitalize">
                      <strong>{property.propertyType}</strong>
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-700 pt-2 border-t border-gray-200/60">
                  <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden />
                  <span>
                    <strong>{modalDateInfo.publishedLabel}</strong>
                  </span>
                </div>
                {modalDateInfo.isModified && modalDateInfo.modifiedLabel && (
                  <div className="flex items-center gap-2 text-amber-800 font-medium">
                    <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" aria-hidden />
                    <span>
                      <strong>{modalDateInfo.modifiedLabel}</strong>
                    </span>
                  </div>
                )}
                {listingInfo.map((info) => (
                  <div key={info.label} className="flex items-center gap-2 text-gray-700">
                    <Tag className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden />
                    <span>
                      {info.label}: <strong className="capitalize">{info.value}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {listingDescription && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3" style={{ fontFamily: 'Archivo, sans-serif' }}>
                Description
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{listingDescription}</p>
            </div>
          )}

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3" style={{ fontFamily: 'Archivo, sans-serif' }}>
              Listed By
            </h3>
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
              <p className="font-medium text-gray-900 mb-1">
                {property.agent?.name || property.source || 'Agent Information'}
              </p>
              {property.agent?.company && <p className="text-sm text-gray-600 mb-2">{property.agent.company}</p>}
              {property.agent?.phone && (
                <p className="text-sm text-gray-600 mb-2 font-mono tracking-wide">
                  {isAuthenticated ? property.agent.phone : maskPhone(property.agent.phone)}
                </p>
              )}
              {property.agent?.email && (
                <p className="text-sm text-gray-600 mb-2">
                  {isAuthenticated ? property.agent.email : maskEmail(property.agent.email)}
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
                  {isChatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                  {isChatLoading ? 'Starting chat…' : isAuthenticated ? 'Chat' : 'Send Enquiry'}
                </button>

                {/* Book Viewing — guests are prompted to sign in */}
                <div className="flex flex-col items-start gap-1">
                  <button
                    type="button"
                    onClick={() => onBookClick(property)}
                    disabled={isNavigatingToBooking || isChatLoading}
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
                  {!isAuthenticated && <p className="text-[11px] text-gray-400 pl-1">Sign in to book a viewing</p>}
                </div>
              </div>
              {chatError && <p className="mt-2 text-xs text-red-600">{chatError}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
