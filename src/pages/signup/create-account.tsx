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
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-blue-50 via-slate-50 to-orange-50 relative overflow-hidden">
      <Navbar hideServiceLinks />
      
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#136C9E]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#E65D24]/10 blur-3xl pointer-events-none" />

      <main className="flex-1 flex items-center justify-center p-4 mt-16 relative z-10">
        <div className="w-full max-w-md p-8 bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-white">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center mb-6">
              <img src="/images/proptii-logo.png" alt="Proptii Logo" className="h-12 w-auto object-contain" />
            </div>
            
            {plan && (
              <span className="inline-block px-3 py-1 bg-orange-100 text-[#E65D24] text-xs font-bold rounded-full mb-3 uppercase tracking-wide">
                {plan.name} Plan
              </span>
            )}
            
            <h1 className="text-3xl font-archive font-bold text-gray-900 mb-3">Create Account</h1>
            <p className="text-gray-500 font-nunito text-sm">
              Get started with Proptii securely and instantly using your Google account.
            </p>
          </div>

          {formError && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
              {formError}
            </div>
          )}

          <div className="space-y-6">
            <div className="text-left">
              <label htmlFor="signup-phone" className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                id="signup-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +44 7123 456789"
                disabled={submitting}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#136C9E]/20 focus:border-[#136C9E] transition-all disabled:opacity-50"
              />
            </div>

            <button
              onClick={handleGoogleSignUp}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 text-gray-700 px-4 py-3.5 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-200 transition-all duration-300 shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9c0-.4 0-.8 0-1.4z" />
                <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z" />
              </svg>
              {submitting ? 'Creating account...' : 'Sign up with Google'}
            </button>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-gray-500 text-sm">
                Already have an account?{' '}
                <button
                  onClick={handleSignIn}
                  disabled={submitting}
                  className="text-[#136C9E] font-bold hover:underline transition-all disabled:opacity-50"
                >
                  Sign in here
                </button>
              </p>
            </div>
            
            <div className="text-center pt-2">
              <Link to="/pricing" className="text-gray-400 text-xs hover:text-gray-600 transition-colors">
                ← Back to pricing
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateAccountPage;
