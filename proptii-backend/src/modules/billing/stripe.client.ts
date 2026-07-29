/**
 * Stripe SDK factory — fixes CommonJS `default is not a constructor` when
 * `esModuleInterop` is off (Nest compiles `import Stripe from 'stripe'` incorrectly).
 */
export function createStripeClientOptional(secretKey?: string): any | null {
  const trimmed = secretKey?.trim() ?? '';
  if (!trimmed.startsWith('sk_')) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const StripeSdk = require('stripe');
  const Stripe =
    typeof StripeSdk === 'function' ? StripeSdk : StripeSdk.default;

  return new Stripe(trimmed, {
    apiVersion: '2026-05-27.dahlia',
  });
}

export function createStripeClient(secretKey: string): any {
  const client = createStripeClientOptional(secretKey);
  if (!client) {
    throw new Error(
      'STRIPE_SECRET_KEY must be a Stripe secret key (sk_test_... or sk_live_...). ' +
        'Do not use STRIPE_WEBHOOK_SECRET (whsec_...) here.',
    );
  }
  return client;
}
