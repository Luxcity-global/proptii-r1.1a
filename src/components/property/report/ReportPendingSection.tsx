import React from 'react';
import { ReportStatusChip } from './ReportStatusChip';

interface ReportPendingSectionProps {
  id?: string;
  kicker: string;
  title: string;
  statusLabel: string;
  body?: string;
  testId?: string;
  className?: string;
}

/** Collapsed “coming later” panel — body expands in PDF via reportPdfExport. */
export const ReportPendingSection: React.FC<ReportPendingSectionProps> = ({
  id,
  kicker,
  title,
  statusLabel,
  body,
  testId,
  className,
}) => (
  <section
    id={id}
    aria-labelledby={id ? `${id}-title` : undefined}
    tabIndex={0}
    className={`group p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4${className ? ` ${className}` : ''}`}
    data-testid={testId}
  >
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 pb-2 border-b border-gray-100">
      <div className="min-w-0">
        <p className="text-[13px] font-normal uppercase tracking-wider text-[#136C9E] font-archivo">
          {kicker}
        </p>
        <h3
          id={id ? `${id}-title` : undefined}
          className="mt-1 text-[15px] font-normal text-gray-900 font-archivo"
        >
          {title}
        </h3>
      </div>
      <ReportStatusChip label={statusLabel} tone="pending" />
    </div>
    {body ? (
      <p className="max-h-0 overflow-hidden text-[13px] leading-relaxed text-gray-600 opacity-0 transition-all duration-200 group-hover:mt-0 group-hover:max-h-40 group-hover:opacity-100 focus-within:mt-0 focus-within:max-h-40 focus-within:opacity-100 sm:text-[14px]">
        {body}
      </p>
    ) : null}
  </section>
);

export function parsePaidPendingCopy(copy: string): { title: string; statusLabel: string } {
  const match = copy.match(/^(.+?)\s*—\s*paid,\s*(.+)$/i);
  if (!match) {
    return { title: copy, statusLabel: 'Coming soon' };
  }
  const statusLabel = match[2].trim();
  return {
    title: match[1].trim(),
    statusLabel: statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1),
  };
}
