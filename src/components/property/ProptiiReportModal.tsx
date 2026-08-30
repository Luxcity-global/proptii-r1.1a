import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Download,
  Search,
  Tag,
  UserCheck,
  X,
} from 'lucide-react';
import type { Audience, FactFlag, PropertyReportResponse, ReportLens } from '../../types/govData';
import { fetchPropertyReport } from '../../services/govDataService';
import { defaultRenterContent } from '../../data/renterReportFixtures';
import { trackEvent } from '../../utils/analytics';
import { downloadIntelligenceReportPdf } from '../../utils/intelligenceReportPdf';
import { getPropertyListingDescription } from '../../utils/propertyDisplay';
import { extractUkPostcode } from '../../utils/postcodesIo';
import { ReportLocationCard } from './report/ReportLocationCard';
import { ReportStatutoryBreakdown } from './report/ReportStatutoryBreakdown';
import { ReportLocalArea } from './report/ReportLocalArea';

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

const LENS_SHORT: Record<Audience, string> = {
  tenant: 'Renter',
  buyer: 'Buyer',
  landlord: 'Landlord',
  agent: 'Agent',
  homeowner: 'Homeowner',
};

type ReportTab = 'area' | 'part-a' | 'part-b' | 'part-c';

const TAB_TARGETS: Record<ReportTab, string> = {
  area: 'approximate-location',
  'part-a': 'part-a',
  'part-b': 'part-b',
  'part-c': 'part-c',
};

