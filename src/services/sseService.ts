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

class SseService {
  private sources: Map<string, EventSource> = new Map();
  private listeners: Map<string, Set<SseListener>> = new Map();
  private reconnectTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private isConnecting: Map<string, boolean> = new Map();

  /**
   * Register a listener for one or more event types.
   * Automatically connects to the appropriate SSE channel if not already connected.
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
      this.ensureConnected(channel);
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
   * Uses a short-lived SSE ticket (exchanged via POST /communication/sse-ticket) so the
   * Bearer token is never exposed in the URL or server access logs.
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

    this.isConnecting.set(channel, true);

    try {
      const baseUrl = getResolvedApiBaseUrl().replace(/\/$/, '');
      let sseUrl: string;

      // For the communication channel, exchange the Bearer token for a short-lived
      // opaque ticket so the token never appears in URLs / server logs.
      if (channel === 'communication') {
        try {
          const token = await getAccessTokenForApiRequest();
          const ticketRes = await fetch(`${baseUrl}/communication/sse-ticket`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          if (ticketRes.ok) {
            const { ticket } = await ticketRes.json();
            sseUrl = `${baseUrl}/${channel}/events?ticket=${encodeURIComponent(ticket)}`;
          } else {
            // Ticket exchange failed — fall back to legacy token-in-URL
            const fallbackToken = await getAccessTokenForApiRequest().catch(() => null);
            sseUrl = `${baseUrl}/${channel}/events${fallbackToken ? `?token=${encodeURIComponent(fallbackToken)}` : ''}`;
          }
        } catch {
          // Network error — fall back to legacy
          const fallbackToken = await getAccessTokenForApiRequest().catch(() => null);
          sseUrl = `${baseUrl}/${channel}/events${fallbackToken ? `?token=${encodeURIComponent(fallbackToken)}` : ''}`;
        }
      } else {
        // Other channels: legacy token-in-URL (can be migrated similarly later)
        const token = await getAccessTokenForApiRequest().catch(() => null);
        sseUrl = `${baseUrl}/${channel}/events${token ? `?token=${encodeURIComponent(token)}` : ''}`;
      }

      const source = new EventSource(sseUrl);
      console.log('[SSE] Connecting to', sseUrl);

      source.onopen = () => {
        const prevAttempts = this.reconnectAttempts.get(channel) || 0;
        console.log(`[SSE:${channel}] Connected (readyState=${source.readyState})`);
        this.reconnectAttempts.set(channel, 0);

        // If this is a reconnect, dispatch a synthetic event so pollers immediately re-sync
        if (prevAttempts > 0) {
          this.dispatch({ type: 'conversation_updated', data: { reconnected: true }, timestamp: Date.now() });
        }
      };

      // NestJS @Sse emits named events (event: <type>\ndata: ...) when MessageEvent.type is set.
      // EventSource.onmessage only fires for unnamed events — named events are silently dropped.
      // We must use addEventListener for every event type we care about, PLUS keep onmessage
      // as a fallback for any unnamed events the backend may emit.
      const handleRawEvent = (eventType: string) => (msgEvent: MessageEvent) => {
        try {
          console.log(`[SSE named:${eventType}]`, msgEvent.data);
          const raw = typeof msgEvent.data === 'string' ? JSON.parse(msgEvent.data) : msgEvent.data;
          // The data field is the full AppServerEvent; extract the inner data payload
          const innerData = raw?.data ?? raw;
          const payload: SseMessagePayload = {
            type: eventType,
            userId: raw?.userId,
            targetEmail: raw?.targetEmail,
            targetRole: raw?.targetRole,
            data: innerData,
            timestamp: raw?.timestamp,
          };
          console.log('[SSE dispatching]', JSON.stringify(payload));
          this.dispatch(payload);
        } catch (err) {
          console.log(`[SSE:${channel}] Error parsing named event ${eventType}:`, err);
        }
      };

      // Register listeners for every named event type the backend emits
      const namedEventTypes = [
        'message_new', 'message_read', 'message_edit', 'message_delete',
        'conversation_new', 'conversation_updated',
        'typing_start',
        'presence_update',
      ];
      namedEventTypes.forEach(type => {
        source.addEventListener(type, handleRawEvent(type));
      });

      // Fallback: unnamed events (type = 'message') — kept for safety
      source.onmessage = (event) => {
        try {
          console.log('[SSE RAW onmessage]', event.data);
          const parsed: SseMessagePayload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          // Flatten double-nest if present
          const unwrapped: SseMessagePayload =
            parsed.data && typeof parsed.data === 'object' && 'data' in parsed.data && parsed.data.type === parsed.type
              ? { ...parsed, data: parsed.data.data }
              : parsed;
          this.dispatch(unwrapped);
        } catch (err) {
          console.log(`[SSE:${channel}] Error parsing unnamed event:`, err);
        }
      };

      source.onerror = (err) => {
        console.log(`[SSE:${channel}] Error/disconnect (readyState=${source.readyState})`, err);
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
    const delay = Math.min(1000 * Math.pow(2, attempts), 5000); // Exponential backoff capped at 5s
    this.reconnectAttempts.set(channel, attempts + 1);

    const timer = setTimeout(() => {
      this.reconnectTimers.delete(channel);
      this.ensureConnected(channel);
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
