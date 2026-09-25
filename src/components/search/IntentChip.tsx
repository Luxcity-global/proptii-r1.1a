import React from 'react';
import type { FilterSource } from '../../types/filter';

interface IntentChipProps {
  label: string;
  /** The filter key this chip represents, e.g. 'bedrooms', 'maxPrice', 'isPetFriendly' */
  filterKey: string;
  source: FilterSource;
  /** Called when the user clicks the promote button (AI chip → hard constraint) */
  onPromote?: (key: string) => void;
  /** Called when the user dismisses/removes this chip */
  onDismiss?: (key: string) => void;
  /** Optional icon to display before the label */
  icon?: React.ReactNode;
}

/**
 * IntentChip — displays a single filter constraint.
 *
 * Visual distinction:
 *   - 'user' / 'url' source → solid filled chip (hard constraint, currently active)
 *   - 'ai' source           → dashed/outlined chip (AI-extracted soft signal)
 *
 * Behaviour:
 *   - AI chip: clicking the label promotes it to a hard user constraint.
 *   - AI chip: dismiss (×) removes the signal entirely from the filter state.
 *   - User/url chip: dismiss removes the filter.
 */
export function IntentChip({
  label,
  filterKey,
  source,
  onPromote,
  onDismiss,
  icon,
}: IntentChipProps) {
  const isAi = source === 'ai';

  if (isAi) {
    return (
      <span
        title="AI detected from your search — click to apply as a strict filter"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 10px',
          borderRadius: '999px',
          border: '1.5px dashed #136C9E',
          color: '#136C9E',
          fontSize: '0.78rem',
          fontWeight: 500,
          background: 'rgba(19,108,158,0.06)',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'background 0.15s, color 0.15s',
          whiteSpace: 'nowrap',
        }}
        onClick={() => onPromote?.(filterKey)}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(19,108,158,0.14)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(19,108,158,0.06)';
        }}
      >
        {/* AI sparkle icon */}
        <svg
          width="11"
          height="11"
          viewBox="0 0 16 16"
          fill="none"
          style={{ opacity: 0.7, flexShrink: 0 }}
        >
          <path
            d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5z"
            fill="#136C9E"
          />
        </svg>
        {icon}
        {label}
        {onDismiss && (
          <button
            aria-label={`Remove ${label} filter`}
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(filterKey);
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#136C9E',
              padding: '0 0 0 2px',
              lineHeight: 1,
              fontSize: '0.9rem',
              opacity: 0.6,
            }}
          >
            ×
          </button>
        )}
      </span>
    );
  }

  // 'user' or 'url' source — solid chip (hard constraint)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 10px',
        borderRadius: '999px',
        border: '1.5px solid #136C9E',
        color: '#fff',
        fontSize: '0.78rem',
        fontWeight: 500,
        background: '#136C9E',
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {label}
      {onDismiss && (
        <button
          aria-label={`Remove ${label} filter`}
          onClick={() => onDismiss(filterKey)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#fff',
            padding: '0 0 0 2px',
            lineHeight: 1,
            fontSize: '0.9rem',
            opacity: 0.7,
          }}
        >
          ×
        </button>
      )}
    </span>
  );
}

export default IntentChip;
