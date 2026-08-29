import React, { useEffect, useRef, useState } from 'react';
import type { Audience, FactFlag, PropertyReportResponse, ReportLens } from '../../types/govData';
import { fetchPropertyLens, fetchPropertyReport } from '../../services/govDataService';
import { FactsBadgeRow } from './FactsBadgeRow';
import { AudienceToggle } from '../search/AudienceToggle';
import { trackEvent } from '../../utils/analytics';

interface ReportPanelProps {
  listingId: string;
  initialAudience: Audience | null;
  onClose?: () => void;
}

/**
 * Report + lens switch. Facts are loaded once; audience changes call lens only.
 */
export const ReportPanel: React.FC<ReportPanelProps> = ({
  listingId,
  initialAudience,
  onClose,
}) => {
  const [audience, setAudience] = useState<Audience | null>(initialAudience);
  const [facts, setFacts] = useState<FactFlag[] | null>(null);
  const [lens, setLens] = useState<ReportLens | null>(null);
  const [loadingReport, setLoadingReport] = useState(true);
  const [loadingLens, setLoadingLens] = useState(false);
  const factsFingerprintRef = useRef<string>('');

  useEffect(() => {
    let cancelled = false;
    setLoadingReport(true);

    void (async () => {
      const report: PropertyReportResponse = await fetchPropertyReport(listingId, audience);
      if (cancelled) return;
      setFacts(report.facts);
      factsFingerprintRef.current = JSON.stringify(report.facts);
      setLens(report.lens);
      setLoadingReport(false);
      trackEvent('gov_data_report_open', { listingId, audience: audience || 'tenant' });
    })();

    return () => {
      cancelled = true;
    };
    // Initial report only — lens switches handled separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  const handleAudienceChange = async (next: Audience | null) => {
    setAudience(next);
    setLoadingLens(true);
    try {
      const nextLens = await fetchPropertyLens(listingId, next);
      setLens(nextLens);
      trackEvent('gov_data_lens_switch', {
        listingId,
        audience: next || 'tenant',
        factsUnchanged: factsFingerprintRef.current === JSON.stringify(facts),
      });
    } finally {
      setLoadingLens(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4" data-testid="report-panel">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">Proptii report</h4>
          <p className="text-sm text-gray-500">Facts stay fixed; only the lens changes with “View as”.</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            Close
          </button>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Facts</span>
        <AudienceToggle value={audience} onChange={(v) => void handleAudienceChange(v)} />
      </div>

      {loadingReport ? (
        <FactsBadgeRow isLoading />
      ) : (
        <div data-facts-fingerprint={factsFingerprintRef.current}>
          <FactsBadgeRow
            flags={facts}
            unresolvedFallback={!facts || facts.length === 0}
          />
        </div>
      )}

      <div className="mt-5 rounded-lg bg-gray-50 border border-gray-100 p-4" data-testid="report-lens">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Lens</span>
          {loadingLens && <span className="text-xs text-gray-400">Updating…</span>}
        </div>
        {lens ? (
          <>
            <p className="text-sm font-medium text-gray-900 mb-2">{lens.verdictText}</p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              {lens.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </>
        ) : (
          <p className="text-sm text-gray-500">No lens available yet.</p>
        )}
      </div>
    </div>
  );
};
