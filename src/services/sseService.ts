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
      const token = await getAccessTokenForApiRequest();
      const baseUrl = getResolvedApiBaseUrl().replace(/\/$/, '');
      const sseUrl = `${baseUrl}/${channel}/events${token ? `?token=${encodeURIComponent(token)}` : ''}`;

      const source = new EventSource(sseUrl);

      source.onopen = () => {
        console.debug(`[SSE:${channel}] Connected`);
        this.reconnectAttempts.set(channel, 0);
      };

      source.onmessage = (event) => {
        try {
          const parsed: SseMessagePayload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          this.dispatch(parsed);
        } catch (err) {
          console.debug(`[SSE:${channel}] Error parsing event:`, err);
        }
      };

      source.onerror = () => {
        console.debug(`[SSE:${channel}] Disconnected, scheduling reconnect...`);
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
    const delay = Math.min(1000 * Math.pow(2, attempts), 30000); // Exponential backoff capped at 30s
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