function formatAsOf(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function addressLines(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Renter intelligence report — visual match of the standalone HTML modal spec.
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
  const [activeTab, setActiveTab] = useState<ReportTab>('area');
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(() => new Set());
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

  const isSourcesLoading = useMemo(() => {
    return report.sources?.some((s) => s.state === 'loading') ?? false;
  }, [report.sources]);

  const handleDownloadPdf = async () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
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

  const handleTab = (tab: ReportTab) => {
    setActiveTab(tab);
    const target = document.getElementById(TAB_TARGETS[tab]);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleStep = (index: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  if (!isOpen && !isWarming) return null;

  const asOf = formatAsOf(new Date());
  const reference = `PRP-${listingId.slice(-6).toUpperCase() || '849201'}`;
  const steps = renter.steps.length > 0 ? renter.steps : (lens?.steps ?? []);
  const lines = addressLines(resolvedLocation);
  const postcode = extractUkPostcode(resolvedLocation) || '';
  const headerTrail = [lines[0]?.toUpperCase(), postcode, reference].filter(Boolean).join(' • ');
  const sourcesVerified = report.sources?.some((s) => s.state === 'clear');

  return (
    <div
      className={`fixed inset-0 z-[70] bg-slate-900/90 flex items-stretch sm:items-center justify-center p-3 sm:p-6 lg:p-8${
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
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#EEF6FB] via-[#F3F8FB] to-[#FAF6F2] border-2 border-[#136C9E]/25 max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl text-gray-900 font-nunito-sans"
      >
        <div
          data-pdf-hide
          className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-[#E0F0F8] pointer-events-none blur-3xl z-0"
        />

        <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between z-20 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-normal text-[13px] tracking-wider text-[#136C9E] uppercase font-archivo shrink-0">
              Proptii Report
            </span>
            <span className="text-gray-300 text-[13px] hidden sm:inline">|</span>
            <div className="text-[13px] text-gray-600 font-normal tracking-wide hidden sm:block truncate max-w-md">
              {headerTrail}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onChangeLens}
              className="no-print flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-[#136C9E] hover:bg-blue-100 text-[13px] font-normal transition-all shadow-sm"
              title="Change audience perspective"
            >
              <UserCheck className="w-3.5 h-3.5" aria-hidden />
              <span>Change Lens ({LENS_SHORT[audience]})</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="no-print w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
              aria-label="Close report"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div
          data-report-scroll
          className="p-6 sm:p-10 pb-16 overflow-y-auto space-y-9 flex-1 relative z-10"
          data-facts-fingerprint={factsFingerprintRef.current}
        >
          <div className="space-y-3">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-900 text-white text-[11px] font-normal tracking-wider font-archivo uppercase shadow-sm">
              {ROLE_CHIP[audience]}
            </div>

            <h1
              id="proptii-report-title"
              className="text-[25px] sm:text-[31px] lg:text-[37px] font-normal font-archivo text-gray-900 tracking-tight leading-[1.22]"
            >
              {lines.length > 0
                ? lines.map((line, index) => (
                    <React.Fragment key={`${line}-${index}`}>
                      {line}
                      {index < lines.length - 1 ? <br /> : null}
                    </React.Fragment>
                  ))
                : resolvedTitle}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-slate-600 font-normal pt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" aria-hidden />
                <span>Correct as of {asOf}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-500" aria-hidden />
                <span>{reference}</span>
              </span>
              <span>•</span>
              <span className={sourcesVerified ? 'text-emerald-700 font-normal' : 'text-slate-500'}>
                {isSourcesLoading
                  ? 'Checking open registers…'
                  : sourcesVerified
                    ? 'Open & EPC register verified'
                    : renter.precisionLine}
              </span>
            </div>
          </div>

          <div className="no-print border-b border-gray-300 flex items-center gap-8 text-[13px] font-normal tracking-wider uppercase font-archivo overflow-x-auto">
            {(
              [
                ['area', 'Area Intel'],
                ['part-a', 'Part A'],
                ['part-b', 'Part B'],
                ['part-c', 'Part C'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => handleTab(id)}
                className={
                  activeTab === id
                    ? 'pb-3 border-b-2 border-gray-900 text-gray-900 font-medium transition-all shrink-0'
                    : 'pb-3 border-b-2 border-transparent text-slate-600 hover:text-gray-900 transition-all shrink-0'
                }
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative rounded-2xl bg-white border border-gray-200 p-5 pl-6 shadow-sm overflow-hidden flex items-start justify-between gap-4">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#EF4444]" />
            <div className="space-y-1.5 flex-1 pr-4">
              <div className="flex items-center gap-1.5 text-[13px] font-normal uppercase tracking-wider text-[#EF4444] font-archivo">
                <AlertTriangle className="w-4 h-4 text-[#EF4444]" aria-hidden />
                <span>{renter.whatToWatchTitle}</span>
              </div>
              <p className="text-[13px] sm:text-[14px] text-gray-700 leading-relaxed font-normal">
                {renter.whatToWatchBody}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-red-200/60 flex items-center justify-center text-red-300 flex-shrink-0 my-auto hidden sm:flex">
              <span className="font-archivo text-xl font-normal">!</span>
            </div>
          </div>

          <ReportLocationCard
            embedQuery={report.map?.embedQuery}
            addressLabel={resolvedLocation}
          />

          <ReportLocalArea intro={renter.localIntro} checks={renter.localArea} />

          <ReportStatutoryBreakdown
            renter={renter}
            listingPrice={propertyPrice}
            paidCopy={renter.paidCopy}
          />

          <section
            id="recommended-action-steps"
            aria-labelledby="recommended-action-steps-title"
            className="space-y-4 pt-4 border-t border-gray-200"
          >
            <div>
              <div className="text-[11px] font-normal text-slate-600 uppercase tracking-widest font-archivo">
                What to do next
              </div>
              <h2
                id="recommended-action-steps-title"
                className="text-[25px] sm:text-[31px] font-normal font-archivo text-gray-900"
              >
                Recommended Action Steps
              </h2>
            </div>

            <div className="space-y-3">
              {steps.map((step, index) => {
                const done = completedSteps.has(index);
                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => toggleStep(index)}
                    className={`group w-full text-left p-4 sm:p-5 rounded-2xl border flex items-start gap-4 transition-all ${
                      done
                        ? 'bg-emerald-50/60 border-emerald-200 line-through text-gray-400'
                        : 'bg-white border-gray-200 hover:border-[#136C9E] hover:shadow-[0_16px_32px_#E7F2FF]'
                    }`}
                  >
                    <span
                      className={`font-archivo font-normal text-[15px] sm:text-[17px] flex-shrink-0 ${
                        done ? 'text-gray-400' : 'text-slate-500 group-hover:text-[#136C9E]'
                      }`}
                    >
                      {String(index + 1).padStart(2, '0')}.
                    </span>
                    <span
                      className={`text-[13px] sm:text-[15px] leading-relaxed font-normal flex-1 ${
                        done ? 'text-gray-400' : 'text-gray-800 group-hover:text-[#136C9E]'
                      }`}
                    >
                      {step}
                    </span>
                    {done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" aria-hidden />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <footer className="bg-[#EEF6FB] border-t border-[#136C9E]/15 px-6 sm:px-8 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-3 z-20 flex-shrink-0">
          <div className="text-[10px] text-gray-500 leading-tight max-w-sm font-normal">
            <span className="font-normal text-gray-800 text-[11px] block">
              Proptii • {reference}
            </span>
            <span>{renter.footerAudience}</span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              id="export-facts-only"
              type="button"
              onClick={() => {
                void handleDownloadPdf();
              }}
              disabled={isDownloadingPdf}
              className="no-print h-10 px-5 flex items-center gap-2 rounded-full bg-[#DC5F12] hover:bg-[#c34f0d] text-white text-xs font-normal shadow-sm transition-all uppercase tracking-wider font-archivo disabled:cursor-wait disabled:opacity-80"
              data-testid="download-intelligence-report-pdf"
            >
              <Download
                aria-hidden
                className={`w-3.5 h-3.5 text-white ${isSourcesLoading ? 'animate-pulse' : ''}`}
              />
              <span>
                {isDownloadingPdf
                  ? 'Preparing PDF…'
                  : isSourcesLoading
                    ? 'Gathering Live Data…'
                    : 'Export Facts-Only (Public)'}
              </span>
            </button>
            <button
              id="new-search"
              type="button"
              onClick={onClose}
              className="no-print h-10 px-5 flex items-center gap-2 rounded-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 text-xs font-normal shadow-sm transition-all uppercase tracking-wider font-archivo"
            >
              <Search className="w-3.5 h-3.5 text-gray-600" aria-hidden />
              <span>New Search</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
