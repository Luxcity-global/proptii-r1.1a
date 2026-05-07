/**
 * useMessagingPoller — tab-aware 30-second polling hook.
 *
 * Polls GET /api/communication/conversations and
 * GET /api/communication/conversations/unread-count every 30 seconds while
 * the browser tab is visible. Pauses when the tab is hidden and resumes
 * immediately (with a fresh fetch) when the tab becomes visible again.
 *
 * Must be called inside a component that is a descendant of MessagingProvider.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import { useEffect, useContext } from 'react';
import { MessagingContext } from '../contexts/MessagingContext';
import communicationService from '../services/communicationService';

const DEFAULT_INTERVAL_MS = 30_000;

export function useMessagingPoller(intervalMs: number = DEFAULT_INTERVAL_MS): void {
    const { _setConversations, _setUnreadCount } = useContext(MessagingContext);

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
                // Silently ignore — the next tick will retry
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

        // Start the interval (only if the tab is currently visible)
        if (document.visibilityState !== 'hidden') {
            startInterval();
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup on unmount
        return () => {
            stopInterval();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [intervalMs]);
}
