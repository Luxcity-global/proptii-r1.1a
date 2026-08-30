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
    className={`pt-3 border-t text-[11px] font-medium uppercase tracking-wider leading-relaxed ${
      pending
        ? 'border-dashed border-gray-200 text-gray-400'
        : 'border-gray-200 text-slate-700'
    }`}
  >
    <span className="mr-1">Source</span>
    <span className="min-w-0 break-words font-normal tracking-wide">{source}</span>
  </p>
);
