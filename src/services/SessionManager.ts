/**
 * SessionManager — lightweight inactivity tracker.
 *
 * Responsibility: track the last user interaction timestamp and emit
 * `sessionWarning` / `sessionEnd` / `sessionTimeout` / `sessionExpired` events.
 * Singleton — call SessionManager.getInstance() anywhere.
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
  private listeners: Map<string, Set<Function>> = new Map();

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

  // ─── Event Emitter API ──────────────────────────────────────────────────────

  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  public off(event: string, callback: Function): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
    }
  }

  public addEventListener(event: string, callback: Function): void {
    this.on(event, callback);
  }

  public removeEventListener(event: string, callback: Function): void {
    this.off(event, callback);
  }

  public emit(event: string, ...args: any[]): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(...args);
        } catch (e) {
          console.error(`Error in SessionManager listener for ${event}:`, e);
        }
      });
    }
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
      this.emit('sessionWarning', { remaining });
    }
  }

  private end(reason: string): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
    window.dispatchEvent(new CustomEvent('sessionEnd', { detail: { reason } }));
    this.emit('sessionEnd', { reason });
    this.emit('sessionTimeout');
    this.emit('sessionExpired');
  }
}

export default SessionManager;
