/**
 * authReady.ts
 *
 * Standalone leaf module that signals when AuthProvider has fully initialised
 * (handleRedirectPromise + role resolution complete).
 *
 * Lives in src/services/ so msalAccessToken.ts can import it WITHOUT creating
 * a circular dependency with AuthContext.tsx.
 *
 * Dependency graph (no cycle):
 *   AuthContext.tsx     → authReady.ts  (notifyAuthReady)
 *   msalAccessToken.ts  → authReady.ts  (waitForAuthReady)
 *   AuthContext.tsx     → msalAccessToken.ts  (getMsalInstance — no cycle back)
 */

/** True once AuthProvider has finished its first init pass. */
export let isAuthReady = false;

/**
 * Called by AuthProvider in its useEffect finally block.
 * Safe to call multiple times — only the first call takes effect.
 */
export function notifyAuthReady(): void {
  if (isAuthReady) return;
  isAuthReady = true;
  console.log('[AuthReady] notifyAuthReady() — dispatching auth-init-complete');
  window.dispatchEvent(new CustomEvent('auth-init-complete'));
}

/**
 * Returns a Promise that resolves once AuthProvider has fully initialised.
 * Resolves immediately if already done.
 */
export function waitForAuthReady(): Promise<void> {
  if (isAuthReady) return Promise.resolve();
  console.log('[AuthReady] waitForAuthReady() — waiting for auth-init-complete event...');
  return new Promise((resolve) => {
    window.addEventListener(
      'auth-init-complete',
      () => {
        console.log('[AuthReady] auth-init-complete received — unblocking caller');
        resolve();
      },
      { once: true },
    );
  });
}
