import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMsal } from '@azure/msal-react';
import Navbar from '../../components/Navbar';
import { loginRequest } from '../../config/authConfig';
import { usePlan } from '../../hooks/usePlan';
import { setPendingPlan } from '../../services/billingService';
import { welcomeUrl } from '../../utils/pricingRoutes';
import type { BillingCycle } from '../../components/pricing/PricingBillingToggle';
import '../../styles/pricing.css';

const schema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormValues = z.infer<typeof schema>;

/**
 * S2-15–16 — Create account (MSAL B2C sign-up + pending plan upsert).
 */
const CreateAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { instance } = useMsal();
  const planId = searchParams.get('plan') ?? 'explorer';
  const cycle = (searchParams.get('cycle') as BillingCycle) || 'annual';
  const emailParam = searchParams.get('email') ?? '';
  const plan = usePlan(planId);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: emailParam ? decodeURIComponent(emailParam) : '',
      password: '',
    },
  });

  const onSubmit = async (_data: FormValues) => {
    setSubmitting(true);
    setFormError(null);
    sessionStorage.setItem('redirectAfterLogin', welcomeUrl(planId, cycle));

    try {
      const result = await instance.loginPopup({
        ...loginRequest,
        prompt: 'login',
      });

      if (result?.account) {
        instance.setActiveAccount(result.account);
        try {
          await setPendingPlan(planId, cycle);
        } catch (e) {
          console.warn('pending plan save failed', e);
        }
        navigate(welcomeUrl(planId, cycle), { replace: true });
      }
    } catch {
      setFormError('Account creation was cancelled or failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignIn = async () => {
    setSubmitting(true);
    setFormError(null);
    sessionStorage.setItem('redirectAfterLogin', welcomeUrl(planId, cycle));
    try {
      await instance.loginPopup(loginRequest);
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
              We use secure Microsoft sign-in — your password is managed by Azure AD.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="pr-field">
                <label htmlFor="fullName">Full name</label>
                <input id="fullName" {...register('fullName')} />
                {errors.fullName && (
                  <span className="pr-field-error">{errors.fullName.message}</span>
                )}
              </div>

              <div className="pr-field">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" {...register('email')} />
                {errors.email && (
                  <span className="pr-field-error">{errors.email.message}</span>
                )}
              </div>

              <div className="pr-field">
                <label htmlFor="password">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      fontSize: 12,
                      color: 'var(--pr-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {errors.password && (
                  <span className="pr-field-error">{errors.password.message}</span>
                )}
              </div>

              <button
                type="submit"
                className="pr-btn pr-btn-primary pr-btn-block"
                disabled={submitting}
              >
                {submitting ? 'Creating account…' : 'Create account'}
              </button>
            </form>

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
