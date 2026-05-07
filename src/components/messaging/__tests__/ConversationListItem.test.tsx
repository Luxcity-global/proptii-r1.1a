/**
 * Unit tests for ConversationListItem component.
 *
 * Requirements: 10.2, 11.2, 12.3
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConversationListItem, { truncatePreview } from '../ConversationListItem';
import type { Conversation } from '../../../types/messaging';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
    return {
        id: 'conv-1',
        propertyId: 'prop-1',
        tenantId: 'tenant-1',
        landlordId: 'landlord-1',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
        lastMessageAt: '2024-01-01T12:00:00Z',
        isDeleted: false,
        deletedAt: null,
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// truncatePreview utility
// ---------------------------------------------------------------------------

describe('truncatePreview', () => {
    it('returns the string unchanged when it is 80 characters or fewer', () => {
        const text = 'a'.repeat(80);
        expect(truncatePreview(text)).toBe(text);
    });

    it('truncates strings longer than 80 characters and appends ellipsis', () => {
        const text = 'a'.repeat(100);
        const result = truncatePreview(text);
        expect(result).toBe('a'.repeat(80) + '…');
        expect(result.length).toBe(81);
    });

    it('returns empty string unchanged', () => {
        expect(truncatePreview('')).toBe('');
    });
});

// ---------------------------------------------------------------------------
// ConversationListItem rendering
// ---------------------------------------------------------------------------

describe('ConversationListItem', () => {
    it('renders property address', () => {
        render(
            <ConversationListItem
                conversation={makeConversation()}
                isActive={false}
                onClick={() => { }}
                propertyAddress="123 Test Street, London"
            />
        );
        expect(screen.getByTestId('property-address')).toHaveTextContent('123 Test Street, London');
    });

    it('renders participant name', () => {
        render(
            <ConversationListItem
                conversation={makeConversation()}
                isActive={false}
                onClick={() => { }}
                participantName="John Doe"
            />
        );
        expect(screen.getByTestId('participant-name')).toHaveTextContent('John Doe');
    });

    it('renders last message preview truncated to 80 characters', () => {
        const longBody = 'x'.repeat(200);
        render(
            <ConversationListItem
                conversation={makeConversation()}
                isActive={false}
                onClick={() => { }}
                lastMessageBody={longBody}
            />
        );
        const preview = screen.getByTestId('message-preview');
        expect(preview.textContent?.length).toBeLessThanOrEqual(81); // 80 + ellipsis
        expect(preview.textContent).toMatch(/…$/);
    });

    it('renders timestamp when lastMessageAt is set', () => {
        render(
            <ConversationListItem
                conversation={makeConversation({ lastMessageAt: '2024-06-15T14:30:00Z' })}
                isActive={false}
                onClick={() => { }}
            />
        );
        expect(screen.getByTestId('last-message-timestamp')).toBeInTheDocument();
    });

    it('shows unread dot when lastMessageAt is newer than lastReadAt', () => {
        render(
            <ConversationListItem
                conversation={makeConversation({ lastMessageAt: '2024-01-01T12:00:00Z' })}
                isActive={false}
                onClick={() => { }}
                lastReadAt="2024-01-01T11:00:00Z"
            />
        );
        const dot = screen.getByTestId('unread-indicator');
        expect(dot).toHaveStyle({ backgroundColor: '#3b82f6' });
    });

    it('hides unread dot when lastReadAt is newer than lastMessageAt', () => {
        render(
            <ConversationListItem
                conversation={makeConversation({ lastMessageAt: '2024-01-01T11:00:00Z' })}
                isActive={false}
                onClick={() => { }}
                lastReadAt="2024-01-01T12:00:00Z"
            />
        );
        const dot = screen.getByTestId('unread-indicator');
        // When read, the dot should NOT have the unread blue color
        expect(dot).not.toHaveStyle({ backgroundColor: '#3b82f6' });
    });

    it('shows unread dot when lastReadAt is null', () => {
        render(
            <ConversationListItem
                conversation={makeConversation({ lastMessageAt: '2024-01-01T12:00:00Z' })}
                isActive={false}
                onClick={() => { }}
                lastReadAt={null}
            />
        );
        const dot = screen.getByTestId('unread-indicator');
        expect(dot).toHaveStyle({ backgroundColor: '#3b82f6' });
    });

    it('calls onClick with conversation id when clicked', () => {
        const handleClick = vi.fn();
        render(
            <ConversationListItem
                conversation={makeConversation({ id: 'conv-abc' })}
                isActive={false}
                onClick={handleClick}
            />
        );
        fireEvent.click(screen.getByTestId('conversation-list-item'));
        expect(handleClick).toHaveBeenCalledWith('conv-abc');
    });

    it('applies active styling when isActive is true', () => {
        render(
            <ConversationListItem
                conversation={makeConversation()}
                isActive={true}
                onClick={() => { }}
            />
        );
        const item = screen.getByTestId('conversation-list-item');
        expect(item).toHaveAttribute('aria-pressed', 'true');
    });
});
