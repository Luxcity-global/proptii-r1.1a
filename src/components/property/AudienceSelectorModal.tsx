import React from 'react';
import { CheckCircle2, ChevronRight, Layers, X } from 'lucide-react';
import type { Audience } from '../../types/govData';

interface AudienceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (audience: Audience) => void;
  currentAudience?: Audience;
}

const ROLES: { value: Audience; letter: string; title: string; blurb: string; tone: string }[] = [
  {
    value: 'tenant',
    letter: 'T',
    title: 'Tenant (Renting)',
    blurb: 'Deposit protection, pet covenants & tenant rights',
    tone: 'bg-orange-500/10 text-[#F15A22]',
  },
  {
    value: 'buyer',
    letter: 'B',
    title: 'Buyer (Purchasing)',
    blurb: 'Title encumbrances, boundary restrictions & MEES',
    tone: 'bg-blue-500/10 text-[#136C9E]',
  },
  {
    value: 'landlord',
    letter: 'L',
    title: 'Landlord (Lessor)',
    blurb: 'HMO requirements, MEES compliance & AST terms',
    tone: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    value: 'agent',
    letter: 'A',
    title: 'Estate Agent (Negotiator)',
    blurb: 'CPRs Part A/B/C Material Information disclosures',
    tone: 'bg-purple-500/10 text-purple-600',
  },
];

/**
 * Audience lens selector — shown when the user is signed in (or in demo preview mode).
 */
export const AudienceSelectorModal: React.FC<AudienceSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentAudience = 'tenant',
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      data-testid="audience-selector-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audience-selector-title"
      style={{ fontFamily: '"Nunito Sans", sans-serif' }}
    >
      <div className="max-w-lg w-full bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          aria-label="Cancel"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 mb-4 pr-10">
          <div className="w-8 h-8 rounded-xl bg-[#136C9E]/10 text-[#136C9E] flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <h3
            id="audience-selector-title"
            className="text-base font-bold text-gray-900"
            style={{ fontFamily: 'Archivo, sans-serif' }}
          >
            Select Your Role Perspective
          </h3>
        </div>

        <p className="text-xs text-gray-600 mb-5 leading-relaxed">
          Proptii formats statutory verdicts, rights, and action steps tailored to your specific role
          in the property transaction:
        </p>

        <div className="space-y-2.5">
          {ROLES.map((role) => {
            const isActive = role.value === currentAudience;
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => onSelect(role.value)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between group ${
                  isActive
                    ? 'border-[#136C9E] bg-blue-50/60 shadow-sm'
                    : 'border-gray-200 hover:border-[#136C9E] hover:bg-blue-50/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center ${role.tone}`}
                  >
                    {role.letter}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900 group-hover:text-[#136C9E]">
                      {role.title}
                    </div>
                    <div className="text-[11px] text-gray-500">{role.blurb}</div>
                  </div>
                </div>
                {isActive ? (
                  <CheckCircle2 className="w-4 h-4 text-[#136C9E] flex-shrink-0" aria-hidden />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#136C9E] flex-shrink-0" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
