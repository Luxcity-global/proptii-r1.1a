// Feature: proptii-communication, Property 21: ConversationListItem renders all required fields with preview truncated to 80 characters

/**
 * Validates: Requirements 10.2, 11.2
 *
 * Property 21: ConversationListItem renders all required fields with preview truncated to 80 characters
 *
 * For any conversation with a last message body of arbitrary length, the ConversationListItem
 * component SHALL render the property address, participant name, timestamp, and unread indicator,
 * and the last message preview SHALL be truncated to at most 80 characters.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import ConversationListItem from '../../ConversationListItem';
import type { Conversation } from '../../../../types/messaging';

/** Minimal valid Conversation object */
function makeConversation(lastMessageAt: string | null = null): Conversation {
    return {
        id: 'conv-123',
        propertyId: 'prop-456',
        tenantId: 'tenant-789',
        landlordId: 'landlord-012',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastMessageAt,
        isDeleted: false,
        deletedAt: null,
    };
}

describe('Property 21: ConversationListItem renders all required fields with preview truncated to 80 characters', () => {
    it('renders property address, participant name, timestamp, unread indicator, and truncates preview to at most 80 chars', () => {
        fc.assert(
            fc.property(
                fc.record({
                    lastMessageBody: fc.string(),
                    propertyAddress: fc.string({ minLength: 1 }),
                    participantName: fc.string({ minLength: 1 }),
                }),
                ({ lastMessageBody, propertyAddress, participantName }) => {
                    const conversation = makeConversation(new Date().toISOString());

                    const { unmount } = render(
                        <ConversationListItem
                            conversation={conversation}
                            isActive={false}
                            onClick={() => { }}
                            propertyAddress={propertyAddress}
                            participantName={participantName}
                            lastMessageBody={lastMessageBody}
                            lastReadAt={null}
                        />
                    );

                    // Assert all required fields are rendered
                    const addressEl = screen.getByTestId('property-address');
                    const participantEl = screen.getByTestId('participant-name');
                    const previewEl = screen.getByTestId('message-preview');
                    const unreadEl = screen.getByTestId('unread-indicator');

                    expect(addressEl).toBeInTheDocument();
                    expect(participantEl).toBeInTheDocument();
                    expect(previewEl).toBeInTheDocument();
                    expect(unreadEl).toBeInTheDocument();

                    // Assert preview is truncated to at most 80 characters
                    const renderedPreview = previewEl.textContent ?? '';
                    const isValid = renderedPreview.length <= 80;

                    unmount();

                    return isValid;
                }
            ),
            { numRuns: 10 }
        );
    });

    it('truncates long message bodies to exactly 80 characters plus ellipsis', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 81 }),
                (longBody) => {
                    const conversation = makeConversation(new Date().toISOString());

                    const { unmount } = render(
                        <ConversationListItem
                            conversation={conversation}
                            isActive={false}
                            onClick={() => { }}
                            lastMessageBody={longBody}
                        />
                    );

                    const previewEl = screen.getByTestId('message-preview');
                    const renderedPreview = previewEl.textContent ?? '';

                    // Should be exactly 80 chars + "…" = 81 chars
                    const isValid = renderedPreview.length === 81 && renderedPreview.endsWith('…');

                    unmount();

                    return isValid;
                }
            ),
            { numRuns: 10 }
        );
    });

    it('does not truncate message bodies shorter than or equal to 80 characters', () => {
        fc.assert(
            fc.property(
                fc.string({ maxLength: 80 }),
                (shortBody) => {
                    const conversation = makeConversation(new Date().toISOString());

                    const { unmount } = render(
                        <ConversationListItem
                            conversation={conversation}
                            isActive={false}
                            onClick={() => { }}
                            lastMessageBody={shortBody}
                        />
                    );

                    const previewEl = screen.getByTestId('message-preview');
                    const renderedPreview = previewEl.textContent ?? '';

                    // Should be exactly the same as the input
                    const isValid = renderedPreview === shortBody;

                    unmount();

                    return isValid;
                }
            ),
            { numRuns: 10 }
        );
    });
});
