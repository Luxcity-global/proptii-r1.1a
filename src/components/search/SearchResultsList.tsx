import React, { useState } from 'react';
import type { Property } from '../../hooks/useSearchBackend';
import type { FactFlag } from '../../types/govData';
import { cleanPropertyPrice } from './PropertyDetailsModal';
import { getPropertyDisplayTitle } from '../../utils/propertyDisplay';
import { getPropertyDateInfo } from '../../utils/propertyDates';
import { getKeyFeatureBadges } from '../../utils/propertyFeatures';
import { FactsBadgeRow } from '../property/FactsBadgeRow';

export const PropertySkeleton = () => (
  <div className="sr-skel" aria-hidden>
    <div className="sr-skel-img" />
    <div className="sr-skel-body">
      <div className="sr-skel-line" style={{ width: '40%', height: 20 }} />
      <div className="sr-skel-line" style={{ width: '75%' }} />
      <div className="sr-skel-line" style={{ width: '55%' }} />
    </div>
  </div>
);

export interface PropertyCardProps {
  property: Property;
  onClick: () => void;
  isSaved: boolean;
  onToggleSave: (e: React.MouseEvent) => void;
  factFlags?: FactFlag[] | null;
  factsLoading?: boolean;
  factsUnresolved?: boolean;
  reportHint?: string | null;
  reserveHintSlot?: boolean;
  isHighlighted?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onClick,
  isSaved,
  onToggleSave,
  factFlags,
  factsLoading,
  factsUnresolved,
  reportHint,
  reserveHintSlot,
  isHighlighted,
}) => {
  const [imgError, setImgError] = useState(false);

  const placeholderImage =
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800';
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
  const dateInfo = getPropertyDateInfo(property);
  const { visibleFeatures, overflowCount } = getKeyFeatureBadges(property, 3);

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

  const bathroomCount =
    property.bathroom_count ??
    (property.bathrooms !== undefined && property.bathrooms !== null && property.bathrooms !== ''
      ? Number(property.bathrooms)
      : undefined);
  const sqFt =
    property.sq_ft ??
    (property.squareFootage ? String(property.squareFootage).replace(/[^0-9]/g, '') : undefined);

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
          <span
            className={`sr-badge ${dateInfo.badgeVariant}`}
            title={dateInfo.modifiedLabel || dateInfo.publishedLabel}
          >
            {dateInfo.badgeText}
          </span>
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
          <button type="button" onClick={handleShare} aria-label="Share property">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
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
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 9V19M22 9v10M2 14h20M7 9V7a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2" />
            </svg>
            {property.bedrooms === 0 ? 'Studio' : property.bedrooms ? `${property.bedrooms} beds` : '— beds'}
          </span>
          {bathroomCount !== undefined && !isNaN(bathroomCount) && bathroomCount > 0 ? (
            <span>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12h16v4a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-4z" />
                <path d="M6 12V5a2 2 0 0 1 2-2h1" />
              </svg>
              {bathroomCount} bath{Number(bathroomCount) === 1 ? '' : 's'}
            </span>
          ) : null}
          {sqFt && Number(sqFt) > 0 ? (
            <span>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="1" />
              </svg>
              {Number(sqFt).toLocaleString('en-GB')} ft²
            </span>
          ) : null}
        </div>

        {visibleFeatures.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {visibleFeatures.map((feat) => {
              const IconComponent = feat.Icon;
              return (
                <span
                  key={feat.id}
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-2xs ${feat.badgeClass}`}
                >
                  <IconComponent className={`w-3 h-3 ${feat.iconColorClass}`} aria-hidden />
                  <span>{feat.label}</span>
                </span>
              );
            })}
            {overflowCount > 0 && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200/80"
                title={`${overflowCount} more feature${overflowCount === 1 ? '' : 's'} available`}
              >
                +{overflowCount} more
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

interface SearchResultsListProps {
  properties: Property[];
  selectedProperty: Property | null;
  onSelectProperty: (property: Property) => void;
  isPropertySaved: (propertyId: string) => boolean;
  onToggleSave: (property: Property, e: React.MouseEvent) => void;
  govDataEnabled: boolean;
  getFlagsFor?: (property: Property) => FactFlag[] | null;
  isFactsLoading?: boolean;
  isUnresolved?: (property: Property) => boolean;
  getHintFor?: (property: Property) => string | null;
  isLoading?: boolean;
}

export const SearchResultsList: React.FC<SearchResultsListProps> = ({
  properties,
  selectedProperty,
  onSelectProperty,
  isPropertySaved,
  onToggleSave,
  govDataEnabled,
  getFlagsFor,
  isFactsLoading,
  isUnresolved,
  getHintFor,
  isLoading,
}) => {
  return (
    <div className="sr-grid">
      {properties.map((property, index) => {
        const propertyId = `${property.title}-${property.location}-${property.price}`;
        const isSaved = isPropertySaved(propertyId);
        const isHighlighted = Boolean(
          selectedProperty &&
            selectedProperty.title === property.title &&
            selectedProperty.location === property.location &&
            selectedProperty.price === property.price
        );

        return (
          <PropertyCard
            key={index}
            property={property}
            onClick={() => onSelectProperty(property)}
            isSaved={isSaved}
            onToggleSave={(e) => onToggleSave(property, e)}
            factFlags={govDataEnabled && getFlagsFor ? getFlagsFor(property) : undefined}
            factsLoading={govDataEnabled && isFactsLoading}
            factsUnresolved={govDataEnabled && isUnresolved ? isUnresolved(property) : undefined}
            reserveHintSlot={govDataEnabled}
            reportHint={govDataEnabled && getHintFor ? getHintFor(property) : null}
            isHighlighted={isHighlighted}
          />
        );
      })}
      {isLoading && [1, 2, 3].map((i) => <PropertySkeleton key={`skeleton-grid-${i}`} />)}
    </div>
  );
};
