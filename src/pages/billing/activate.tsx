import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import PaymentForm from '../../components/billing/PaymentForm';
import { useBillingStatus } from '../../hooks/useBillingStatus';
import { usePlan } from '../../hooks/usePlan';
import {
  createCheckoutSession,
  downgradeToFreePlan,
  resolveStripePriceId,
  CHECKOUT_NOT_CONFIGURED_MSG,
} from '../../services/billingService';
import { getPlanById, type PlanId } from '../../config/plans';
import type { BillingCycle } from '../../components/pricing/PricingBillingToggle';
import '../../styles/pricing.css';

/** S3-12–15 — Day-30 billing choice after trial expires. */
const BillingActivatePage: React.FC = () => {
  const navigate = useNavigate();
  const { plan, pendingPlan, pendingCycle, loading } = useBillingStatus();
  const [selected, setSelected] = useState<'paid' | 'free'>('paid');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planId = (pendingPlan ?? plan ?? 'renter_pro') as PlanId;
  const cycle = (pendingCycle as BillingCycle) || 'annual';
  const planConfig = usePlan(planId) ?? getPlanById(planId);

  const price = useMemo(() => {
    if (!planConfig) return null;
    return cycle === 'annual'
      ? planConfig.annualTotal
      : planConfig.monthlyPrice;
  }, [planConfig, cycle]);

  const handleContinuePaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planConfig) return;

    const priceId = await resolveStripePriceId(planId, cycle);
    if (!priceId) {
      setError(CHECKOUT_NOT_CONFIGURED_MSG);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const { checkoutUrl } = await createCheckoutSession(priceId, false);
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setBusy(false);
    }
  };

  const handleFreePlan = async () => {
    setBusy(true);
    setError(null);
    try {
      await downgradeToFreePlan();
      navigate('/dashboard?downgraded=true', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Downgrade failed');
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="pr-page min-h-screen flex flex-col">
        <Navbar hideServiceLinks />
        <main className="pr-content flex-1" style={{ paddingTop: 76 }}>
          <p style={{ textAlign: 'center', marginTop: 48 }}>Loading…</p>
        </main>
      </div>
    );
  }

  const billingDesc =
    cycle === 'annual' ? 'Annual billing · best value' : 'Monthly billing';
  const perLabel = cycle === 'annual' ? '/ year' : '/ month';

  return (
    <div className="pr-page min-h-screen flex flex-col">
      <div className="pr-bg-blobs" aria-hidden="true">
        <div className="pr-blob pr-blob-1" />
        <div className="pr-blob pr-blob-2" />
      </div>

      <Navbar hideServiceLinks />

      <main className="pr-content flex-1">
        <div className="pr-flow-wrap pr-fade-in" style={{ maxWidth: 560 }}>
          <div className="pr-flow-card">
            <h1 style={{ fontSize: 24, lineHeight: 1.25 }}>
              Your free month is up — what would you like to do?
            </h1>
            <p className="lead">No rush. Choose what works for you.</p>

            <div
              className={`pr-option${selected === 'paid' ? ' selected' : ''}`}
              onClick={() => setSelected('paid')}
              onKeyDown={(e) => e.key === 'Enter' && setSelected('paid')}
              role="button"
              tabIndex={0}
            >
              <div className="pr-option-head">
                <div className="pr-radio" />
                <div className="pr-opt-title">
                  <div className="pr-opt-name">
                    Continue with {planConfig?.name ?? 'your plan'}
                  </div>
                  <div className="pr-opt-desc">{billingDesc}</div>
                </div>
                <div className="pr-opt-price">
                  <div className="amt">£{price ?? '—'}</div>
                  <div className="per">{perLabel}</div>
                </div>
              </div>

              {selected === 'paid' && (
                <div className="pr-option-body">
                  <PaymentForm />
                  <form onSubmit={handleContinuePaid}>
                    <button
                      type="submit"
                      className="pr-btn pr-btn-primary pr-btn-block"
                      style={{ marginTop: 12 }}
                      disabled={busy}
                    >
                      {busy
                        ? 'Redirecting…'
                        : `Start my subscription — £${price ?? '—'}${perLabel}`}
                    </button>
                  </form>
                </div>
              )}
            </div>

            <div
              className={`pr-option${selected === 'free' ? ' selected' : ''}`}
              onClick={() => setSelected('free')}
              onKeyDown={(e) => e.key === 'Enter' && setSelected('free')}
              role="button"
              tabIndex={0}
            >
              <div className="pr-option-head">
                <div className="pr-radio" />
                <div className="pr-opt-title">
                  <div className="pr-opt-name">Move to the free plan</div>
                  <div className="pr-opt-desc">
                    Explorer — core search and basic features
                  </div>
                </div>
                <div className="pr-opt-price">
                  <div className="amt">£0</div>
                  <div className="per">/ month</div>
                </div>
              </div>

              {selected === 'free' && (
                <div className="pr-option-body">
                  <button
                    type="button"
                    onClick={handleFreePlan}
                    className="pr-btn pr-btn-ghost pr-btn-block"
                    disabled={busy}
                  >
                    Continue with free plan
                  </button>
                </div>
              )}
            </div>

            {error && <p className="pr-signup-error">{error}</p>}

            <p
              style={{
                fontSize: 13,
                color: 'var(--pr-muted)',
                marginTop: 18,
                lineHeight: 1.55,
                textAlign: 'center',
              }}
            >
              Choosing the free plan keeps all your data and saved properties.
            </p>

            <a
              href="mailto:support@proptii.com"
              style={{
                display: 'block',
                textAlign: 'center',
                marginTop: 22,
                fontSize: 13,
                color: 'var(--pr-muted)',
                textDecoration: 'none',
                paddingTop: 16,
                borderTop: '1px solid var(--pr-border)',
              }}
            >
              Need more time? Contact us →
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BillingActivatePage;
