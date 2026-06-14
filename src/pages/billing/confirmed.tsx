import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import CheckAnimation from '../../components/billing/CheckAnimation';
import { useAuth } from '../../contexts/AuthContext';
import { useBillingStatus } from '../../hooks/useBillingStatus';
import { usePlan } from '../../hooks/usePlan';
import {
  confirmCheckoutSession,
  createBillingPortalSession,
} from '../../services/billingService';
import { trackEvent } from '../../utils/analytics';
import { getPlanById } from '../../config/plans';
import {
  clearPendingStripeCheckout,
  clearPostStripeCheckout,
  clearPricingFlow,
  markPostStripeCheckout,
} from '../../utils/pricingRoutes';
import '../../styles/pricing.css';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function normalizePlanId(planId: string): string {
  return planId === 'free' ? 'explorer' : planId;
}

function formatMoney(
  planId: string,
  status: string | null,
  cycle: string | null,
): string {
  if (status === 'trialing') return '£0.00';
  const cfg = getPlanById(normalizePlanId(planId) as never);
  if (!cfg) return '—';
  const amount =
    cycle === 'monthly' ? cfg.monthlyPrice : cfg.annualTotal ?? cfg.monthlyPrice;
  return amount != null ? `£${Number(amount).toFixed(2)}` : '—';
}

/** S3-09–11 — Post-checkout confirmation at /billing/confirmed. */
const BillingConfirmedPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const {
    plan,
    status,
    currentPeriodEnd,
    pendingCycle,
    billingCadence,
    pendingPlan,
    loading,
    refresh,
  } = useBillingStatus();
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const displayPlanId =
    plan && plan !== 'free' ? plan : pendingPlan ?? plan ?? '';
  const displayCycle =
    billingCadence ?? pendingCycle ?? 'annual';
  const planConfig = usePlan(normalizePlanId(displayPlanId) as never);

  useEffect(() => {
    if (searchParams.get('session_id')) {
      markPostStripeCheckout();
    }
    clearPendingStripeCheckout();
    clearPricingFlow();
    sessionStorage.removeItem('redirectAfterLogin');
    sessionStorage.removeItem('redirect_in_progress');
    sessionStorage.removeItem('last_redirect_path');
    sessionStorage.removeItem('signup_auto_msal_for_paynow');

    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      refresh();
      return;
    }

    let cancelled = false;
    const sync = async () => {
      setSyncing(true);
      setSyncError(null);
      const delays = [0, 800, 1500, 2500, 4000];
      for (let i = 0; i < delays.length; i++) {
        if (cancelled) return;
        if (delays[i] > 0) {
          await new Promise((r) => setTimeout(r, delays[i]));
        }
        try {
          const synced = await confirmCheckoutSession(sessionId);
          await refresh();
          trackEvent('billing_checkout_completed', {
            plan: synced.plan,
            status: synced.status,
            billing_cadence: synced.billingCadence,
          });
          setSyncing(false);
          return;
        } catch (e) {
          const msg =
            e instanceof Error ? e.message : 'Could not sync subscription';
          if (i === delays.length - 1) {
            setSyncError(msg);
            setSyncing(false);
            await refresh();
          }
        }
      }
    };

    void sync();
    return () => {
      cancelled = true;
    };
  }, [refresh, searchParams]);

  const billingLabel =
    displayCycle === 'monthly' ? 'Monthly' : 'Annual';
  const planName = planConfig?.name ?? displayPlanId ?? 'your plan';
  const showLoading = loading || syncing;

  const handleManageBilling = async () => {
    try {
      const { portalUrl } = await createBillingPortalSession();
      window.location.href = portalUrl;
    } catch {
      /* user may not have customer yet */
    }
  };

  return (
    <div className="pr-page min-h-screen flex flex-col">
      <div className="pr-bg-blobs" aria-hidden="true">
        <div className="pr-blob pr-blob-1" />
        <div className="pr-blob pr-blob-2" />
      </div>

      <Navbar hideServiceLinks />

      <main className="pr-content flex-1">
        <div className="pr-confirmed pr-fade-in">
          <CheckAnimation />

          <h1>You&apos;re all set.</h1>
          <p className="sub">
            Your <strong>{planName}</strong> subscription is now{' '}
            {status === 'trialing' ? 'in your free month' : 'active'}.
          </p>
          {syncError && (
            <p style={{ color: '#b45309', fontSize: 14, marginBottom: 16 }}>
              {syncError} You can refresh this page or open Manage billing below.
            </p>
          )}

          <div
            className="pr-summary"
            style={{
              textAlign: 'left',
              borderRadius: 16,
              padding: '22px 26px',
              marginBottom: 32,
            }}
          >
            <div className="pr-summary-row">
              <span className="lbl">Plan</span>
              <span style={{ fontWeight: 600, color: 'var(--pr-navy)' }}>
                {showLoading ? '…' : planName}
              </span>
            </div>
            <div className="pr-summary-row">
              <span className="lbl">Billing cycle</span>
              <span style={{ fontWeight: 600, color: 'var(--pr-navy)' }}>
                {billingLabel}
              </span>
            </div>
            <div className="pr-summary-row">
              <span className="lbl">Amount charged</span>
              <span
                style={{
                  fontFamily: 'Archivo, sans-serif',
                  fontSize: 18,
                  fontWeight: 800,
                  color: 'var(--pr-orange)',
                }}
              >
                {formatMoney(displayPlanId, status, displayCycle)}
              </span>
            </div>
            <div className="pr-summary-row">
              <span className="lbl">Next billing date</span>
              <span style={{ fontWeight: 600, color: 'var(--pr-navy)' }}>
                {formatDate(currentPeriodEnd)}
              </span>
            </div>
          </div>

          <Link
            to="/dashboard"
            className="pr-btn pr-btn-primary"
            style={{ padding: '14px 28px' }}
            onClick={() => {
              sessionStorage.removeItem('redirectAfterLogin');
              sessionStorage.removeItem('redirect_in_progress');
              sessionStorage.removeItem('last_redirect_path');
              clearPostStripeCheckout();
            }}
          >
            Go to your dashboard →
          </Link>

          <p
            style={{
              fontSize: 13,
              color: 'var(--pr-muted)',
              marginTop: 18,
              lineHeight: 1.7,
            }}
          >
            {user?.email && (
              <>
                A receipt has been sent to{' '}
                <strong style={{ color: 'var(--pr-navy)' }}>{user.email}</strong>
                .
                <br />
              </>
            )}
            <button
              type="button"
              onClick={handleManageBilling}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--pr-orange)',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                fontFamily: 'inherit',
                fontSize: 'inherit',
              }}
            >
              Manage billing
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};

export default BillingConfirmedPage;
