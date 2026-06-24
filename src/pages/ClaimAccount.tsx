import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import quickRequestService, { ValidateClaimResponse } from '../services/quickRequestService';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

const getCleanErrorMessage = (err: any, fallback: string): string => {
  const apiCode = err.response?.data?.error?.code;
  const apiMessage = err.response?.data?.error?.message;

  if (apiCode === 'CLAIM_TOKEN_EXPIRED') {
    return 'This claim link has expired (links are valid for 30 days).';
  }
  if (apiCode === 'CLAIM_TOKEN_NOT_FOUND') {
    return 'This claim link is invalid or has already been used.';
  }
  if (apiCode === 'GHOST_ACCOUNT_ALREADY_CLAIMED') {
    return 'This account has already been claimed. Please log in to your Proptii account.';
  }
  if (apiMessage) {
    return apiMessage;
  }
  if (err.message && !err.message.includes('status code')) {
    return err.message;
  }
  return fallback;
};

const ClaimAccount: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { isAuthenticated, login, user } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimData, setClaimData] = useState<ValidateClaimResponse | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  // Email resend state
  const [emailForResend, setEmailForResend] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setError('No claim token was provided in the URL.');
        setIsLoading(false);
        return;
      }

      try {
        const data = await quickRequestService.validateClaimToken(token);
        setClaimData(data);
        setIsLoading(false);
      } catch (err: any) {
        setError(getCleanErrorMessage(err, 'This claim link is invalid or has expired.'));
        setIsLoading(false);
      }
    };

    validate();
  }, [token]);

  useEffect(() => {
    // If the token is validated and the user is authenticated, automatically trigger the claim confirmation
    const confirm = async () => {
      if (!token || !claimData || !isAuthenticated || !user || isClaiming || claimSuccess) {
        return;
      }

      setIsClaiming(true);
      setError(null);

      try {
        await quickRequestService.confirmClaim(token);
        setClaimSuccess(true);
        setTimeout(() => {
          navigate('/dashboard/messages');
        }, 3000);
      } catch (err: any) {
        setError(getCleanErrorMessage(err, 'Failed to link your guest account. Please try again.'));
        setIsClaiming(false);
      }
    };

    confirm();
  }, [token, claimData, isAuthenticated, user, isClaiming, claimSuccess, navigate]);

  const handleLogin = () => {
    // Store redirect so AuthRedirectHandler brings us back to this page with token to complete claim
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
    login();
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForResend.trim()) return;

    setResendStatus('sending');
    setResendError(null);

    try {
      await quickRequestService.resendClaimToken(emailForResend.trim());
      setResendStatus('success');
    } catch (err: any) {
      setResendError(getCleanErrorMessage(err, 'Failed to request new claim link.'));
      setResendStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <div className="bg-[#0F2537] border border-[#1A3A4F] rounded-2xl p-8 max-w-md w-full shadow-xl text-center">
        
        {/* Logo */}
        <img src="/images/proptii-logo.png" alt="Proptii Logo" className="h-10 mx-auto mb-6" />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-10 h-10 text-[#D95B00] animate-spin mb-4" />
            <h2 className="text-lg font-bold text-white">Validating claim token...</h2>
            <p className="text-gray-300 text-sm mt-1">Please wait while we check your verification details.</p>
          </div>
        ) : error && !claimData ? (
          <div className="py-4">
            <div className="w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-800">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Claim Link Invalid</h2>
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              {error}
            </p>

            {/* Resend Claim Token Section */}
            <div className="border-t border-[#1A3A4F] pt-6 text-left">
              <h4 className="text-sm font-semibold text-white mb-2">Need a new link?</h4>
              {resendStatus === 'success' ? (
                <div className="p-3 bg-emerald-900/30 border border-emerald-800 text-emerald-400 rounded-lg text-xs font-medium">
                  Success! If an account matches that email, a new claim link has been sent.
                </div>
              ) : (
                <form onSubmit={handleResend} className="space-y-3">
                  {resendError && (
                    <div className="text-xs text-red-400 bg-red-900/30 border border-red-800 p-2 rounded">
                      {resendError}
                    </div>
                  )}
                  <input
                    type="email"
                    value={emailForResend}
                    onChange={(e) => setEmailForResend(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="w-full px-4 py-3 bg-[#1A3A4F] border border-[#2C5B81] rounded-xl text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#D95B00] focus:ring-1 focus:ring-[#D95B00] transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={resendStatus === 'sending'}
                    className="w-full bg-[#D95B00] hover:bg-[#c45200] text-white font-medium py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
                  >
                    {resendStatus === 'sending' ? 'Sending...' : 'Request New Link'}
                  </button>
                </form>
              )}
            </div>

            <button
              onClick={() => navigate('/')}
              className="mt-6 w-full border border-[#2C5B81] text-gray-300 py-3 rounded-xl text-sm font-semibold hover:bg-[#1A3A4F] transition-colors"
            >
              Return to Homepage
            </button>
          </div>
        ) : claimSuccess ? (
          <div className="py-6">
            <div className="w-16 h-16 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-800">
              <Check className="w-8 h-8 text-emerald-400 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Account Linked!</h2>
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              Your guest conversation has been successfully linked to your permanent Proptii account.
              Redirecting you to your messages...
            </p>
            <button
              onClick={() => navigate('/dashboard/messages')}
              className="w-full bg-[#D95B00] hover:bg-[#c45200] text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm"
            >
              Go to Messages
            </button>
          </div>
        ) : isClaiming ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-10 h-10 text-[#D95B00] animate-spin mb-4" />
            <h2 className="text-lg font-bold text-white">Linking your account...</h2>
            <p className="text-gray-300 text-sm mt-1">Please wait while we merge your conversations.</p>
          </div>
        ) : (
          <div>
            <h2 className="text-[22px] font-bold text-white mb-3">Claim Your Account</h2>
            <p className="text-gray-300 text-sm mb-8 leading-relaxed">
              Hello <strong className="text-white font-bold">{claimData?.name || claimData?.email}</strong>!
              Verify your permanent account to secure your message history and unlock unlimited chat.
            </p>

            {error && (
              <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-sm text-red-400 mb-4 text-left">
                {error}
              </div>
            )}

            <div className="bg-[#1A3A4F] border border-[#2C5B81] rounded-xl p-5 text-left mb-8 space-y-3.5">
              <div className="flex items-start gap-3 text-sm text-gray-200">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" strokeWidth={3} />
                <span>Access conversation history from any device</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-200">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" strokeWidth={3} />
                <span>Send unlimited replies to landlords/agents</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-200">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" strokeWidth={3} />
                <span>Schedule viewings, submit references, and sign agreements</span>
              </div>
            </div>

            <button
              onClick={handleLogin}
              className="w-full bg-[#D95B00] hover:bg-[#c45200] text-white font-bold py-4 px-6 rounded-xl transition-colors mb-4"
            >
              Register / Log In with Azure AD
            </button>
            <p className="text-gray-400 text-xs font-medium">
              Note: Logging in with a permanent account verifies your email and connects it with this thread.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimAccount;
