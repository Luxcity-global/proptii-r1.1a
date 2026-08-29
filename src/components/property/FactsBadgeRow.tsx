import React from 'react';
import type { FactFlag, FlagState } from '../../types/govData';

const STATE_STYLES: Record<FlagState, string> = {
  clear: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  flagged: 'bg-amber-50 text-amber-900 border-amber-200',
  unresolved: 'bg-gray-100 text-gray-600 border-gray-200',
};

const STATE_LABEL: Record<FlagState, string> = {
  clear: 'Clear',
  flagged: 'Flagged',
  unresolved: 'Unresolved',
};

const LISTING_STYLES: Record<FlagState, string> = {
  clear: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  flagged: 'bg-amber-50 text-amber-700 border-amber-200',
  unresolved: 'bg-gray-50 text-gray-600 border-gray-200',
};

interface FactsBadgeRowProps {
  flags?: FactFlag[] | null;
  /** True while the batch request is in flight (distinct from scrape loading). */
  isLoading?: boolean;
  /**
   * When the listing is absent from the batch response, show an honest unresolved
   * row — never invent a "clear" visual.
   */
  unresolvedFallback?: boolean;
  className?: string;
  /** Handoff listing-card style: icon + label, no Clear/Flagged prefix */
  variant?: 'default' | 'listing';
}

export const FactsBadgeRow: React.FC<FactsBadgeRowProps> = ({
  flags,
  isLoading = false,
  unresolvedFallback = false,
  className = '',
  variant = 'default',
}) => {
  if (isLoading) {
    return (
      <div
        className={`flex flex-wrap gap-1.5 ${className}`}
        data-testid="facts-badge-loading"
        aria-busy="true"
      >
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-5 w-16 rounded-full bg-gray-100 animate-pulse border border-gray-100"
          />
        ))}
      </div>
    );
  }

  const displayFlags: FactFlag[] =
    flags && flags.length > 0
      ? flags
      : unresolvedFallback
        ? [{ id: 'unresolved', label: 'Gov data', state: 'unresolved' }]
        : [];

  if (displayFlags.length === 0) return null;

  if (variant === 'listing') {
    return (
      <div
        className={`flex flex-wrap items-center gap-2 ${className}`}
        data-testid="facts-badge-row"
        aria-label="Government data facts"
      >
        {displayFlags.slice(0, 3).map((flag) => (
          <span
            key={flag.id}
            title={flag.detail || `${flag.label}: ${STATE_LABEL[flag.state]}`}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${LISTING_STYLES[flag.state]}`}
          >
            <span aria-hidden>{flag.state === 'flagged' ? '⚠' : flag.state === 'clear' ? '✓' : '·'}</span>
            <span>{flag.label}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap gap-1.5 ${className}`}
      data-testid="facts-badge-row"
      aria-label="Government data facts"
    >
      {displayFlags.map((flag) => (
        <span
          key={flag.id}
          title={flag.detail || `${flag.label}: ${STATE_LABEL[flag.state]}`}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATE_STYLES[flag.state]}`}
        >
          <span className="opacity-70">{STATE_LABEL[flag.state]}</span>
          <span>{flag.label}</span>
        </span>
      ))}
    </div>
  );
};
