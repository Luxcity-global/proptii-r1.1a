/**
 * TenantMessages — the tenant inbox page at /dashboard/messages.
 *
 * Two-column layout:
 *   Left  — scrollable list of ConversationListItem rows from MessagingContext
 *   Right — MessageThread + ComposeBox for the active conversation
 *
 * On mount, fetches conversations if the context list is empty (i.e. the
 * poller has not yet fired). Selecting a conversation calls
 * setActiveConversationId. ComposeBox.onSend appends the new message to the
 * thread optimistically via a local state update.
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useMessagingContext } from '../../contexts/MessagingContext';
import { useAuth } from '../../contexts/AuthContext';
import communicationService from '../../services/communicationService';
import ConversationListItem from '../../components/messaging/ConversationListItem';
import MessageThread from '../../components/messaging/MessageThread';
import ComposeBox from '../../components/messaging/ComposeBox';
import type { Message } from '../../types/messaging';

// ---------------------------------------------------------------------------
// Empty-state illustration (inline SVG — no external asset dependency)
// ---------------------------------------------------------------------------

const EmptyStateIllustration: React.FC = () => (
    <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <circle cx="60" cy="60" r="56" fill="#EFF6FF" />
        <rect x="28" y="38" width="64" height="44" rx="8" fill="#BFDBFE" />
        <rect x="36" y="50" width="48" height="6" rx="3" fill="#93C5FD" />
        <rect x="36" y="62" width="32" height="6" rx="3" fill="#93C5FD" />
        <circle cx="84" cy="38" r="14" fill="#3B82F6" />
        <path
            d="M78 38h12M84 32v12"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
        />
    </svg>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TenantMessages: React.FC = () => {
    const {
        conversations,
        activeConversationId,
        setActiveConversationId,
        _setConversations,
    } = useMessagingContext();

    const { user } = useAuth();

    // Local optimistic messages appended by ComposeBox before the next poll
    const [optimisticMessages, setOptimisticMessages] = useState<Record<string, Message[]>>({});

    // Fetch conversations on mount if the poller hasn't populated them yet
    useEffect(() => {
        if (conversations.length === 0) {
            communicationService
                .getConversations()
                .then((convs) => {
                    if (convs.length > 0) {
                        _setConversations(convs);
                    }
                })
                .catch(() => {
                    // Silently ignore — the poller will retry
                });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSelectConversation = useCallback(
        (id: string) => {
            setActiveConversationId(id);
            // Clear optimistic messages for this conversation when re-opening
            // (MessageThread will fetch the real messages)
            setOptimisticMessages((prev) => ({ ...prev, [id]: [] }));
        },
        [setActiveConversationId],
    );

    const handleSend = useCallback(
        (message: Message) => {
            if (!activeConversationId) return;
            setOptimisticMessages((prev) => ({
                ...prev,
                [activeConversationId]: [
                    ...(prev[activeConversationId] ?? []),
                    message,
                ],
            }));
        },
        [activeConversationId],
    );

    const currentUserId = user?.id ?? '';

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    return (
        <div
            data-testid="tenant-messages-page"
            style={{
                display: 'flex',
                height: 'calc(100vh - 160px)',
                minHeight: '500px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid #e5e7eb',
                backgroundColor: '#ffffff',
                marginTop: '16px',
            }}
        >
            {/* ----------------------------------------------------------------
                Left column — conversation list
            ---------------------------------------------------------------- */}
            <aside
                aria-label="Conversations"
                style={{
                    width: '320px',
                    flexShrink: 0,
                    borderRight: '1px solid #e5e7eb',
                    display: 'flex',
                    flexDirection: 'column',
                    overflowY: 'auto',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '16px',
                        borderBottom: '1px solid #e5e7eb',
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: '#111827',
                        flexShrink: 0,
                    }}
                >
                    Messages
                </div>

                {/* Conversation list or empty state */}
                {conversations.length === 0 ? (
                    <div
                        data-testid="empty-state"
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '32px 16px',
                            gap: '16px',
                            color: '#6b7280',
                            textAlign: 'center',
                        }}
                    >
                        <EmptyStateIllustration />
                        <p style={{ margin: 0, fontWeight: 600, color: '#374151' }}>
                            No conversations yet
                        </p>
                        <p style={{ margin: 0, fontSize: '0.875rem' }}>
                            Start a conversation from a property listing.
                        </p>
                    </div>
                ) : (
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {conversations.map((conversation) => (
                            <ConversationListItem
                                key={conversation.id}
                                conversation={conversation}
                                isActive={conversation.id === activeConversationId}
                                onClick={handleSelectConversation}
                                // Derive display names from conversation metadata.
                                // The landlord is the "other" participant from the tenant's perspective.
                                participantName="Landlord"
                                propertyAddress={conversation.propertyId}
                            />
                        ))}
                    </div>
                )}
            </aside>

            {/* ----------------------------------------------------------------
                Right column — message thread + compose box
            ---------------------------------------------------------------- */}
            <main
                aria-label="Message thread"
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {activeConversationId ? (
                    <>
                        {/* Thread header */}
                        <div
                            style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid #e5e7eb',
                                fontWeight: 600,
                                fontSize: '0.9375rem',
                                color: '#111827',
                                flexShrink: 0,
                            }}
                        >
                            {conversations.find((c) => c.id === activeConversationId)?.propertyId ??
                                'Conversation'}
                        </div>

                        {/* Scrollable message thread */}
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <MessageThread
                                conversationId={activeConversationId}
                                currentUserId={currentUserId}
                            />

                            {/* Optimistic messages appended immediately after send */}
                            {(optimisticMessages[activeConversationId] ?? []).map((msg) => (
                                <div
                                    key={msg.id}
                                    data-testid="optimistic-message"
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        padding: '4px 16px',
                                    }}
                                >
                                    <div
                                        style={{
                                            maxWidth: '70%',
                                            padding: '10px 14px',
                                            borderRadius: '12px',
                                            backgroundColor: '#3b82f6',
                                            color: '#ffffff',
                                            opacity: 0.85,
                                        }}
                                    >
                                        <p style={{ margin: 0, wordBreak: 'break-word' }}>{msg.body}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Compose box */}
                        <div style={{ flexShrink: 0, borderTop: '1px solid #e5e7eb' }}>
                            <ComposeBox
                                conversationId={activeConversationId}
                                onSend={handleSend}
                            />
                        </div>
                    </>
                ) : (
                    /* No conversation selected */
                    <div
                        data-testid="no-conversation-selected"
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#6b7280',
                            gap: '12px',
                            padding: '32px',
                            textAlign: 'center',
                        }}
                    >
                        <svg
                            width="64"
                            height="64"
                            viewBox="0 0 64 64"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                        >
                            <path
                                d="M8 12C8 9.79 9.79 8 12 8h40c2.21 0 4 1.79 4 4v28c0 2.21-1.79 4-4 4H20l-8 8V12z"
                                fill="#E5E7EB"
                            />
                            <path
                                d="M20 24h24M20 32h16"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                        </svg>
                        <p style={{ margin: 0, fontWeight: 600, color: '#374151' }}>
                            Select a conversation
                        </p>
                        <p style={{ margin: 0, fontSize: '0.875rem' }}>
                            Choose a conversation from the list to view messages.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default TenantMessages;
