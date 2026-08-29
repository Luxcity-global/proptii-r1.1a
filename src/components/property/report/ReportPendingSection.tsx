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

/** Collapsed “coming later” panel with a dancing orange status chip. */
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
    className={`group rounded-xl border border-dashed border-stamp bg-stamp/10 px-5 py-3.5 transition-[padding] duration-200 hover:py-5 focus-within:py-5 sm:px-6${className ? ` ${className}` : ''}`}
    data-testid={testId}
  >
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand-blue">{kicker}</p>
        <h3
          id={id ? `${id}-title` : undefined}
          className="mt-1 font-display text-[16px] font-semibold tracking-[-0.015em] text-brand-navy sm:text-[18px]"
        >
          {title}
        </h3>
      </div>
      <ReportStatusChip label={statusLabel} tone="pending" />
    </div>
    {body ? (
      <p className="max-h-0 overflow-hidden text-[13px] leading-relaxed text-ink-muted opacity-0 transition-all duration-200 group-hover:mt-2 group-hover:max-h-40 group-hover:opacity-100 focus-within:mt-2 focus-within:max-h-40 focus-within:opacity-100 sm:text-[14px]">
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
