/**
 * Screen 4 — Free Month Arrival
 * The celebratory landing page after successful sign-up / sign-in.
 */
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/pricing.css';

interface SelectedPlan {
  name: string;
  key: string;
  billing?: string;
}

const PricingArrival: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plan, setPlan] = useState<SelectedPlan | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('selectedPlan');
    if (raw) {
      try { setPlan(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, []);

  const userEmail = user?.email ?? '';
  const planName = plan?.name ?? 'your plan';

  return (
    <div className="pr-page min-h-screen flex flex-col">
      <div className="pr-bg-blobs" aria-hidden="true">
        <div className="pr-blob pr-blob-1" />
        <div className="pr-blob pr-blob-2" />
      </div>

      <Navbar hideServiceLinks />

      <main className="pr-content flex-1">
        <div className="pr-confirmed pr-fade-in">
          {/* Animated check circle */}
          <div className="pr-check-circle">
            <svg viewBox="0 0 24 24">
              <polyline points="5,12 10,17 19,7" />
            </svg>
          </div>

          <h1>Your free month has started.</h1>
          <p className="sub">
            Full access to <strong>{planName}</strong> — no card needed, no commitment.
          </p>

          {/* Timeline */}
          <div className="pr-timeline">
            <div className="pr-tstep active">
              <span className="tdot" />
              <span className="tlabel">Today<br />Full access begins</span>
            </div>
            <div className="pr-tstep">
              <span className="tdot" />
              <span className="tlabel">Day 27<br />We'll remind you</span>
            </div>
            <div className="pr-tstep">
              <span className="tdot" />
              <span className="tlabel">Day 30<br />Choose to continue</span>
            </div>
          </div>

          {/* Primary CTA */}
          <div style={{ marginTop: '8px' }}>
            <Link to="/dashboard" className="pr-btn pr-btn-primary" style={{ padding: '16px 36px', fontSize: '17px' }}>
              Go to your dashboard →
            </Link>
          </div>

          {userEmail && (
            <p style={{ fontSize: '13px', color: 'var(--pr-muted)', marginTop: '24px' }}>
              A confirmation has been sent to <strong style={{ color: 'var(--pr-navy)' }}>{userEmail}</strong>.
            </p>
          )}

          <button
            onClick={() => navigate('/pricing/pay-now')}
            style={{
              display: 'inline-block',
              marginTop: '14px',
              fontSize: '12px',
              color: 'var(--pr-muted)',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
              opacity: .8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'opacity .15s, color .15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--pr-navy)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '.8'; e.currentTarget.style.color = 'var(--pr-muted)'; }}
          >
            Rather commit now? You can pay today and skip the trial →
          </button>
        </div>
      </main>
    </div>
  );
};

export default PricingArrival;
