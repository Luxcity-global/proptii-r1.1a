import React, { useMemo } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement } from '@stripe/react-stripe-js';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as
  | string
  | undefined;

/** Only load Stripe.js when Payment Element is shown — avoids CSP frames on hosted Checkout pages. */
function useStripePromise(enabled: boolean): Promise<Stripe | null> | null {
  return useMemo(() => {
    if (!enabled || !publishableKey) return null;
    return loadStripe(publishableKey);
  }, [enabled]);
}

interface Props {
  /** When false, shows secure-checkout notice only (hosted Checkout redirect). */
  showElement?: boolean;
  clientSecret?: string;
}

/**
 * S3-05 — Stripe Payment Element wrapper (card only).
 * Pay-now uses hosted Checkout redirect; Element is available when clientSecret is provided.
 */
const PaymentForm: React.FC<Props> = ({ showElement = false, clientSecret }) => {
  const stripePromise = useStripePromise(Boolean(showElement && clientSecret));

  if (!publishableKey) {
    return (
      <p style={{ fontSize: 14, color: 'var(--pr-muted)', lineHeight: 1.6 }}>
        Payment is processed securely by Stripe. You will enter card details on the
        next step — Proptii never stores card numbers.
      </p>
    );
  }

  if (!showElement || !clientSecret || !stripePromise) {
    return (
      <div
        style={{
          border: '1.5px solid var(--pr-border-strong)',
          borderRadius: 14,
          padding: '18px 16px',
          background: 'var(--pr-cream)',
          fontSize: 14,
          color: 'var(--pr-navy)',
          lineHeight: 1.55,
        }}
      >
        <strong>Secured by Stripe</strong>
        <p style={{ margin: '8px 0 0', color: 'var(--pr-muted)' }}>
          Card details are collected on Stripe&apos;s PCI-compliant checkout page.
          No card data passes through Proptii.
        </p>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: { theme: 'stripe' },
      }}
    >
      <PaymentElement
        options={{
          wallets: { applePay: 'never', googlePay: 'never' },
        }}
      />
    </Elements>
  );
};

export default PaymentForm;
