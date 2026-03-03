/**
 * Onboarding (demo) session utilities.
 * Stores anonymous session in sessionStorage for value-first onboarding.
 */

const KEY_PREFIX = 'onboarding_';
const ANONYMOUS_ID_KEY = `${KEY_PREFIX}anonymousId`;
const USER_GROUP_KEY = `${KEY_PREFIX}userGroup`;
const PENDING_PROPERTY_KEY = `${KEY_PREFIX}pendingProperty`;
const GUIDE_DISMISSED_KEY = `${KEY_PREFIX}guideDismissed`;
const ONBOARDING_COMPLETED_KEY = `${KEY_PREFIX}completed`;
const DISCOVERY_PREFIX = `${KEY_PREFIX}discovery_`;

export type OnboardingUserGroup = 'tenant' | 'landlord' | 'agent' | 'homeowner';

function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}

/**
 * Get or create anonymous ID for this session.
 */
export function getOrCreateAnonymousId(): string {
  const storage = getSessionStorage();
  if (!storage) return `anon_${Date.now()}`;
  let id = storage.getItem(ANONYMOUS_ID_KEY);
  if (!id) {
    id = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    storage.setItem(ANONYMOUS_ID_KEY, id);
  }
  return id;
}

/**
 * Set user group when entering a demo (e.g. from Profiling or ?onboarding=tenant).
 */
export function setOnboardingUserGroup(group: OnboardingUserGroup): void {
  getSessionStorage()?.setItem(USER_GROUP_KEY, group);
  getOrCreateAnonymousId(); // ensure anonymous ID exists
}

/**
 * Get current onboarding user group, or null if not in demo.
 */
export function getOnboardingUserGroup(): OnboardingUserGroup | null {
  const raw = getSessionStorage()?.getItem(USER_GROUP_KEY);
  if (!raw) return null;
  if (['tenant', 'landlord', 'agent', 'homeowner'].includes(raw)) {
    return raw as OnboardingUserGroup;
  }
  return null;
}

/**
 * True if we are in onboarding/demo mode (user group set).
 */
export function isOnboardingDemo(): boolean {
  return getOnboardingUserGroup() !== null;
}

/**
 * Store a property to be saved after sign-up (pending migration).
 */
export function setPendingProperty(property: unknown): void {
  try {
    getSessionStorage()?.setItem(PENDING_PROPERTY_KEY, JSON.stringify(property));
  } catch (e) {
    console.warn('Failed to set pending property', e);
  }
}

/**
 * Get and clear pending property (for migration after sign-up).
 */
export function consumePendingProperty(): unknown | null {
  const storage = getSessionStorage();
  if (!storage) return null;
  const raw = storage.getItem(PENDING_PROPERTY_KEY);
  storage.removeItem(PENDING_PROPERTY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/**
 * Mark guide as dismissed for this session (optional).
 */
export function setGuideDismissed(dismissed: boolean): void {
  if (dismissed) {
    getSessionStorage()?.setItem(GUIDE_DISMISSED_KEY, '1');
  } else {
    getSessionStorage()?.removeItem(GUIDE_DISMISSED_KEY);
  }
}

export function isGuideDismissed(): boolean {
  return getSessionStorage()?.getItem(GUIDE_DISMISSED_KEY) === '1';
}

/**
 * Mark onboarding flow (Discovery + Profiling) as completed so we don't show it again this session.
 */
export function setOnboardingCompleted(): void {
  getSessionStorage()?.setItem(ONBOARDING_COMPLETED_KEY, '1');
}

/**
 * True if user has already completed the homepage onboarding flow (Discovery + Profiling).
 */
export function hasOnboardingCompleted(): boolean {
  return getSessionStorage()?.getItem(ONBOARDING_COMPLETED_KEY) === '1';
}

/**
 * Clear onboarding completed flag so the onboarding flow can be shown again (for "Resume Onboarding").
 */
export function clearOnboardingCompleted(): void {
  getSessionStorage()?.removeItem(ONBOARDING_COMPLETED_KEY);
}

/**
 * Store a Discovery answer (e.g. "howDoYouWantToUse", "howDidYouFindUs") for analytics.
 */
export function setDiscoveryAnswer(key: string, value: string): void {
  try {
    getSessionStorage()?.setItem(`${DISCOVERY_PREFIX}${key}`, value);
  } catch (e) {
    console.warn('Failed to set discovery answer', e);
  }
}

/**
 * Get a Discovery answer (optional, for debugging or analytics).
 */
export function getDiscoveryAnswer(key: string): string | null {
  return getSessionStorage()?.getItem(`${DISCOVERY_PREFIX}${key}`) ?? null;
}

/**
 * Clear onboarding session (e.g. after sign-up).
 */
export function clearOnboardingSession(): void {
  const storage = getSessionStorage();
  if (!storage) return;
  storage.removeItem(ANONYMOUS_ID_KEY);
  storage.removeItem(USER_GROUP_KEY);
  storage.removeItem(GUIDE_DISMISSED_KEY);
  storage.removeItem(ONBOARDING_COMPLETED_KEY);
  // Leave PENDING_PROPERTY_KEY to be consumed by migration
  // Discovery keys could be cleared here too if desired
}
