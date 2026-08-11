import React, { useEffect, useRef, useState } from 'react';
import { useIsMobile } from './ui/use-mobile';

interface SavedPropertyDetailsModalProps {
  property: any | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Property details modal for saved/liked listings (matches Saved Searches page).
 */
const SavedPropertyDetailsModal: React.FC<SavedPropertyDetailsModalProps> = ({
  property,
  isOpen,
  onClose,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isOpen) {
      setCurrentImageIndex(0);
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      const handleArrows = (e: KeyboardEvent) => {
        if (!property?.imageUrls?.length) return;
        if (e.key === 'ArrowLeft') {
          setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : property.imageUrls.length - 1));
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

  const cleanPrice = (raw: string) => {
    if (!raw) return raw;
    let cleaned = raw.replace(/Tenancy info£?/gi, '');
    cleaned = cleaned.replace(/\s*\(£[\d,]+\s*pw\)/gi, '');
    const pcm = cleaned.match(/£[\d,]+ pcm/i);
    if (pcm) return pcm[0];
    const t = cleaned.trim();
    if (t && !t.startsWith('£') && /\d/.test(t)) return `£${t}`;
    return t;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className={`bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto ${isMobile ? 'mx-2' : ''}`}
        style={{ maxWidth: isMobile ? '100%' : '900px' }}
      >
        <div className={`sticky top-0 bg-white border-b border-gray-200 ${isMobile ? 'px-4 py-3' : 'px-6 py-4'} flex items-center justify-between`}>
          <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>Property Details</h2>
          <button
            onClick={onClose}
            className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'} rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors`}
          >
            <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {property.imageUrls && property.imageUrls.length > 0 && (
          <div className="relative">
            <div className={`${isMobile ? 'h-48' : 'h-96'} overflow-hidden`}>
              <img
                src={property.imageUrls[currentImageIndex]}
                alt={`${property.title} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            {property.imageUrls.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : property.imageUrls.length - 1))
                  }
                  className={`absolute ${isMobile ? 'left-2' : 'left-4'} top-1/2 -translate-y-1/2 ${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors`}
                >
                  <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentImageIndex(prev => (prev + 1) % property.imageUrls.length)}
                  className={`absolute ${isMobile ? 'right-2' : 'right-4'} top-1/2 -translate-y-1/2 ${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors`}
                >
                  <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            {property.imageUrls.length > 1 && (
              <div
                className={`absolute ${isMobile ? 'bottom-2' : 'bottom-4'} left-1/2 -translate-x-1/2 flex gap-1 md:gap-2 bg-black/50 rounded-lg ${isMobile ? 'p-1' : 'p-2'}`}
              >
                {property.imageUrls.slice(0, isMobile ? 4 : 8).map((img: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} rounded overflow-hidden border-2 transition-all ${index === currentImageIndex ? 'border-white' : 'border-transparent'}`}
                  >
                    <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={isMobile ? 'p-4' : 'p-6'}>
          <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 mb-2`}>{property.title}</h3>
          <p className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-[#E65D24] mb-4`}>
            {cleanPrice(property.price)}
          </p>
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} ${isMobile ? 'gap-3' : 'gap-4'} mb-6`}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-gray-600">{property.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
              </svg>
              <span className="text-gray-600">{property.bedrooms} bedrooms</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-gray-600">{property.propertyType}</span>
            </div>
            {property.source && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
                </svg>
                <span className="text-gray-600">Source: {property.source}</span>
              </div>
            )}
          </div>

          <div className="mb-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
              Available
            </span>
          </div>

          <div className={`border-t border-gray-200 ${isMobile ? 'pt-4 mb-4' : 'pt-6 mb-6'}`}>
            <h4 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 ${isMobile ? 'mb-2' : 'mb-3'}`}>
              Description
            </h4>
            <p className={`text-gray-700 leading-relaxed ${isMobile ? 'text-sm' : ''}`}>
              {property.description || 'No description provided for this property.'}
            </p>
          </div>

          {property.agent && (
            <div className={`border-t border-gray-200 ${isMobile ? 'pt-4' : 'pt-6'}`}>
              <h4 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 ${isMobile ? 'mb-2' : 'mb-3'}`}>
                Listed By
              </h4>
              <div className={`bg-gray-50 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
                <p className={`${isMobile ? 'text-sm' : ''} font-medium text-gray-900`}>
                  {property.agent.name || 'Estate Agent'}
                </p>
                {property.agent.company && (
                  <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} mt-1`}>{property.agent.company}</p>
                )}
                {property.agent.email && (
                  <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} mt-1`}>{property.agent.email}</p>
                )}
                {property.agent.phone && (
                  <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} mt-1`}>
                    Phone: {property.agent.phone}
                  </p>
                )}
                <div className={isMobile ? 'mt-1' : 'mt-2'}>
                  {property.agent.website && (
                    <a
                      href={property.agent.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-[#E65D24] hover:underline ${isMobile ? 'text-xs' : ''}`}
                    >
                      View Agency Website
                    </a>
                  )}
                </div>
                <div className={`${isMobile ? 'mt-3 flex-col' : 'mt-4 flex'} items-center ${isMobile ? 'gap-2' : 'gap-3'}`}>
                  <button className={`${isMobile ? 'w-full' : 'px-4'} py-2 bg-[#E65D24] text-white rounded-lg ${isMobile ? 'text-sm' : ''}`}>
                    Chat
                  </button>
                  <button className={`${isMobile ? 'w-full' : 'px-4'} py-2 bg-green-600 text-white rounded-lg ${isMobile ? 'text-sm' : ''}`}>
                    Call
                  </button>
                  <button className={`${isMobile ? 'w-full' : 'px-4'} py-2 bg-white border border-gray-300 text-gray-700 rounded-lg ${isMobile ? 'text-sm' : ''}`}>
                    Message
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedPropertyDetailsModal;
