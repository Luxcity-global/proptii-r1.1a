import React, { useEffect, useState } from 'react';
import type { Audience, MatchStatus, PropertyFactsResponse } from '../../types/govData';
import { fetchPropertyFacts } from '../../services/govDataService';
import { FactsBadgeRow } from './FactsBadgeRow';
import { ReportPanel } from './ReportPanel';
import { trackEvent } from '../../utils/analytics';

const MATCH_COPY: Record<MatchStatus, string> = {
  exact: 'Exact title / UPRN match',
  partial: 'Partial match — some facts may be incomplete',
  none: 'No government match yet',
};

interface ProptiiModuleProps {
  listingId: string;
  uprn?: string | null;
  audience: Audience | null;
}

export const ProptiiModule: React.FC<ProptiiModuleProps> = ({
  listingId,
  uprn,
  audience,
}) => {
  const [facts, setFacts] = useState<PropertyFactsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const result = await fetchPropertyFacts(listingId, uprn);
      if (cancelled) return;
      setFacts(result);
      setLoading(false);
      trackEvent('gov_data_proptii_module', {
        listingId,
        match: result.match,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [listingId, uprn]);

  return (
    <div
      className="mt-6 rounded-xl border border-[#E65D24]/25 bg-[#FFF8F5] p-4"
      data-testid="proptii-module"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h4 className="text-base font-semibold text-gray-900">Proptii government data</h4>
          <p className="text-xs text-gray-600 mt-0.5">
            {loading
              ? 'Loading facts…'
              : facts
                ? MATCH_COPY[facts.match]
                : MATCH_COPY.none}
          </p>
        </div>
        {!showReport && (
          <button
            type="button"
            onClick={() => setShowReport(true)}
            className="shrink-0 rounded-lg bg-[#E65D24] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#D54A1A]"
          >
            Open report
          </button>
        )}
      </div>

      <FactsBadgeRow
        flags={facts?.flags}
        isLoading={loading}
        unresolvedFallback={!loading && (!facts || facts.match === 'none' || facts.flags.length === 0)}
      />

      {showReport && (
        <div className="mt-4">
          <ReportPanel
            listingId={listingId}
            initialAudience={audience}
            onClose={() => setShowReport(false)}
          />
        </div>
      )}
    </div>
  );
};
