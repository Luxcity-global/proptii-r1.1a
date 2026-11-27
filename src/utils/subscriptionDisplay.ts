import { getPlanById, type PlanId } from '../config/plans';

export interface UserDisplayInput {
  name?: string | null;
  givenName?: string | null;
  familyName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  avatar?: string | null;
  avatarUrl?: string | null;
  photo?: string | null;
  profilePhoto?: string | null;
}

export interface UserDisplay {
  displayName: string;
  initials: string;
  photoUrl: string | null;
}

export interface SidebarTierPillStyle {
  bg: string;
  text: string;
  dot: string;
}

export interface SidebarTierState {
  normalizedPlanId: PlanId;
  tierName: string;
  isPaidTier: boolean;
  isPastDue: boolean;
  canUpgradeTier: boolean;
  tierPillStyle: SidebarTierPillStyle;
}

export const CONSUMER_TOP_PLANS: readonly string[] = ['buyer_pro', 'elite', 'enterprise'];
export const LANDLORD_TOP_PLANS: readonly string[] = ['elite', 'enterprise'];

/**
 * Resolves a consistent display name, initials fallback, and avatar URL
 * across both consumer AuthContext users and landlord UserProfile objects.
 */
export function resolveUserDisplay(user?: UserDisplayInput | null): UserDisplay {
  const displayName =
    user?.name?.trim() ||
    [user?.givenName, user?.familyName].filter(Boolean).join(' ').trim() ||
    user?.email?.split('@')[0] ||
    'User';

  const parts = displayName.split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : displayName.slice(0, 2).toUpperCase();

  const photoUrl =
    user?.photoURL ||
    user?.avatar ||
    user?.avatarUrl ||
    user?.photo ||
    user?.profilePhoto ||
    null;

  return { displayName, initials, photoUrl };
}

/**
 * Resolves normalized plan metadata, upgrade/manage state, and Proptii platform
 * pill colors (treating canceled/unpaid subscriptions as free Explorer tier).
 */
export function resolveSidebarTierState(
  plan: string | null | undefined,
  status: string | null | undefined,
  topPlanIds: readonly string[] = CONSUMER_TOP_PLANS,
): SidebarTierState {
  const isInactiveSubscription = status === 'canceled' || status === 'unpaid';
  const normalizedPlanId: PlanId =
    !plan || plan === 'free' || isInactiveSubscription ? 'explorer' : (plan as PlanId);
  const planConfig = getPlanById(normalizedPlanId);
  const tierName = planConfig?.name ?? 'Explorer';
  const isPaidTier = Boolean(planConfig && !planConfig.isFree && normalizedPlanId !== 'explorer');
  const isPastDue = isPaidTier && status === 'past_due';
  const canUpgradeTier = !topPlanIds.includes(normalizedPlanId);

  const tierPillStyle: SidebarTierPillStyle = isPastDue
    ? { bg: '#FAEEDA', text: '#BA7517', dot: '#BA7517' }
    : isPaidTier
      ? { bg: '#E6F3FF', text: '#136C9E', dot: '#136C9E' }
      : { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' };

  return {
    normalizedPlanId,
    tierName,
    isPaidTier,
    isPastDue,
    canUpgradeTier,
    tierPillStyle,
  };
}
