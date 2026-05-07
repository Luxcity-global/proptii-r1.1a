/**
 * ConversationListItem — renders a single conversation summary row in an inbox list.
 *
 * Displays:
 * - Property address
 * - Participant name (derived from conversation metadata)
 * - Last message preview truncated to 80 characters
 * - Timestamp of the last message
 * - Unread dot indicator when lastMessageAt is newer than the last readAt
 *
 * Requirements: 10.2, 11.2, 12.3
 */

import React from 'react';
import type { Conversation } from '../../types/messaging';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PREVIEW_MAX_CHARS = 80;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Truncates a string to at most maxLength characters, appending "…" if truncated.
 */
export function truncatePreview(text: string, maxLength: number = PREVIEW_MAX_CHARS): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '…';
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ConversationListItemProps {
    conversation: Conversation;
    isActive: boolean;
    onClick: (id: string) => void;
    /** The display name of the other participant (tenant or landlord name) */
    participantName?: string;
    /** The property address to display */
    propertyAddress?: string;
    /** The last message body for preview (optional — shown truncated to 80 chars) */
    lastMessageBody?: string;
    /** The readAt timestamp of the current user's last read in this conversation */
    lastReadAt?: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ConversationListItem: React.FC<ConversationListItemProps> = ({
    conversation,
    isActive,
    onClick,
    participantName = 'Unknown',
    propertyAddress = 'Unknown property',
    lastMessageBody = '',
    lastReadAt = null,
}) => {
    const preview = truncatePreview(lastMessageBody);

    // Show unread dot when lastMessageAt is newer than lastReadAt (or lastReadAt is null)
    const hasUnread =
        conversation.lastMessageAt !== null &&
        (lastReadAt === null ||
            new Date(conversation.lastMessageAt) > new Date(lastReadAt));

    const formattedTimestamp = conversation.lastMessageAt
        ? new Date(conversation.lastMessageAt).toLocaleString([], {
            dateStyle: 'short',
            timeStyle: 'short',
        })
        : '';

    return (
        <button
            type="button"
            data-testid="conversation-list-item"
            data-conversation-id={conversation.id}
            onClick={() => onClick(conversation.id)}
            aria-pressed={isActive}
            aria-label={`Conversation with ${participantName} about ${propertyAddress}`}
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                background: isActive ? '#eff6ff' : 'transparent',
                border: 'none',
                borderBottom: '1px solid #f3f4f6',
                cursor: 'pointer',
                textAlign: 'left',
            }}
        >
            {/* Unread dot */}
            <div
                data-testid="unread-indicator"
                aria-label={hasUnread ? 'Unread messages' : undefined}
                style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: hasUnread ? '#3b82f6' : 'transparent',
                    flexShrink: 0,
                    marginTop: '4px',
                }}
            />

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Property address */}
                <p
                    data-testid="property-address"
                    style={{
                        margin: 0,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: '#111827',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {propertyAddress}
                </p>

                {/* Participant name */}
                <p
                    data-testid="participant-name"
                    style={{
                        margin: '2px 0',
                        fontSize: '0.8125rem',
                        color: '#374151',
                    }}
                >
                    {participantName}
                </p>

                {/* Last message preview */}
                <p
                    data-testid="message-preview"
                    style={{
                        margin: 0,
                        fontSize: '0.8125rem',
                        color: '#6b7280',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {preview}
                </p>
            </div>

            {/* Timestamp */}
            {formattedTimestamp && (
                <time
                    data-testid="last-message-timestamp"
                    dateTime={conversation.lastMessageAt ?? undefined}
                    style={{
                        fontSize: '0.75rem',
                        color: '#9ca3af',
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {formattedTimestamp}
                </time>
            )}
        </button>
    );
};

export default ConversationListItem;
