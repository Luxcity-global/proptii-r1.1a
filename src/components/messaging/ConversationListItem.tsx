/**
 * ConversationListItem — single conversation row matching the reference design.
 *
 * Layout (left → right):
 *   [Initials avatar]  [Name + preview]  [Time + unread badge]
 *
 * Requirements: 10.2, 11.2, 12.3
 */

import React from 'react';
import type { Conversation } from '../../types/messaging';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PREVIEW_MAX_CHARS = 55;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function truncatePreview(text: string, maxLength: number = PREVIEW_MAX_CHARS): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '…';
}

/** Derive up to 2 initials from a display name */
function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Deterministic hue from a string so each person gets a consistent colour */
function nameToHue(name: string): number {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash) % 360;
}

function formatTime(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ConversationListItemProps {
    conversation: Conversation;
    isActive: boolean;
    onClick: (id: string) => void;
    participantName?: string;
    propertyAddress?: string;
    lastMessageBody?: string;
    lastReadAt?: string | null;
    /** Unread message count — shown as a badge when > 0 */
    unreadCount?: number;
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
    unreadCount = 0,
}) => {
    const preview = truncatePreview(lastMessageBody || propertyAddress);

    const hasUnread =
        conversation.lastMessageAt !== null &&
        (lastReadAt === null || new Date(conversation.lastMessageAt) > new Date(lastReadAt));

    const formattedTime = conversation.lastMessageAt ? formatTime(conversation.lastMessageAt) : '';

    // Avatar colours
    const hue = nameToHue(participantName);
    const avatarBg = isActive
        ? '#3b82f6'
        : `hsl(${hue}, 55%, 92%)`;
    const avatarText = isActive
        ? '#ffffff'
        : `hsl(${hue}, 55%, 35%)`;

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
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                background: isActive ? '#eff6ff' : 'transparent',
                border: 'none',
                borderBottom: '1px solid #f3f4f6',
                borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.12s',
            }}
        >
            {/* Initials avatar */}
            <div
                aria-hidden="true"
                style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: avatarBg,
                    color: avatarText,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    flexShrink: 0,
                    letterSpacing: '0.02em',
                    transition: 'background 0.12s, color 0.12s',
                    boxShadow: isActive ? '0 0 0 2px #bfdbfe' : 'none',
                }}
            >
                {getInitials(participantName)}
            </div>

            {/* Middle — name + preview */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p
                    data-testid="participant-name"
                    style={{
                        margin: 0,
                        fontWeight: hasUnread ? 700 : 500,
                        fontSize: '0.9rem',
                        color: '#111827',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.3,
                    }}
                >
                    {participantName}
                </p>
                <p
                    data-testid="message-preview"
                    style={{
                        margin: '3px 0 0',
                        fontSize: '0.8rem',
                        color: hasUnread ? '#374151' : '#9ca3af',
                        fontWeight: hasUnread ? 500 : 400,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.4,
                    }}
                >
                    {preview}
                </p>
            </div>

            {/* Right — time + unread badge */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '5px',
                flexShrink: 0,
            }}>
                {formattedTime && (
                    <time
                        data-testid="last-message-timestamp"
                        dateTime={conversation.lastMessageAt ?? undefined}
                        style={{
                            fontSize: '0.72rem',
                            color: hasUnread ? '#3b82f6' : '#9ca3af',
                            fontWeight: hasUnread ? 600 : 400,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {formattedTime}
                    </time>
                )}

                {/* Unread badge */}
                {hasUnread && unreadCount > 0 ? (
                    <span
                        data-testid="unread-indicator"
                        aria-label={`${unreadCount} unread messages`}
                        style={{
                            minWidth: '20px',
                            height: '20px',
                            borderRadius: '10px',
                            background: '#3b82f6',
                            color: '#ffffff',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 5px',
                        }}
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                ) : hasUnread ? (
                    <span
                        data-testid="unread-indicator"
                        aria-label="Unread messages"
                        style={{
                            width: '9px',
                            height: '9px',
                            borderRadius: '50%',
                            background: '#3b82f6',
                            display: 'block',
                        }}
                    />
                ) : null}
            </div>
        </button>
    );
};

export default ConversationListItem;
