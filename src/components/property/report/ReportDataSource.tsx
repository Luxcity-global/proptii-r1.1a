import React from 'react';

interface ReportDataSourceProps {
  source: string;
  pending?: boolean;
}

export const ReportDataSource: React.FC<ReportDataSourceProps> = ({
  source,
  pending = false,
}) => (
  <p
    className={`mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t pt-3 font-mono text-[11px] leading-relaxed ${
      pending ? 'border-dashed border-pending-line text-pending-text' : 'border-rule text-ink-muted'
    }`}
  >
    <span
      className={`text-[10px] uppercase tracking-[0.2em] ${pending ? 'text-pending-text' : 'text-brand-blue'}`}
    >
      Source
    </span>
    <span className="min-w-0 break-words">{source}</span>
  </p>
);
