// Feature: proptii-communication, Property 15: Poller calls APIs at 30-second intervals when tab is visible
// Feature: proptii-communication, Property 16: Poller resumes immediately on tab becoming visible

/**
 * Validates: Requirements 8.1 (Property 15)
 * Validates: Requirements 8.3 (Property 16)
 *
 * Property 15: Poller calls APIs at 30-second intervals when tab is visible
 * For any number of elapsed 30-second ticks (1–20), the poller SHALL have
 * called getConversations and getUnreadCount exactly (ticks + 1) times
 * (the +1 accounts for the initial fetch on mount).
 *
 * Property 16: Poller resumes immediately on tab becoming visible
 * For any number of hide/show cycles (1–5), an immediate API call is made
 * on each visibility-restored event before the next 30-second tick.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import * as fc from 'fast-check';
import { MessagingProvider } from '../../../contexts/MessagingContext';
import { useMessagingPoller } from '../../useMessagingPoller';

// ---------------------------------------------------------------------------
// Mock communicationService
// ---------------------------------------------------------------------------

vi.mock('../../../services/communicationService', () => ({
    default: {
        getConversations: vi.fn().mockResolvedValue([]),
        getUnreadCount: vi.fn().mockResolvedValue(0),
    },
}));

import communicationService from '../../../services/communicationService';

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

function setVisibility(state: 'visible' | 'hidden') {
    Object.defineProperty(document, 'visibilityState', {
        value: state,
        configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
}

// ---------------------------------------------------------------------------
// Property 15: Poller calls APIs at 30-second intervals when tab is visible
// Validates: Requirements 8.1
// ---------------------------------------------------------------------------

describe('Property 15: Poller calls APIs at 30-second intervals when tab is visible', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mockGetConversations.mockClear();
        mockGetUnreadCount.mockClear();
        Object.defineProperty(document, 'visibilityState', {
            value: 'visible',
            configurable: true,
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('calls getConversations and getUnreadCount exactly (ticks + 1) times for any number of ticks', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 1, max: 20 }),
                async (ticks) => {
                    mockGetConversations.mockClear();
                    mockGetUnreadCount.mockClear();

                    const { unmount } = renderPoller();

                    // Flush the initial fetch
                    await vi.runAllTicks();

                    // Advance fake timers by ticks * 30_000 ms
                    vi.advanceTimersByTime(ticks * 30_000);
                    await vi.runAllTicks();

                    const expectedCalls = ticks + 1; // ticks interval calls + 1 initial call

                    const convCalls = mockGetConversations.mock.calls.length;
                    const unreadCalls = mockGetUnreadCount.mock.calls.length;

                    unmount();

                    return convCalls === expectedCalls && unreadCalls === expectedCalls;
                },
            ),
            { numRuns: 20 },
        );
    });
});

// ---------------------------------------------------------------------------
// Property 16: Poller resumes immediately on tab becoming visible
// Validates: Requirements 8.3
// ---------------------------------------------------------------------------

describe('Property 16: Poller resumes immediately on tab becoming visible', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mockGetConversations.mockClear();
        mockGetUnreadCount.mockClear();
        Object.defineProperty(document, 'visibilityState', {
            value: 'visible',
            configurable: true,
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('makes an immediate API call on each visibility-restored event before the next 30-second tick', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 1, max: 5 }),
                async (cycles) => {
                    mockGetConversations.mockClear();
                    mockGetUnreadCount.mockClear();

                    const { unmount } = renderPoller();

                    // Flush the initial fetch
                    await vi.runAllTicks();
                    const callsAfterMount = mockGetConversations.mock.calls.length; // = 1

                    let expectedCalls = callsAfterMount;

                    for (let i = 0; i < cycles; i++) {
                        // Hide the tab — polling pauses
                        setVisibility('hidden');
                        // Advance time but NOT a full 30s interval
                        vi.advanceTimersByTime(15_000);
                        await vi.runAllTicks();

                        const callsWhileHidden = mockGetConversations.mock.calls.length;

                        // Show the tab — should fire immediately
                        setVisibility('visible');
                        await vi.runAllTicks();

                        const callsAfterVisible = mockGetConversations.mock.calls.length;

                        // An immediate call must have been made upon becoming visible
                        if (callsAfterVisible !== callsWhileHidden + 1) {
                            unmount();
                            return false;
                        }

                        expectedCalls = callsAfterVisible;

                        // Advance a bit to let the restarted interval settle (but not fire)
                        vi.advanceTimersByTime(5_000);
                        await vi.runAllTicks();
                    }

                    unmount();
                    return true;
                },
            ),
            { numRuns: 5 },
        );
    });
});
