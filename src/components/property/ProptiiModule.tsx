import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { Audience, PropertyFactsResponse, PropertyReportResponse } from '../../types/govData';
import { fetchPropertyFacts, fetchPropertyReport } from '../../services/govDataService';
import { useAuth } from '../../contexts/AuthContext';
import { AuthPromptModal } from './AuthPromptModal';
import { AudienceSelectorModal } from './AudienceSelectorModal';
import { ReportDiagnostic } from './ReportDiagnostic';
import { ProptiiReportModal } from './ProptiiReportModal';
import { AgentComplianceActions } from './AgentComplianceActions';
import { KeyPropertyAlertsBanner } from './KeyPropertyAlertsBanner';
import { trackEvent } from '../../utils/analytics';
import { markPendingPostAuth } from '../../utils/accountType';
import { prefetchReportMap, warmupReportMap } from '../../utils/mapsEmbed';

const AUTO_COLLAPSE_MS = 7000;
const PENDING_LENS_AUDIENCE_KEY = 'proptii_pending_lens_audience';
const PENDING_LENS_RETURN_REPORT_KEY = 'proptii_pending_lens_return_report';

const ROLE_LABEL: Record<Audience, string> = {
  tenant: 'Tenant',
  buyer: 'Buyer',
  landlord: 'Landlord',
  agent: 'Agent',
  homeowner: 'Homeowner',
};

const MODULE_ONE_LINER: Record<Audience, string> = {
  tenant:
    'Uncover hidden restrictions, pet clauses, and real energy costs before you sign or pay a deposit.',
  buyer:
    'Spot hidden title covenants, boundary restrictions, and energy upgrade costs before making an offer.',
  landlord:
    'Protect your rental yield and verify 100% MEES & statutory compliance before listing.',
  agent:
    'Meet NTSELAT Material Information compliance instantly and prevent transaction fall-throughs.',
  homeowner:
    'Understand title encumbrances, energy performance, and statutory obligations for your home.',
};

type FlowStep = 'idle' | 'multiprofile-auth' | 'audience' | 'diagnostic' | 'report';

interface ProptiiModuleProps {
  listingId: string;
  /** Portal listing URL — sent as listingId to POST /api/properties/report when set. */
  propertyUrl?: string | null;
  uprn?: string | null;
  audience: Audience | null;
  onAudienceChange?: (audience: Audience) => void;
  addressLabel?: string;
  propertyTitle?: string;
  propertyLocation?: string;
  propertyPrice?: string;
  propertyStreet?: string | null;
  propertyPostcode?: string | null;
  coordinates?: { lat: number; lng: number } | null;
}

/**
 * Property-details Proptii Intelligence Report module (handoff Step 2).
 * Default tenant lens. Report CTA goes straight to diagnostic → report.
 * Lens changes are gated: logged-in users get the selector; guests get multi-profile auth.
 */
