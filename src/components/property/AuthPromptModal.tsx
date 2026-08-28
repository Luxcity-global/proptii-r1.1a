import React from 'react';
import { ArrowRight, CheckCircle2, Layers, Lock, Sparkles, X } from 'lucide-react';
import type { Audience } from '../../types/govData';

const ROLE_LABEL: Record<Audience, string> = {
  tenant: 'Tenant',
  buyer: 'Buyer',
  landlord: 'Landlord',
  agent: 'Agent',
  homeowner: 'Homeowner',
};

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onContinueAsGuest: () => void;
  /** Role the user is trying to unlock (handoff Multi-Profile Auth modal). */
  targetRole?: Audience;
}

/**
 * Multi-Profile Auth Prompt — gates non-tenant audience lenses when logged out.
 * Logged-in users use AudienceSelectorModal instead.
 */
export const AuthPromptModal: React.FC<AuthPromptModalProps> = ({
  isOpen,
  onClose,
  onSignIn,
  onContinueAsGuest,
  targetRole = 'buyer',
}) => {
  if (!isOpen) return null;

  const roleLabel = ROLE_LABEL[targetRole] || 'Buyer';

  return (
    <div
      className="fixed inset-0 z-[85] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      data-testid="multiprofile-auth-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="multiprofile-auth-title"
      style={{ fontFamily: '"Nunito Sans", sans-serif' }}
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-7 sm:p-8 shadow-2xl border border-gray-100 relative overflow-hidden text-left text-gray-900">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#136C9E] to-[#0d4f74] text-white flex items-center justify-center mb-5 shadow-lg shadow-blue-900/20">
          <Layers className="w-7 h-7 text-orange-300" />
        </div>

        <h3
          id="multiprofile-auth-title"
          className="text-2xl font-extrabold text-gray-900 mb-2 leading-tight"
          style={{ fontFamily: 'Archivo, sans-serif' }}
        >
          Unlock Tailored Reports for Other Profiles
        </h3>

        <p className="text-xs sm:text-[13px] text-gray-600 leading-relaxed mb-6">
          Sign in or create a free account to instantly compare properties through multiple user
          perspectives
        </p>

        <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 text-xs text-gray-700">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Switch seamlessly between Tenant, Buyer, Landlord &amp; Agent</span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Save unlimited properties and audit certificates to your dashboard</span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Export tailored evidentiary reports for every stakeholder</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={onSignIn}
            className="w-full py-3.5 px-6 rounded-full bg-[#F15A22] hover:bg-[#D54A1A] text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>Sign In to Unlock {roleLabel} Report</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onContinueAsGuest}
            className="w-full py-2.5 px-4 rounded-full bg-blue-50 hover:bg-blue-100 text-[#136C9E] font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#136C9E]" />
            <span>Quick Preview: Unlock All Profiles (Demo Mode)</span>
          </button>
        </div>

        <p className="text-[11px] text-gray-400 text-center mt-4">Official UK HMLR &amp; EPC Data</p>
      </div>
    </div>
  );
};
