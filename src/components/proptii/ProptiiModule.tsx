import React from 'react';
import { ShieldCheck, FileText, CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { RiskBadge } from '../badges/RiskBadge';
import { AudienceLens } from '../../data/audienceLensCopy';

export interface ProptiiModuleProps {
  propertyTitle: string;
  propertyAddress: string;
  price?: string | number;
  uprn?: string;
  titleNumber?: string;
  isFlagged?: boolean;
  isUnresolved?: boolean;
  currentAudience?: AudienceLens;
  onOpenReport: (audienceLens: AudienceLens) => void;
  className?: string;
}

export const ProptiiModule: React.FC<ProptiiModuleProps> = ({
  propertyTitle,
  propertyAddress,
  isFlagged = false,
  isUnresolved = false,
  currentAudience = 'tenant',
  onOpenReport,
  className = ''
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#136C9E]/5 via-[#136C9E]/10 to-[#F15A22]/5 border-2 border-[#136C9E]/25 p-6 shadow-xl font-nunito ${className}`}
    >
      {/* Decorative background branding accent */}
      <div className="absolute top-0 right-0 -mr-12 -mt-12 w-44 h-44 rounded-full bg-gradient-to-bl from-[#136C9E]/15 to-transparent pointer-events-none" />
      
      <div className="relative z-10">
        {/* Header with official Proptii badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-[#136C9E]/15">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white border border-[#136C9E] flex items-center justify-center text-[#136C9E] shadow-sm">
              <ShieldCheck className="w-5 h-5 text-[#136C9E]" strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#136C9E] font-archivo uppercase tracking-wider">
                  Proptii Intelligence Layer
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                Independent government register cross-check (HMLR & EPC)
              </p>
            </div>
          </div>

          <div className="text-[11px] text-gray-500 font-medium">
            Refreshed this month
          </div>
        </div>

        {/* Intelligence Status Badges */}
        <div className="space-y-3 mb-5">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3.5 border border-[#136C9E]/15 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-gray-900">
                Land Registry & Building Compliance
              </span>
              <span className="text-[10px] font-bold text-[#136C9E]">
                Audience: {currentAudience.toUpperCase()}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <RiskBadge
                flagType="restrictive_covenant"
                state={isUnresolved ? 'unresolved' : isFlagged ? 'flagged' : 'clear'}
                audienceLens={currentAudience}
                size="sm"
                onOpenReport={onOpenReport}
              />
              <RiskBadge
                flagType="epc_context"
                state={isUnresolved ? 'unresolved' : isFlagged ? 'flagged' : 'clear'}
                audienceLens={currentAudience}
                size="sm"
                onOpenReport={onOpenReport}
              />
            </div>
          </div>

          {/* Value proposition / Verdict Highlight Card matching Report Page */}
          <div>
            {isFlagged ? (
              <div className="p-3.5 rounded-2xl bg-amber-50/70 flex items-start gap-3 transition-all">
                <div className="w-7 h-7 rounded-lg bg-amber-100/80 flex items-center justify-center text-[#D97706] flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-[#D97706]" strokeWidth={2.2} />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider font-archivo text-[#D97706] mb-0.5">
                    Advisory Notice Surfaced on Registers
                  </h4>
                  <p className="text-[11px] text-[#374957] leading-relaxed">
                    Title register or EPC efficiency checks surfaced actionable disclosures for this address.
                  </p>
                </div>
              </div>
            ) : isUnresolved ? (
              <div className="p-3.5 rounded-2xl bg-slate-50 flex items-start gap-3 transition-all">
                <div className="w-7 h-7 rounded-lg bg-slate-200/70 flex items-center justify-center text-[#64748B] flex-shrink-0 mt-0.5">
                  <FileText className="w-4 h-4 text-[#64748B]" strokeWidth={2.2} />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider font-archivo text-[#64748B] mb-0.5">
                    Source Did Not Return a Definitive Match
                  </h4>
                  <p className="text-[11px] text-[#374957] leading-relaxed">
                    Digital title match pending. Proptii plain-truth reporting never treats unresolved matches as a clean pass.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-[#F0FDF4] flex items-start gap-3 transition-all">
                <div className="w-7 h-7 rounded-lg bg-emerald-100/80 flex items-center justify-center text-[#059669] flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059669]" strokeWidth={2.2} />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider font-archivo text-[#059669] mb-0.5">
                    Official Registers Clear for Residential Use
                  </h4>
                  <p className="text-[11px] text-[#374957] leading-relaxed">
                    Freehold title and energy performance verified compliant with standard residential occupancy.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <span className="text-[11px] text-gray-500 font-medium">
            Full diagnostic and statutory recommendations available
          </span>

          <button
            type="button"
            onClick={() => onOpenReport(currentAudience)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#136C9E] hover:bg-[#0d4f74] text-white text-xs font-bold shadow-lg shadow-blue-900/20 transition-all transform active:scale-95 ml-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>Generate Full Proptii Report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProptiiModule;
