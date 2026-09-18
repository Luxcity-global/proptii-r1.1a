import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapPin,
  BedDouble,
  Home,
  Key,
  Tag,
  PawPrint,
  Zap,
  Trees,
  Train,
  Car,
  Dumbbell,
  Bell,
  X,
} from 'lucide-react';
import type { ClassifyEntities } from '../../types/govData';

export interface FilterPill {
  key: string;
  label: string;
  iconName?:
    | 'location'
    | 'bedrooms'
    | 'propertyType'
    | 'tenure'
    | 'price'
    | 'pet'
    | 'bills'
    | 'garden'
    | 'station'
    | 'parking'
    | 'gym'
    | 'concierge';
}

const VISIBLE_PILL_LIMIT = 3;
const PILL_BLUE = '#136C9E';
const PILL_BORDER = '#0E5A84';

export function entitiesToPills(entities: ClassifyEntities | null | undefined): FilterPill[] {
  if (!entities) return [];

  const pills: FilterPill[] = [];

  if (entities.location) {
    pills.push({ key: 'location', label: entities.location, iconName: 'location' });
  }
  if (entities.address_full) {
    pills.push({ key: 'address', label: entities.address_full, iconName: 'location' });
  }
  if (entities.bedrooms !== null && entities.bedrooms !== undefined) {
    pills.push({
      key: 'bedrooms',
      label: entities.bedrooms === 0 ? 'Studio' : `${entities.bedrooms} bed`,
      iconName: 'bedrooms',
    });
  }
  if (entities.propertyType || entities.property_type) {
    const pt = entities.propertyType || entities.property_type;
    pills.push({
      key: 'propertyType',
      label: String(pt).charAt(0).toUpperCase() + String(pt).slice(1),
      iconName: 'propertyType',
    });
  }
  if (entities.tenure) {
    pills.push({
      key: 'tenure',
      label: entities.tenure === 'rent' ? 'To rent' : 'To buy',
      iconName: 'tenure',
    });
  }
  if (entities.price_max != null) {
    pills.push({
      key: 'price_max',
      label: `Up to £${Number(entities.price_max).toLocaleString('en-GB')}`,
      iconName: 'price',
    });
  } else if (entities.maxPrice != null) {
    pills.push({
      key: 'price_max',
      label: `Up to £${Number(entities.maxPrice).toLocaleString('en-GB')}`,
      iconName: 'price',
    });
  }
  if (entities.minPrice != null || entities.price_min != null) {
    const minP = entities.minPrice ?? entities.price_min;
    pills.push({
      key: 'price_min',
      label: `From £${Number(minP).toLocaleString('en-GB')}`,
      iconName: 'price',
    });
  }
  if (entities.radius_hint) {
    pills.push({ key: 'radius', label: entities.radius_hint });
  }

  // Amenities
  const rawAmenities = new Set<string>();
  if (Array.isArray(entities.amenities)) {
    entities.amenities.forEach((a) => rawAmenities.add(a.toLowerCase()));
  }
  if (entities.pet_friendly === true || (entities as any).pet_friendly === 'true') {
    rawAmenities.add('pet_friendly');
  }
  if (entities.bills_included === true || (entities as any).bills_included === 'true') {
    rawAmenities.add('bills_included');
  }
  if (entities.balcony_or_garden === true) {
    rawAmenities.add('balcony_or_garden');
  }
  if (entities.parking === true) {
    rawAmenities.add('parking');
  }

  if (rawAmenities.has('pet_friendly')) {
    pills.push({ key: 'amenity_pets', label: 'Pet Friendly', iconName: 'pet' });
  }
  if (rawAmenities.has('bills_included')) {
    pills.push({ key: 'amenity_bills', label: 'Bills Included', iconName: 'bills' });
  }
  if (rawAmenities.has('balcony_or_garden') || rawAmenities.has('garden') || rawAmenities.has('balcony')) {
    pills.push({ key: 'amenity_garden', label: 'Balcony / Garden', iconName: 'garden' });
  }
  if (rawAmenities.has('near_station')) {
    pills.push({ key: 'amenity_station', label: 'Near Station', iconName: 'station' });
  }
  if (rawAmenities.has('parking')) {
    pills.push({ key: 'amenity_parking', label: 'Parking', iconName: 'parking' });
  }
  if (rawAmenities.has('gym')) {
    pills.push({ key: 'amenity_gym', label: 'Gym', iconName: 'gym' });
  }
  if (rawAmenities.has('concierge')) {
    pills.push({ key: 'amenity_concierge', label: 'Concierge', iconName: 'concierge' });
  }

  return pills;
}

const renderPillIcon = (iconName?: string) => {
  switch (iconName) {
    case 'location':
      return <MapPin className="w-3.5 h-3.5 opacity-90 shrink-0" aria-hidden />;
    case 'bedrooms':
      return <BedDouble className="w-3.5 h-3.5 opacity-90 shrink-0" aria-hidden />;
    case 'propertyType':
      return <Home className="w-3.5 h-3.5 opacity-90 shrink-0" aria-hidden />;
    case 'tenure':
      return <Key className="w-3.5 h-3.5 opacity-90 shrink-0" aria-hidden />;
    case 'price':
      return <Tag className="w-3.5 h-3.5 opacity-90 shrink-0" aria-hidden />;
    case 'pet':
      return <PawPrint className="w-3.5 h-3.5 opacity-90 shrink-0" aria-hidden />;
    case 'bills':
      return <Zap className="w-3.5 h-3.5 opacity-90 shrink-0" aria-hidden />;
    case 'garden':
      return <Trees className="w-3.5 h-3.5 opacity-90 shrink-0" aria-hidden />;
    case 'station':
      return <Train className="w-3.5 h-3.5 opacity-90 shrink-0" aria-hidden />;
    case 'parking':
      return <Car className="w-3.5 h-3.5 opacity-90 shrink-0" aria-hidden />;
    case 'gym':
      return <Dumbbell className="w-3.5 h-3.5 opacity-90 shrink-0" aria-hidden />;
    case 'concierge':
      return <Bell className="w-3.5 h-3.5 opacity-90 shrink-0" aria-hidden />;
    default:
      return null;
  }
};

