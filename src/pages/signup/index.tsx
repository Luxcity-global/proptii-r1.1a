import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePlan } from '../../hooks/usePlan';
import PricingPage from '../pricing';
import {
  createAccountUrl,
  getPricingFlow,
  hasPendingStripeCheckout,
  hasPostStripeCheckout,
  payNowUrl,
  setPricingFlow,
  welcomeUrl,
} from '../../utils/pricingRoutes';
import { setPendingPlan } from '../../services/billingService';
import type { BillingCycle } from '../../components/pricing/PricingBillingToggle';
import { setRoleIntent } from '../../utils/roleIntent';
import '../../styles/pricing.css';

/**
 * S2-11–14 — Account check modal over dimmed pricing page.
 *
 * Step 0 (NEW): Role-intent question — Tenant or Landlord?
 *   - Tenant: proceeds to existing MSAL / email flow (unchanged).
 *   - Landlord: stores intent + redirects to landlord pricing page.
 *
 * Step 1: Sign-in (existing MSAL / email entry).
 */
type SignupStep = 'role' | 'signin';

const SignupModalPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading, login, user } = useAuth();

  const planId = searchParams.get('plan') ?? '';
  const cycle = (searchParams.get('cycle') as BillingCycle) || 'annual';
  const plan = usePlan(planId);
  const [step, setStep] = useState<SignupStep>('role');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredRole, setHoveredRole] = useState<'tenant' | 'landlord' | null>(null);

  // ─── existing auth redirect logic (unchanged) ───────────────────────────────
  useEffect(() => {
    if (isLoading || !isAuthenticated || !planId) return;

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

    if (hasPendingStripeCheckout() && getPricingFlow() === 'pay_now') {
      navigate(payNowUrl(planId, cycle), { replace: true });
      return;
    }

    const returnPath = sessionStorage.getItem('redirectAfterLogin');
    if (returnPath?.includes('/signup/pay-now') || returnPath?.includes('/billing/')) {
      sessionStorage.removeItem('redirectAfterLogin');
      sessionStorage.removeItem('signup_auto_msal_for_paynow');
      navigate(returnPath, { replace: true });
      return;
    }

    if (getPricingFlow() === 'pay_now') {
      navigate(payNowUrl(planId, cycle), { replace: true });
      return;
    }

    const goWelcome = async () => {
      try {
        await setPendingPlan(planId, cycle);
      } catch {
        /* non-blocking if Cosmos unavailable */
      }
      setPricingFlow('trial');
      navigate(welcomeUrl(planId, cycle), { replace: true });
    };

    goWelcome();
  }, [isLoading, isAuthenticated, planId, cycle, navigate]);

  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    const returnPath = sessionStorage.getItem('redirectAfterLogin') ?? '';
    if (!returnPath.includes('pay-now')) return;
    if (sessionStorage.getItem('signup_auto_msal_for_paynow') === '1') return;
    sessionStorage.setItem('signup_auto_msal_for_paynow', '1');

    navigate('/login?redirect=' + encodeURIComponent(returnPath));
  }, [isLoading, isAuthenticated, login]);

  // ─── role intent handlers ────────────────────────────────────────────────────

  const handleRoleTenant = () => {
    setRoleIntent('tenant');
    setStep('signin');
  };

  const handleRoleLandlord = () => {
    setRoleIntent('landlord');
    // Landlords go to their own pricing page, not the renter one
    navigate('/pricing?audience=landlords');
  };

  // ─── tenant sign-in handlers (unchanged) ────────────────────────────────────

  const handleMsalSignIn = () => {
    const existingReturn = sessionStorage.getItem('redirectAfterLogin');
    let targetUrl = existingReturn;
    if (!existingReturn?.includes('pay-now') && !existingReturn?.includes('/billing/')) {
      setPricingFlow('trial');
      targetUrl = welcomeUrl(planId || 'renter_pro', cycle);
      sessionStorage.setItem('redirectAfterLogin', targetUrl);
    }
    navigate(`/login?redirect=${encodeURIComponent(targetUrl || '/')}`);
  };

  const handleEmailContinue = () => {
    if (!planId) return;
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address.');
      return;
    }
    navigate(createAccountUrl(planId, cycle, trimmed));
  };

  const handleClose = () => navigate('/pricing');

  // ─── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="pr-page min-h-screen flex flex-col relative">
      <PricingPage dimmed hideShell />

      <div
        className="pr-signup-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signup-modal-title"
      >
        <div className="pr-signup-modal pr-fade-in">
          <button
            type="button"
            className="pr-signup-close"
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>

          {/* ── Step 0: Role selection ── */}
          {step === 'role' && (
            <>
              <h1 id="signup-modal-title" style={{ fontSize: '22px', marginBottom: '8px' }}>
                Welcome to Proptii
              </h1>
              <p className="pr-signup-lead">
                First, tell us how you'll be using Proptii:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                {/* Tenant option */}
                <button
                  id="signup-role-tenant"
                  type="button"
                  onClick={handleRoleTenant}
                  onMouseEnter={() => setHoveredRole('tenant')}
                  onMouseLeave={() => setHoveredRole(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px 20px',
                    border: `2px solid ${hoveredRole === 'tenant' ? '#136C9E' : '#E5E7EB'}`,
                    borderRadius: '12px',
                    background: hoveredRole === 'tenant' ? '#EBF5FB' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    width: '100%',
                  }}
                >
                  <span style={{ fontSize: '28px', lineHeight: 1 }}>🏠</span>
                  <span>
                    <strong style={{ display: 'block', fontSize: '15px', color: '#0F2537' }}>
                      I'm looking for a home
                    </strong>
                    <span style={{ fontSize: '13px', color: '#6B7280' }}>
                      Search, book viewings, and manage your rental
                    </span>
                  </span>
                </button>

                {/* Landlord option */}
                <button
                  id="signup-role-landlord"
                  type="button"
                  onClick={handleRoleLandlord}
                  onMouseEnter={() => setHoveredRole('landlord')}
                  onMouseLeave={() => setHoveredRole(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px 20px',
                    border: `2px solid ${hoveredRole === 'landlord' ? '#DC5F12' : '#E5E7EB'}`,
                    borderRadius: '12px',
                    background: hoveredRole === 'landlord' ? '#FDF3EE' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    width: '100%',
                  }}
                >
                  <span style={{ fontSize: '28px', lineHeight: 1 }}>🏢</span>
                  <span>
                    <strong style={{ display: 'block', fontSize: '15px', color: '#0F2537' }}>
                      I manage properties
                    </strong>
                    <span style={{ fontSize: '13px', color: '#6B7280' }}>
                      List properties, manage tenants, and grow your portfolio
                    </span>
                  </span>
                </button>
              </div>
            </>
          )}

          {/* ── Step 1: Sign-in (tenant path, unchanged) ── */}
          {step === 'signin' && (
            <>
              {plan && (
                <p className="pr-signup-eyebrow">{plan.name}</p>
              )}

              <h1 id="signup-modal-title">Continue to Proptii</h1>
              <p className="pr-signup-lead">
                Sign in with your Google account, or continue with email to create
                one.
              </p>

              <button
                type="button"
                className="pr-btn pr-btn-primary pr-btn-block"
                onClick={handleMsalSignIn}
                disabled={busy || isLoading}
              >
                {busy ? 'Opening sign-in…' : 'Continue with your account'}
              </button>

              <div className="pr-signup-divider">
                <span>or</span>
              </div>

              <div className="pr-field">
                <label htmlFor="signup-email">Email address</label>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={user?.email ?? 'you@example.com'}
                />
              </div>

              <button
                type="button"
                className="pr-btn pr-btn-ghost pr-btn-block"
                onClick={handleEmailContinue}
                disabled={!planId}
              >
                Continue with email
              </button>

              <button
                type="button"
                onClick={() => setStep('role')}
                style={{
                  marginTop: '12px',
                  background: 'none',
                  border: 'none',
                  color: '#6B7280',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  width: '100%',
                }}
              >
                ← Back
              </button>

              {error && <p className="pr-signup-error">{error}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignupModalPage;

