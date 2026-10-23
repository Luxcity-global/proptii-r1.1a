/**
 * useMessagingPoller — SSE-driven real-time messaging hook with fallback polling.
 *
 * When SSE is connected, polling is switched off entirely to save resources.
 * If the SSE stream errors or disconnects, an exponential backoff safety poll activates
 * (starting at 15s, backing off to 60s) until SSE reconnects.
 *
 * Must be called inside a component that is a descendant of MessagingProvider.
 */

import { useEffect, useContext, useRef } from 'react';
import { MessagingContext } from '../contexts/MessagingContext';
import communicationService from '../services/communicationService';
import sseService from '../services/sseService';
import { useAuth } from '../contexts/AuthContext';

const BASE_INTERVAL_MS = 15_000;
const MAX_INTERVAL_MS = 60_000;

export function useMessagingPoller(initialIntervalMs: number = BASE_INTERVAL_MS): void {
  const { _setConversations, _setUnreadCount, _setOnlineUsers } = useContext(MessagingContext);
  const { user } = useAuth();
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef<number>(initialIntervalMs);

  useEffect(() => {
    let isCancelled = false;

    /** Fetch both endpoints and write results to context. */
    async function fetchData(): Promise<void> {
      try {
        const [convs, count] = await Promise.all([
          communicationService.getConversations(),
          communicationService.getUnreadCount(),
        ]);
        if (isCancelled) return;
        // Merge: keep any optimistic conversations not yet returned by the server
        _setConversations((prev) => {
          const serverIds = new Set(convs.map((c) => c.id));
          const optimisticOnly = prev.filter((c) => !serverIds.has(c.id));
          return [...convs, ...optimisticOnly];
        });
        _setUnreadCount(count);
      } catch {
        // Silently ignore — next retry or SSE will handle
      }
    }

    /** Stop any active polling timer. */
    function stopPolling(): void {
      if (pollTimerRef.current !== null) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }

    /** Schedule next poll with exponential backoff if SSE is disconnected. */
    function scheduleFallbackPoll(): void {
      stopPolling();

      // If document is hidden or SSE is currently connected, do NOT poll
      if (document.visibilityState === 'hidden' || sseService.isConnected('communication')) {
        backoffRef.current = initialIntervalMs;
        return;
      }

      pollTimerRef.current = setTimeout(async () => {
        if (isCancelled) return;
        await fetchData();

        // Increase backoff delay up to MAX_INTERVAL_MS if SSE is still down
        backoffRef.current = Math.min(backoffRef.current * 1.5, MAX_INTERVAL_MS);
        scheduleFallbackPoll();
      }, backoffRef.current);
    }

    function syncPollingState(): void {
      if (sseService.isConnected('communication')) {
        // SSE is active — switch off polling loop
        stopPolling();
        backoffRef.current = initialIntervalMs;
      } else {
        // SSE is disconnected — trigger fallback poller with backoff
        scheduleFallbackPoll();
      }
    }

    /** Handle Page Visibility API changes. */
    function handleVisibilityChange(): void {
      if (document.visibilityState === 'hidden') {
        stopPolling();
      } else {
        // Tab became visible — fire an immediate fetch then re-evaluate
        void fetchData();
        syncPollingState();
      }
    }

    // Fire an initial fetch on mount
    void fetchData();

    // Ensure communication SSE channel is connected
    void sseService.ensureConnected('communication');

    // Check initial SSE connection state
    syncPollingState();

    // Register SSE real-time listeners
    const unsubscribeSse = sseService.on(['conversation_new'], () => {
      void fetchData();
    });

    const unsubscribePresence = sseService.on('presence_update', (event) => {
      const data = event.data as any;
      if (data?.userId && typeof data.isOnline === 'boolean') {
        _setOnlineUsers((prev) => ({ ...prev, [data.userId]: data.isOnline }));
      }
    });

    const unsubscribeConn = sseService.on('sse_connection_changed', (event) => {
      const data = event.data as { channel?: string; connected?: boolean };
      if (!data?.channel || data.channel === 'communication') {
        if (data?.connected) {
          // SSE connected! Shut off polling loop immediately
          stopPolling();
          backoffRef.current = initialIntervalMs;
          void fetchData();
        } else {
          // SSE dropped! Enable fallback polling loop
          scheduleFallbackPoll();
        }
      }
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isCancelled = true;
      stopPolling();
      unsubscribeSse();
      unsubscribePresence();
      unsubscribeConn();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIntervalMs, user?.id]);
}
