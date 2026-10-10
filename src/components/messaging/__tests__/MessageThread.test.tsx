/**
 * Unit tests for MessageThread component.
 *
 * Requirements: 10.3, 10.5, 11.3, 11.5, 12.1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import MessageThread from '../MessageThread';
import type { Message } from '../../../types/messaging';

// ---------------------------------------------------------------------------
// Mock communicationService
// ---------------------------------------------------------------------------

vi.mock('../../../services/communicationService', () => ({
    default: {
        getMessages: vi.fn(),
        markRead: vi.fn().mockResolvedValue(undefined),
    },
}));

// ---------------------------------------------------------------------------
// Mock sseService — prevents real EventSource connections in tests
// ---------------------------------------------------------------------------

vi.mock('../../../services/sseService', () => ({
    default: {
        on: vi.fn(() => () => {}), // returns a no-op unsubscribe function
        dispatch: vi.fn(),
    },
}));

import communicationService from '../../../services/communicationService';

const mockGetMessages = communicationService.getMessages as ReturnType<typeof vi.fn>;
const mockMarkRead = communicationService.markRead as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMessage(overrides: Partial<Message> = {}): Message {
    return {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-a',
        senderRole: 'tenant',
        body: 'Hello!',
        attachmentIds: [],
        sentAt: new Date().toISOString(),
        readAt: null,
        isDeleted: false,
        deletedAt: null,
        ...overrides,
    };
}

/** Helper: wrap messages in the { messages, hasMore } shape expected by MessageThread */
function mockMessages(msgs: Message[], hasMore = false) {
    return { messages: msgs, hasMore };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MessageThread', () => {
    beforeEach(() => {
        mockGetMessages.mockClear();
        mockMarkRead.mockClear();
    });

    it('renders messages in ascending sentAt order', async () => {
        const messages: Message[] = [
            makeMessage({ id: 'msg-3', sentAt: '2024-01-01T12:00:00Z', body: 'Third' }),
            makeMessage({ id: 'msg-1', sentAt: '2024-01-01T10:00:00Z', body: 'First' }),
            makeMessage({ id: 'msg-2', sentAt: '2024-01-01T11:00:00Z', body: 'Second' }),
        ];
        mockGetMessages.mockResolvedValueOnce(mockMessages(messages));

        render(<MessageThread conversationId="conv-1" currentUserId="user-a" />);

        await waitFor(() => {
            expect(screen.getAllByTestId('message-item')).toHaveLength(3);
        });

        const items = screen.getAllByTestId('message-item');
        const timestamps = items.map((el) => el.getAttribute('data-sent-at'));
        expect(timestamps[0]).toBe('2024-01-01T10:00:00Z');
        expect(timestamps[1]).toBe('2024-01-01T11:00:00Z');
        expect(timestamps[2]).toBe('2024-01-01T12:00:00Z');
    });

    it('right-aligns messages from currentUserId', async () => {
        const messages: Message[] = [
            makeMessage({ id: 'msg-1', senderId: 'current-user', sentAt: '2024-01-01T10:00:00Z' }),
        ];
        mockGetMessages.mockResolvedValueOnce(mockMessages(messages));

        render(<MessageThread conversationId="conv-1" currentUserId="current-user" />);

        await waitFor(() => {
            expect(screen.getAllByTestId('message-item')).toHaveLength(1);
        });

        const item = screen.getByTestId('message-item');
        expect(item.getAttribute('data-alignment')).toBe('right');
    });

    it('left-aligns messages from other senders', async () => {
        const messages: Message[] = [
            makeMessage({ id: 'msg-1', senderId: 'other-user', sentAt: '2024-01-01T10:00:00Z' }),
        ];
        mockGetMessages.mockResolvedValueOnce(mockMessages(messages));

        render(<MessageThread conversationId="conv-1" currentUserId="current-user" />);

        await waitFor(() => {
            expect(screen.getAllByTestId('message-item')).toHaveLength(1);
        });

        const item = screen.getByTestId('message-item');
        expect(item.getAttribute('data-alignment')).toBe('left');
    });

    it('calls markRead for each unread message from other senders', async () => {
        const messages: Message[] = [
            makeMessage({ id: 'msg-1', senderId: 'other-user', readAt: null }),
            makeMessage({ id: 'msg-2', senderId: 'other-user', readAt: '2024-01-01T10:00:00Z' }),
            makeMessage({ id: 'msg-3', senderId: 'current-user', readAt: null }),
        ];
        mockGetMessages.mockResolvedValueOnce(mockMessages(messages));

        render(<MessageThread conversationId="conv-1" currentUserId="current-user" />);

        await waitFor(() => {
            expect(mockMarkRead).toHaveBeenCalledTimes(1);
        });

        expect(mockMarkRead).toHaveBeenCalledWith('msg-1', 'conv-1');
    });

    it('shows an error banner when getMessages fails', async () => {
        mockGetMessages.mockRejectedValueOnce(new Error('Network error'));

        render(<MessageThread conversationId="conv-1" currentUserId="current-user" />);

        await waitFor(() => {
            expect(screen.getByTestId('message-thread-error')).toBeInTheDocument();
        });
    });

    it('shows empty state when there are no messages', async () => {
        mockGetMessages.mockResolvedValueOnce(mockMessages([]));

        render(<MessageThread conversationId="conv-1" currentUserId="current-user" />);

        await waitFor(() => {
            expect(screen.getByTestId('message-thread-empty')).toBeInTheDocument();
        });
    });

    it('re-fetches messages when conversationId changes', async () => {
        mockGetMessages.mockResolvedValue(mockMessages([]));

        const { rerender } = render(
            <MessageThread conversationId="conv-1" currentUserId="current-user" />
        );

        await waitFor(() => {
            expect(mockGetMessages).toHaveBeenCalledWith('conv-1');
        });

        rerender(<MessageThread conversationId="conv-2" currentUserId="current-user" />);

        await waitFor(() => {
            expect(mockGetMessages).toHaveBeenCalledWith('conv-2');
        });
    });

    it('shows the scroll anchor sentinel element', async () => {
        mockGetMessages.mockResolvedValueOnce(mockMessages([]));

        render(<MessageThread conversationId="conv-1" currentUserId="current-user" />);

        await waitFor(() => {
            expect(screen.getByTestId('scroll-anchor')).toBeInTheDocument();
        });
    });

    it('does not call markRead for own messages even if unread', async () => {
        const messages: Message[] = [
            makeMessage({ id: 'msg-1', senderId: 'current-user', readAt: null }),
        ];
        mockGetMessages.mockResolvedValueOnce(mockMessages(messages));

        render(<MessageThread conversationId="conv-1" currentUserId="current-user" />);

        await waitFor(() => {
            expect(screen.getAllByTestId('message-item')).toHaveLength(1);
        });

        expect(mockMarkRead).not.toHaveBeenCalled();
    });

    it('shows loading state while messages are being fetched', async () => {
        // Never resolves during this test
        let resolveMessages: (v: any) => void;
        mockGetMessages.mockReturnValueOnce(
            new Promise((res) => { resolveMessages = res; })
        );

        render(<MessageThread conversationId="conv-1" currentUserId="current-user" />);

        expect(screen.getByTestId('message-thread-loading')).toBeInTheDocument();

        // Resolve to stop leaking
        resolveMessages!(mockMessages([]));
    });

    it('displays message body text', async () => {
        const messages: Message[] = [
            makeMessage({ id: 'msg-1', body: 'Test message body', senderId: 'other-user' }),
        ];
        mockGetMessages.mockResolvedValueOnce(mockMessages(messages));

        render(<MessageThread conversationId="conv-1" currentUserId="current-user" />);

        await waitFor(() => {
            expect(screen.getByText('Test message body')).toBeInTheDocument();
        });
    });
});
