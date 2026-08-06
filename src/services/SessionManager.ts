/**
 * SessionManager — lightweight inactivity tracker.
 *
 * Responsibility: track the last user interaction timestamp and emit
 * `sessionWarning` / `sessionEnd` custom events when the tab is idle.
 * MSAL handles token lifetimes; we do not duplicate that work here.
 *
 * Design decisions:
 *  - No AES-GCM encryption of UI interaction timestamps (no sensitive data).
 *  - No fetch monkey-patching (breaks SSE streams and interferes with MSAL).
 *  - No 5-second cross-tab sync interval (localStorage `storage` event is sufficient).
 *  - Singleton — call SessionManager.getInstance() anywhere.
 */

const ACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 min → session end
const WARNING_TIMEOUT_MS  = 25 * 60 * 1000; // 25 min → warn user
const CHECK_INTERVAL_MS   =  1 * 60 * 1000; //  1 min interval

export type ActivityType = 'interaction' | 'api_call' | 'navigation' | 'authentication' | 'idle';

export class SessionManager {
  private static instance: SessionManager;

  private lastActivity = Date.now();
  private checkTimer: ReturnType<typeof setInterval> | null = null;
  private warned = false;

  private constructor() {
    this.setupListeners();
    this.startCheck();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /** Record any meaningful user activity — resets the inactivity clock. */
  public updateActivity(_type: ActivityType, _details?: string): void {
    this.lastActivity = Date.now();
    this.warned = false;
  }

  /** Returns the session ID — kept for compatibility; always returns a fixed value. */
  public getSessionId(): string {
    return 'session';
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private setupListeners(): void {
    const bump = () => this.updateActivity('interaction');
    (['mousedown', 'keydown', 'scroll', 'touchstart'] as const).forEach(
      (e) => window.addEventListener(e, bump, { passive: true }),
    );
    window.addEventListener('popstate', () =>
      this.updateActivity('navigation', window.location.pathname),
    );
  }

  private startCheck(): void {
    this.checkTimer = setInterval(() => this.checkValidity(), CHECK_INTERVAL_MS);
  }

  private checkValidity(): void {
    const idle = Date.now() - this.lastActivity;

    if (idle >= ACTIVITY_TIMEOUT_MS) {
      this.end('timeout');
    } else if (idle >= WARNING_TIMEOUT_MS && !this.warned) {
      this.warned = true;
      const remaining = Math.floor((ACTIVITY_TIMEOUT_MS - idle) / 1000);
      window.dispatchEvent(new CustomEvent('sessionWarning', { detail: { remaining } }));
    }
  }

  private end(reason: string): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
    window.dispatchEvent(new CustomEvent('sessionEnd', { detail: { reason } }));
  }
}

export default SessionManager;
