/**
 * Screen 2 — Plan Selected
 * Shown as a full page (overlaying a dimmed pricing background) after a user picks a paid plan.
 * Uses Azure AD B2C via MSAL (not Google) for sign-in / sign-up.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/pricing.css';

interface SelectedPlan {
  key: string;
  name: string;
  audience: string;
  billing?: string;
  monthlyPrice?: number;
  annualPrice?: number;
  annualTotal?: number;
}

const PlanSelected: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [plan, setPlan] = useState<SelectedPlan | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('selectedPlan');
    if (raw) {
      try { setPlan(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, []);

  // If already authenticated, skip straight to arrival
  useEffect(() => {
    if (isAuthenticated && plan) {
      navigate('/pricing/arrival', { replace: true });
    }
  }, [isAuthenticated, plan, navigate]);

  const handleSignIn = async () => {
    // Store redirect target so AuthRedirectHandler sends user to arrival page
    sessionStorage.setItem('redirectAfterLogin', '/pricing/arrival');
    await login();
  };

  const handleClose = () => {
    navigate('/pricing');
  };

  const planName = plan?.name ?? 'your plan';

  return (
    <div className="pr-page" style={{ minHeight: '100vh' }}>
      {/* Dimmed pricing page peek behind */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--pr-cream)',
          zIndex: 1,
          opacity: .4,
          pointerEvents: 'none',
          padding: '80px 60px',
          overflow: 'hidden',
        }}
      >
        <h1 style={{ fontFamily: 'Archivo, sans-serif', fontSize: '56px', fontWeight: 800, textAlign: 'center', color: 'var(--pr-navy)', marginTop: '80px' }}>
          The right plan for every move.
        </h1>
        <div style={{ display: 'flex', gap: '20px', maxWidth: '1080px', margin: '60px auto' }}>
          {[false, true, false].map((mid, i) => (
            <div key={i} style={{ flex: 1, height: '380px', background: '#fff', border: mid ? '2px solid var(--pr-green-dark)' : '1px solid var(--pr-border)', borderRadius: '24px' }} />
          ))}
        </div>
      </div>

      {/* Modal overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(14,43,71,0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <div
          role="dialog"
          aria-labelledby="planModalTitle"
          style={{
            background: '#fff',
            width: '480px',
            maxWidth: '100%',
            borderRadius: '24px',
            padding: '36px 36px 28px',
            position: 'relative',
            animation: 'prCheckPop .35s cubic-bezier(.2,.8,.2,1) both',
          }}
        >
          {/* Close button */}
          <button
            aria-label="Close"
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '18px',
              right: '18px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: 'var(--pr-cream)',
              color: 'var(--pr-navy)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              lineHeight: 1,
            }}
          >
            ×
          </button>

          {/* Eyebrow */}
          <div style={{
            display: 'inline-block',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            color: 'var(--pr-orange)',
            background: 'var(--pr-orange-light)',
            padding: '5px 12px',
            borderRadius: '20px',
            marginBottom: '14px',
          }}>
            You chose {planName}
          </div>

          <h2 id="planModalTitle" style={{ fontFamily: 'Archivo, sans-serif', fontSize: '26px', fontWeight: 800, letterSpacing: '-.02em', marginBottom: '8px', color: 'var(--pr-navy)' }}>
            Let's get you set up.
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--pr-muted)', marginBottom: '24px' }}>
            Your free month starts the moment you're in.
          </p>

          {/* Azure AD B2C Sign-in button (replacing Google) */}
          <button
            onClick={handleSignIn}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              width: '100%',
              padding: '13px',
              border: '1.5px solid var(--pr-border-strong)',
              borderRadius: '30px',
              background: '#fff',
              color: 'var(--pr-navy)',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'border-color .15s, transform .15s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--pr-navy)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--pr-border-strong)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {/* Microsoft icon */}
            <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
              <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
              <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
            </svg>
            Continue with Microsoft account
          </button>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '18px 0',
            color: 'var(--pr-muted)',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
          }}>
            <span style={{ flex: 1, height: '1px', background: 'var(--pr-border)' }} />
            or
            <span style={{ flex: 1, height: '1px', background: 'var(--pr-border)' }} />
          </div>

          {/* Email CTA — also triggers B2C (B2C handles the email signup form) */}
          <button
            onClick={handleSignIn}
            className="pr-btn pr-btn-primary pr-btn-block"
            style={{ borderRadius: '30px' }}
          >
            Create account &amp; start free month
          </button>

          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--pr-muted)', marginTop: '20px' }}>
            Already have an account?{' '}
            <button
              onClick={handleSignIn}
              style={{ color: 'var(--pr-orange)', textDecoration: 'none', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}
            >
              Sign in instead →
            </button>
          </p>

          {/* Footnote */}
          <div style={{
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--pr-muted)',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--pr-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--pr-green)" strokeWidth="2.5">
              <polyline points="2,6 5,9 10,3" />
            </svg>
            Free month starts immediately. No card needed today.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanSelected;
