/**
 * Screen 8 — Subscription Confirmed
 * Calm confirmation screen after successful payment.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/pricing.css';

interface SelectedPlan {
  name: string;
  key: string;
  billing?: string;
  monthlyPrice?: number;
  annualPrice?: number;
  annualTotal?: number;
}

function getNextBillingDate(billing: string): string {
  const d = new Date();
  if (billing === 'annual') {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

const PricingConfirmed: React.FC = () => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<SelectedPlan | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('selectedPlan');
    if (raw) {
      try { setPlan(JSON.parse(raw)); } catch { /* ignore */ }
    }
    // Clear selected plan from session after confirmation
    sessionStorage.removeItem('selectedPlan');
  }, []);

  const billing = plan?.billing ?? 'annual';
  const amountCharged = billing === 'annual' ? plan?.annualTotal : plan?.monthlyPrice;
  const billingLabel = billing === 'annual' ? 'Annual' : 'Monthly';
  const nextDate = getNextBillingDate(billing);
  const userEmail = user?.email ?? '';

  return (
    <div className="pr-page min-h-screen flex flex-col">
      <div className="pr-bg-blobs" aria-hidden="true">
        <div className="pr-blob pr-blob-1" />
        <div className="pr-blob pr-blob-2" />
      </div>

      <Navbar hideServiceLinks />

      <main className="pr-content flex-1">
        <div className="pr-confirmed pr-fade-in">
          {/* Animated check */}
          <div className="pr-check-circle">
            <svg viewBox="0 0 24 24">
              <polyline points="5,12 10,17 19,7" />
            </svg>
          </div>

          <h1>You're all set.</h1>
          <p className="sub">
            Your <strong>{plan?.name ?? 'subscription'}</strong> is now active.
          </p>

          {/* Summary */}
          <div className="pr-summary" style={{ textAlign: 'left', borderRadius: '16px', padding: '22px 26px', marginBottom: '32px' }}>
            <div className="pr-summary-row">
              <span className="lbl">Plan</span>
              <span style={{ fontWeight: 600, color: 'var(--pr-navy)' }}>{plan?.name ?? '—'}</span>
            </div>
            <div className="pr-summary-row">
              <span className="lbl">Billing cycle</span>
              <span style={{ fontWeight: 600, color: 'var(--pr-navy)' }}>{billingLabel}</span>
            </div>
            <div className="pr-summary-row">
              <span className="lbl">Amount charged</span>
              <span style={{ fontFamily: 'Archivo, sans-serif', fontSize: '18px', fontWeight: 800, color: 'var(--pr-orange)' }}>
                £{amountCharged ?? '—'}.00
              </span>
            </div>
            <div className="pr-summary-row">
              <span className="lbl">Next billing date</span>
              <span style={{ fontWeight: 600, color: 'var(--pr-navy)' }}>{nextDate}</span>
            </div>
          </div>

          <Link to="/dashboard" className="pr-btn pr-btn-primary" style={{ padding: '14px 28px' }}>
            Go to your dashboard →
          </Link>

          <p style={{ fontSize: '13px', color: 'var(--pr-muted)', marginTop: '18px', lineHeight: 1.7 }}>
            {userEmail && (
              <>A receipt has been sent to <strong style={{ color: 'var(--pr-navy)' }}>{userEmail}</strong>.<br /></>
            )}
            Manage your billing any time in{' '}
            <Link to="/dashboard" style={{ color: 'var(--pr-orange)', textDecoration: 'none', fontWeight: 600 }}>
              account settings
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
};

export default PricingConfirmed;
