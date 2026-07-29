import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import CheckAnimation from '../../components/billing/CheckAnimation';
import { ProtectedRoute } from '../../components/common/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import { useBillingStatus } from '../../hooks/useBillingStatus';
import { usePlan } from '../../hooks/usePlan';
import {
  createCheckoutSession,
  resolveStripePriceId,
  setPendingPlan,
  CHECKOUT_NOT_CONFIGURED_MSG,
} from '../../services/billingService';
import { getPlanById, type PlanId } from '../../config/plans';
import {
  getPricingFlow,
  hasPostStripeCheckout,
  markPendingStripeCheckout,
  payNowUrl,
  setPricingFlow,
} from '../../utils/pricingRoutes';
import type { BillingCycle } from '../../components/pricing/PricingBillingToggle';
import { trackEvent } from '../../utils/analytics';
import '../../styles/pricing.css';

const WelcomeContent: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { pendingPlan, pendingCycle, status, loading } = useBillingStatus();
  const checkoutStarted = useRef(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [redirectingToStripe, setRedirectingToStripe] = useState(false);

  const planId =
    (searchParams.get('plan') as PlanId) ||
    (pendingPlan as PlanId) ||
    'renter_pro';
  const cycle =
    (searchParams.get('cycle') as BillingCycle) ||
    (pendingCycle as BillingCycle) ||
    'annual';

  const plan = usePlan(planId) ?? getPlanById(planId);
  const planName = plan?.name ?? 'your plan';

  useEffect(() => {
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

    if (loading || checkoutStarted.current) return;
    if (plan?.isFree || plan?.isContactSales) return;
    if (status === 'trialing' || status === 'active') return;

    if (getPricingFlow() === 'pay_now') {
      navigate(payNowUrl(planId, cycle), { replace: true });
      return;
    }

    if (getPricingFlow() !== 'trial') {
      return;
    }

    const runCheckout = async () => {
      checkoutStarted.current = true;
      setRedirectingToStripe(true);
      const priceId = await resolveStripePriceId(planId, cycle);
      if (!priceId) {
        setRedirectingToStripe(false);
        setCheckoutError(CHECKOUT_NOT_CONFIGURED_MSG);
        return;
      }

      try {
        try {
          await setPendingPlan(planId, cycle);
        } catch {
          /* best-effort */
        }
        markPendingStripeCheckout('trial');
        trackEvent('billing_checkout_started', {
          plan_id: planId,
          cycle,
          trial_enabled: true,
        });
        const { checkoutUrl } = await createCheckoutSession(priceId, true, {
          planId,
          cycle,
        });
        window.location.href = checkoutUrl;
      } catch (e) {
        checkoutStarted.current = false;
        setRedirectingToStripe(false);
        setCheckoutError(
          e instanceof Error ? e.message : 'Could not start checkout',
        );
      }
    };

    runCheckout();
  }, [loading, status, plan, planId, cycle, navigate]);

  return (
    <div className="pr-page min-h-screen flex flex-col">
      <div className="pr-bg-blobs" aria-hidden="true">
        <div className="pr-blob pr-blob-1" />
        <div className="pr-blob pr-blob-2" />
      </div>

      <Navbar hideServiceLinks />

      <main className="pr-content flex-1">
        {redirectingToStripe ? (
          <div className="pr-confirmed pr-fade-in" style={{ textAlign: 'center' }}>
            <div
              className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-6"
              aria-hidden="true"
            />
            <h1>Redirecting to secure checkout…</h1>
            <p className="sub">
              You&apos;ll confirm your <strong>{planName}</strong> free month on
              Stripe in a moment.
            </p>
          </div>
        ) : (
        <div className="pr-confirmed pr-fade-in">
          <CheckAnimation />

          <h1>Your free month has started.</h1>
          <p className="sub">
            Full access to <strong>{planName}</strong> — no card needed until day
            30.
          </p>

          <div className="pr-timeline">
            <div className="pr-tstep active">
              <span className="tdot" />
              <span className="tlabel">
                Today
                <br />
                Full access begins
              </span>
            </div>
            <div className="pr-tstep">
              <span className="tdot" />
              <span className="tlabel">
                Day 27
                <br />
                We&apos;ll remind you
              </span>
            </div>
            <div className="pr-tstep">
              <span className="tdot" />
              <span className="tlabel">
                Day 30
                <br />
                Choose to continue
              </span>
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <Link
              to="/dashboard"
              className="pr-btn pr-btn-primary"
              style={{ padding: '16px 36px', fontSize: '17px' }}
            >
              Go to your dashboard →
            </Link>
          </div>

          {user?.email && (
            <p style={{ fontSize: 13, color: 'var(--pr-muted)', marginTop: 24 }}>
              A confirmation has been sent to{' '}
              <strong style={{ color: 'var(--pr-navy)' }}>{user.email}</strong>.
            </p>
          )}

          {checkoutError && (
            <p className="pr-signup-error" style={{ marginTop: 16 }}>
              {checkoutError}
            </p>
          )}

          {!plan?.isFree && (
            <button
              type="button"
              onClick={() => {
                setPricingFlow('pay_now');
                navigate(payNowUrl(planId, cycle));
              }}
              style={{
                display: 'inline-block',
                marginTop: 14,
                fontSize: 12,
                color: 'var(--pr-muted)',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Rather commit now? Pay today and skip the trial →
            </button>
          )}
        </div>
        )}
      </main>
    </div>
  );
};

/** S2-17–19 — Welcome screen + background trial checkout. */
const SignupWelcomePage: React.FC = () => (
  <ProtectedRoute>
    <WelcomeContent />
  </ProtectedRoute>
);

export default SignupWelcomePage;
