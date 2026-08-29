import React, { useState } from 'react';
import type { Audience } from '../../types/govData';
import { ChevronDown } from 'lucide-react';

const AUDIENCE_OPTIONS: { value: Audience; label: string }[] = [
  { value: 'tenant', label: 'Renter' },
  { value: 'buyer', label: 'Buyer' },
  { value: 'landlord', label: 'Landlord' },
  { value: 'agent', label: 'Agent' },
  { value: 'homeowner', label: 'Homeowner' },
];

interface AudienceToggleProps {
  value: Audience | null;
  onChange: (audience: Audience | null) => void;
  className?: string;
  onDark?: boolean;
}

export const AudienceToggle: React.FC<AudienceToggleProps> = ({
  value,
  onChange,
  className = '',
  onDark = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const selectedLabel =
    AUDIENCE_OPTIONS.find((o) => o.value === value)?.label ?? 'View as';

  return (
    <div className={`relative ${className}`} data-testid="audience-toggle">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
          onDark
            ? 'bg-white/10 text-white border-white/40 hover:bg-white/20'
            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
        }`}
      >
        <span>{selectedLabel}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {expanded && (
        <div
          className={`absolute z-20 mt-2 min-w-[10rem] rounded-xl border shadow-lg overflow-hidden ${
            onDark ? 'bg-[#1f2937] border-white/20' : 'bg-white border-gray-200'
          }`}
          role="listbox"
          aria-label="Audience"
        >
          <button
            type="button"
            role="option"
            aria-selected={value === null}
            className={`w-full text-left px-3 py-2 text-xs ${
              onDark ? 'text-white/80 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => {
              onChange(null);
              setExpanded(false);
            }}
          >
            Not set
          </button>
          {AUDIENCE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              className={`w-full text-left px-3 py-2 text-xs font-medium ${
                value === option.value
                  ? onDark
                    ? 'bg-white/15 text-white'
                    : 'bg-[#F15A22]/10 text-[#E65D24]'
                  : onDark
                    ? 'text-white hover:bg-white/10'
                    : 'text-gray-800 hover:bg-gray-50'
              }`}
              onClick={() => {
                onChange(option.value);
                setExpanded(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
