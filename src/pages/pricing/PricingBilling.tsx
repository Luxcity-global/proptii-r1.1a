/**
 * Screen 7 — Day 30 Billing Prompt
 * Shown when the free trial is ending. User chooses to continue or move to free plan.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import '../../styles/pricing.css';

interface SelectedPlan {
  name: string;
  key: string;
  billing?: string;
  monthlyPrice?: number;
  annualPrice?: number;
  annualTotal?: number;
}

const PricingBilling: React.FC = () => {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<SelectedPlan | null>(null);
  const [selected, setSelected] = useState<'paid' | 'free'>('paid');

  useEffect(() => {
    const raw = sessionStorage.getItem('selectedPlan');
    if (raw) {
      try { setPlan(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, []);

  const billing = plan?.billing ?? 'annual';
  const price = billing === 'annual' ? plan?.annualTotal : plan?.monthlyPrice;
  const billingDesc = billing === 'annual' ? 'Annual billing · best value' : 'Monthly billing';
  const priceLabel = billing === 'annual' ? `£${price}` : `£${price}`;
  const perLabel = billing === 'annual' ? '/ year' : '/ month';

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
        <div className="pr-flow-wrap pr-fade-in" style={{ maxWidth: '560px' }}>
          <div className="pr-flow-card">
            <h1 style={{ fontSize: '24px', lineHeight: 1.25 }}>Your free month is up — what would you like to do?</h1>
            <p className="lead">No rush. Choose what works for you.</p>

            {/* Option: Continue with paid plan */}
            <div
              className={`pr-option${selected === 'paid' ? ' selected' : ''}`}
              onClick={() => setSelected('paid')}
            >
              <div className="pr-option-head">
                <div className="pr-radio" />
                <div className="pr-opt-title">
                  <div className="pr-opt-name">Continue with {plan?.name ?? 'your plan'}</div>
                  <div className="pr-opt-desc">{billingDesc}</div>
                </div>
                <div className="pr-opt-price">
                  <div className="amt">{priceLabel}</div>
                  <div className="per">{perLabel}</div>
                </div>
              </div>

              {selected === 'paid' && (
                <div className="pr-option-body">
                  <form onSubmit={handlePaySubmit}>
                    <div className="pr-field">
                      <input type="text" placeholder="Card number" style={{ borderRadius: '12px', padding: '11px 14px', fontSize: '14px' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="pr-field">
                        <input type="text" placeholder="MM / YY" style={{ borderRadius: '12px', padding: '11px 14px', fontSize: '14px' }} />
                      </div>
                      <div className="pr-field">
                        <input type="text" placeholder="CVC" style={{ borderRadius: '12px', padding: '11px 14px', fontSize: '14px' }} />
                      </div>
                    </div>
                    <button type="submit" className="pr-btn pr-btn-primary pr-btn-block" style={{ marginTop: '6px' }}>
                      Start my subscription — {priceLabel}{perLabel}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Option: Move to free plan */}
            <div
              className={`pr-option${selected === 'free' ? ' selected' : ''}`}
              onClick={() => setSelected('free')}
            >
              <div className="pr-option-head">
                <div className="pr-radio" />
                <div className="pr-opt-title">
                  <div className="pr-opt-name">Move to the free plan</div>
                  <div className="pr-opt-desc">Explorer — core search and basic features</div>
                </div>
                <div className="pr-opt-price">
                  <div className="amt">£0</div>
                  <div className="per">/ month</div>
                </div>
              </div>

              {selected === 'free' && (
                <div className="pr-option-body">
                  <button
                    onClick={() => navigate('/')}
                    className="pr-btn pr-btn-ghost pr-btn-block"
                    style={{ marginTop: '6px' }}
                  >
                    Continue with free plan
                  </button>
                </div>
              )}
            </div>

            <p style={{ fontSize: '13px', color: 'var(--pr-muted)', marginTop: '18px', lineHeight: 1.55, textAlign: 'center' }}>
              Choosing the free plan keeps all your data and saved properties. Nothing is deleted.
            </p>

            <a
              href="mailto:contactus@luxcity.co.uk"
              style={{
                display: 'block',
                textAlign: 'center',
                marginTop: '22px',
                fontSize: '13px',
                color: 'var(--pr-muted)',
                textDecoration: 'none',
                paddingTop: '16px',
                borderTop: '1px solid var(--pr-border)',
              }}
              onMouseEnter={(e) => { (e.target as HTMLAnchorElement).style.color = 'var(--pr-navy)'; (e.target as HTMLAnchorElement).style.textDecoration = 'underline'; }}
              onMouseLeave={(e) => { (e.target as HTMLAnchorElement).style.color = 'var(--pr-muted)'; (e.target as HTMLAnchorElement).style.textDecoration = 'none'; }}
            >
              Need more time? Contact us →
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PricingBilling;
