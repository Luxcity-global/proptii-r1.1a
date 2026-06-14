import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import OrderSummary from '../../components/billing/OrderSummary';
import PaymentForm from '../../components/billing/PaymentForm';
import { getPlanById, getStripePriceId, type PlanId } from '../../config/plans';
import {
  createCheckoutSession,
  setPendingPlan,
} from '../../services/billingService';
import {
  markPendingStripeCheckout,
  setPricingFlow,
  welcomeUrl,
} from '../../utils/pricingRoutes';
import { trackEvent } from '../../utils/analytics';
import type { BillingCycle } from '../../components/pricing/PricingBillingToggle';
import '../../styles/pricing.css';

/** S3-03–08 — Pay now (skip trial) via Stripe Checkout. */
const PayNowPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planId = (searchParams.get('plan') as PlanId) || 'renter_pro';
  const cycle = (searchParams.get('cycle') as BillingCycle) || 'annual';
  const plan = useMemo(() => getPlanById(planId), [planId]);

  useEffect(() => {
    setPricingFlow('pay_now');
  }, []);

  const dueAmount =
    cycle === 'annual' ? plan?.annualTotal : plan?.monthlyPrice;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;

    const priceId = getStripePriceId(plan, cycle);
    if (!priceId) {
      setError('This plan is not configured for checkout yet.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await setPendingPlan(planId, cycle);
      markPendingStripeCheckout('pay_now');
      trackEvent('billing_checkout_started', {
        plan_id: planId,
        cycle,
        trial_enabled: false,
      });
      const { checkoutUrl } = await createCheckoutSession(priceId, false);
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not start checkout',
      );
      setLoading(false);
    }
  };

  if (!plan) {
    return (
      <div className="pr-page min-h-screen flex flex-col">
        <Navbar hideServiceLinks />
        <main className="pr-content flex-1" style={{ paddingTop: 76 }}>
          <p style={{ textAlign: 'center', marginTop: 48 }}>Plan not found.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="pr-page min-h-screen flex flex-col">
      <div className="pr-bg-blobs" aria-hidden="true">
        <div className="pr-blob pr-blob-1" />
        <div className="pr-blob pr-blob-2" />
      </div>

      <Navbar hideServiceLinks />

      <main className="pr-content flex-1">
        <div className="pr-flow-wrap pr-fade-in">
          <div className="pr-flow-card">
            <h1>Skip the trial — start your plan today.</h1>
            <p className="lead">Pay now and your subscription begins immediately.</p>

            <OrderSummary plan={plan} cycle={cycle} />
            <PaymentForm />

            <form onSubmit={handlePay} style={{ marginTop: 20 }}>
              <button
                type="submit"
                className="pr-btn pr-btn-primary pr-btn-block"
                disabled={loading}
              >
                {loading
                  ? 'Redirecting to Stripe…'
                  : `Pay £${dueAmount ?? '—'} and start now`}
              </button>
            </form>

            {error && <p className="pr-signup-error">{error}</p>}

            <button
              type="button"
              onClick={() => {
                setPricingFlow('trial');
                navigate(welcomeUrl(planId, cycle));
              }}
              style={{
                display: 'block',
                textAlign: 'center',
                marginTop: 14,
                fontSize: 12,
                color: 'var(--pr-muted)',
                textDecoration: 'underline',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                width: '100%',
              }}
            >
              ← Actually, I&apos;d prefer the free month
            </button>

            <div className="pr-trust">
              <span>
                <svg viewBox="0 0 16 16">
                  <rect x="3" y="7" width="10" height="7" rx="1" />
                  <path d="M5 7V5a3 3 0 1 1 6 0v2" />
                </svg>
                Secured by Stripe
              </span>
              <span>
                <svg viewBox="0 0 16 16">
                  <path d="M8 1l6 2v5c0 4-3 6-6 7-3-1-6-3-6-7V3z" />
                </svg>
                PCI compliant
              </span>
              <span>
                <svg viewBox="0 0 16 16" strokeLinecap="round">
                  <line x1="4" y1="4" x2="12" y2="12" />
                  <line x1="12" y1="4" x2="4" y2="12" />
                </svg>
                Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PayNowPage;
