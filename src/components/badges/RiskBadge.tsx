import React, { useState } from 'react';
import { FlagState, AudienceLens, AUDIENCE_LENS_COPY, AUDIENCE_METADATA } from '../../data/audienceLensCopy';
import { CheckCircle2, AlertTriangle, HelpCircle, Loader2, FileQuestion, ArrowRight } from 'lucide-react';

export interface RiskBadgeProps {
  flagType?: 'restrictive_covenant' | 'epc_context';
  state?: FlagState;
  label?: string;
  sourceText?: string;
  isLoading?: boolean;
  isUnmatched?: boolean;
  audienceLens?: AudienceLens;
  size?: 'sm' | 'md' | 'lg';
  showDetailsOnClick?: boolean;
  onOpenReport?: (lens: AudienceLens) => void;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  flagType = 'restrictive_covenant',
  state = 'clear',
  label,
  sourceText,
  isLoading = false,
  isUnmatched = false,
  audienceLens = 'tenant',
  size = 'md',
  showDetailsOnClick = true,
  onOpenReport,
  className = '',
}) => {
  const [showPopover, setShowPopover] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/90 text-slate-600 border border-slate-200 text-xs font-medium animate-pulse ${className}`}
        title="Checking government registers..."
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#136C9E]" />
        <span>Verifying registers...</span>
      </div>
    );
  }

  // Unmatched state
  if (isUnmatched) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 border border-stone-300 text-xs font-medium ${className}`}
        title="Property address could not be matched to HM Land Registry or EPC UPRN"
      >
        <FileQuestion className="w-3.5 h-3.5 text-stone-500" />
        <span>Unmatched to Title — Not checked</span>
      </div>
    );
  }

  // Audience lens copy
  const flagCopy = AUDIENCE_LENS_COPY[flagType]?.[audienceLens]?.[state];
  const displayLabel =
    label ||
    (flagType === 'restrictive_covenant'
      ? state === 'clear'
        ? 'Clear Title'
        : state === 'flagged'
        ? 'Covenants Noted'
        : 'Title Unverified'
      : state === 'clear'
      ? 'EPC Verified'
      : state === 'flagged'
      ? 'EPC Flagged'
      : 'EPC Unresolved');

  // Styles based on state (Strictly using official Lucide icons, no emojis)
  const stateStyles = {
    clear: {
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />,
      dotBg: 'bg-emerald-500',
      headerBg: 'bg-emerald-50 border-emerald-100 text-emerald-900',
      titleText: 'Verified Clear',
    },
    flagged: {
      badgeBg: 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />,
      dotBg: 'bg-amber-500',
      headerBg: 'bg-amber-50 border-amber-100 text-amber-900',
      titleText: 'Attention Needed',
    },
    unresolved: {
      badgeBg: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200',
      icon: <HelpCircle className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />,
      dotBg: 'bg-slate-500',
      headerBg: 'bg-slate-100 border-slate-200 text-slate-900',
      titleText: 'Unresolved — No Register Match',
    },
  }[state];

  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5',
    md: 'text-xs px-3 py-1',
    lg: 'text-sm px-3.5 py-1.5',
  }[size];

  return (
    <div className="relative inline-block font-nunito">
      <button
        type="button"
        onClick={(e) => {
          if (showDetailsOnClick) {
            e.stopPropagation();
            setShowPopover(!showPopover);
          }
        }}
        className={`inline-flex items-center gap-1.5 rounded-full border font-medium transition-all shadow-sm ${stateStyles.badgeBg} ${sizeClasses} ${className}`}
      >
        {stateStyles.icon}
        <span>{displayLabel}</span>
        {sourceText && (
          <span className="text-[10px] opacity-75 hidden sm:inline">({sourceText})</span>
        )}
      </button>

      {/* Popover explaining audience lens verdict & recommended steps */}
      {showPopover && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              e.stopPropagation();
              setShowPopover(false);
            }}
          />
          <div
            className="absolute left-0 bottom-full mb-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 p-4 text-left font-nunito animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900">
                  {flagType === 'restrictive_covenant' ? 'HM Land Registry Title' : 'EPC Register'}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#136C9E]">
                  {AUDIENCE_METADATA[audienceLens].label} Lens
                </span>
              </div>
              <button
                onClick={() => setShowPopover(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1"
                aria-label="Close popover"
              >
                ✕
              </button>
            </div>

            <div className="mt-3">
              <div className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-2 mb-2.5 ${stateStyles.headerBg}`}>
                <span className={`w-2 h-2 rounded-full ${stateStyles.dotBg}`} />
                <span>{stateStyles.titleText}</span>
              </div>

              <p className="text-xs text-gray-700 leading-relaxed mb-3">
                {flagCopy?.verdict}
              </p>

              {flagCopy?.steps && flagCopy.steps.length > 0 && (
                <div className="space-y-1.5 bg-gray-50 p-2.5 rounded-xl border border-gray-100 mb-3">
                  <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">
                    Recommended Next Steps
                  </div>
                  {flagCopy.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[11px] text-gray-600">
                      <span className="text-[#F15A22] font-bold mt-0.5">•</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                <span className="text-gray-400">
                  {flagType === 'restrictive_covenant' ? 'HMLR refreshed this month' : 'EPC refreshed this month'}
                </span>
                {onOpenReport ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowPopover(false);
                      onOpenReport(audienceLens);
                    }}
                    className="text-[#136C9E] hover:text-[#0d4f74] font-bold flex items-center gap-1"
                  >
                    <span>Full Report</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ) : (
                  <a
                    href="/tools/know-your-rights"
                    className="text-[#136C9E] hover:underline font-bold"
                  >
                    Know Your Rights →
                  </a>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RiskBadge;
