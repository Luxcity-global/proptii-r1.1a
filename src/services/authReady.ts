/**
 * authReady.ts
 *
 * Tiny standalone module that tracks whether AuthContext has fully initialised
 * (i.e. handleRedirectPromise + role resolution are complete).
 *
 * Lives in src/services/ — not in src/contexts/ — so it can be imported by
 * msalAccessToken.ts WITHOUT creating a circular dependency with AuthContext.tsx.
 *
 * Dependency graph (no cycle):
 *   AuthContext.tsx  →  authReady.ts   (notifyAuthReady / isAuthReady)
 *   msalAccessToken.ts  →  authReady.ts   (waitForAuthReady)
 *   AuthContext.tsx  →  msalAccessToken.ts   (getAccessTokenForApiRequest)
 */

/** True once AuthProvider has finished its first initialization pass. */
export let isAuthReady = false;

/**
 * Called by AuthProvider (in its useEffect finally block) after
 * handleRedirectPromise and role resolution have both completed.
 * Safe to call multiple times — only the first call takes effect.
 */
export function notifyAuthReady(): void {
  if (isAuthReady) return;
  isAuthReady = true;
  window.dispatchEvent(new CustomEvent('auth-init-complete'));
}

/**
 * Returns a promise that resolves once AuthProvider has fully initialised.
 * Resolves immediately if init is already done.
 */
export function waitForAuthReady(): Promise<void> {
  if (isAuthReady) return Promise.resolve();
  return new Promise((resolve) => {
    window.addEventListener('auth-init-complete', () => resolve(), { once: true });
  });
}
