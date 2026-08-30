import React from 'react';
import { Lock } from 'lucide-react';
import type { RenterReportContent } from '../../../types/govData';
import { ReportStatusChip } from './ReportStatusChip';

interface ReportStatutoryBreakdownProps {
  renter: RenterReportContent;
  listingPrice?: string;
  paidCopy?: string;
}

function EmphasisedBody({ text }: { text: string }) {
  const parts = text.split(/(Band [A-G] \(\d+\)|~£[\d.]+\/mo)/g);
  return (
    <p className="text-[13px] sm:text-[15px] leading-relaxed text-gray-900 font-normal">
      {parts.map((part, index) => {
        if (/^Band [A-G] \(\d+\)$/.test(part)) {
          return (
            <span key={index} className="font-normal text-gray-900">
              {part}
            </span>
          );
        }
        if (/^~£[\d.]+\/mo$/.test(part)) {
          return (
            <span key={index} className="font-normal text-gray-900">
              {part}
            </span>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </p>
  );
}

export const ReportStatutoryBreakdown: React.FC<ReportStatutoryBreakdownProps> = ({
  renter,
  listingPrice,
  paidCopy,
}) => {
  const partARows = renter.partARows.map((row) =>
    row.label === 'Price / Rent' && listingPrice?.trim()
      ? { ...row, value: listingPrice.trim() }
      : row,
  );

  return (
    <section id="full-report-breakdown" aria-labelledby="full-report-breakdown-title" className="space-y-4">
      <div className="space-y-1 pt-4 border-t border-gray-200">
        <div className="text-[11px] font-normal text-slate-600 uppercase tracking-widest font-archivo">
          NTSELAT CPR 2008 • Parts A–C
        </div>
        <h2
          id="full-report-breakdown-title"
          className="text-[25px] sm:text-[31px] font-normal font-archivo text-gray-900"
        >
          Full Report Breakdown
        </h2>
      </div>

      <article
        id="part-a"
        aria-labelledby="part-a-title"
        className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 gap-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="text-[13px] font-normal uppercase tracking-wider text-[#136C9E] font-archivo">
              Part A
            </span>
            <h3
              id="part-a-title"
              className="text-[15px] font-normal text-gray-900 font-archivo"
            >
              {renter.partATitle}
            </h3>
          </div>
          <ReportStatusChip label="Required" tone="resolved" />
        </div>

        <div className="divide-y divide-gray-100 text-[13px] sm:text-[15px]">
          {partARows.map((row) => (
            <div key={row.label} className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-gray-500 font-normal">{row.label}</span>
              <span className="font-normal text-gray-900 text-right">
                {row.value}
                {row.qualifier && (
                  <span className="ml-1.5 text-[11px] text-gray-400 font-normal">
                    ({row.qualifier})
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between text-[11px] text-slate-600 gap-2 border-t border-gray-100 font-normal">
          <span>{renter.partANote}</span>
          <span className="font-medium uppercase tracking-wider text-slate-700">
            Source: {renter.partASource}
          </span>
        </div>
      </article>

      <article
        id="part-b"
        aria-labelledby="part-b-title"
        className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 gap-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="text-[13px] font-normal uppercase tracking-wider text-[#136C9E] font-archivo">
              Part B
            </span>
            <h3
              id="part-b-title"
              className="text-[15px] font-normal text-gray-900 font-archivo"
            >
              {renter.partBTitle}
            </h3>
          </div>
          <ReportStatusChip label="Required" tone="resolved" />
        </div>
        <EmphasisedBody text={renter.partBBody} />
        <div className="pt-2 flex justify-end text-[11px] text-slate-700 font-medium uppercase tracking-wider border-t border-gray-100">
          Source: {renter.partBSource}
        </div>
      </article>

      <article
        id="part-c"
        aria-labelledby="part-c-title"
        className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4"
        data-testid="report-part-c-pending"
      >
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 gap-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="text-[13px] font-normal uppercase tracking-wider text-[#136C9E] font-archivo">
              Part C
            </span>
            <h3
              id="part-c-title"
              className="text-[15px] font-normal text-gray-900 font-archivo"
            >
              {renter.partCTitle}
            </h3>
          </div>
          <ReportStatusChip label={renter.partCStatus} tone="pending" />
        </div>

        <div className="divide-y divide-gray-100 text-[13px] sm:text-[15px]">
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-gray-500 font-normal">Title Register</span>
            <span className="text-gray-400 font-mono font-normal">—</span>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-gray-500 font-normal">Covenant Text</span>
            <span className="text-gray-400 font-mono font-normal">—</span>
          </div>
        </div>

        {paidCopy ? (
          <div
            className="p-4 rounded-xl border-2 border-dashed border-gray-200 bg-slate-50/70 text-center flex items-center justify-center gap-2 text-[13px] font-normal text-gray-600"
            data-testid="report-paid-pending"
          >
            <Lock className="w-4 h-4 text-gray-500 shrink-0" aria-hidden />
            <span>{paidCopy}</span>
          </div>
        ) : null}

        <p className="text-[11px] text-slate-500 leading-normal pt-1 font-normal">
          {renter.partCBody}
        </p>
      </article>
    </section>
  );
};
