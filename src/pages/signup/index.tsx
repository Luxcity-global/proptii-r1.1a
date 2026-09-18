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
import { getRoleIntent, setRoleIntent, type RoleIntentValue } from '../../utils/roleIntent';
import { trackEvent } from '../../utils/analytics';
import '../../styles/pricing.css';

const DedicatedSignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading, login, user } = useAuth();
  const hasHandledAuthRedirect = useRef(false);

  // Parse query parameters
  const rawRoleParam = searchParams.get('role')?.toLowerCase();
  const initialRole: RoleIntentValue = (rawRoleParam === 'landlord' || rawRoleParam === 'agent' || rawRoleParam === 'tenant')
    ? (rawRoleParam as RoleIntentValue)
    : (getRoleIntent() || 'landlord');

  const [selectedRole, setSelectedRole] = useState<RoleIntentValue>(initialRole);
  const isFromCampaign = searchParams.get('from') === 'campaign';

  // Resolve plan
  const defaultPlanForRole = selectedRole === 'agent' ? 'independent' : selectedRole === 'tenant' ? 'renter_pro' : 'starter';
  const planId = searchParams.get('plan') || defaultPlanForRole;
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

  // Synchronize role intent
  useEffect(() => {
    setRoleIntent(selectedRole);
    try {
      sessionStorage.setItem('proptii_signup_role_intent', selectedRole);
    } catch {}
  }, [selectedRole]);

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
      user?.roles?.includes('agent') ||
      selectedRole === 'landlord' ||
      selectedRole === 'agent';

    const targetDashboard = isLandlordOrAgent ? '/landlord' : '/dashboard';
    navigate(targetDashboard, { replace: true });
  }, [isLoading, isAuthenticated, planId, cycle, navigate, searchParams, user?.roles, selectedRole, isFromCampaign]);

  // Google Sign-up action
  const handleGoogleSignUp = async () => {
    try {
      setBusy(true);
      setError(null);
      setRoleIntent(selectedRole);
      sessionStorage.setItem('proptii_signup_role_intent', selectedRole);

      trackEvent('signup_google_started', {
        role: selectedRole,
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
    setRoleIntent(selectedRole);
    sessionStorage.setItem('proptii_signup_role_intent', selectedRole);
    sessionStorage.setItem('pending_registration_email', trimmed);
    navigate(createAccountUrl(planId, cycle, trimmed));
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-gradient-to-br from-blue-50 via-slate-50 to-orange-50 relative overflow-hidden font-sans">
      {/* Ambient background glow elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-[#136C9E]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-[#E65D24]/10 blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
          <img src="/images/proptii-logo.png" alt="Proptii" className="h-10 w-auto object-contain" />
        </Link>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="hidden sm:inline">Already have an account?</span>
          <Link
            to="/login"
            className="text-[#DC5F12] font-bold hover:underline transition-all"
          >
            Sign in &rarr;
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10 my-4">
        <div className="w-full max-w-lg bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-white">
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
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold text-[#0F2537] tracking-tight mb-2">
              Create your account
            </h1>
            <p className="text-gray-500 text-sm">
              Join thousands of UK landlords, agents, and tenants on Proptii.
            </p>
          </div>

          {/* Role Intent Selector */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              I am using Proptii as a:
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60">
              <button
                type="button"
                onClick={() => setSelectedRole('landlord')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200 flex flex-col items-center gap-1 ${
                  selectedRole === 'landlord'
                    ? 'bg-white text-[#DC5F12] shadow-sm scale-[1.02]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="text-lg">🏢</span>
                <span>Landlord</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('agent')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200 flex flex-col items-center gap-1 ${
                  selectedRole === 'agent'
                    ? 'bg-white text-[#136C9E] shadow-sm scale-[1.02]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="text-lg">📑</span>
                <span>Agent</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('tenant')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200 flex flex-col items-center gap-1 ${
                  selectedRole === 'tenant'
                    ? 'bg-white text-emerald-600 shadow-sm scale-[1.02]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="text-lg">🏠</span>
                <span>Tenant</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Primary Action: Google Sign Up */}
          <div className="space-y-4 mb-6">
            <button
              id="signup-google-btn"
              type="button"
              onClick={handleGoogleSignUp}
              disabled={busy || isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 hover:border-gray-200 text-gray-700 px-4 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-60"
            >
              {busy ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" className="flex-shrink-0">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                    <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9c0-.4 0-.8 0-1.4z" />
                    <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z" />
                  </svg>
                  <span>Sign up with Google</span>
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <span className="relative bg-white/80 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              or continue with email
            </span>
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailContinue} className="space-y-4">
            <div>
              <label htmlFor="signup-email" className="block text-xs font-bold text-gray-700 mb-1.5">
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E] focus:border-transparent transition-all bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-[#0F2537] hover:bg-[#136C9E] text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.99]"
            >
              Continue with email &rarr;
            </button>
          </form>

          {/* Footer Terms */}
          <p className="text-[11.5px] text-gray-400 text-center mt-6 leading-relaxed">
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
