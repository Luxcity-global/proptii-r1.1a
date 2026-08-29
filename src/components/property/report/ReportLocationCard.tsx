import React, { useEffect, useState } from 'react';
import { resolveMapQuery } from '../../../utils/mapsEmbed';
import { ReportDataSource } from './ReportDataSource';
import { ReportLocationMap, type ReportMapStatus } from './ReportLocationMap';

interface ReportLocationCardProps {
  embedQuery?: string | null;
  addressLabel: string;
}

/**
 * Approximate Location block — map slot is shown only when a map can be generated.
 */
export const ReportLocationCard: React.FC<ReportLocationCardProps> = ({
  embedQuery,
  addressLabel,
}) => {
  const query = resolveMapQuery(embedQuery, addressLabel);
  const hasQuery = Boolean(query);
  const [mapStatus, setMapStatus] = useState<ReportMapStatus>(hasQuery ? 'loading' : 'failed');

  useEffect(() => {
    setMapStatus(hasQuery ? 'loading' : 'failed');
  }, [query, hasQuery]);

  const showMapArea = hasQuery && mapStatus !== 'failed';

  return (
    <section
      id="approximate-location"
      aria-labelledby="approximate-location-title"
      className="rounded-xl border border-rule bg-paper p-5 sm:p-7"
      data-testid="report-location-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2
          id="approximate-location-title"
          className="font-display text-[17px] font-semibold tracking-[-0.01em] text-brand-blue sm:text-[19px]"
        >
          Approximate Location
        </h2>
        <span className="inline-flex items-center border border-brand-blue/25 bg-brand-blue-light px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-brand-blue">
          Postcode centroid, not exact plot
        </span>
      </div>

      {showMapArea ? (
        <div className="mt-4 overflow-hidden rounded-lg border border-rule print:hidden">
          <ReportLocationMap query={query} onStatusChange={setMapStatus} />
        </div>
      ) : null}

      {addressLabel && showMapArea ? (
        <p className="mt-4 hidden text-[14px] leading-relaxed text-ink-muted print:block">
          {addressLabel} — postcode centroid, not the exact plot.
        </p>
      ) : null}

      {!showMapArea ? (
        <ReportDataSource source="pending — map not available for this address" pending />
      ) : null}
    </section>
  );
};
