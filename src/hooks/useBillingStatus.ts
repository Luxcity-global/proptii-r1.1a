import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchBillingStatus,
  type BillingStatus,
} from '../services/billingService';
import type { BillingDashboard } from '../config/plans';
import { isMockTestUserId } from '../data/mockTestUsers';
import {
  complimentaryBillingStatus,
  isComplimentaryAccessEmail,
} from '../utils/complimentaryAccess';

function mockBillingStatus(role?: string | null): BillingStatus {
  const plan =
    role === 'agent' ? 'agent_pro' : role === 'landlord' ? 'landlord_pro' : 'renter_pro';
  return {
    plan,
    status: 'active',
    trialEndsAt: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    fitChecksUsed: 0,
    fitChecksQuota: null,
    pendingPlan: null,
    pendingCycle: null,
    billingCadence: 'monthly',
    hasStripeCustomer: false,
  };
}

export function useBillingStatus(dashboard: BillingDashboard = 'consumer') {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [data, setData] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setData(null);
      setLoading(false);
      return;
    }
    if (import.meta.env.DEV && isMockTestUserId(user?.id)) {
      setData(mockBillingStatus(user?.roles?.[0]));
      setError(null);
      setLoading(false);
      return;
    }
    if (isComplimentaryAccessEmail(user?.email)) {
      setData(complimentaryBillingStatus(user?.roles?.[0]));
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const status = await fetchBillingStatus(dashboard);
      setData(status);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load billing status');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, dashboard, user?.id, user?.roles, user?.email]);

  useEffect(() => {
    if (authLoading) return;
    refresh();
  }, [authLoading, refresh]);

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
    loading: authLoading || loading,
    error,
    refresh,
  };
}
