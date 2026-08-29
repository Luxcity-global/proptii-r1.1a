import React from 'react';
import type { ReportEntryTone } from '../../../types/govData';

interface ReportStatusChipProps {
  label: string;
  tone: ReportEntryTone;
}

const toneStyles: Record<ReportEntryTone, string> = {
  resolved: 'border-brand-blue/25 bg-brand-blue-light text-brand-blue',
  note: 'border-brand-blue/25 bg-brand-blue-light text-brand-blue',
  pending: 'report-pending-chip border border-stamp bg-stamp text-paper shadow-sm',
};

export const ReportStatusChip: React.FC<ReportStatusChipProps> = ({ label, tone }) => (
  <span
    className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${toneStyles[tone]}`}
  >
    {tone !== 'pending' && (
      <span aria-hidden="true" className="h-1.5 w-1.5 bg-brand-blue" />
    )}
    {label}
  </span>
);
