import React from 'react';
import { ShieldCheck, X, Sparkles, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthPromptModal: React.FC<AuthPromptModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { login, isAuthenticated } = useAuth();

  if (!isOpen) return null;

  const handleLogin = async () => {
    try {
      if (!isAuthenticated) {
        await login();
      }
      onSuccess();
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  // Demo bypass option so designer/reviewer can test without Azure AD credentials
  const handleDemoSignIn = () => {
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-nunito animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-gray-100 relative overflow-hidden text-left">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Heading */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#136C9E] to-[#0d4f74] text-white flex items-center justify-center mb-5 shadow-lg shadow-blue-900/20">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <h3 className="text-2xl font-extrabold text-gray-900 font-archivo mb-2">
          Unlock Proptii Report
        </h3>
        
        <p className="text-xs text-gray-600 leading-relaxed mb-6">
          Sign in or create a free account to generate official HM Land Registry and EPC statutory register intelligence reports.
        </p>

        {/* Value Points */}
        <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 text-xs text-gray-700">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Full Land Registry title covenants check</span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>EPC thermal efficiency & MEES compliance</span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Audience-tailored legal rights & action steps</span>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleLogin}
            className="w-full py-3.5 px-6 rounded-full bg-[#F15A22] hover:bg-[#D54A1A] text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>Sign In / Create Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleDemoSignIn}
            className="w-full py-2.5 px-4 rounded-full bg-blue-50 hover:bg-blue-100 text-[#136C9E] font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#136C9E]" />
            <span>Continue as Guest / Preview Mode</span>
          </button>
        </div>

        <p className="text-[11px] text-gray-400 text-center mt-4">
          Free for tenants & homebuyers • No credit card required
        </p>

      </div>
    </div>
  );
};

export default AuthPromptModal;
