import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Download, MapPin, Search, X } from 'lucide-react';
import type { Audience, FactFlag, PropertyReportResponse, ReportLens } from '../../types/govData';
import { fetchPropertyReport } from '../../services/govDataService';
import { defaultRenterContent } from '../../data/renterReportFixtures';
import { trackEvent } from '../../utils/analytics';
import { downloadIntelligenceReportPdf } from '../../utils/intelligenceReportPdf';
import { getPropertyListingDescription } from '../../utils/propertyDisplay';
import { ReportLocationCard } from './report/ReportLocationCard';
import { ReportStatutoryBreakdown } from './report/ReportStatutoryBreakdown';
import { ReportLocalArea } from './report/ReportLocalArea';
import { parsePaidPendingCopy, ReportPendingSection } from './report/ReportPendingSection';

interface ProptiiReportModalProps {
  isOpen: boolean;
  /** Keep the report (and map) mounted during Unlock diagnostic — use opacity, not display:none. */
  isWarming?: boolean;
  listingId: string;
  addressLabel: string;
  propertyTitle?: string;
  propertyLocation?: string;
  propertyPrice?: string;
  audience: Audience;
  initialReport?: PropertyReportResponse | null;
  /** When true, report data comes from parent streaming — do not re-fetch on open. */
  streamingReport?: boolean;
  onClose: () => void;
  onChangeLens: () => void;
}

const ROLE_CHIP: Record<Audience, string> = {
  tenant: 'Renter Report',
  buyer: 'Buyer Report',
  landlord: 'Landlord Report',
  agent: 'Agent Report',
  homeowner: 'Homeowner Report',
};