interface FilterPillsProps {
  entities: ClassifyEntities | null | undefined;
  isClassifying?: boolean;
  className?: string;
  /** Lighter styling for dark hero backgrounds (in-flight label contrast) */
  onDark?: boolean;
}

function pillShellClass(extra = '') {
  return `inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-white text-xs sm:text-sm font-medium shadow-md border backdrop-blur-md transition-all search-filter-pill ${extra}`;
}

const pillShellStyle: React.CSSProperties = {
  backgroundColor: PILL_BLUE,
  borderColor: PILL_BORDER,
};

export const FilterPills: React.FC<FilterPillsProps> = ({
  entities,
  isClassifying = false,
  className = '',
  onDark = false,
}) => {
  const pills = useMemo(() => entitiesToPills(entities), [entities]);
  const pillKeySignature = useMemo(() => pills.map((p) => p.key).join('|'), [pills]);

  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  // Reset local-only dismissals when classifier entities change
  useEffect(() => {
    setDismissedKeys(new Set());
    setOverflowOpen(false);
  }, [pillKeySignature]);

  useEffect(() => {
    if (!overflowOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(event.target as Node)) {
        setOverflowOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOverflowOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [overflowOpen]);

  const visiblePills = useMemo(
    () => pills.filter((pill) => !dismissedKeys.has(pill.key)),
    [pills, dismissedKeys]
  );

  const primaryPills = visiblePills.slice(0, VISIBLE_PILL_LIMIT);
  const overflowPills = visiblePills.slice(VISIBLE_PILL_LIMIT);

  const dismissPill = (key: string) => {
    setDismissedKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  if (!isClassifying && visiblePills.length === 0) {
    return null;
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${className}`}
      aria-live="polite"
      data-testid="filter-pills"
    >
      {isClassifying && primaryPills.length === 0 && (
        <span
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium tracking-wide shadow-sm border backdrop-blur-md transition-all ${
            onDark
              ? 'bg-white/20 border-white/40 text-white'
              : 'bg-brand-navy/10 border-brand-navy/20 text-brand-navy'
          }`}
          data-testid="filter-pills-inflight"
        >
          <span className="flex items-center gap-1" aria-hidden>
            <span className="w-1.5 h-1.5 rounded-full bg-[#E65D24] animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#E65D24] animate-pulse delay-100" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#E65D24] animate-pulse delay-200" />
          </span>
          <span className="font-mono tracking-wide">understanding your search</span>
        </span>
      )}

      {primaryPills.map((pill) => (
        <span
          key={pill.key}
          className={pillShellClass()}
          style={pillShellStyle}
          data-testid={`filter-pill-${pill.key}`}
        >
          {renderPillIcon(pill.iconName)}
          <span>{pill.label}</span>
          <button
            type="button"
            aria-label={`Hide ${pill.label} filter`}
            onClick={() => dismissPill(pill.key)}
            className="text-white/70 hover:text-white ml-0.5 p-0.5 rounded-full hover:bg-white/20 transition-colors inline-flex items-center justify-center"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      {overflowPills.length > 0 && (
        <div className="relative" ref={overflowRef} data-testid="filter-pills-overflow">
          <button
            type="button"
            aria-expanded={overflowOpen}
            aria-haspopup="listbox"
            onClick={() => setOverflowOpen((open) => !open)}
            className={pillShellClass('font-medium gap-1')}
            style={pillShellStyle}
          >
            <span>+{overflowPills.length} more</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                overflowOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {overflowOpen && (
            <div
              className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-60 rounded-2xl shadow-2xl border p-2 z-50 text-left"
              style={{ backgroundColor: PILL_BLUE, borderColor: PILL_BORDER }}
              role="listbox"
              aria-label="Additional filters"
              data-testid="filter-pills-overflow-menu"
            >
              <div className="px-3 py-1.5 text-[11px] font-bold text-white/60 uppercase tracking-wider border-b border-white/10 mb-1">
                Additional Filters
              </div>
              <div className="space-y-1 text-sm">
                {overflowPills.map((pill) => (
                  <div
                    key={pill.key}
                    className="flex items-center justify-between px-3 py-1.5 rounded-xl text-white hover:bg-white/10 transition-colors"
                    role="option"
                    aria-selected={false}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {renderPillIcon(pill.iconName)}
                      <span className="truncate">{pill.label}</span>
                    </div>
                    <button
                      type="button"
                      aria-label={`Hide ${pill.label} filter`}
                      onClick={() => dismissPill(pill.key)}
                      className="text-white/70 hover:text-red-300 ml-2 p-0.5 rounded hover:bg-white/10 inline-flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
