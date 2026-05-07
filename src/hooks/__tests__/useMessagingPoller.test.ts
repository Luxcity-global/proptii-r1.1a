/**
 * Unit tests for useMessagingPoller hook.
 *
 * Uses Vitest fake timers to assert:
 * - Polling fires at 30-second intervals
 * - Polling pauses when the tab becomes hidden
 * - Polling resumes immediately when the tab becomes visible
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { MessagingProvider } from '../../contexts/MessagingContext';
import { useMessagingPoller } from '../useMessagingPoller';

// ---------------------------------------------------------------------------
// Mock communicationService
// ---------------------------------------------------------------------------

vi.mock('../../services/communicationService', () => ({
    default: {
        getConversations: vi.fn().mockResolvedValue([]),
        getUnreadCount: vi.fn().mockResolvedValue(0),
    },
}));

import communicationService from '../../services/communicationService';

const mockGetConversations = communicationService.getConversations as ReturnType<typeof vi.fn>;
const mockGetUnreadCount = communicationService.getUnreadCount as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPoller(intervalMs = 30_000) {
    return renderHook(() => useMessagingPoller(intervalMs), {
        wrapper: ({ children }: { children: React.ReactNode }) =>
            React.createElement(MessagingProvider, null, children),
    });
}

/** Simulate a visibilitychange event with the given state. */
function setVisibility(state: 'visible' | 'hidden') {
    Object.defineProperty(document, 'visibilityState', {
        value: state,
        configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useMessagingPoller', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mockGetConversations.mockClear();
        mockGetUnreadCount.mockClear();
        // Default: tab is visible
        Object.defineProperty(document, 'visibilityState', {
            value: 'visible',
            configurable: true,
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('fires an initial fetch on mount', async () => {
        renderPoller();
        // Flush the initial async fetch
        await vi.runAllTicks();
        expect(mockGetConversations).toHaveBeenCalledTimes(1);
        expect(mockGetUnreadCount).toHaveBeenCalledTimes(1);
    });

    it('polls at 30-second intervals', async () => {
        renderPoller();
        await vi.runAllTicks(); // initial fetch

        // Advance 30 seconds — one tick
        vi.advanceTimersByTime(30_000);
        await vi.runAllTicks();
        expect(mockGetConversations).toHaveBeenCalledTimes(2);

        // Advance another 30 seconds — second tick
        vi.advanceTimersByTime(30_000);
        await vi.runAllTicks();
        expect(mockGetConversations).toHaveBeenCalledTimes(3);
    });

    it('pauses polling when the tab becomes hidden', async () => {
        renderPoller();
        await vi.runAllTicks(); // initial fetch

        setVisibility('hidden');

        // Advance 90 seconds — no additional calls should be made
        vi.advanceTimersByTime(90_000);
        await vi.runAllTicks();

        // Only the initial fetch should have occurred
        expect(mockGetConversations).toHaveBeenCalledTimes(1);
    });

    it('resumes immediately when the tab becomes visible again', async () => {
        renderPoller();
        await vi.runAllTicks(); // initial fetch

        setVisibility('hidden');
        vi.advanceTimersByTime(60_000);
        await vi.runAllTicks();

        // Still only the initial fetch
        expect(mockGetConversations).toHaveBeenCalledTimes(1);

        // Tab becomes visible — should fire immediately
        setVisibility('visible');
        await vi.runAllTicks();

        expect(mockGetConversations).toHaveBeenCalledTimes(2);
    });

    it('resumes the 30-second interval after becoming visible', async () => {
        renderPoller();
        await vi.runAllTicks(); // initial fetch

        setVisibility('hidden');
        vi.advanceTimersByTime(60_000);
        await vi.runAllTicks();

        setVisibility('visible');
        await vi.runAllTicks(); // immediate fetch on visible

        // Now advance 30 seconds — interval should fire
        vi.advanceTimersByTime(30_000);
        await vi.runAllTicks();

        // initial + immediate-on-visible + one interval tick = 3
        expect(mockGetConversations).toHaveBeenCalledTimes(3);
    });

    it('cleans up interval and event listener on unmount', async () => {
        const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
        const { unmount } = renderPoller();
        await vi.runAllTicks();

        unmount();

        // After unmount, advancing timers should not trigger more calls
        const callCountAfterUnmount = mockGetConversations.mock.calls.length;
        vi.advanceTimersByTime(90_000);
        await vi.runAllTicks();

        expect(mockGetConversations).toHaveBeenCalledTimes(callCountAfterUnmount);
        expect(removeEventListenerSpy).toHaveBeenCalledWith(
            'visibilitychange',
            expect.any(Function),
        );
    });
});
