/**
 * Screen 5 — Pay Now (Skip the Trial)
 * Frontend-only: no backend payment processing yet.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getPlanById } from '../../config/plans';
import type { PlanId } from '../../config/plans';
import '../../styles/pricing.css';

interface SelectedPlan {
  name: string;
  key: string;
  billing?: string;
  monthlyPrice?: number;
  annualPrice?: number;
  annualTotal?: number;
}

const PricingPayNow: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [plan, setPlan] = useState<SelectedPlan | null>(null);

  useEffect(() => {
    const planId = searchParams.get('plan') as PlanId | null;
    const cycle = (searchParams.get('cycle') as 'monthly' | 'annual') || 'annual';
    if (planId) {
      const cfg = getPlanById(planId);
      if (cfg) {
        setPlan({
          key: cfg.id,
          name: cfg.name,
          billing: cycle,
          monthlyPrice: cfg.monthlyPrice ?? undefined,
          annualPrice: cfg.annualPrice ?? undefined,
          annualTotal: cfg.annualTotal ?? undefined,
        });
        return;
      }
    }
    const raw = sessionStorage.getItem('selectedPlan');
    if (raw) {
      try { setPlan(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, [searchParams]);

  const billing = plan?.billing ?? 'annual';
  const price =
    billing === 'annual' ? plan?.annualTotal : plan?.monthlyPrice;
  const billingLabel = billing === 'annual' ? 'Annual' : 'Monthly';
  const priceLabel = billing === 'annual' ? `£${price} / year` : `£${price} / month`;
  const dueLabel = `£${price ?? '—'}`;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    // Frontend-only: navigate to confirmed page
    navigate('/pricing/confirmed');
  };

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

            {/* Summary */}
            <div className="pr-summary">
              <div className="pr-summary-row">
                <span className="lbl">Plan</span>
                <span>{plan?.name ?? '—'}</span>
              </div>
              <div className="pr-summary-row">
                <span className="lbl">Billing</span>
                <span>{billingLabel}</span>
              </div>
              <div className="pr-summary-row">
                <span className="lbl">Price</span>
                <span>{priceLabel}</span>
              </div>
              <div className="pr-summary-divider" />
              <div className="pr-summary-row pr-summary-due">
                <span>Due today</span>
                <span className="amt">{dueLabel}</span>
              </div>
            </div>

            {/* Card payment — Stripe Payment Element will replace this form in Sprint 3 */}
            <form onSubmit={handlePay}>
              <div className="pr-field">
                <label>Card number</label>
                <input type="text" placeholder="1234 5678 9012 3456" inputMode="numeric" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="pr-field">
                  <label>Expiry</label>
                  <input type="text" placeholder="MM / YY" />
                </div>
                <div className="pr-field">
                  <label>CVC</label>
                  <input type="text" placeholder="123" inputMode="numeric" />
                </div>
              </div>
              <div className="pr-field">
                <label>Name on card</label>
                <input type="text" placeholder="As shown on card" />
              </div>
              <button type="submit" className="pr-btn pr-btn-primary pr-btn-block" style={{ marginTop: '6px' }}>
                Pay {dueLabel} and start now
              </button>
            </form>

            <button
              onClick={() => navigate('/pricing/arrival')}
              style={{
                display: 'block',
                textAlign: 'center',
                marginTop: '14px',
                fontSize: '12px',
                color: 'var(--pr-muted)',
                textDecoration: 'none',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                width: '100%',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--pr-navy)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--pr-muted)'; }}
            >
              ← Actually, I'd prefer the free month
            </button>

            {/* Trust badges */}
            <div className="pr-trust">
              <span>
                <svg viewBox="0 0 16 16"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5 7V5a3 3 0 1 1 6 0v2"/></svg>
                Secured by Stripe
              </span>
              <span>
                <svg viewBox="0 0 16 16"><path d="M8 1l6 2v5c0 4-3 6-6 7-3-1-6-3-6-7V3z"/></svg>
                PCI compliant
              </span>
              <span>
                <svg viewBox="0 0 16 16" strokeLinecap="round"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>
                Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PricingPayNow;
