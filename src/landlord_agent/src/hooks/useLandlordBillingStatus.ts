import { useCallback, useEffect, useState } from 'react';
import {
  fetchBillingStatus,
  type BillingStatus,
} from '../../../services/billingService';

/** Billing status for the landlord/agent app (no AuthContext dependency). */
export function useLandlordBillingStatus(isAuthenticated: boolean) {
  const [data, setData] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setData(null);
      setLoading(false);
      return;
    }
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
