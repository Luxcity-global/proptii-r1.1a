/**
 * authReady.ts
 *
 * Standalone leaf module — signals when AuthProvider has fully initialised
 * (handleRedirectPromise + role resolution complete).
 *
 * Lives in src/services/ so msalAccessToken.ts can import it without creating
 * a circular dependency with AuthContext.tsx.
 *
 * Dependency graph (no cycle):
 *   AuthContext.tsx     → authReady.ts  (notifyAuthReady)
 *   msalAccessToken.ts  → authReady.ts  (waitForAuthReady)
 *   AuthContext.tsx     → msalAccessToken.ts  (getMsalInstance — one-way)
 */

export let isAuthReady = false;

export function notifyAuthReady(): void {
  if (isAuthReady) return;
  isAuthReady = true;
  window.dispatchEvent(new CustomEvent('auth-init-complete'));
}

export function waitForAuthReady(): Promise<void> {
  if (isAuthReady) return Promise.resolve();
  return new Promise((resolve) => {
    window.addEventListener('auth-init-complete', () => resolve(), { once: true });
  });
}
