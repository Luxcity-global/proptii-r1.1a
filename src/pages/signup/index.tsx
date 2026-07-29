import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePlan } from '../../hooks/usePlan';
import PricingPage from '../pricing';
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
import '../../styles/pricing.css';

/**
 * S2-11–14 — Account check modal over dimmed pricing page.
 */
const SignupModalPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading, login, user } = useAuth();

  const planId = searchParams.get('plan') ?? '';
  const cycle = (searchParams.get('cycle') as BillingCycle) || 'annual';
  const plan = usePlan(planId);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !planId) return;

    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      navigate(
        `/billing/confirmed?session_id=${encodeURIComponent(sessionId)}`,
        { replace: true },
      );
      return;
    }

    if (hasPostStripeCheckout()) {
      navigate('/billing/confirmed', { replace: true });
      return;
    }

    if (hasPendingStripeCheckout() && getPricingFlow() === 'pay_now') {
      navigate(payNowUrl(planId, cycle), { replace: true });
      return;
    }

    const returnPath = sessionStorage.getItem('redirectAfterLogin');
    if (returnPath?.includes('/signup/pay-now') || returnPath?.includes('/billing/')) {
      sessionStorage.removeItem('redirectAfterLogin');
      sessionStorage.removeItem('signup_auto_msal_for_paynow');
      navigate(returnPath, { replace: true });
      return;
    }

    if (getPricingFlow() === 'pay_now') {
      navigate(payNowUrl(planId, cycle), { replace: true });
      return;
    }

    const goWelcome = async () => {
      try {
        await setPendingPlan(planId, cycle);
      } catch {
        /* non-blocking if Cosmos unavailable */
      }
      setPricingFlow('trial');
      navigate(welcomeUrl(planId, cycle), { replace: true });
    };

    goWelcome();
  }, [isLoading, isAuthenticated, planId, cycle, navigate]);

  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    const returnPath = sessionStorage.getItem('redirectAfterLogin') ?? '';
    if (!returnPath.includes('pay-now')) return;
    if (sessionStorage.getItem('signup_auto_msal_for_paynow') === '1') return;
    sessionStorage.setItem('signup_auto_msal_for_paynow', '1');

    void (async () => {
      setBusy(true);
      setError(null);
      try {
        await login();
      } catch {
        setError('Sign-in was cancelled or failed. Please try again.');
        sessionStorage.removeItem('signup_auto_msal_for_paynow');
      } finally {
        setBusy(false);
      }
    })();
  }, [isLoading, isAuthenticated, login]);

  const handleMsalSignIn = async () => {
    setBusy(true);
    setError(null);
    const existingReturn = sessionStorage.getItem('redirectAfterLogin');
    if (!existingReturn?.includes('pay-now') && !existingReturn?.includes('/billing/')) {
      setPricingFlow('trial');
      sessionStorage.setItem(
        'redirectAfterLogin',
        welcomeUrl(planId || 'renter_pro', cycle),
      );
    }
    try {
      await login();
    } catch {
      setError('Sign-in was cancelled or failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleEmailContinue = () => {
    if (!planId) return;
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address.');
      return;
    }
    navigate(createAccountUrl(planId, cycle, trimmed));
  };

  const handleClose = () => navigate('/pricing');

  return (
    <div className="pr-page min-h-screen flex flex-col relative">
      <PricingPage dimmed hideShell />

      <div
        className="pr-signup-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signup-modal-title"
      >
        <div className="pr-signup-modal pr-fade-in">
          <button
            type="button"
            className="pr-signup-close"
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>

          {plan && (
            <p className="pr-signup-eyebrow">{plan.name}</p>
          )}

          <h1 id="signup-modal-title">Continue to Proptii</h1>
          <p className="pr-signup-lead">
            Sign in with your Microsoft account, or continue with email to create
            one.
          </p>

          <button
            type="button"
            className="pr-btn pr-btn-primary pr-btn-block"
            onClick={handleMsalSignIn}
            disabled={busy || isLoading}
          >
            {busy ? 'Opening sign-in…' : 'Continue with your account'}
          </button>

          <div className="pr-signup-divider">
            <span>or</span>
          </div>

          <div className="pr-field">
            <label htmlFor="signup-email">Email address</label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={user?.email ?? 'you@example.com'}
            />
          </div>

          <button
            type="button"
            className="pr-btn pr-btn-ghost pr-btn-block"
            onClick={handleEmailContinue}
            disabled={!planId}
          >
            Continue with email
          </button>

          {error && <p className="pr-signup-error">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default SignupModalPage;
