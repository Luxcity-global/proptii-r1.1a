import { useMemo } from 'react';
import { usePlans } from './usePlans';
import type { PlanConfig, PlanId } from '../config/plans';

/** Returns live plan config for a plan ID (prices from Stripe via usePlans). */
export function usePlan(planId: PlanId | string | null | undefined): PlanConfig | undefined {
  const { plans } = usePlans();
  return useMemo(() => {
    if (!planId) return undefined;
    return plans.find((p) => p.id === planId);
  }, [planId, plans]);
}