function formatAsOf(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Renter intelligence report — visual match of HTML v04.
 * Profile switcher, Price Paid tables, owner-intent, and agent ledger are excluded.
 */
export const ProptiiReportModal: React.FC<ProptiiReportModalProps> = ({
  isOpen,
  isWarming = false,
  listingId,
  addressLabel,
  propertyTitle,
  propertyLocation,
  propertyPrice,
  audience,
  initialReport = null,
  streamingReport = false,
  onClose,
  onChangeLens,
}) => {
  const [facts, setFacts] = useState<FactFlag[] | null>(initialReport?.facts ?? null);
  const [lens, setLens] = useState<ReportLens | null>(initialReport?.lens ?? null);
  const [report, setReport] = useState<PropertyReportResponse>(
    initialReport ?? {
      facts: [],
      lens: null,
      generatedFor: audience || 'tenant',
      map: { embedQuery: propertyLocation || addressLabel },
    },
  );
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const factsFingerprintRef = useRef('');
  const resolvedTitle = propertyTitle || addressLabel.split(',')[0]?.trim() || 'Selected property';
  const resolvedLocation =
    propertyLocation || addressLabel.split(',').slice(1).join(',').trim() || addressLabel;

  useEffect(() => {
    if (!isOpen && !isWarming) return;
    let cancelled = false;
    const audienceKey = audience || 'tenant';

    const applyReport = (next: PropertyReportResponse) => {
      setReport((prev) => {
        const embedQuery =
          resolvedLocation.trim() ||
          (next.map?.embedQuery || '').trim() ||
          (prev.map?.embedQuery || '').trim() ||
          addressLabel.trim();
        return {
          ...next,
          sources: next.sources?.length ? next.sources : prev.sources,
          renter: next.renter ?? prev.renter,
          map: { embedQuery },
        };
      });
      setFacts(next.facts);
      factsFingerprintRef.current = JSON.stringify(next.facts);
      setLens(next.lens);
    };

    if (streamingReport && initialReport) {
      applyReport(initialReport);
      trackEvent('gov_data_report_open', { listingId, audience });
      return () => {
        cancelled = true;
      };
    }

    const matchesPrefetch = initialReport?.generatedFor === audienceKey;

    if (matchesPrefetch && initialReport) {
      applyReport(initialReport);
      trackEvent('gov_data_report_open', { listingId, audience });
      return;
    }

    void (async () => {
      const next: PropertyReportResponse = await fetchPropertyReport(listingId, audience, {
        address: { display: resolvedLocation || addressLabel },
        listingPrice: propertyPrice,
        onProgress: (partial) => {
          if (!cancelled) applyReport(partial);
        },
      });
      if (cancelled) return;
      applyReport(next);
      trackEvent('gov_data_report_open', { listingId, audience });
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    isWarming,
    listingId,
    audience,
    initialReport,
    streamingReport,
    addressLabel,
    propertyPrice,
    resolvedLocation,
  ]);

  useEffect(() => {
    if (!streamingReport || !initialReport || (!isOpen && !isWarming)) return;
    setReport((prev) => {
      const embedQuery =
        resolvedLocation.trim() ||
        (initialReport.map?.embedQuery || '').trim() ||
        (prev.map?.embedQuery || '').trim() ||
        addressLabel.trim();
      return {
        ...initialReport,
        map: { embedQuery },
      };
    });
    setFacts(initialReport.facts);
    factsFingerprintRef.current = JSON.stringify(initialReport.facts);
    setLens(initialReport.lens);
  }, [streamingReport, initialReport, isOpen, isWarming, resolvedLocation, addressLabel]);

  const renter = useMemo(() => {
    if (report.renter) {
      return report.renter;
    }
    return defaultRenterContent(facts);
  }, [report.renter, facts]);

  const paidPending = useMemo(() => parsePaidPendingCopy(renter.paidCopy), [renter.paidCopy]);

  const isSourcesLoading = useMemo(() => {
    return report.sources?.some((s) => s.state === 'loading') ?? false;
  }, [report.sources]);

  const handleDownloadPdf = async () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      const reportEl = document.getElementById('proptii-report');
      if (reportEl) {
        reportEl.scrollTop = 0;
      }
      await new Promise((resolve) => {
        window.setTimeout(resolve, 350);
      });
      await downloadIntelligenceReportPdf({
        listingId,
        audience,
        propertyTitle: resolvedTitle,
        propertyLocation: resolvedLocation,
        propertyPrice,
        addressLabel,
        listingDescription: getPropertyListingDescription({ title: propertyTitle || resolvedTitle }),
        epcText: renter.partBBody,
        facts,
        lens,
        renter,
      });
      trackEvent('gov_data_report_pdf_download', { listingId, audience });
    } catch (error) {
      console.error('Failed to download intelligence report PDF:', error);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (!isOpen && !isWarming) return null;

  const asOf = formatAsOf(new Date());
  const reference = `PRP-${listingId.slice(-6).toUpperCase() || '849201'}`;
  const steps = renter.steps.length > 0 ? renter.steps : (lens?.steps ?? []);

  return (
    <div
      className={`fixed inset-0 z-[70] bg-black/50 flex items-stretch sm:items-center justify-center sm:p-4${
        isWarming ? ' pointer-events-none opacity-0' : ''
      }`}
      data-testid="proptii-report-modal"
      role={isWarming ? 'presentation' : 'dialog'}
      aria-modal={isWarming ? undefined : true}
      aria-hidden={isWarming}
      aria-labelledby={isWarming ? undefined : 'proptii-report-title'}
    >
      <div
        id="proptii-report"
        className="relative min-h-0 h-full sm:h-auto sm:max-h-[96vh] w-full max-w-5xl overflow-y-auto bg-ground font-sans text-ink shadow-2xl sm:rounded-sm"
      >
        <header id="report-header" className="border-b border-rule bg-paper">
          <div className="mx-auto max-w-5xl px-5 pb-7 pt-8 sm:px-8 sm:pb-9 sm:pt-11">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-brand-blue">Proptii</p>
                <h1
                  id="proptii-report-title"
                  className="mt-3 font-display text-[30px] font-bold leading-[1.05] tracking-[-0.02em] text-brand-blue sm:text-[42px]"
                >
                  Your Proptii Report
                </h1>
                <p className="mt-4 flex items-start gap-2 font-display text-[17px] font-semibold leading-snug text-brand-navy sm:text-[20px]">
                  <MapPin aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-brand-blue" />
                  <span>{resolvedLocation}</span>
                </p>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
                  Correct as of {asOf}
                  <span className="mx-2 text-pending" aria-hidden="true">
                    ·
                  </span>
                  {reference}
                </p>
                <p
                  id="location-precision-disclosure"
                  className="mt-3 max-w-2xl text-[13px] leading-relaxed text-ink-muted"
                >
                  {renter.precisionLine}{' '}
                  <span className="font-mono text-[12px]">UPRN / title register pending.</span>
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 sm:items-end">
                <div className="flex items-center gap-2">
                  <button
                    id="download-report"
                    type="button"
                    onClick={() => {
                      void handleDownloadPdf();
                    }}
                    disabled={isDownloadingPdf}
                    aria-busy={isDownloadingPdf}
                    className="no-print inline-flex items-center justify-center gap-2 rounded-lg bg-stamp px-3.5 py-2 text-[13px] font-semibold text-paper transition-colors duration-150 ease-out hover:bg-stamp-hover disabled:cursor-wait disabled:opacity-80"
                  >
                    <Download aria-hidden="true" className="h-3.5 w-3.5" />
                    {isDownloadingPdf ? 'Preparing…' : 'Download report'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="no-print flex h-9 w-9 items-center justify-center rounded-lg border border-ink/15 text-ink-muted transition-colors duration-150 ease-out hover:bg-ground hover:text-ink"
                    aria-label="Close report"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <span className="inline-flex items-center gap-2 rounded-md border border-brand-blue/20 bg-brand-blue-light px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-brand-blue">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-blue" />
                  {ROLE_CHIP[audience]}
                </span>
                <button
                  type="button"
                  onClick={onChangeLens}
                  className="no-print text-[13px] font-medium text-brand-blue-deep underline-offset-4 transition-colors duration-150 ease-out hover:text-brand-blue hover:underline"
                >
                  Buying, letting or managing? Sign in
                </button>
              </div>
            </div>
          </div>
        </header>

        <main
          className="mx-auto max-w-5xl space-y-8 px-5 py-8 sm:px-8 sm:py-10"
          data-facts-fingerprint={factsFingerprintRef.current}
        >
          <section
            id="verdict-banner"
            aria-labelledby="verdict-title"
            className="rounded-xl border border-brand-blue/20 bg-brand-cream px-5 py-6 sm:px-8 sm:py-7"
          >
            <div className="flex items-start gap-3.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-blue/15 text-brand-blue">
                <AlertTriangle aria-hidden="true" className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h2
                  id="verdict-title"
                  className="font-display text-[20px] font-bold leading-[1.15] tracking-[-0.02em] text-brand-blue sm:text-[24px]"
                >
                  {renter.whatToWatchTitle}
                </h2>
                <p className="mt-2.5 max-w-3xl text-[15px] leading-[1.65] text-ink-muted sm:text-[16px]">
                  {renter.whatToWatchBody}
                </p>
              </div>
            </div>
          </section>

          <ReportLocationCard
            embedQuery={report.map?.embedQuery}
            addressLabel={resolvedLocation}
          />

          <ReportStatutoryBreakdown renter={renter} listingPrice={propertyPrice} />

          <ReportLocalArea intro={renter.localIntro} checks={renter.localArea} />

          <ReportPendingSection
            id="paid-features-placeholder"
            kicker="Paid"
            title={paidPending.title}
            statusLabel={paidPending.statusLabel}
            testId="report-paid-pending"
          />

          <section
            id="recommended-action-steps"
            aria-labelledby="recommended-action-steps-title"
            className="rounded-xl border border-rule bg-paper p-5 sm:p-7"
          >
            <div className="border-b-2 border-brand-navy/20 pb-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand-blue">What to do next</p>
              <h2
                id="recommended-action-steps-title"
                className="mt-2 font-display text-[21px] font-bold tracking-[-0.02em] text-brand-blue sm:text-[26px]"
              >
                Recommended Action Steps
              </h2>
            </div>

            <ol className="mt-5 divide-y divide-rule">
              {steps.map((step, index) => (
                <li key={step} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-brand-blue/25 bg-brand-blue-light font-mono text-[11px] font-medium text-brand-blue">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p className="text-[15px] leading-[1.65] text-ink-muted">{step}</p>
                </li>
              ))}
            </ol>
          </section>
        </main>

        <footer id="report-footer" className="border-t border-rule bg-paper">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">
                Proptii · {reference}
              </p>
              <p className="mt-1.5 max-w-md text-[12px] leading-relaxed text-ink-muted">
                {renter.footerAudience}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                id="export-facts-only"
                type="button"
                onClick={() => {
                  void handleDownloadPdf();
                }}
                disabled={isDownloadingPdf}
                className="no-print inline-flex items-center justify-center gap-2 rounded-lg bg-stamp px-5 py-3 text-[14px] font-semibold text-paper transition-colors duration-150 ease-out hover:bg-stamp-hover disabled:cursor-wait disabled:opacity-80"
                data-testid="download-intelligence-report-pdf"
              >
                <Download aria-hidden="true" className={`h-4 w-4 ${isSourcesLoading ? 'animate-pulse' : ''}`} />
                {isDownloadingPdf
                  ? 'Preparing PDF…'
                  : isSourcesLoading
                    ? 'Gathering Live Data…'
                    : 'Export Facts-Only (Public)'}
              </button>
              <button
                id="new-search"
                type="button"
                onClick={onClose}
                className="no-print inline-flex items-center justify-center gap-2 rounded-lg border border-ink/25 px-5 py-3 text-[14px] font-semibold text-ink transition-colors duration-150 ease-out hover:bg-ground"
              >
                <Search aria-hidden="true" className="h-4 w-4" />
                New Search
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
