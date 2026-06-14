import { useLayoutEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { markPostStripeCheckout } from '../../utils/pricingRoutes';

/**
 * Stripe appends ?session_id=cs_... to success_url. If auth is still loading and
 * ProtectedRoute bounces through /signup, we must still end on /billing/confirmed.
 */
export function StripeCheckoutReturnHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useLayoutEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    if (!sessionId) return;

    markPostStripeCheckout();
    sessionStorage.removeItem('pending_stripe_checkout');

    const targetPath = '/billing/confirmed';
    const target = `${targetPath}?session_id=${encodeURIComponent(sessionId)}`;
    const current = location.pathname + location.search;

    if (current !== target && !current.startsWith(`${targetPath}?`)) {
      navigate(target, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  return null;
}
