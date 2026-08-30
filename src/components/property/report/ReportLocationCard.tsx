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
      className="space-y-2 pt-2"
      data-testid="report-location-card"
    >
      <div className="flex items-center justify-between text-[11px] font-normal text-slate-600 uppercase tracking-wider font-archivo px-1">
        <h2 id="approximate-location-title" className="font-normal">
          Approximate Location
        </h2>
        <span>Postcode centroid: 100m resolution</span>
      </div>

      {showMapArea ? (
        <div className="relative w-full rounded-2xl border border-gray-200 bg-slate-100 overflow-hidden shadow-inner">
          <ReportLocationMap query={query} onStatusChange={setMapStatus} />
        </div>
      ) : null}

      {addressLabel && showMapArea ? (
        <p className="text-[11px] text-slate-500 leading-normal px-1 font-normal">
          {addressLabel} — postcode centroid, not the exact plot.
        </p>
      ) : null}

      {!showMapArea ? (
        <ReportDataSource source="pending — map not available for this address" pending />
      ) : null}
    </section>
  );
};
