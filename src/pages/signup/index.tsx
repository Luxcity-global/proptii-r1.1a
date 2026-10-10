import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePlan } from '../../hooks/usePlan';
import {
  createAccountUrl,
  getPricingFlow,
  hasPendingStripeCheckout,
  hasPostStripeCheckout,
  payNowUrl,
  setPricingFlow,
  welcomeUrl,
} from '../../utils/pricingRoutes';
import { setPendingPlan } from '../../services/billingService';
import type { BillingCycle } from '../../components/pricing/PricingBillingToggle';

import { trackEvent } from '../../utils/analytics';
import '../../styles/pricing.css';

const DedicatedSignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading, login, user } = useAuth();
  const hasHandledAuthRedirect = useRef(false);

  const isFromCampaign = searchParams.get('from') === 'campaign';

  // Resolve plan
  const planId = searchParams.get('plan') || 'starter';
  const cycle = (searchParams.get('cycle') as BillingCycle) || 'monthly';
  const plan = usePlan(planId);

  const [email, setEmail] = useState(() => {
    return searchParams.get('email') || sessionStorage.getItem('pending_registration_email') || '';
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const campaignLead = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('proptii_campaign_lead');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  // Auth redirect logic
  useEffect(() => {
    if (isLoading || !isAuthenticated || hasHandledAuthRedirect.current) return;

    // Check Stripe callbacks
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      hasHandledAuthRedirect.current = true;
      navigate(`/billing/confirmed?session_id=${encodeURIComponent(sessionId)}`, { replace: true });
      return;
    }

    if (hasPostStripeCheckout()) {
      hasHandledAuthRedirect.current = true;
      navigate('/billing/confirmed', { replace: true });
      return;
    }

    if (hasPendingStripeCheckout() && getPricingFlow() === 'pay_now') {
      hasHandledAuthRedirect.current = true;
      navigate(payNowUrl(planId, cycle), { replace: true });
      return;
    }

    const returnPath = sessionStorage.getItem('redirectAfterLogin');
    if (returnPath?.includes('/signup/pay-now') || returnPath?.includes('/billing/')) {
      hasHandledAuthRedirect.current = true;
      sessionStorage.removeItem('redirectAfterLogin');
      sessionStorage.removeItem('signup_auto_msal_for_paynow');
      navigate(returnPath, { replace: true });
      return;
    }

    if (getPricingFlow() === 'pay_now') {
      hasHandledAuthRedirect.current = true;
      navigate(payNowUrl(planId, cycle), { replace: true });
      return;
    }

    // If coming from welcome campaign or has an active trial plan request
    const hasExplicitPlan = Boolean(searchParams.get('plan'));
    if (isFromCampaign || hasExplicitPlan) {
      hasHandledAuthRedirect.current = true;
      const goWelcome = async () => {
        try {
          await setPendingPlan(planId, cycle);
        } catch {
          /* best-effort */
        }
        setPricingFlow('trial');
        navigate(welcomeUrl(planId, cycle), { replace: true });
      };
      goWelcome();
      return;
    }

    // Direct role-based dashboard landing
    hasHandledAuthRedirect.current = true;
    const isLandlordOrAgent =
      user?.roles?.includes('landlord') ||
      user?.roles?.includes('agent');

    const targetDashboard = isLandlordOrAgent ? '/landlord' : '/dashboard';
    navigate(targetDashboard, { replace: true });
  }, [isLoading, isAuthenticated, planId, cycle, navigate, searchParams, user?.roles, isFromCampaign]);

  // Google Sign-up action
  const handleGoogleSignUp = async () => {
    try {
      setBusy(true);
      setError(null);
      // Ensure no stale role intent is present so the user goes to /select-role
      sessionStorage.removeItem('proptii_signup_role_intent');

      trackEvent('signup_google_started', {
        plan_id: planId,
        from_campaign: isFromCampaign,
      });

      await login();
    } catch (err: any) {
      console.error('Google sign-up failed:', err);
      setError(err?.message || 'Google sign-up was cancelled or failed. Please try again.');
      setBusy(false);
    }
  };

  // Auto-trigger Google Auth if provider=google param is present
  const autoGoogleTriggered = useRef(false);
  useEffect(() => {
    if (
      searchParams.get('provider') === 'google' &&
      !isAuthenticated &&
      !isLoading &&
      !busy &&
      !autoGoogleTriggered.current
    ) {
      autoGoogleTriggered.current = true;
      handleGoogleSignUp();
    }
  }, [searchParams, isAuthenticated, isLoading, busy]);

  // Email continue action
  const handleEmailContinue = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    // Ensure no stale role intent is present so the user goes to /select-role
    sessionStorage.removeItem('proptii_signup_role_intent');
    sessionStorage.setItem('pending_registration_email', trimmed);
    navigate(createAccountUrl(planId, cycle, trimmed));
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-gradient-to-br from-slate-50 via-blue-50/50 to-orange-50/50 relative overflow-hidden font-sans">
      {/* Ambient background glow elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-[#136C9E]/15 to-transparent blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tl from-[#DC5F12]/15 to-transparent blur-[100px] pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-8 flex items-center justify-between relative z-10">
        <Link to="/" className="flex items-center gap-3 transition-transform hover:scale-105 active:scale-95">
          <img src="/images/proptii-logo.png" alt="Proptii" className="h-10 w-auto object-contain" />
        </Link>
        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
          <span className="hidden sm:inline">Already have an account?</span>
          <Link
            to="/login"
            className="text-[#DC5F12] font-bold hover:text-[#E65D24] transition-colors relative group"
          >
            Sign in
            <span className="inline-block transition-transform group-hover:translate-x-1 ml-1">&rarr;</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10 my-4">
        <div className="w-full max-w-[480px] bg-white/70 backdrop-blur-2xl rounded-[2.5rem] p-8 sm:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-white/60 relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#136C9E] via-[#DC5F12] to-[#136C9E]" />
          {/* VIP Campaign Badge */}
          {(isFromCampaign || campaignLead) && (
            <div className="mb-5 p-3 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center gap-3 text-amber-900 shadow-sm">
              <span className="text-xl leading-none">✨</span>
              <div className="text-xs">
                <span className="font-bold block text-amber-950 text-sm">
                  1-Month VIP Free Trial Included
                </span>
                Full access to {plan?.name || 'Starter'} plan with no credit card required today.
              </div>
            </div>
          )}

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F2537] tracking-tight mb-3">
              Create an account
            </h1>
            <p className="text-slate-500 text-sm sm:text-base font-medium">
              Join thousands of UK landlords, agents, and tenants on Proptii.
            </p>
          </div>


          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Primary Action: Google Sign Up */}
          <div className="space-y-4 mb-8">
            <button
              id="signup-google-btn"
              type="button"
              onClick={handleGoogleSignUp}
              disabled={busy || isLoading}
              className="group w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-100 hover:border-[#136C9E]/30 text-slate-700 px-4 py-4 rounded-2xl font-bold hover:bg-blue-50/30 transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
            >
              {busy ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-slate-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg width="22" height="22" viewBox="0 0 24 24" className="flex-shrink-0 transition-transform group-hover:scale-110">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                    <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9c0-.4 0-.8 0-1.4z" />
                    <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z" />
                  </svg>
                  <span className="text-[15px]">Continue with Google</span>
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-8 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white/70 px-4 text-xs font-bold text-slate-400 tracking-widest uppercase">
              Or
            </span>
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailContinue} className="space-y-5">
            <div>
              <label htmlFor="signup-email" className="block text-sm font-bold text-slate-700 mb-2">
                Work or personal email
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. alex@example.com"
                className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl text-base focus:outline-none focus:border-[#136C9E] focus:ring-4 focus:ring-[#136C9E]/10 transition-all bg-white placeholder-slate-400 font-medium"
              />
            </div>

            <button
              type="submit"
              className="group w-full py-4 px-5 bg-gradient-to-r from-[#0F2537] to-[#136C9E] hover:from-[#136C9E] hover:to-[#0F2537] text-white font-bold rounded-2xl text-[15px] transition-all duration-300 shadow-[0_8px_20px_rgba(19,108,158,0.2)] hover:shadow-[0_12px_25px_rgba(19,108,158,0.3)] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Continue with email
              <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
            </button>
          </form>

          {/* Footer Terms */}
          <p className="text-[12px] text-slate-500 text-center mt-8 font-medium leading-relaxed">
            By signing up, you agree to Proptii&apos;s{' '}
            <Link to="/terms" className="underline hover:text-gray-600">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="underline hover:text-gray-600">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-4 text-center text-xs text-gray-400 relative z-10">
        &copy; {new Date().getFullYear()} Proptii Ltd. All rights reserved. &bull; Engineered for UK Portfolios 🇬🇧
      </footer>
    </div>
  );
};

export default DedicatedSignupPage;
