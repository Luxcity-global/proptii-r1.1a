export type BillingCycle = 'monthly' | 'annual';
export type PricingAudience = 'renters' | 'landlords' | 'agents';

/** Distinguishes free-month (trial) signup from pay-now checkout. */
export type PricingFlow = 'trial' | 'pay_now';

const PRICING_FLOW_KEY = 'pricing_flow';
const POST_STRIPE_CHECKOUT_KEY = 'post_stripe_checkout';

export function setPricingFlow(flow: PricingFlow): void {
  sessionStorage.setItem(PRICING_FLOW_KEY, flow);
}

export function getPricingFlow(): PricingFlow | null {
  const v = sessionStorage.getItem(PRICING_FLOW_KEY);
  return v === 'trial' || v === 'pay_now' ? v : null;
}

export function clearPricingFlow(): void {
  sessionStorage.removeItem(PRICING_FLOW_KEY);
}

/** Set when Stripe redirects back to /billing/confirmed — blocks welcome auto-checkout loop. */
export function markPostStripeCheckout(): void {
  sessionStorage.setItem(POST_STRIPE_CHECKOUT_KEY, '1');
}

export function hasPostStripeCheckout(): boolean {
  return sessionStorage.getItem(POST_STRIPE_CHECKOUT_KEY) === '1';
}

export function clearPostStripeCheckout(): void {
  sessionStorage.removeItem(POST_STRIPE_CHECKOUT_KEY);
}

const PENDING_STRIPE_CHECKOUT_KEY = 'pending_stripe_checkout';

/** Set before redirecting to Stripe so welcome cannot start a second checkout. */
export function markPendingStripeCheckout(flow: PricingFlow): void {
  sessionStorage.setItem(PENDING_STRIPE_CHECKOUT_KEY, flow);
}

export function hasPendingStripeCheckout(): boolean {
  return (
    sessionStorage.getItem(PENDING_STRIPE_CHECKOUT_KEY) === 'trial' ||
    sessionStorage.getItem(PENDING_STRIPE_CHECKOUT_KEY) === 'pay_now'
  );
}

export function clearPendingStripeCheckout(): void {
  sessionStorage.removeItem(PENDING_STRIPE_CHECKOUT_KEY);
}

export function signupUrl(planId: string, cycle: BillingCycle = 'annual'): string {
  return `/signup?plan=${encodeURIComponent(planId)}&cycle=${encodeURIComponent(cycle)}`;
}

export function createAccountUrl(
  planId: string,
  cycle?: BillingCycle,
  email?: string,
): string {
  const params = new URLSearchParams({ plan: planId });
  if (cycle) params.set('cycle', cycle);
  if (email) params.set('email', email);
  return `/signup/create-account?${params.toString()}`;
}

export function welcomeUrl(planId: string, cycle: BillingCycle = 'annual'): string {
  return `/signup/welcome?plan=${encodeURIComponent(planId)}&cycle=${encodeURIComponent(cycle)}`;
}

export function payNowUrl(planId: string, cycle: BillingCycle = 'annual'): string {
  return `/signup/pay-now?plan=${encodeURIComponent(planId)}&cycle=${encodeURIComponent(cycle)}`;
}

/** Map a protected billing/signup return path to the signup modal (plan preserved). */
export function signupUrlForAuthRedirect(returnPath: string): string | null {
  try {
    const path = returnPath.startsWith('http')
      ? new URL(returnPath).pathname + new URL(returnPath).search
      : returnPath;
    if (!path.startsWith('/signup/pay-now') && !path.startsWith('/billing/')) {
      return null;
    }
    const q = path.includes('?') ? path.slice(path.indexOf('?')) : '';
    const params = new URLSearchParams(q);
    const plan = params.get('plan') || 'renter_pro';
    const cycle = (params.get('cycle') || 'annual') as BillingCycle;
    return signupUrl(plan, cycle);
  } catch {
    return null;
  }
}

export const ENTERPRISE_MAILTO =
  'mailto:sales@proptii.com?subject=Enterprise%20Enquiry';
