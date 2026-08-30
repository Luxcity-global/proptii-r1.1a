import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import { usePlan } from '../../hooks/usePlan';
import { setPendingPlan } from '../../services/billingService';
import { welcomeUrl } from '../../utils/pricingRoutes';
import type { BillingCycle } from '../../components/pricing/PricingBillingToggle';
import '../../styles/pricing.css';

/**
 * Create account with pure Firebase (Google & Email).
 */
const CreateAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const planId = searchParams.get('plan') ?? 'explorer';
  const cycle = (searchParams.get('cycle') as BillingCycle) || 'annual';
  const plan = usePlan(planId);
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleGoogleSignUp = async () => {
    setSubmitting(true);
    setFormError(null);
    sessionStorage.setItem('redirectAfterLogin', welcomeUrl(planId, cycle));
    if (phone.trim()) {
      sessionStorage.setItem('pending_registration_phone', phone.trim());
    }

    try {
      await login('google');
      try {
        await setPendingPlan(planId, cycle);
      } catch (e) {
        console.warn('pending plan save failed', e);
      }
      navigate(welcomeUrl(planId, cycle), { replace: true });
    } catch {
      setFormError('Account sign-up was cancelled or failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };



  const handleSignIn = async () => {
    setSubmitting(true);
    setFormError(null);
    sessionStorage.setItem('redirectAfterLogin', welcomeUrl(planId, cycle));
    try {
      await login('google');
      await setPendingPlan(planId, cycle);
      navigate(welcomeUrl(planId, cycle), { replace: true });
    } catch {
      setFormError('Sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pr-page min-h-screen flex flex-col">
      <Navbar hideServiceLinks />
      <main className="pr-content flex-1" style={{ paddingTop: '76px' }}>
        <div className="pr-flow-wrap">
          <div className="pr-flow-card">
            {plan && <p className="pr-signup-eyebrow">{plan.name}</p>}
            <h1>Create your account</h1>
            <p className="lead">
              Get started with Proptii using your Google account for secure, instant access.
            </p>

            <div style={{ marginTop: 20 }}>
              {/* Optional Phone Number input */}
              <div style={{ marginBottom: 18, textAlign: 'left' }}>
                <label
                  htmlFor="signup-phone"
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: 6,
                  }}
                >
                  Phone Number <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(Optional)</span>
                </label>
                <input
                  id="signup-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +44 7123 456789"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid #D1D5DB',
                    fontSize: 14,
                    color: '#111827',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                />
                <p style={{ fontSize: 11, color: '#6B7280', marginTop: 4, marginBlockEnd: 0 }}>
                  Used for viewing updates and booking confirmations.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={submitting}
                className="pr-btn pr-btn-primary pr-btn-block"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  padding: '14px 20px',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600,
                  backgroundColor: '#136C9E',
                  color: '#ffffff',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9c0-.4 0-.8 0-1.4z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                  />
                </svg>
                <span>{submitting ? 'Connecting…' : 'Sign up with Google'}</span>
              </button>


            </div>

            {formError && <p className="pr-signup-error">{formError}</p>}

            <p style={{ marginTop: 20, fontSize: 14, color: 'var(--pr-muted)' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={handleSignIn}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--pr-orange)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  textDecoration: 'underline',
                }}
              >
                Sign in →
              </button>
            </p>

            <p style={{ marginTop: 16, fontSize: 13 }}>
              <Link to="/pricing">← Back to pricing</Link>
            </p>
          </div>

          <div className="pr-progress">
            <div className="pr-progress-step active">
              <span className="dot" />
              Account
            </div>
            <div className="pr-progress-line" />
            <div className="pr-progress-step">
              <span className="dot" />
              Welcome
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateAccountPage;
