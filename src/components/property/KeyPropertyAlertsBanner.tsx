import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface KeyPropertyAlertsBannerProps {
  description: string;
  title?: string;
  /** Property details module uses tighter padding + rounded-2xl; report modal uses rounded-3xl. */
  variant?: 'module' | 'report';
  className?: string;
}

/**
 * Alert verdict box — shared between ProptiiModule (property details) and ProptiiReportModal.
 */
export const KeyPropertyAlertsBanner: React.FC<KeyPropertyAlertsBannerProps> = ({
  description,
  title,
  variant = 'module',
  className = '',
}) => {
  const isReport = variant === 'report';
  const heading = title || (isReport ? 'What to watch' : 'Key Property Alerts & Restrictions Surfaced');

  return (
    <div
      className={`bg-[#FFFBEB] border border-amber-200/60 text-gray-900 transition-all shadow-sm ${
        isReport
          ? 'p-5 sm:p-6 rounded-3xl flex flex-col justify-center h-full'
          : 'p-4 rounded-2xl flex items-start'
      } ${className}`}
      data-testid="key-property-alerts-banner"
    >
      <div
        className={`flex items-start gap-3.5 ${isReport ? 'my-auto w-full' : 'w-full'}`}
      >
        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-[#D97706] flex-shrink-0 mt-0.5 shadow-sm">
          <AlertTriangle className="w-[18px] h-[18px] text-[#D97706]" strokeWidth={2.25} aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <h4
            className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#D97706] mb-0.5"
            style={{ fontFamily: 'Archivo, sans-serif' }}
          >
            {heading}
          </h4>
          <p className="text-[11px] sm:text-xs text-[#374957] leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};
