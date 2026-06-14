import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface SignUpPromptModalProps {
  /** Whether the modal is open. */
  isOpen: boolean;
  /** Close modal (e.g. keep browsing anonymously). */
  onClose: () => void;
  /** Demo-specific title (e.g. "Want to save this property?"). */
  title: string;
  /** Reassurance line (e.g. "Don't worry, you won't have to go through the entire search process again."). */
  reassurance?: string;
  /** Called when user chooses "Sign up with email"; default navigates to /pricing. */
  onSignUpEmail?: () => void;
  /** Called when user chooses "Social Media sign up"; default navigates to /pricing. */
  onSignUpSocial?: () => void;
  /** When true, show "Explore more features" as the secondary button instead of "Social Media sign up". */
  showExploreFeaturesAsSecondary?: boolean;
  /** Called when user clicks "Explore more features"; default calls onClose. */
  onExploreFeatures?: () => void;
}

/**
 * Reusable sign-up prompt modal for demo mode.
 * Matches UI spec: icon, title, "Sign up in 10 seconds", reassurance, primary + secondary CTA.
 */
export function SignUpPromptModal({
  isOpen,
  onClose,
  title,
  reassurance = "Don't worry, you won't have to go through the entire search process again.",
  onSignUpEmail,
  onSignUpSocial,
  showExploreFeaturesAsSecondary = false,
  onExploreFeatures
}: SignUpPromptModalProps) {
  const navigate = useNavigate();

  const handleSignUpEmail = () => {
    if (onSignUpEmail) {
      onSignUpEmail();
    } else {
      navigate('/pricing', { state: { from: 'demo' } });
    }
    onClose();
  };

  const handleSignUpSocial = () => {
    if (onSignUpSocial) {
      onSignUpSocial();
    } else {
      navigate('/pricing', { state: { from: 'demo', tab: 'social' } });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50">
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden min-h-[420px] flex flex-col justify-between"
        style={{ fontFamily: 'Archivo, sans-serif' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="signup-prompt-title"
      >
        <div>
        {/* Icon */}
        <div className="flex justify-center pt-10 pb-2">
          <img
            src="/images/scout1.png"
            alt=""
            className="w-28 h-28 object-contain"
          />
        </div>

        {/* Title */}
        <h2 id="signup-prompt-title" className="text-center text-lg font-bold text-gray-900 px-6 pt-2">
          {title}
        </h2>

        {/* Sign up in 10 seconds */}
        <p className="text-center mt-2">
          <span className="text-blue-600 underline font-medium cursor-default">Sign up in 10 seconds</span>
        </p>

        {/* Reassurance */}
        {reassurance && (
          <p className="text-center text-sm text-gray-500 px-6 mt-3">{reassurance}</p>
        )}

        {/* Buttons */}
        <div className="px-6 pt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleSignUpEmail}
            className="w-full py-3 px-4 rounded-full font-medium text-white bg-[#E65D24] hover:bg-[#d9541f] transition-colors"
          >
            {showExploreFeaturesAsSecondary ? 'Sign in / Sign up' : 'Sign up with email'}
          </button>
          <button
            type="button"
            onClick={showExploreFeaturesAsSecondary ? (onExploreFeatures || onClose) : handleSignUpSocial}
            className="w-full py-3 px-4 rounded-full font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            {showExploreFeaturesAsSecondary ? 'Explore more features' : 'Social Media sign up'}
          </button>
        </div>
        </div>

        {/* Close */}
        <div className="flex justify-center pb-8">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
