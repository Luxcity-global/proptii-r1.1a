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
 * Create account supporting both Email + Password and Google authentication.
 */
const CreateAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, signupWithEmail } = useAuth();

  const planId = searchParams.get('plan');
  const cycle = (searchParams.get('cycle') as BillingCycle) || 'annual';
  const plan = usePlan(planId || '');

  const [email, setEmail] = useState(() => {
    return (
      searchParams.get('email') ||
      sessionStorage.getItem('pending_registration_email') ||
      ''
    );
  });
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resolveTargetUrl = () => {
    if (planId) {
      return welcomeUrl(planId, cycle);
    }
    return '/select-role';
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please verify your password.');
      return;
    }

    setSubmitting(true);
    const targetUrl = resolveTargetUrl();
    sessionStorage.setItem('redirectAfterLogin', targetUrl);
    if (!planId) {
      sessionStorage.setItem('signup_flow_active', 'true');
    }
    if (phone.trim()) {
      sessionStorage.setItem('pending_registration_phone', phone.trim());
    }

    try {
      await signupWithEmail(trimmedEmail, password, name.trim());
      if (planId) {
        try {
          await setPendingPlan(planId, cycle);
        } catch (planErr) {
          console.warn('[signup] Pending plan save notice:', planErr);
        }
      }
      navigate(targetUrl, { replace: true });
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setFormError('An account with this email already exists. Please sign in instead.');
      } else if (code === 'auth/weak-password') {
        setFormError('Password is too weak. Please use at least 8 characters.');
      } else if (code === 'auth/invalid-email') {
        setFormError('Please enter a valid email address.');
      } else {
        setFormError(err?.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setSubmitting(true);
    setFormError(null);
    const targetUrl = resolveTargetUrl();
    sessionStorage.setItem('redirectAfterLogin', targetUrl);
    if (!planId) {
      sessionStorage.setItem('signup_flow_active', 'true');
    }
    if (phone.trim()) {
      sessionStorage.setItem('pending_registration_phone', phone.trim());
    }

    try {
      await login();
      if (planId) {
        try {
          await setPendingPlan(planId, cycle);
        } catch (e) {
          console.warn('[signup] Pending plan save failed', e);
        }
      }
      navigate(targetUrl, { replace: true });
    } catch {
      setFormError('Account sign-up was cancelled or failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-blue-50 via-slate-50 to-orange-50 relative overflow-hidden">
      <Navbar hideServiceLinks />

      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#136C9E]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#E65D24]/10 blur-3xl pointer-events-none" />

      <main className="flex-1 flex items-center justify-center p-4 my-12 relative z-10">
        <div className="w-full max-w-md p-8 sm:p-10 bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-white">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center mb-5">
              <img src="/images/proptii-logo.png" alt="Proptii Logo" className="h-10 w-auto object-contain" />
            </div>

            {planId && plan && (
              <span className="inline-block px-3 py-1 bg-orange-100 text-[#E65D24] text-xs font-bold rounded-full mb-3 uppercase tracking-wide">
                {plan.name} Plan
              </span>
            )}

            <h1 className="text-2xl sm:text-3xl font-archive font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-500 font-nunito text-sm">
              {planId && plan
                ? `Complete your setup for the ${plan.name} plan.`
                : 'Create your account to get started with Proptii.'}
            </p>
          </div>

          {formError && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{formError}</span>
            </div>
          )}

          {/* Email + Password Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div>
              <label htmlFor="signup-email" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                Email Address
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. alex@example.com"
                disabled={submitting}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]/20 focus:border-[#136C9E] transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="signup-name" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                Full Name <span className="text-gray-400 font-normal lowercase">(optional)</span>
              </label>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Taylor"
                disabled={submitting}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]/20 focus:border-[#136C9E] transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="signup-password" className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-[#136C9E] hover:underline"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                disabled={submitting}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]/20 focus:border-[#136C9E] transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="signup-confirm-password" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                Confirm Password
              </label>
              <input
                id="signup-confirm-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                disabled={submitting}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]/20 focus:border-[#136C9E] transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="signup-phone" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                Phone Number <span className="text-gray-400 font-normal lowercase">(optional)</span>
              </label>
              <input
                id="signup-phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +44 7123 456789"
                disabled={submitting}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]/20 focus:border-[#136C9E] transition-all disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-5 bg-[#DC5F12] hover:bg-[#E65D24] text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {submitting ? 'Creating account...' : 'Create account →'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <span className="relative bg-white px-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
              Or
            </span>
          </div>

          {/* Google Sign-in Alternative */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-200 transition-all duration-200 shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9c0-.4 0-.8 0-1.4z" />
              <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z" />
            </svg>
            Sign up with Google
          </button>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-gray-500 text-sm">
              Already have an account?{' '}
              <Link
                to={`/login${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                className="text-[#136C9E] font-bold hover:underline transition-all"
              >
                Sign in here
              </Link>
            </p>
          </div>

          <div className="text-center pt-2">
            <Link to="/pricing" className="text-gray-400 text-xs hover:text-gray-600 transition-colors">
              ← View all plans & pricing
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateAccountPage;
