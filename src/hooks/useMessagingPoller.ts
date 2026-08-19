/**
 * useMessagingPoller — SSE-driven real-time messaging hook with tab-aware fallback polling.
 *
 * Listens to Server-Sent Events ('message_new', 'message_read') for instant inbox updates.
 * Also runs a background safety poll every 60s while the browser tab is visible.
 *
 * Must be called inside a component that is a descendant of MessagingProvider.
 */

import { useEffect, useContext } from 'react';
import { MessagingContext } from '../contexts/MessagingContext';
import communicationService from '../services/communicationService';
import sseService from '../services/sseService';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_INTERVAL_MS = 60_000; // 60s backup interval (SSE is primary)

export function useMessagingPoller(intervalMs: number = DEFAULT_INTERVAL_MS): void {
    const { _setConversations, _setUnreadCount } = useContext(MessagingContext);
    const { user } = useAuth();

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | null = null;

        /** Fetch both endpoints and write results to context. */
        async function fetchData(): Promise<void> {
            try {
                const [convs, count] = await Promise.all([
                    communicationService.getConversations(),
                    communicationService.getUnreadCount(),
                ]);
                _setConversations(convs);
                _setUnreadCount(count);
            } catch {
                // Silently ignore — the next tick or SSE event will retry
            }
        }

        /** Start the polling interval. */
        function startInterval(): void {
            intervalId = setInterval(() => {
                void fetchData();
            }, intervalMs);
        }

        /** Stop the polling interval. */
        function stopInterval(): void {
            if (intervalId !== null) {
                clearInterval(intervalId);
                intervalId = null;
            }
        }

        /** Handle Page Visibility API changes. */
        function handleVisibilityChange(): void {
            if (document.visibilityState === 'hidden') {
                stopInterval();
            } else {
                // Tab became visible — fire an immediate fetch then restart interval
                void fetchData();
                startInterval();
            }
        }

        // Fire an initial fetch on mount
        void fetchData();

        // Register SSE real-time listener for instant push updates
        const unsubscribeSse = sseService.on(['message_new', 'message_read'], () => {
            console.debug('[useMessagingPoller] SSE message event received, updating inbox immediately');
            void fetchData();
        });

        // Start the fallback interval (only if the tab is currently visible)
        if (document.visibilityState !== 'hidden') {
            startInterval();
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup on unmount
        return () => {
            unsubscribeSse();
            stopInterval();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [intervalMs, user?.id]);
}
