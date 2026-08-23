import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, Loader2, Database, FileCheck, Layers } from 'lucide-react';
import { AudienceLens, AUDIENCE_METADATA } from '../../data/audienceLensCopy';

export interface ReportDiagnosticProps {
  propertyTitle: string;
  audienceLens: AudienceLens;
  onComplete: () => void;
  onCancel?: () => void;
}

export const ReportDiagnostic: React.FC<ReportDiagnosticProps> = ({
  propertyTitle,
  audienceLens,
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Querying HM Land Registry Title Register',
      desc: 'Retrieving restrictive covenants, easements, and ownership encumbrances...',
      icon: <Database className="w-5 h-5 text-[#136C9E]" />
    },
    {
      title: 'Validating National EPC Register & MEES Benchmarks',
      desc: 'Cross-referencing thermal efficiency ratings and building vintage context...',
      icon: <FileCheck className="w-5 h-5 text-[#136C9E]" />
    },
    {
      title: 'Correlating Ordnance Survey & UPRN Boundaries',
      desc: 'Confirming unique property reference numbers and address coordinates...',
      icon: <Layers className="w-5 h-5 text-[#136C9E]" />
    },
    {
      title: `Structuring Intelligence for ${AUDIENCE_METADATA[audienceLens].label} Lens`,
      desc: 'Applying statutory rights, compliance rules, and recommended action steps...',
      icon: <ShieldCheck className="w-5 h-5 text-[#F15A22]" />
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          setTimeout(onComplete, 600);
          return prev;
        }
      });
    }, 700);

    return () => clearInterval(timer);
  }, [onComplete, steps.length]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-nunito animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-gray-100 relative overflow-hidden">
        
        {/* Top Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#136C9E] to-[#0d4f74] text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/20 animate-pulse">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 font-archivo">
            Checking Government Registers
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto truncate">
            {propertyTitle}
          </p>
          <div className="inline-block mt-2 px-3 py-0.5 rounded-full bg-blue-50 text-[#136C9E] text-xs font-bold">
            Configured for: {AUDIENCE_METADATA[audienceLens].label} Lens
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-4 mb-8">
          {steps.map((step, idx) => {
            const isFinished = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div
                key={idx}
                className={`flex items-start gap-3.5 p-3 rounded-2xl transition-all duration-300 ${
                  isCurrent
                    ? 'bg-blue-50/80 border border-[#136C9E]/20 shadow-sm'
                    : isFinished
                    ? 'bg-gray-50 border border-gray-100'
                    : 'opacity-40'
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {isFinished ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-[#136C9E] animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900">
                    {step.title}
                  </p>
                  <p className="text-[11px] text-gray-500 leading-normal mt-0.5">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cancel option */}
        {onCancel && (
          <div className="text-center">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-gray-400 hover:text-gray-600 font-semibold"
            >
              Cancel check
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ReportDiagnostic;
