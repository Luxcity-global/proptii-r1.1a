import { useMemo } from 'react';
import {
  getPlanById,
  type PlanConfig,
  type PlanId,
} from '../config/plans';

/** Returns typed plan config for a plan ID (S2-09). */
export function usePlan(planId: PlanId | string | null | undefined): PlanConfig | undefined {
  return useMemo(() => {
    if (!planId) return undefined;
    return getPlanById(planId as PlanId);
  }, [planId]);
}
