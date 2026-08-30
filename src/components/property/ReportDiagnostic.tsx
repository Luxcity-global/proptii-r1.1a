import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import type { Audience, ReportSource } from '../../types/govData';
import { DEFAULT_REPORT_SOURCES } from '../../data/renterReportFixtures';

interface ReportDiagnosticProps {
  isOpen: boolean;
  addressLabel: string;
  audience: Audience;
  sources?: ReportSource[] | null;
  isGenerating: boolean;
  onComplete: () => void;
  onClose: () => void;
}

const ROLE_LABEL: Record<Audience, string> = {
  tenant: 'Tenant',
  buyer: 'Buyer',
  landlord: 'Landlord',
  agent: 'Agent',
  homeowner: 'Homeowner',
};

function resolveSteps(sources?: ReportSource[] | null): ReportSource[] {
  const incoming = (sources || []).filter((step) => step.title?.trim());
  return incoming.length > 0 ? incoming : DEFAULT_REPORT_SOURCES;
}

function stepTitle(step: ReportSource, roleLabel: string): string {
  if (step.id === 'lens' || /audience lens/i.test(step.title)) {
    return `Structuring Intelligence for ${roleLabel} Lens`;
  }
  return step.title;
}

/**
 * Animated register check overlay — steps come from backend `sources[]`.
 */
export const ReportDiagnostic: React.FC<ReportDiagnosticProps> = ({
  isOpen,
  addressLabel,
  audience,
  sources,
  isGenerating,
  onComplete,
  onClose,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [steps, setSteps] = useState<ReportSource[]>(() => resolveSteps(sources));
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const sourcesRef = useRef(sources);
  sourcesRef.current = sources;

  useEffect(() => {
    if (!isOpen) {
      setActiveIndex(0);
      setDone(false);
      return;
    }

    const currentSources = resolveSteps(sources);
    setSteps(currentSources);
    
    // Find the latest source that is not 'loading' or 'unresolved'
    let lastActiveIndex = 0;
    currentSources.forEach((source, idx) => {
      if (source.state === 'clear' || source.state === 'flagged') {
        lastActiveIndex = idx;
      }
    });
    
    setActiveIndex(lastActiveIndex);

    // If generation finished, trigger completion
    if (!isGenerating && isOpen) {
      setDone(true);
      const timer = window.setTimeout(() => {
        onCompleteRef.current();
      }, 900);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen, audience, sources, isGenerating]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const roleLabel = ROLE_LABEL[audience];

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      data-testid="report-diagnostic"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-diagnostic-title"
      aria-busy={!done}
      style={{ fontFamily: 'Nunito, "Nunito Sans", sans-serif' }}
    >
      <div className="max-w-lg w-full bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 relative overflow-hidden">
        <div className="text-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#136C9E] to-[#0d4f74] text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/20 animate-pulse">
            <ShieldCheck className="w-8 h-8" aria-hidden />
          </div>
          <h3
            id="report-diagnostic-title"
            className="text-xl font-bold text-gray-900"
            style={{ fontFamily: 'Archivo, sans-serif' }}
          >
            Checking Government Registers
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto truncate">{addressLabel}</p>
          <div className="inline-block mt-2.5 px-3 py-0.5 rounded-full bg-blue-50 text-[#136C9E] text-xs font-bold">
            Configured for: {roleLabel} Lens
          </div>
        </div>

        <div className="space-y-3.5" aria-live="polite">
          {done && (
            <p className="sr-only">Checks complete. Opening intelligence report.</p>
          )}
          {steps.map((step, index) => {
            const completed = index < activeIndex || (done && index <= activeIndex);
            const active = index === activeIndex && !done;
            const pending = index > activeIndex;

            return (
              <div
                key={step.id || step.title}
                className={`flex items-start gap-3.5 p-3 rounded-2xl transition-all ${
                  active
                    ? 'bg-blue-50/80 border border-[#136C9E]/20 shadow-sm'
                    : pending
                      ? 'opacity-40'
                      : 'bg-gray-50 border border-gray-100'
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" aria-hidden />
                  ) : active ? (
                    <Loader2 className="w-5 h-5 text-[#136C9E] animate-spin" aria-hidden />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900">{stepTitle(step, roleLabel)}</p>
                  {step.detail && (
                    <p className="text-[11px] text-gray-500 leading-normal mt-0.5">{step.detail}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
