/**
 * Stripe Basil+ subscriptions may expose billing period end on subscription items
 * instead of (or as well as) the subscription root — avoid Invalid time value crashes.
 */

export function stripeUnixSecondsToIso(
  unixSeconds: number | null | undefined,
): string | null {
  if (unixSeconds == null || !Number.isFinite(unixSeconds)) {
    return null;
  }
  const date = new Date(unixSeconds * 1000);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

export function getSubscriptionCurrentPeriodEndIso(
  subscription: Record<string, unknown>,
): string | null {
  const fromRoot = stripeUnixSecondsToIso(
    subscription.current_period_end as number | undefined,
  );
  if (fromRoot) return fromRoot;

  const items = subscription.items as
    | { data?: Array<{ current_period_end?: number }> }
    | undefined;
  return stripeUnixSecondsToIso(items?.data?.[0]?.current_period_end);
}

export function getSubscriptionTrialEndIso(
  subscription: Record<string, unknown>,
): string | null {
  return stripeUnixSecondsToIso(subscription.trial_end as number | undefined);
}
