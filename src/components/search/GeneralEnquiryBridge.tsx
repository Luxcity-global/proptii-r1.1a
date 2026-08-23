import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Compass,
  ExternalLink,
  ShieldCheck,
  Building2,
  Zap,
  Lock,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { GeneralEnquiryResponse, ActionSearchChip } from '../../data/audienceLensCopy';

export interface GeneralEnquiryBridgeProps {
  enquiryData: GeneralEnquiryResponse;
  onSelectActionChip?: (searchQuery: string) => void;
  onSelectQuickReply?: (chip: string) => void;
  className?: string;
}

export const GeneralEnquiryBridge: React.FC<GeneralEnquiryBridgeProps> = ({
  enquiryData,
  onSelectActionChip,
  onSelectQuickReply,
  className = '',
}) => {
  const [activePerspective, setActivePerspective] = useState<'tenant' | 'landlord' | 'agent'>('tenant');

  // Case A: Too Broad Refinement Screen
  if (enquiryData.isTooBroad) {
    return (
      <div
        className={`bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-white/40 shadow-2xl font-nunito max-w-3xl mx-auto text-left animate-in fade-in zoom-in-95 duration-150 ${className}`}
      >
        <div className="flex items-center gap-2 mb-2 text-[#136C9E]">
          <Compass className="w-5 h-5 text-[#136C9E]" />
          <span className="text-xs font-extrabold uppercase tracking-wider">
            Refine Search Scope
          </span>
        </div>

        <h4 className="text-base font-bold text-gray-900 mb-4 font-archivo">
          {enquiryData.clarifyingQuestion || 'Which location and criteria are you looking for?'}
        </h4>

        {/* 1. Location Chips */}
        {enquiryData.quickReplyChips && (
          <div className="mb-4">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
              Select Target City
            </div>
            <div className="flex flex-wrap gap-2">
              {enquiryData.quickReplyChips.map((city, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (onSelectActionChip) onSelectActionChip(`Flats in ${city}`);
                    else if (onSelectQuickReply) onSelectQuickReply(city);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-blue-50 hover:bg-[#136C9E] text-[#136C9E] hover:text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                >
                  <span>{city}</span>
                  <ArrowRight className="w-3 h-3 opacity-60" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. Budget Chips */}
        {enquiryData.budgetChips && (
          <div className="mb-4">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
              Monthly Budget Ceiling
            </div>
            <div className="flex flex-wrap gap-2">
              {enquiryData.budgetChips.map((budget, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (onSelectActionChip) onSelectActionChip(`2 bed flat under ${budget.replace(/[^\d]/g, '')}pcm`);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-800 text-gray-700 hover:text-white text-xs font-semibold transition-all shadow-sm"
                >
                  {budget}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Property Type Chips */}
        {enquiryData.propertyTypeChips && (
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
              Property Configuration
            </div>
            <div className="flex flex-wrap gap-2">
              {enquiryData.propertyTypeChips.map((type, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (onSelectActionChip) onSelectActionChip(`${type} in Leeds`);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-orange-50 hover:bg-[#F15A22] text-[#F15A22] hover:text-white text-xs font-bold transition-all shadow-sm"
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Case B: Answerable Topic Guidance with Perspective Tabs & Action Chips
  const perspectiveContent =
    enquiryData.perspectives?.[activePerspective] || enquiryData.briefAnswer;

  return (
    <div
      className={`bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-2xl font-nunito max-w-3xl mx-auto text-left animate-in fade-in zoom-in-95 duration-150 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 mb-3 border-b border-gray-100 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-orange-500/10 flex items-center justify-center text-[#F15A22]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#136C9E]">
              {enquiryData.topic || 'Proptii Statutory Guidance'}
            </span>
          </div>
        </div>

        {/* Perspective Switcher Tabs */}
        {enquiryData.perspectives && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full text-xs">
            <span className="text-gray-400 font-semibold px-1.5 text-[10px] uppercase">View as:</span>
            {(['tenant', 'landlord', 'agent'] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setActivePerspective(role)}
                className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-all ${
                  activePerspective === role
                    ? 'bg-[#136C9E] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Answer Body */}
      <div className="mb-4">
        <p className="text-xs text-gray-800 leading-relaxed font-normal">
          {perspectiveContent}
        </p>
      </div>

      {/* Interactive Action Search Chips */}
      {enquiryData.actionChips && enquiryData.actionChips.length > 0 && (
        <div className="pt-3 border-t border-gray-100">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            Explore Pre-Verified Properties
          </div>
          <div className="flex flex-wrap gap-2">
            {enquiryData.actionChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (onSelectActionChip) onSelectActionChip(chip.searchQuery);
                }}
                className="px-3.5 py-1.5 rounded-full bg-blue-50/90 hover:bg-[#136C9E] text-[#136C9E] hover:text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 group"
              >
                <span>{chip.label}</span>
                <ArrowRight className="w-3 h-3 text-[#136C9E] group-hover:text-white transition-colors" />
              </button>
            ))}
            
            <a
              href="/tools/know-your-rights"
              className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs font-bold transition-all inline-flex items-center gap-1"
            >
              <span>Know Your Rights Guide</span>
              <ExternalLink className="w-3 h-3 text-gray-500" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralEnquiryBridge;
