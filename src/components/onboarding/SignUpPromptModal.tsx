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
  /** Called when user chooses "Sign up with email"; default navigates to /register. */
  onSignUpEmail?: () => void;
  /** Called when user chooses "Social Media sign up"; default navigates to /register (or could open OAuth). */
  onSignUpSocial?: () => void;
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
  onSignUpSocial
}: SignUpPromptModalProps) {
  const navigate = useNavigate();

  const handleSignUpEmail = () => {
    if (onSignUpEmail) {
      onSignUpEmail();
    } else {
      navigate('/register', { state: { from: 'demo' } });
    }
    onClose();
  };

  const handleSignUpSocial = () => {
    if (onSignUpSocial) {
      onSignUpSocial();
    } else {
      navigate('/register', { state: { from: 'demo', tab: 'social' } });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50">
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signup-prompt-title"
      >
        {/* Icon */}
        <div className="flex justify-center pt-8 pb-2">
          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>
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
        <div className="p-6 pt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleSignUpEmail}
            className="w-full py-3 px-4 rounded-xl font-medium text-white bg-[#E65D24] hover:bg-[#d9541f] transition-colors"
          >
            Sign up with email
          </button>
          <button
            type="button"
            onClick={handleSignUpSocial}
            className="w-full py-3 px-4 rounded-xl font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Social Media sign up
          </button>
        </div>

        {/* Close */}
        <div className="flex justify-center pb-6">
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
