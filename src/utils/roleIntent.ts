/**
 * roleIntent.ts
 *
 * Lightweight sessionStorage helper that preserves a user's intended role
 * (tenant | landlord) across the Azure B2C popup / redirect flow.
 *
 * Lifecycle:
 *   1. User clicks "I'm a Tenant" or "I manage properties" on the signup screen.
 *   2. setRoleIntent() is called → stored in sessionStorage.
 *   3. Azure B2C popup opens; the user authenticates.
 *   4. AuthContext calls RoleService.resolveRole(), which reads this value,
 *      writes it to Firestore users/{uid}, then calls clearRoleIntent().
 */

export type RoleIntentValue = 'tenant' | 'landlord';

const ROLE_INTENT_KEY = 'proptii_signup_role_intent';

/**
 * Store the user's intended role before the B2C auth flow begins.
 */
export function setRoleIntent(role: RoleIntentValue): void {
  try {
    sessionStorage.setItem(ROLE_INTENT_KEY, role);
  } catch {
    // sessionStorage blocked (private browsing, etc.) — silently ignore
  }
}

/**
 * Read the stored intent. Returns null if nothing was set.
 */
export function getRoleIntent(): RoleIntentValue | null {
  try {
    const value = sessionStorage.getItem(ROLE_INTENT_KEY);
    if (value === 'tenant' || value === 'landlord') return value;
  } catch {
    // ignore
  }
  return null;
}

/**
 * Remove the intent after it has been consumed (written to Firestore).
 */
export function clearRoleIntent(): void {
  try {
    sessionStorage.removeItem(ROLE_INTENT_KEY);
  } catch {
    // ignore
  }
}
