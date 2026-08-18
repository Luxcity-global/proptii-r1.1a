/**
 * Maps dashboard section IDs to the minimum plan required.
 * 'free' = accessible on Explorer. Any other value = requires that plan or above.
 *
 * Rule: never rely solely on frontend gating for data security —
 * the NestJS SubscriptionGuard handles API-layer enforcement.
 * This file drives UI gating (lock icons, upgrade prompts).
 */

import type { PlanId } from '../config/plans';

/** Which plans include access to each feature group. */
export const SECTION_ACCESS: Record<
  string,
  { requiredPlans: PlanId[]; upgradeLabel: string }
> = {
  'tenant-referencing': {
    requiredPlans: [
      'renter_pro',
      'buyer_pro',
      'starter',
      'landlord_pro',
      'elite',
      'independent',
      'agent_pro',
      'enterprise',
    ],
    upgradeLabel: 'Referencing toolkit is included in Renter Pro and above.',
  },
  'tenant-contracts': {
    requiredPlans: [
      'renter_pro',
      'buyer_pro',
      'starter',
      'landlord_pro',
      'elite',
      'independent',
      'agent_pro',
      'enterprise',
    ],
    upgradeLabel: 'Contracts are included in Renter Pro and above.',
  },
};

export function canAccessSection(
  sectionId: string,
  plan: PlanId | string | null | undefined,
  status: string | null | undefined,
): boolean {
  // Unrestricted access enabled for full testing
  return true;
}

export function sectionUpgradeLabel(sectionId: string): string {
  return SECTION_ACCESS[sectionId]?.upgradeLabel ?? 'Upgrade your plan to access this feature.';
}
