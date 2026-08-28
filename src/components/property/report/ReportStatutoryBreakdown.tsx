import React from 'react';
import type { RenterReportContent } from '../../../types/govData';
import { ReportDataSource } from './ReportDataSource';
import { ReportPendingSection } from './ReportPendingSection';
import { ReportStatusChip } from './ReportStatusChip';

interface ReportStatutoryBreakdownProps {
  renter: RenterReportContent;
  listingPrice?: string;
}

function EmphasisedBody({ text }: { text: string }) {
  const parts = text.split(/(Band [A-G] \(\d+\)|~£[\d.]+\/mo)/g);
  return (
    <p className="text-[15px] leading-[1.7] text-ink sm:text-[16px]">
      {parts.map((part, index) => {
        if (/^Band [A-G] \(\d+\)$/.test(part)) {
          return (
            <span key={index} className="font-mono font-medium text-brand-blue">
              {part}
            </span>
          );
        }
        if (/^~£[\d.]+\/mo$/.test(part)) {
          return (
            <span key={index} className="font-mono font-medium text-brand-navy">
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
}) => {
  const partARows = renter.partARows.map((row) =>
    row.label === 'Price / Rent' && listingPrice?.trim()
      ? { ...row, value: listingPrice.trim() }
      : row,
  );

  return (
    <section id="full-report-breakdown" aria-labelledby="full-report-breakdown-title">
      <div className="border-b-2 border-brand-navy/20 pb-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand-blue">
          Statutory record · Parts A–C
        </p>
        <h2
          id="full-report-breakdown-title"
          className="mt-2 font-display text-[24px] font-bold tracking-[-0.02em] text-brand-blue sm:text-[30px]"
        >
          Full Report Breakdown
        </h2>
      </div>

      <ol className="mt-8 space-y-5">
        <li>
          <article
            id="part-a"
            aria-labelledby="part-a-title"
            className="rounded-xl border border-rule bg-paper p-5 sm:p-7"
          >
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand-blue">
                  Part A
                </p>
                <h3
                  id="part-a-title"
                  className="mt-1.5 font-display text-[19px] font-semibold leading-tight tracking-[-0.015em] text-brand-navy sm:text-[22px]"
                >
                  {renter.partATitle}
                </h3>
              </div>
              <ReportStatusChip label="Recorded" tone="resolved" />
            </div>

            <div className="mt-5">
              <dl className="divide-y divide-rule border-y border-rule">
                {partARows.map((row) => (
                  <div
                    key={row.label}
                    className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                  >
                    <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
                      {row.label}
                    </dt>
                    <dd className="font-mono text-[15px] font-medium text-brand-navy sm:text-right sm:text-[16px]">
                      {row.value}
                      {row.qualifier && (
                        <span className="ml-2 font-sans text-[12px] font-normal italic text-ink-muted">
                          ({row.qualifier})
                        </span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-[13px] leading-relaxed text-ink-muted">{renter.partANote}</p>
              <ReportDataSource source={renter.partASource} />
            </div>
          </article>
        </li>

        <li>
          <article
            id="part-b"
            aria-labelledby="part-b-title"
            className="rounded-xl border border-rule bg-paper p-5 sm:p-7"
          >
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand-blue">
                  Part B
                </p>
                <h3
                  id="part-b-title"
                  className="mt-1.5 font-display text-[19px] font-semibold leading-tight tracking-[-0.015em] text-brand-navy sm:text-[22px]"
                >
                  {renter.partBTitle}
                </h3>
              </div>
              <ReportStatusChip label="Recorded" tone="resolved" />
            </div>
            <div className="mt-5">
              <EmphasisedBody text={renter.partBBody} />
              <ReportDataSource source={renter.partBSource} />
            </div>
          </article>
        </li>
      </ol>

      <div className="mt-5">
        <ReportPendingSection
          id="part-c"
          kicker="Part C"
          title={renter.partCTitle}
          statusLabel={renter.partCStatus}
          body={renter.partCBody}
          testId="report-part-c-pending"
        />
      </div>
    </section>
  );
};
