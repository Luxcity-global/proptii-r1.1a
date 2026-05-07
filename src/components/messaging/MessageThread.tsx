/**
 * MessageThread — renders a conversation's message history in chronological order.
 *
 * - Fetches messages on mount and when conversationId changes.
 * - Marks each unread message as read after fetching.
 * - Sent messages (senderId === currentUserId) are right-aligned.
 * - Received messages are left-aligned.
 * - Shows an inline error banner on fetch failure.
 *
 * Requirements: 10.3, 10.5, 11.3, 11.5, 12.1
 */

import React, { useEffect, useState, useCallback } from 'react';
import type { Message } from '../../types/messaging';
import communicationService from '../../services/communicationService';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MessageThreadProps {
    conversationId: string;
    currentUserId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MessageThread: React.FC<MessageThreadProps> = ({ conversationId, currentUserId }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchAndMarkRead = useCallback(async () => {
        if (!conversationId) return;

        setLoading(true);
        setError(null);

        try {
            const fetched = await communicationService.getMessages(conversationId);

            // Sort ascending by sentAt (API should already return sorted, but enforce it)
            const sorted = [...fetched].sort(
                (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
            );

            setMessages(sorted);

            // Mark each unread message as read
            const unread = sorted.filter(
                (m) => m.readAt === null && m.senderId !== currentUserId,
            );
            await Promise.all(
                unread.map((m) => communicationService.markRead(m.id, conversationId)),
            );
        } catch {
            setError('Failed to load messages. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [conversationId, currentUserId]);

    useEffect(() => {
        fetchAndMarkRead();
    }, [fetchAndMarkRead]);

    return (
        <div
            data-testid="message-thread"
            style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}
        >
            {/* Inline error banner */}
            {error && (
                <div
                    role="alert"
                    data-testid="message-thread-error"
                    style={{
                        backgroundColor: '#fee2e2',
                        border: '1px solid #fca5a5',
                        borderRadius: '4px',
                        padding: '12px',
                        color: '#991b1b',
                    }}
                >
                    {error}
                </div>
            )}

            {/* Loading state */}
            {loading && messages.length === 0 && (
                <div data-testid="message-thread-loading" style={{ textAlign: 'center', color: '#6b7280' }}>
                    Loading messages…
                </div>
            )}

            {/* Messages */}
            {messages.map((message) => {
                const isSent = message.senderId === currentUserId;
                return (
                    <div
                        key={message.id}
                        data-testid="message-item"
                        data-sender-id={message.senderId}
                        data-sent-at={message.sentAt}
                        data-alignment={isSent ? 'right' : 'left'}
                        style={{
                            display: 'flex',
                            justifyContent: isSent ? 'flex-end' : 'flex-start',
                        }}
                    >
                        <div
                            style={{
                                maxWidth: '70%',
                                padding: '10px 14px',
                                borderRadius: '12px',
                                backgroundColor: isSent ? '#3b82f6' : '#f3f4f6',
                                color: isSent ? '#ffffff' : '#111827',
                                textAlign: isSent ? 'right' : 'left',
                            }}
                        >
                            <p style={{ margin: 0, wordBreak: 'break-word' }}>{message.body}</p>
                            <time
                                dateTime={message.sentAt}
                                style={{ fontSize: '0.75rem', opacity: 0.7, display: 'block', marginTop: '4px' }}
                            >
                                {new Date(message.sentAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </time>
                        </div>
                    </div>
                );
            })}

            {/* Empty state */}
            {!loading && !error && messages.length === 0 && (
                <div
                    data-testid="message-thread-empty"
                    style={{ textAlign: 'center', color: '#6b7280', padding: '32px' }}
                >
                    No messages yet. Start the conversation!
                </div>
            )}
        </div>
    );
};

export default MessageThread;
