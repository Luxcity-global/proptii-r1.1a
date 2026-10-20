import { useCallback, useEffect, useState } from 'react';
import {
  fetchBillingStatus,
  type BillingStatus,
} from '../../../services/billingService';

export interface LandlordBillingOptions {
  email?: string | null;
  role?: string | null;
}

/** Billing status for the landlord/agent app (no AuthContext dependency). */
export function useLandlordBillingStatus(
  isAuthenticated: boolean,
  options: LandlordBillingOptions = {},
) {
  // email and role are not used in the refresh callback — complimentary access
  // is now determined server-side by getBillingStatus (see FEAT-004).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { email: _email, role: _role } = options;
  const [data, setData] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setData(null);
      setLoading(false);
      return;
    }
    // Complimentary-access determination is now handled server-side only.
    // getBillingStatus returns the correct plan for @theluxcity.co.uk addresses.
    setLoading(true);
    setError(null);
    try {
      const status = await fetchBillingStatus('landlord');
      setData(status);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load billing status');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    plan: data?.plan ?? null,
    status: data?.status ?? null,
    trialEndsAt: data?.trialEndsAt ?? null,
    currentPeriodEnd: data?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: data?.cancelAtPeriodEnd ?? false,
    pendingPlan: data?.pendingPlan ?? null,
    pendingCycle: data?.pendingCycle ?? null,
    billingCadence: data?.billingCadence ?? null,
    fitChecksUsed: data?.fitChecksUsed ?? null,
    fitChecksQuota: data?.fitChecksQuota ?? null,
    hasStripeCustomer: data?.hasStripeCustomer ?? false,
    loading,
    error,
    refresh,
  };
}
