import { getResolvedApiBaseUrl } from '../config/apiBaseUrl';
import { getAccessTokenForApiRequest } from './msalAccessToken';

export interface SseMessagePayload {
  type: string;
  userId?: string;
  targetEmail?: string;
  targetRole?: string;
  data: any;
  timestamp?: number;
}

type SseListener = (event: SseMessagePayload) => void;

const MAX_RECONNECT_ATTEMPTS = 5;

class SseService {
  private sources: Map<string, EventSource> = new Map();
  private listeners: Map<string, Set<SseListener>> = new Map();
  private reconnectTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private isConnecting: Map<string, boolean> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('auth-session-expired', () => {
        this.disconnectAll();
      });

      window.addEventListener('auth-login-success', () => {
        this.reconnectActiveChannels();
      });

      window.addEventListener('storage', (e) => {
        if (e.key === 'auth_token' && e.newValue) {
          this.reconnectActiveChannels();
        } else if (e.key === 'auth_token' && !e.newValue) {
          this.disconnectAll();
        }
      });
    }
  }

  /**
   * Reconnect any channels that have active listeners once authentication becomes valid.
   */
  public reconnectActiveChannels(): void {
    const activeChannels = new Set<string>();
    for (const eventType of this.listeners.keys()) {
      const channel = this.resolveChannelForEventType(eventType);
      activeChannels.add(channel);
    }

    activeChannels.forEach(channel => {
      this.reconnectAttempts.set(channel, 0);
      void this.ensureConnected(channel);
    });
  }

  /**
   * Register a listener for one or more event types.
   * Automatically connects to the appropriate SSE channel if not already connected and authenticated.
   */
  on(eventTypes: string | string[], listener: SseListener): () => void {
    const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes];

    types.forEach(type => {
      if (!this.listeners.has(type)) {
        this.listeners.set(type, new Set());
      }
      this.listeners.get(type)!.add(listener);

      // Auto-connect to appropriate channel based on event prefix/domain
      const channel = this.resolveChannelForEventType(type);
      void this.ensureConnected(channel);
    });

    return () => {
      types.forEach(type => {
        this.listeners.get(type)?.delete(listener);
      });
    };
  }

  private resolveChannelForEventType(type: string): string {
    if (type.startsWith('viewing_')) return 'viewing-requests';
    if (type.startsWith('contract_')) return 'contracts';
    if (type.startsWith('message_') || type.startsWith('conversation_')) return 'communication';
    if (type.startsWith('alert_')) return 'alerts';
    return 'viewing-requests';
  }

  /**
   * Connect to an SSE channel (e.g. 'viewing-requests', 'contracts', 'communication', 'alerts')
   * Requires a valid, non-expired authentication token.
   * Uses an opaque SSE ticket for the communication channel where supported.
   */
  async ensureConnected(channel: string): Promise<EventSource | null> {
    if (this.sources.has(channel)) {
      return this.sources.get(channel)!;
    }

    if (this.isConnecting.get(channel)) {
      return null;
    }

    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return null;
    }

    // Pre-flight auth check: do NOT open an SSE connection without a valid token.
    // This prevents 401 Unauthorized errors and infinite reconnect loops before login.
    let token: string | null = null;
    try {
      token = await getAccessTokenForApiRequest();
    } catch {
      token = null;
    }

    if (!token) {
      // User is not authenticated yet — defer connection until login
      return null;
    }

    this.isConnecting.set(channel, true);

    try {
      const baseUrl = getResolvedApiBaseUrl().replace(/\/$/, '');
      let sseUrl: string;

      // For communication, exchange the Bearer token for a short-lived opaque ticket
      if (channel === 'communication') {
        let ticket: string | null = null;
        try {
          const ticketRes = await fetch(`${baseUrl}/communication/sse-ticket`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          if (ticketRes.ok) {
            const data = await ticketRes.json();
            ticket = data.ticket;
          }
        } catch {
          // Fall back to token-in-url
        }

        sseUrl = ticket
          ? `${baseUrl}/${channel}/events?ticket=${encodeURIComponent(ticket)}`
          : `${baseUrl}/${channel}/events?token=${encodeURIComponent(token)}`;
      } else {
        sseUrl = `${baseUrl}/${channel}/events?token=${encodeURIComponent(token)}`;
      }

      const source = new EventSource(sseUrl);

      source.onopen = () => {
        const prevAttempts = this.reconnectAttempts.get(channel) || 0;
        this.reconnectAttempts.set(channel, 0);
        this.dispatch({ type: 'sse_connection_changed', data: { channel, connected: true }, timestamp: Date.now() });
        if (prevAttempts > 0) {
          this.dispatch({ type: 'conversation_updated', data: { reconnected: true }, timestamp: Date.now() });
        }
      };

      // Register addEventListener for every named event type
      const handleRawEvent = (eventType: string) => (msgEvent: MessageEvent) => {
        try {
          const raw = typeof msgEvent.data === 'string' ? JSON.parse(msgEvent.data) : msgEvent.data;
          const payload: SseMessagePayload = {
            type: eventType,
            userId: raw?.userId,
            targetEmail: raw?.targetEmail,
            targetRole: raw?.targetRole,
            data: raw?.data ?? raw,
            timestamp: raw?.timestamp,
          };
          this.dispatch(payload);
        } catch (err) {
          console.error(`[SSE:${channel}] Error parsing ${eventType} event:`, err);
        }
      };

      const namedEventTypes = [
        'message_new', 'message_read', 'message_edit', 'message_delete',
        'conversation_new', 'conversation_updated',
        'typing_start', 'presence_update',
      ];
      namedEventTypes.forEach(type => source.addEventListener(type, handleRawEvent(type)));

      // Fallback for unnamed events
      source.onmessage = (event) => {
        try {
          const parsed: SseMessagePayload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          this.dispatch(parsed);
        } catch (err) {
          console.error(`[SSE:${channel}] Error parsing unnamed event:`, err);
        }
      };

      source.onerror = () => {
        this.dispatch({ type: 'sse_connection_changed', data: { channel, connected: false }, timestamp: Date.now() });
        this.disconnectChannel(channel);
        this.scheduleReconnect(channel);
      };

      this.sources.set(channel, source);
      return source;
    } catch (err) {
      console.debug(`[SSE:${channel}] Connection error:`, err);
      this.scheduleReconnect(channel);
      return null;
    } finally {
      this.isConnecting.set(channel, false);
    }
  }

  private scheduleReconnect(channel: string): void {
    if (this.reconnectTimers.has(channel)) return;

    const attempts = this.reconnectAttempts.get(channel) || 0;
    if (attempts >= MAX_RECONNECT_ATTEMPTS) {
      console.warn(`[SSE:${channel}] Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Pausing retries until auth or network state changes.`);
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, attempts), 15000); // 1s, 2s, 4s, 8s, 15s
    this.reconnectAttempts.set(channel, attempts + 1);

    const timer = setTimeout(async () => {
      this.reconnectTimers.delete(channel);
      // Verify that user is authenticated before retrying
      const token = await getAccessTokenForApiRequest().catch(() => null);
      if (token) {
        void this.ensureConnected(channel);
      } else {
        console.debug(`[SSE:${channel}] Reconnect postponed: no active auth token.`);
      }
    }, delay);

    this.reconnectTimers.set(channel, timer);
  }

  private disconnectChannel(channel: string): void {
    const source = this.sources.get(channel);
    if (source) {
      source.close();
      this.sources.delete(channel);
    }
  }

  public dispatch(event: SseMessagePayload): void {
    if (!event || !event.type) return;

    const set = this.listeners.get(event.type);
    if (set) {
      set.forEach(listener => {
        try {
          listener(event);
        } catch (err) {
          console.error(`[SSE] Listener error for ${event.type}:`, err);
        }
      });
    }

    // Also dispatch to wildcard '*' listeners
    const wildcards = this.listeners.get('*');
    if (wildcards) {
      wildcards.forEach(listener => {
        try {
          listener(event);
        } catch (err) {
          console.error('[SSE] Wildcard listener error:', err);
        }
      });
    }
  }

  disconnectAll(): void {
    this.sources.forEach(source => source.close());
    this.sources.clear();
    this.reconnectTimers.forEach(timer => clearTimeout(timer));
    this.reconnectTimers.clear();
    this.reconnectAttempts.clear();
  }

  isConnected(channel: string): boolean {
    const source = this.sources.get(channel);
    return source ? source.readyState === EventSource.OPEN : false;
  }
}

export const sseService = new SseService();
export default sseService;
