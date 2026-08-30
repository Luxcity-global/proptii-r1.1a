import React from 'react';
import type { ReportEntryTone } from '../../../types/govData';

interface ReportStatusChipProps {
  label: string;
  tone: ReportEntryTone;
}

const toneStyles: Record<ReportEntryTone, string> = {
  resolved: 'bg-blue-50 text-[#136C9E]',
  note: 'bg-amber-50 text-amber-700',
  pending: 'report-pending-chip bg-gray-100 text-gray-600',
};

export const ReportStatusChip: React.FC<ReportStatusChipProps> = ({ label, tone }) => (
  <span
    className={`inline-flex shrink-0 items-center px-2.5 py-0.5 rounded-full text-[11px] font-normal uppercase tracking-wide ${toneStyles[tone]}`}
  >
    {label}
  </span>
);
