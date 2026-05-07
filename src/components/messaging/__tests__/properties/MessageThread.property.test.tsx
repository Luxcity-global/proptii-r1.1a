// Feature: proptii-communication, Property 22: MessageThread renders messages in chronological order with correct alignment

/**
 * Validates: Requirements 12.1
 *
 * Property 22: MessageThread renders messages in chronological order with correct alignment
 *
 * For any list of messages with arbitrary sentAt timestamps and senderId values, the MessageThread
 * component SHALL render them in ascending sentAt order, with messages where senderId === currentUserId
 * right-aligned and all others left-aligned.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import MessageThread from '../../MessageThread';
import type { Message } from '../../../../types/messaging';

// ---------------------------------------------------------------------------
// Mock communicationService
// ---------------------------------------------------------------------------

vi.mock('../../../../services/communicationService', () => ({
    default: {
        getMessages: vi.fn(),
        markRead: vi.fn().mockResolvedValue(undefined),
    },
}));

import communicationService from '../../../../services/communicationService';

const mockGetMessages = communicationService.getMessages as ReturnType<typeof vi.fn>;
const mockMarkRead = communicationService.markRead as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a minimal valid Message object */
function makeMessage(sentAt: Date, senderId: string, id: string): Message {
    return {
        id,
        conversationId: 'conv-test',
        senderId,
        senderRole: 'tenant',
        body: `Message from ${senderId} at ${sentAt.toISOString()}`,
        attachmentIds: [],
        sentAt: sentAt.toISOString(),
        readAt: null,
        isDeleted: false,
        deletedAt: null,
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 22: MessageThread renders messages in chronological order with correct alignment', () => {
    beforeEach(() => {
        mockGetMessages.mockClear();
        mockMarkRead.mockClear();
    });

    it('renders messages in ascending sentAt order regardless of input order', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        sentAt: fc.date(), senderId: fc.uuid(),
                    }),
                    { minLength: 2, maxLength: 10 }
                ),
                async (messageData) => {
                    // Create messages from the generated data with unique IDs
                    const messages = messageData.map((data, idx) =>
                        makeMessage(data.sentAt, data.senderId, `msg-${idx}`)
                    );

                    // Mock the service to return these messages
                    mockGetMessages.mockResolvedValueOnce(messages);

                    const currentUserId = 'current-user-test';

                    const { unmount } = render(
                        <MessageThread conversationId="conv-test" currentUserId={currentUserId} />
                    );

                    try {
                        // Wait for messages to be rendered
                        await waitFor(() => {
                            expect(screen.getAllByTestId('message-item')).toHaveLength(messages.length);
                        });

                        const items = screen.getAllByTestId('message-item');

                        // Extract sentAt timestamps from rendered elements
                        const renderedTimestamps = items.map((el) =>
                            el.getAttribute('data-sent-at')
                        );

                        // Sort the original messages by sentAt ascending (stable sort)
                        const expectedOrder = [...messages]
                            .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
                            .map((m) => m.sentAt);

                        // Assert rendered order matches expected ascending order
                        expect(renderedTimestamps).toEqual(expectedOrder);
                    } finally {
                        unmount();
                    }
                }
            ),
            { numRuns: 100 }
        );
    }, 60_000);

    it('applies correct alignment based on senderId === currentUserId', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    currentUserId: fc.uuid(),
                    messages: fc.array(
                        fc.record({
                            sentAt: fc.date(),
                            senderId: fc.uuid(),
                        }),
                        { minLength: 2, maxLength: 10 }
                    ),
                }),
                async ({ currentUserId, messages: messageData }) => {
                    // Create messages from the generated data
                    const messages = messageData.map((data, idx) =>
                        makeMessage(data.sentAt, data.senderId, `msg-${idx}`)
                    );

                    // Mock the service to return these messages
                    mockGetMessages.mockResolvedValueOnce(messages);

                    const { unmount } = render(
                        <MessageThread conversationId="conv-test" currentUserId={currentUserId} />
                    );

                    try {
                        // Wait for messages to be rendered
                        await waitFor(() => {
                            expect(screen.getAllByTestId('message-item')).toHaveLength(messages.length);
                        });

                        const items = screen.getAllByTestId('message-item');

                        // Check alignment for each rendered message
                        items.forEach((item) => {
                            const senderId = item.getAttribute('data-sender-id');
                            const alignment = item.getAttribute('data-alignment');

                            if (senderId === currentUserId) {
                                expect(alignment).toBe('right');
                            } else {
                                expect(alignment).toBe('left');
                            }
                        });
                    } finally {
                        unmount();
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('maintains chronological order and correct alignment simultaneously', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    currentUserId: fc.uuid(),
                    messages: fc.array(
                        fc.record({
                            sentAt: fc.date(),
                            senderId: fc.uuid(),
                        }),
                        { minLength: 2, maxLength: 10 }
                    ),
                }),
                async ({ currentUserId, messages: messageData }) => {
                    // Create messages from the generated data
                    const messages = messageData.map((data, idx) =>
                        makeMessage(data.sentAt, data.senderId, `msg-${idx}`)
                    );

                    // Mock the service to return these messages
                    mockGetMessages.mockResolvedValueOnce(messages);

                    const { unmount } = render(
                        <MessageThread conversationId="conv-test" currentUserId={currentUserId} />
                    );

                    try {
                        // Wait for messages to be rendered
                        await waitFor(() => {
                            expect(screen.getAllByTestId('message-item')).toHaveLength(messages.length);
                        });

                        const items = screen.getAllByTestId('message-item');

                        // Sort the original messages by sentAt ascending
                        const sortedMessages = [...messages].sort(
                            (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
                        );

                        // Verify both order and alignment for each message
                        items.forEach((item, idx) => {
                            const expectedMessage = sortedMessages[idx];
                            const renderedSentAt = item.getAttribute('data-sent-at');
                            const renderedSenderId = item.getAttribute('data-sender-id');
                            const renderedAlignment = item.getAttribute('data-alignment');

                            // Check chronological order
                            expect(renderedSentAt).toBe(expectedMessage.sentAt);
                            expect(renderedSenderId).toBe(expectedMessage.senderId);

                            // Check alignment: right for current user, left for others
                            const expectedAlignment =
                                expectedMessage.senderId === currentUserId ? 'right' : 'left';
                            expect(renderedAlignment).toBe(expectedAlignment);
                        });
                    } finally {
                        unmount();
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
