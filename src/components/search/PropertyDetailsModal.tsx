import React, { useState, useEffect, useRef } from 'react';
import {
  Bath,
  BedDouble,
  Calendar,
  Clock,
  Home,
  Loader2,
  Lock,
  MapPin,
  MessageSquare,
  Sparkles,
  Square,
  X as XIcon,
} from 'lucide-react';
import type { Property } from '../../hooks/useSearchBackend';
import type { Audience } from '../../types/govData';
import { FactsBadgeRow } from '../property/FactsBadgeRow';
import { ProptiiModule } from '../property/ProptiiModule';
import { getPropertyDisplayTitle, getPropertyListingDescription } from '../../utils/propertyDisplay';
import { getPropertyDateInfo } from '../../utils/propertyDates';
import { getPropertyDynamicFeatures } from '../../utils/propertyFeatures';
import { maskEmail, maskPhone } from '../../utils/formatters';

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
          setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : property.imageUrls!.length - 1));
        } else if (e.key === 'ArrowRight') {
          setCurrentImageIndex((prev) => (prev < property.imageUrls!.length - 1 ? prev + 1 : 0));
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
  }, [isOpen, onClose, property?.imageUrls]);

  if (!isOpen || !property) return null;

  const images = property.imageUrls?.length
    ? property.imageUrls
    : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800'];
  const cleanedPrice = cleanPropertyPrice(property.price);
  const pcmMatch = cleanedPrice.match(/^(£[\d,]+)\s*(pcm)?$/i);
  const priceMain = pcmMatch?.[1] || cleanedPrice;
  const showPcm = /pcm/i.test(cleanedPrice) || Boolean(pcmMatch?.[2]);
  const isRent =
    property.transactionType === 'rent' ||
    Boolean(property.rentAmount) ||
    /pcm|pw|rent/i.test(property.price || '');
  const displayTitle = getPropertyDisplayTitle(property);
  const reportAddress =
    property.formattedAddress ||
    [property.street, property.town || property.city, property.postcode]
      .map((part) => (part || '').trim())
      .filter(Boolean)
      .join(', ') ||
    property.location;
  const listingDescription = getPropertyListingDescription(property);
  const rawAmenities = (property.amenities || [])
    .map((a: any) => (typeof a === 'string' ? a : a?.description || a?.htmlDescription || a?.title || '').trim())
    .filter(Boolean);
  const featureItems =
    property.keyFeatures && property.keyFeatures.length > 0
      ? property.keyFeatures
      : property.features && property.features.length > 0
      ? property.features
      : rawAmenities.length > 0
      ? rawAmenities
      : [];

  const drawerBaths =
    property.bathroom_count ??
    (property.bathrooms !== undefined && property.bathrooms !== null && property.bathrooms !== ''
      ? Number(property.bathrooms)
      : undefined);
  const drawerSqFt =
    property.sq_ft ??
    (property.squareFootage
      ? String(property.squareFootage).replace(/[^0-9]/g, '')
      : undefined);

  const modalDateInfo = getPropertyDateInfo(property);
  const modalFeatures = getPropertyDynamicFeatures(property);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-75 flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-700 hover:text-black hover:bg-white transition-all shadow-md hover:scale-105"
          aria-label="Close modal"
        >
          <XIcon className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto flex-1">
          <div className="relative aspect-[16/9] w-full bg-gray-900 group">
            <img
              src={images[currentImageIndex]}
              alt={`${property.title} - Image ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 transition-all opacity-0 group-hover:opacity-100"
                  aria-label="Previous image"
                >
                  ←
                </button>
                <button
                  onClick={() =>
                    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 transition-all opacity-0 group-hover:opacity-100"
                  aria-label="Next image"
                >
                  →
                </button>
                <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-sm rounded-full">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex flex-wrap items-baseline gap-2 mb-2">
                <span className="text-3xl font-extrabold text-[#E65D24]">{priceMain}</span>
                {showPcm && <span className="text-sm font-medium text-gray-500">pcm</span>}
                {isRent && !showPcm && (
                  <span className="text-sm font-medium text-gray-500">rent</span>
                )}
                {property.tenure && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium ml-2">
                    {property.tenure}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{displayTitle}</h2>
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" aria-hidden />
                <span>{property.location}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-orange-50 text-[#E65D24] rounded-xl">
                  <BedDouble className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Bedrooms</div>
                  <div className="text-sm font-bold text-gray-900">
                    {property.bedrooms === 0 ? 'Studio' : property.bedrooms ?? 'N/A'}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-50 text-[#136C9E] rounded-xl">
                  <Bath className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Bathrooms</div>
                  <div className="text-sm font-bold text-gray-900">
                    {drawerBaths !== undefined && !isNaN(drawerBaths) ? drawerBaths : 'N/A'}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Type</div>
                  <div className="text-sm font-bold text-gray-900 truncate">
                    {property.propertyType || 'Property'}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
                  <Square className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Size</div>
                  <div className="text-sm font-bold text-gray-900">
                    {drawerSqFt ? `${drawerSqFt} sq ft` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {modalFeatures.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {modalFeatures.map((feat) => {
                  const IconComponent = feat.Icon;
                  return (
                    <span
                      key={feat.label}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800"
                    >
                      <IconComponent className="w-3.5 h-3.5 text-gray-600" aria-hidden />
                      {feat.label}
                    </span>
                  );
                })}
              </div>
            )}

            {govDataEnabled && property.uprn && (
              <div className="border-t border-gray-100 pt-4">
                <FactsBadgeRow uprn={property.uprn} audience={audience} />
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">About this property</h3>
              <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">
                {listingDescription}
              </p>
            </div>

            {(modalFeatures.length > 0 || featureItems.length > 0) && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-gray-900">Key Features & Amenities</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {modalFeatures.map((feat) => {
                    const IconComponent = feat.Icon;
                    return (
                      <div
                        key={feat.label}
                        className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3.5 py-2.5 rounded-xl border border-gray-100/80 font-medium"
                      >
                        <IconComponent className="w-4 h-4 text-[#E65D24] flex-shrink-0" aria-hidden />
                        <span>{feat.label}</span>
                      </div>
                    );
                  })}
                  {featureItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3.5 py-2.5 rounded-xl border border-gray-100/80"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E65D24] flex-shrink-0" />
                      <span className="truncate">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">Listing Information</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50/70 p-4 rounded-xl border border-gray-100">
                {modalDateInfo.addedOn && (
                  <div>
                    <span className="text-xs text-gray-400 block font-medium">Added to Market</span>
                    <span className="text-sm font-semibold text-gray-800">{modalDateInfo.addedOn}</span>
                  </div>
                )}
                {modalDateInfo.availableFrom && (
                  <div>
                    <span className="text-xs text-gray-400 block font-medium">Available From</span>
                    <span className="text-sm font-semibold text-gray-800">{modalDateInfo.availableFrom}</span>
                  </div>
                )}
                {property.tenure && (
                  <div>
                    <span className="text-xs text-gray-400 block font-medium">Tenure</span>
                    <span className="text-sm font-semibold text-gray-800">{property.tenure}</span>
                  </div>
                )}
                {property.furnished_state && (
                  <div>
                    <span className="text-xs text-gray-400 block font-medium">Furnishing</span>
                    <span className="text-sm font-semibold text-gray-800 capitalize">
                      {property.furnished_state}
                    </span>
                  </div>
                )}
                {property.council_tax_band && (
                  <div>
                    <span className="text-xs text-gray-400 block font-medium">Council Tax</span>
                    <span className="text-sm font-semibold text-gray-800">
                      Band {property.council_tax_band}
                    </span>
                  </div>
                )}
                {property.source && (
                  <div>
                    <span className="text-xs text-gray-400 block font-medium">Source</span>
                    <span className="text-sm font-semibold text-gray-800 capitalize">
                      {property.source}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {govDataEnabled && property.uprn && (
              <ProptiiModule
                uprn={property.uprn}
                propertyAddress={reportAddress}
                propertyPrice={cleanedPrice}
                audience={audience}
                onAudienceChange={onAudienceChange}
              />
            )}

            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Listed By
                </span>
                <h4 className="text-base font-bold text-gray-900 mt-0.5">
                  {property.agent?.name || property.source || 'Estate Agent'}
                </h4>
                {property.agent?.company && (
                  <p className="text-xs text-gray-500">{property.agent.company}</p>
                )}
                {property.agent?.phone && (
                  <p className="text-xs text-gray-500 mt-1">
                    Tel: {isAuthenticated ? property.agent.phone : maskPhone(property.agent.phone)}
                  </p>
                )}
                {property.agent?.email && (
                  <p className="text-xs text-gray-500">
                    Email: {isAuthenticated ? property.agent.email : maskEmail(property.agent.email)}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={() => onBookClick(property)}
                  disabled={isNavigatingToBooking}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#136C9E] to-[#0F5A8A] hover:opacity-95 transition-all shadow-sm flex items-center justify-center gap-2 text-sm disabled:opacity-70"
                >
                  {isNavigatingToBooking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Opening schedule...</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Book Viewing</span>
                      {!isAuthenticated && <Lock className="w-3.5 h-3.5 opacity-70" />}
                    </>
                  )}
                </button>

                <div className="flex flex-col items-end">
                  <button
                    onClick={() => onChatClick(property)}
                    disabled={isChatLoading}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#E65D24] to-[#D54D14] hover:opacity-95 transition-all shadow-sm flex items-center justify-center gap-2 text-sm disabled:opacity-70"
                  >
                    {isChatLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Opening chat...</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4" />
                        <span>Chat with Agent</span>
                      </>
                    )}
                  </button>
                  {!isAuthenticated && (
                    <p className="mt-1 text-[11px] text-gray-500">
                      Send a fast enquiry — no account required
                    </p>
                  )}
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
