import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import UpgradeConfirmModal from '../../components/billing/UpgradeConfirmModal';
import { useBillingStatus } from '../../hooks/useBillingStatus';
import { usePlan } from '../../hooks/usePlan';
import { createBillingPortalSession } from '../../services/billingService';
import { getPlanById } from '../../config/plans';
import type { PlanId } from '../../config/plans';
import '../../styles/pricing.css';

function normalizePlanId(plan: string | null): string {
  return plan === 'free' ? 'explorer' : plan ?? 'explorer';
}

function statusLabel(status: string | null): string {
  if (!status) return 'No subscription';
  if (status === 'trialing') return 'Free month (trial)';
  if (status === 'active') return 'Active';
  if (status === 'past_due') return 'Payment issue';
  if (status === 'canceled') return 'Canceled';
  return status;
}

/** S4-09 — Account billing settings with Stripe Customer Portal. */
const AccountSettingsPage: React.FC = () => {
  const {
    plan,
    status,
    billingCadence,
    currentPeriodEnd,
    hasStripeCustomer,
    loading,
    refresh,
  } = useBillingStatus();
  const [portalBusy, setPortalBusy] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const displayPlanId = normalizePlanId(plan);
  const planConfig = usePlan(displayPlanId as PlanId) ?? getPlanById(displayPlanId as PlanId);
  const planName = planConfig?.name ?? 'Explorer';

  const cycleLabel = billingCadence === 'monthly' ? 'Monthly' : 'Annual';
  const nextBill = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  const openPortal = async () => {
    setPortalBusy(true);
    setPortalError(null);
    try {
      const { portalUrl } = await createBillingPortalSession();
      window.location.href = portalUrl;
    } catch (e) {
      setPortalError(
        e instanceof Error ? e.message : 'Could not open billing portal',
      );
      setPortalBusy(false);
    }
  };

  const handleManageBilling = () => {
    setShowUpgradeModal(true);
  };

  const handleUpgradeConfirm = async () => {
    await openPortal();
    setShowUpgradeModal(false);
  };

  return (
    <div className="pr-page min-h-screen flex flex-col">
      <Navbar hideServiceLinks />

      <main className="pr-content flex-1" style={{ paddingTop: 76 }}>
        <div className="pr-flow-wrap pr-fade-in" style={{ maxWidth: 560 }}>
          <div className="pr-flow-card">
            <h1>Account & billing</h1>
            <p className="lead">Manage your subscription and payment details.</p>

            <div
              className="pr-summary"
              style={{
                textAlign: 'left',
                borderRadius: 16,
                padding: '20px 22px',
                marginTop: 24,
                marginBottom: 24,
              }}
            >
              <div className="pr-summary-row">
                <span className="lbl">Current plan</span>
                <span style={{ fontWeight: 600, color: 'var(--pr-navy)' }}>
                  {loading ? '…' : planName}
                </span>
              </div>
              <div className="pr-summary-row">
                <span className="lbl">Status</span>
                <span style={{ fontWeight: 600, color: 'var(--pr-navy)' }}>
                  {loading ? '…' : statusLabel(status)}
                </span>
              </div>
              {plan && plan !== 'free' && (
                <>
                  <div className="pr-summary-row">
                    <span className="lbl">Billing cycle</span>
                    <span style={{ fontWeight: 600 }}>{cycleLabel}</span>
                  </div>
                  <div className="pr-summary-row">
                    <span className="lbl">Next billing date</span>
                    <span style={{ fontWeight: 600 }}>{nextBill}</span>
                  </div>
                </>
              )}
            </div>

            {portalError && (
              <p className="pr-signup-error" style={{ marginBottom: 16 }}>
                {portalError}
              </p>
            )}

            {hasStripeCustomer ? (
              <button
                type="button"
                className="pr-btn pr-btn-primary pr-btn-block"
                onClick={handleManageBilling}
                disabled={portalBusy || loading}
              >
                {portalBusy ? 'Opening Stripe…' : 'Manage billing'}
              </button>
            ) : (
              <p style={{ fontSize: 14, color: 'var(--pr-muted)', lineHeight: 1.6 }}>
                You&apos;re on the free Explorer plan.{' '}
                <Link to="/pricing" style={{ color: 'var(--pr-orange)', fontWeight: 600 }}>
                  View paid plans
                </Link>
              </p>
            )}

            <p style={{ marginTop: 20, fontSize: 13, color: 'var(--pr-muted)' }}>
              <button
                type="button"
                onClick={() => refresh()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--pr-orange)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  font: 'inherit',
                }}
              >
                Refresh status
              </button>
              {' · '}
              <Link to="/dashboard" style={{ color: 'var(--pr-orange)' }}>
                Back to dashboard
              </Link>
            </p>
          </div>
        </div>
      </main>

      <UpgradeConfirmModal
        open={showUpgradeModal}
        planName="your new plan in Stripe"
        amountLabel="the prorated amount shown in Stripe"
        onConfirm={handleUpgradeConfirm}
        onCancel={() => setShowUpgradeModal(false)}
        loading={portalBusy}
      />
    </div>
  );
};

export default AccountSettingsPage;
