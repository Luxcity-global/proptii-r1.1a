import React, { useState } from 'react';
import {
  ShieldCheck,
  X,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Download,
  Share2,
  ExternalLink,
  Building2,
  CheckSquare,
  FileCheck2,
  UserCheck,
  ArrowUpRight
} from 'lucide-react';
import {
  AudienceLens,
  AUDIENCE_LENS_COPY,
  AUDIENCE_METADATA,
  FlagState,
  getFreshnessString
} from '../../data/audienceLensCopy';

export interface ProptiiReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyTitle: string;
  propertyAddress: string;
  price?: string | number;
  initialAudience?: AudienceLens;
  isFlagged?: boolean;
  isUnresolved?: boolean;
  onOpenFactsExport?: () => void;
  onOpenDisclosureExport?: () => void;
}

export const ProptiiReportModal: React.FC<ProptiiReportModalProps> = ({
  isOpen,
  onClose,
  propertyTitle,
  propertyAddress,
  price,
  initialAudience = 'tenant',
  isFlagged = false,
  isUnresolved = false,
  onOpenFactsExport,
  onOpenDisclosureExport
}) => {
  const [currentAudience, setCurrentAudience] = useState<AudienceLens>(initialAudience);
  const [showRoleSelectorModal, setShowRoleSelectorModal] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  if (!isOpen) return null;

  const flagState: FlagState = isUnresolved ? 'unresolved' : isFlagged ? 'flagged' : 'clear';
  
  // Data for Restrictive Covenant flag
  const covenantCopy = AUDIENCE_LENS_COPY.restrictive_covenant[currentAudience][flagState];
  
  // Data for EPC Context flag
  const epcCopy = AUDIENCE_LENS_COPY.epc_context[currentAudience][flagState];

  const toggleStep = (idx: number) => {
    setCheckedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleAudienceSelect = (lens: AudienceLens) => {
    setCurrentAudience(lens);
    setShowRoleSelectorModal(false);
    setCheckedSteps({});
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-nunito animate-in fade-in duration-200">
      
      {/* Main Report Container */}
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden relative">
        
        {/* Sticky Report Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-[#136C9E] flex items-center justify-center text-[#136C9E] shadow-sm">
              <ShieldCheck className="w-5 h-5 text-[#136C9E]" strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900 font-archivo">
                  Proptii Property Intelligence Report
                </h2>
              </div>
              <p className="text-xs text-gray-500 truncate max-w-md">
                {propertyTitle} • {propertyAddress}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRoleSelectorModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-[#136C9E] hover:bg-blue-100 text-xs font-bold transition-all"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Change Lens ({AUDIENCE_METADATA[currentAudience].label})</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
              aria-label="Close report"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Report Content with Generous Section Spacing (space-y-12) */}
        <div className="p-6 sm:p-10 pb-14 overflow-y-auto space-y-10 sm:space-y-12 flex-1">
          
          {/* Top Row: Permanent Notice & Verdict Banner Side-by-Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-stretch">
            
            {/* Card 1: Permanent "Generated for: [audience]" Notice */}
            <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-md flex flex-col justify-between h-full">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#F15A22] flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                  {currentAudience.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs uppercase font-extrabold tracking-wider text-orange-400">
                    Permanent Verification Notice
                  </div>
                  <div className="text-sm sm:text-base font-bold mt-0.5">
                    Generated for: <span className="text-white underline underline-offset-4">{AUDIENCE_METADATA[currentAudience].label}</span> ({AUDIENCE_METADATA[currentAudience].roleType})
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-400 font-medium mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span>Proptii Statutory Audit</span>
                <span>Reference: <span className="font-mono text-white">PRP-{Date.now().toString().slice(-6)}</span></span>
              </div>
            </div>

            {/* Card 2: Verdict Banner - Vertically Centered Content */}
            <div
              className={`p-5 sm:p-6 rounded-3xl flex flex-col justify-center h-full transition-all ${
                flagState === 'flagged'
                  ? 'bg-amber-50/70 text-gray-900'
                  : flagState === 'unresolved'
                  ? 'bg-slate-50 text-gray-900'
                  : 'bg-[#F0FDF4] text-gray-900'
              }`}
            >
              <div className="flex items-start gap-3.5 my-auto">
                <div className="flex-shrink-0 mt-0.5">
                  {flagState === 'flagged' ? (
                    <div className="w-8 h-8 rounded-xl bg-amber-100/80 flex items-center justify-center text-[#D97706]">
                      <AlertTriangle className="w-4.5 h-4.5 text-[#D97706]" strokeWidth={2.2} />
                    </div>
                  ) : flagState === 'unresolved' ? (
                    <div className="w-8 h-8 rounded-xl bg-slate-200/70 flex items-center justify-center text-[#64748B]">
                      <HelpCircle className="w-4.5 h-4.5 text-[#64748B]" strokeWidth={2.2} />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-emerald-100/80 flex items-center justify-center text-[#059669]">
                      <CheckCircle2 className="w-4.5 h-4.5 text-[#059669]" strokeWidth={2.2} />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h4
                    className={`text-xs sm:text-[13px] font-bold uppercase tracking-wider font-archivo mb-1 ${
                      flagState === 'flagged'
                        ? 'text-[#D97706]'
                        : flagState === 'unresolved'
                        ? 'text-[#64748B]'
                        : 'text-[#059669]'
                    }`}
                  >
                    {flagState === 'flagged'
                      ? 'Advisory Notice Surfaced on Registers'
                      : flagState === 'unresolved'
                      ? 'Source Did Not Return a Definitive Match'
                      : 'Official Registers Clear for Residential Use'}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-[#374957] leading-relaxed">
                    {flagState === 'flagged'
                      ? `HM Land Registry or EPC registers noted restrictions relevant to ${AUDIENCE_METADATA[currentAudience].label.toLowerCase()} obligations.`
                      : flagState === 'unresolved'
                      ? 'This record could not be matched automatically. In accordance with Proptii plain-truth reporting, unresolved matches are never treated as a clean pass.'
                      : `Independent searches confirm clean title and appropriate energy efficiency benchmarks for ${AUDIENCE_METADATA[currentAudience].label.toLowerCase()} peace of mind.`}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Itemized Register Checks (Flag 1 & Flag 2) */}
          <div className="space-y-4 sm:space-y-5">
            <h3 className="text-sm sm:text-base font-bold text-[#374957] uppercase tracking-wider font-archivo">
              Itemized Register Checks
            </h3>

            {/* Horizontal Side-by-Side Container with Generous Gap */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              
              {/* Card 1: HM Land Registry Restrictive Covenants & Title */}
              <div className="bg-[#FFFCF8] rounded-3xl p-6 sm:p-7 border border-[#F0EBE1] shadow-sm flex flex-col justify-between h-full transition-all hover:shadow-md">
                <div className="flex-1 flex flex-col">
                  {/* Top Row: Icon + Freshness */}
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="w-11 h-11 rounded-2xl bg-gray-100 border border-gray-200/80 flex items-center justify-center text-[#374957] shadow-sm flex-shrink-0">
                      <Building2 className="w-5 h-5 text-[#374957]" strokeWidth={1.8} />
                    </div>
                    <span className="text-xs font-semibold text-[#374957]/70">
                      {getFreshnessString('HMLR')}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="mb-2.5">
                    <h4 className="text-sm sm:text-base font-bold font-archivo text-[#374957] leading-snug">
                      HM Land Registry:
                    </h4>
                    <h4 className="text-base sm:text-lg font-bold font-archivo text-[#136C9E] leading-snug">
                      Restrictive Covenants & Title
                    </h4>
                  </div>

                  {/* Body Verdict */}
                  <p className="text-xs sm:text-sm text-[#374957] leading-relaxed mb-5 flex-1">
                    {covenantCopy.verdict}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100/80 mt-auto">
                  {/* Data Source in #DC5F12 */}
                  <div className="text-xs font-semibold text-[#DC5F12] mb-3.5">
                    Data source: HM Land Registry Digital Title Cadastre
                  </div>

                  {/* Know Your Rights Link Container in Grey */}
                  <a
                    href="/tools/know-your-rights"
                    className="w-full bg-gray-100 hover:bg-gray-200 text-[#374957] p-3 px-4 rounded-2xl flex items-center justify-between transition-all group shadow-sm"
                  >
                    <span className="text-xs sm:text-sm font-bold">Know Your Rights Guide</span>
                    <div className="w-6 h-6 rounded-full border border-[#374957]/40 flex items-center justify-center text-[#374957] group-hover:scale-105 group-hover:border-[#374957] transition-all flex-shrink-0">
                      <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.2} />
                    </div>
                  </a>
                </div>
              </div>

              {/* Card 2: National EPC Register Energy Performance & MEES */}
              <div className="bg-[#FFFCF8] rounded-3xl p-6 sm:p-7 border border-[#F0EBE1] shadow-sm flex flex-col justify-between h-full transition-all hover:shadow-md">
                <div className="flex-1 flex flex-col">
                  {/* Top Row: Icon + Freshness */}
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="w-11 h-11 rounded-2xl bg-gray-100 border border-gray-200/80 flex items-center justify-center text-[#374957] shadow-sm flex-shrink-0">
                      <FileCheck2 className="w-5 h-5 text-[#374957]" strokeWidth={1.8} />
                    </div>
                    <span className="text-xs font-semibold text-[#374957]/70">
                      {getFreshnessString('EPC')}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="mb-2.5">
                    <h4 className="text-sm sm:text-base font-bold font-archivo text-[#374957] leading-snug">
                      National EPC Register:
                    </h4>
                    <h4 className="text-base sm:text-lg font-bold font-archivo text-[#136C9E] leading-snug">
                      Energy Performance & MEES
                    </h4>
                  </div>

                  {/* Body Verdict */}
                  <p className="text-xs sm:text-sm text-[#374957] leading-relaxed mb-5 flex-1">
                    {epcCopy.verdict}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100/80 mt-auto">
                  {/* Data Source in #DC5F12 */}
                  <div className="text-xs font-semibold text-[#DC5F12] mb-3.5">
                    Data source: MHCLG National Energy Register (Band C / 69)
                  </div>

                  {/* Know Your Rights Link Container in Grey */}
                  <a
                    href="/tools/know-your-rights"
                    className="w-full bg-gray-100 hover:bg-gray-200 text-[#374957] p-3 px-4 rounded-2xl flex items-center justify-between transition-all group shadow-sm"
                  >
                    <span className="text-xs sm:text-sm font-bold">Know Your Rights Guide</span>
                    <div className="w-6 h-6 rounded-full border border-[#374957]/40 flex items-center justify-center text-[#374957] group-hover:scale-105 group-hover:border-[#374957] transition-all flex-shrink-0">
                      <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.2} />
                    </div>
                  </a>
                </div>
              </div>

            </div>
          </div>

          {/* Recommended Next Steps (Interactive Checklist) */}
          <div className="bg-slate-50/80 rounded-3xl border border-slate-200/90 p-7 sm:p-9 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200/60">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#F15A22] shadow-sm flex-shrink-0">
                  <CheckSquare className="w-5 h-5 text-[#F15A22]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 uppercase tracking-wider font-archivo">
                    Recommended Action Steps for {AUDIENCE_METADATA[currentAudience].label}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Actionable checklist tailored to your statutory rights & obligations
                  </p>
                </div>
              </div>
              
              <span className="text-xs text-gray-500 font-semibold bg-white px-3.5 py-1.5 rounded-full border border-gray-200 shadow-sm">
                {Object.values(checkedSteps).filter(Boolean).length} of {[...covenantCopy.steps, ...epcCopy.steps].length} completed
              </span>
            </div>

            <div className="space-y-3">
              {[...covenantCopy.steps, ...epcCopy.steps].map((step, idx) => {
                const isChecked = !!checkedSteps[idx];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleStep(idx)}
                    className={`w-full text-left flex items-start gap-3.5 p-4 px-4.5 rounded-2xl border transition-all group ${
                      isChecked
                        ? 'bg-emerald-50/60 border-emerald-200 text-gray-400 line-through'
                        : 'bg-white border-gray-200/80 text-gray-800 hover:border-gray-300 hover:shadow-md shadow-sm'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 mt-0.5 rounded-lg border flex items-center justify-center flex-shrink-0 transition-all ${
                        isChecked
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                          : 'border-gray-300 bg-white group-hover:border-gray-400'
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                    <span className="text-xs sm:text-sm leading-relaxed font-normal">{step}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Sticky Report Actions Footer (Sprint 3.3 Export Triggers) */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onOpenFactsExport && (
              <button
                type="button"
                onClick={onOpenFactsExport}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5 text-gray-500" />
                <span>Export Facts-Only (Public)</span>
              </button>
            )}

            {onOpenDisclosureExport && (
              <button
                type="button"
                onClick={onOpenDisclosureExport}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#136C9E] hover:bg-[#0d4f74] text-white text-xs font-bold shadow-sm transition-all"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-white" />
                <span>Agent Evidentiary Record</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-[#F15A22] hover:bg-[#D54A1A] text-white text-xs font-bold shadow-md transition-all ml-auto"
          >
            Done
          </button>
        </div>

      </div>

      {/* Audience Lens / Role Selector Modal */}
      {showRoleSelectorModal && (
        <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 font-archivo">
                Select Audience Perspective
              </h3>
              <button
                onClick={() => setShowRoleSelectorModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 mt-2 mb-4 leading-relaxed">
              Proptii formats statutory verdicts, rights, and action steps tailored to your specific role in the transaction:
            </p>

            <div className="space-y-2 mb-6">
              {(['tenant', 'buyer', 'landlord', 'agent', 'homeowner'] as AudienceLens[]).map((lens) => {
                const meta = AUDIENCE_METADATA[lens];
                const isSelected = currentAudience === lens;

                return (
                  <button
                    key={lens}
                    type="button"
                    onClick={() => handleAudienceSelect(lens)}
                    className={`w-full text-left p-3 rounded-2xl border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-[#136C9E] text-[#136C9E] shadow-sm'
                        : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{meta.label}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">{meta.description}</div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-[#136C9E]" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowRoleSelectorModal(false)}
              className="w-full py-2.5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProptiiReportModal;
