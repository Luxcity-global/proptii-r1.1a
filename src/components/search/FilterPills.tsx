import React, { useMemo } from 'react';
import type { ClassifyEntities } from '../../types/govData';

export interface FilterPill {
  key: string;
  label: string;
}

export function entitiesToPills(entities: ClassifyEntities | null | undefined): FilterPill[] {
  if (!entities) return [];

  const pills: FilterPill[] = [];

  if (entities.location) {
    pills.push({ key: 'location', label: entities.location });
  }
  if (entities.address_full) {
    pills.push({ key: 'address', label: entities.address_full });
  }
  if (entities.bedrooms !== null && entities.bedrooms !== undefined) {
    pills.push({
      key: 'bedrooms',
      label: entities.bedrooms === 0 ? 'Studio' : `${entities.bedrooms} bed`,
    });
  }
  if (entities.tenure) {
    pills.push({
      key: 'tenure',
      label: entities.tenure === 'rent' ? 'To rent' : 'To buy',
    });
  }
  if (entities.price_max != null) {
    pills.push({
      key: 'price_max',
      label: `Up to £${entities.price_max.toLocaleString('en-GB')}`,
    });
  }
  if (entities.radius_hint) {
    pills.push({ key: 'radius', label: entities.radius_hint });
  }

  return pills;
}

interface FilterPillsProps {
  entities: ClassifyEntities | null | undefined;
  isClassifying?: boolean;
  className?: string;
  /** Lighter styling for dark hero backgrounds */
  onDark?: boolean;
}

export const FilterPills: React.FC<FilterPillsProps> = ({
  entities,
  isClassifying = false,
  className = '',
  onDark = false,
}) => {
  const pills = useMemo(() => entitiesToPills(entities), [entities]);

  if (!isClassifying && pills.length === 0) {
    return null;
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${className}`}
      aria-live="polite"
      data-testid="filter-pills"
    >
      {isClassifying && pills.length === 0 && (
        <span
          className={`text-xs font-medium ${onDark ? 'text-white/70' : 'text-gray-500'}`}
        >
          Understanding your search…
        </span>
      )}
      {pills.map((pill) => (
        <span
          key={pill.key}
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${
            onDark
              ? 'bg-white/15 text-white border-white/40'
              : 'bg-[#F15A22]/10 text-[#E65D24] border-[#E65D24]/25'
          }`}
        >
          {pill.label}
        </span>
      ))}
    </div>
  );
};