export const ProptiiModule: React.FC<ProptiiModuleProps> = ({
  listingId,
  propertyUrl,
  uprn,
  onAudienceChange,
  addressLabel = 'Selected property',
  propertyTitle,
  propertyLocation,
  propertyPrice,
  propertyStreet,
  propertyPostcode,
  coordinates,
}) => {
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();
  const [facts, setFacts] = useState<PropertyFactsResponse | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [guestPreview, setGuestPreview] = useState(false);
  const [flow, setFlow] = useState<FlowStep>('idle');
  const [flowAudience, setFlowAudience] = useState<Audience>('tenant');
  const [pendingAudience, setPendingAudience] = useState<Audience>('buyer');
  const [returnToReportAfterLens, setReturnToReportAfterLens] = useState(false);
  const [prefetchedReport, setPrefetchedReport] = useState<PropertyReportResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const mapWarmupRef = useRef(Promise.resolve<unknown>(null));

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await fetchPropertyFacts(listingId, uprn);
      if (cancelled) return;
      setFacts(result);
      trackEvent('gov_data_proptii_module', {
        listingId,
        match: result.match,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [listingId, uprn]);

  useEffect(() => {
    setFlowAudience('tenant');
    setExpanded(true);
    setPrefetchedReport(null);
  }, [listingId]);

  useEffect(() => {
    if (!expanded || flow !== 'idle') return;
    const timer = window.setTimeout(() => setExpanded(false), AUTO_COLLAPSE_MS);
    return () => window.clearTimeout(timer);
  }, [expanded, flow, listingId]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const pendingAudienceRaw = sessionStorage.getItem(PENDING_LENS_AUDIENCE_KEY);
    if (!pendingAudienceRaw) return;

    sessionStorage.removeItem(PENDING_LENS_AUDIENCE_KEY);
    const nextAudience = pendingAudienceRaw as Audience;
    if (!ROLE_LABEL[nextAudience]) return;

    setFlowAudience(nextAudience);
    onAudienceChange?.(nextAudience);

    const returnReport = sessionStorage.getItem(PENDING_LENS_RETURN_REPORT_KEY) === '1';
    sessionStorage.removeItem(PENDING_LENS_RETURN_REPORT_KEY);
    setFlow(returnReport ? 'report' : 'idle');
  }, [isAuthenticated, onAudienceChange]);

  const handleMultiProfileSignIn = () => {
    const returnPath = `${location.pathname}${location.search}${location.hash}` || '/';
    sessionStorage.setItem('redirectAfterLogin', returnPath);
    sessionStorage.setItem(PENDING_LENS_AUDIENCE_KEY, pendingAudience);
    if (returnToReportAfterLens) {
      sessionStorage.setItem(PENDING_LENS_RETURN_REPORT_KEY, '1');
    }
    markPendingPostAuth();
    setFlow('idle');

    navigate(`/login?redirect=${encodeURIComponent(returnPath)}`);
  };

  const resolvedTitle = propertyTitle || addressLabel.split(',')[0]?.trim() || 'Selected property';
  const resolvedLocation =
    propertyLocation || addressLabel.split(',').slice(1).join(',').trim() || addressLabel;

  const applyAudience = (next: Audience) => {
    setFlowAudience(next);
    onAudienceChange?.(next);
  };

  const finishLensChange = () => {
    if (returnToReportAfterLens) {
      setReturnToReportAfterLens(false);
      setFlow('report');
      return;
    }
    setFlow('idle');
  };

  const startReportFlow = () => {
    setExpanded(true);
    const mapQuery = resolvedLocation || addressLabel;
    prefetchReportMap(mapQuery);
    mapWarmupRef.current = warmupReportMap(mapQuery);
    const reportListingId = propertyUrl?.trim() || listingId;
    setPrefetchedReport(null);
    setIsGenerating(true);
    setFlow('diagnostic');
    void fetchPropertyReport(reportListingId, flowAudience, {
      address: {
        display: resolvedLocation || addressLabel,
        street: propertyStreet,
        postcode: propertyPostcode,
        coordinates,
      },
      listingPrice: propertyPrice,
      onProgress: (partial) => setPrefetchedReport(partial),
    }).then((final) => {
      setPrefetchedReport(final);
      setIsGenerating(false);
    }).catch(() => {
      setIsGenerating(false);
    });
  };

  const openLensChange = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpanded(true);
    setReturnToReportAfterLens(flow === 'report');
    if (isAuthenticated || guestPreview) {
      setFlow('audience');
      return;
    }
    setPendingAudience(flowAudience === 'tenant' ? 'buyer' : flowAudience);
    setFlow('multiprofile-auth');
  };

  const handleAudienceSelected = (next: Audience) => {
    if (next !== 'tenant' && !isAuthenticated && !guestPreview) {
      setPendingAudience(next);
      setFlow('multiprofile-auth');
      return;
    }
    applyAudience(next);
    finishLensChange();
  };

  const handleLensModalClose = () => {
    if (returnToReportAfterLens) {
      setFlow('report');
      return;
    }
    setFlow('idle');
  };

  return (
    <>
      <div
        className="my-6 rounded-2xl bg-gradient-to-br from-[#136C9E]/5 via-[#136C9E]/10 to-[#F15A22]/5 border-2 border-[#136C9E]/25 p-5 sm:p-6 shadow-xl relative overflow-hidden transition-all duration-300"
        data-testid="proptii-module"
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => setExpanded((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setExpanded((v) => !v);
            }
          }}
          className={`flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none ${
            expanded ? 'mb-4 pb-4 border-b border-[#136C9E]/15' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-[#136C9E] flex items-center justify-center text-[#136C9E] shadow-sm flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#136C9E]" aria-hidden />
            </div>
            <div>
              <span
                className="text-sm font-semibold text-[#136C9E] uppercase tracking-wider"
                style={{ fontFamily: 'Archivo, sans-serif' }}
              >
                Proptii Intelligence Report
              </span>
              <p className="text-xs text-gray-600 mt-0.5">
                Get instant property checks to avoid hidden risks and legal surprises.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <div className="px-3.5 py-1 rounded-full bg-white/90 border border-gray-200/90 text-xs font-semibold text-gray-700 shadow-sm flex items-center gap-1.5">
              <span>Audience Lens:</span>
              <strong className="text-gray-900 capitalize" style={{ fontFamily: 'Archivo, sans-serif' }}>
                {ROLE_LABEL[flowAudience]}
              </strong>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-white border border-gray-200 flex items-center justify-center text-gray-600 shadow-sm"
              aria-expanded={expanded}
              aria-label="Toggle Proptii Intelligence Report"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>

        {expanded && (
          <div className="space-y-4 transition-all duration-300">
            <KeyPropertyAlertsBanner
              description={MODULE_ONE_LINER[flowAudience]}
              variant="module"
            />

            {flowAudience === 'agent' && (
              <AgentComplianceActions
                listingId={listingId}
                propertyTitle={resolvedTitle}
                propertyLocation={resolvedLocation}
                propertyPrice={propertyPrice}
                facts={facts?.flags}
                layout="compact"
              />
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="text-xs text-gray-600 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden />
                <span>Instant statutory checks • 100% independent data</span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  startReportFlow();
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#136C9E] hover:bg-[#0d4f74] text-white font-bold text-xs shadow-lg shadow-blue-900/20 transition-all ml-auto"
              >
                <Sparkles className="w-4 h-4" aria-hidden />
                <span>Unlock Full Proptii Intelligence Report</span>
                <ArrowRight className="w-4 h-4" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>

      <AuthPromptModal
        isOpen={flow === 'multiprofile-auth'}
        targetRole={pendingAudience}
        onClose={handleLensModalClose}
        onSignIn={() => {
          void handleMultiProfileSignIn();
        }}
        onContinueAsGuest={() => {
          setGuestPreview(true);
          applyAudience(pendingAudience);
          finishLensChange();
        }}
      />

      <AudienceSelectorModal
        isOpen={flow === 'audience'}
        onClose={handleLensModalClose}
        onSelect={handleAudienceSelected}
        currentAudience={flowAudience}
      />

      <ReportDiagnostic
        isOpen={flow === 'diagnostic'}
        addressLabel={addressLabel}
        audience={flowAudience}
        sources={prefetchedReport?.sources}
        isGenerating={isGenerating}
        onClose={() => setFlow('idle')}
        onComplete={() => {
          void mapWarmupRef.current.finally(() => setFlow('report'));
        }}
      />

      <ProptiiReportModal
        isOpen={flow === 'report'}
        isWarming={flow === 'diagnostic'}
        listingId={propertyUrl?.trim() || listingId}
        addressLabel={addressLabel}
        propertyTitle={resolvedTitle}
        propertyLocation={resolvedLocation}
        propertyPrice={propertyPrice}
        audience={flowAudience}
        initialReport={prefetchedReport}
        streamingReport
        onClose={() => setFlow('idle')}
        onChangeLens={openLensChange}
      />
    </>
  );
};
