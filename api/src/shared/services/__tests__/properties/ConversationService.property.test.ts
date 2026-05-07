/**
 * Property-based tests for ConversationService.
 * All Cosmos DB interactions are mocked — same pattern as ConversationService.test.ts.
 *
 * Testing framework: fast-check (fc)
 */

// ---------------------------------------------------------------------------
// Mocks — must be declared before any imports that trigger module resolution
// ---------------------------------------------------------------------------

const mockConversationsQuery = jest.fn();
const mockConversationsFetchAll = jest.fn();
const mockConversationsCreate = jest.fn();
const mockConversationsItemRead = jest.fn();
const mockConversationsItemReplace = jest.fn();
const mockConversationsItem = jest.fn();

const mockMessagesQuery = jest.fn();
const mockMessagesFetchAll = jest.fn();
const mockMessagesCreate = jest.fn();
const mockMessagesItemRead = jest.fn();
const mockMessagesItemReplace = jest.fn();
const mockMessagesItem = jest.fn();

const mockParticipantsQuery = jest.fn();
const mockParticipantsFetchAll = jest.fn();
const mockParticipantsCreate = jest.fn();

const mockAuditLogCreate = jest.fn();

const containerMocks: Record<string, any> = {
    conversations: {
        items: {
            query: mockConversationsQuery,
            create: mockConversationsCreate,
        },
        item: mockConversationsItem,
    },
    messages: {
        items: {
            query: mockMessagesQuery,
            create: mockMessagesCreate,
        },
        item: mockMessagesItem,
    },
    conversation_participants: {
        items: {
            query: mockParticipantsQuery,
            create: mockParticipantsCreate,
        },
    },
    audit_log: {
        items: {
            create: mockAuditLogCreate,
        },
    },
};

jest.mock('@azure/cosmos', () => {
    const MockCosmosClient = jest.fn().mockImplementation(() => ({
        database: jest.fn().mockReturnValue({
            container: jest.fn().mockImplementation((name: string) => {
                return containerMocks[name] ?? {};
            }),
        }),
    }));
    return { CosmosClient: MockCosmosClient };
});

jest.mock('../../../config/environment', () => ({
    validateEnv: jest.fn(() => ({
        COSMOS_DB_CONNECTION_STRING: 'mock_endpoint',
        COSMOS_DB_KEY: 'mock_key',
        COSMOS_DB_DATABASE_NAME: 'mock_db',
    })),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import * as fc from 'fast-check';
import { ConversationService } from '../../ConversationService';
import { AppError } from '../../../middleware/error-handling';
import {
    Conversation,
    Message,
    ConversationParticipant,
    AuditLog,
} from '../../../types/messaging';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
    return {
        id: 'conv-1',
        propertyId: 'prop-1',
        tenantId: 'tenant-1',
        landlordId: 'landlord-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        lastMessageAt: null,
        isDeleted: false,
        deletedAt: null,
        ...overrides,
    };
}

function makeMessage(overrides: Partial<Message> = {}): Message {
    return {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'tenant-1',
        senderRole: 'tenant',
        body: 'Hello!',
        attachmentIds: [],
        sentAt: '2024-01-01T00:00:00.000Z',
        readAt: null,
        isDeleted: false,
        deletedAt: null,
        ...overrides,
    };
}

function makeParticipant(overrides: Partial<ConversationParticipant> = {}): ConversationParticipant {
    return {
        id: 'part-1',
        conversationId: 'conv-1',
        userId: 'tenant-1',
        role: 'tenant',
        joinedAt: '2024-01-01T00:00:00.000Z',
        ...overrides,
    };
}

/** Reset all mocks to their default (empty/pass-through) state. */
function resetMocks() {
    jest.clearAllMocks();

    mockConversationsQuery.mockReturnValue({ fetchAll: mockConversationsFetchAll });
    mockConversationsFetchAll.mockResolvedValue({ resources: [] });

    mockConversationsItem.mockReturnValue({
        read: mockConversationsItemRead,
        replace: mockConversationsItemReplace,
    });
    mockConversationsItemRead.mockResolvedValue({ resource: null });
    mockConversationsItemReplace.mockResolvedValue({ resource: null });

    mockMessagesQuery.mockReturnValue({ fetchAll: mockMessagesFetchAll });
    mockMessagesFetchAll.mockResolvedValue({ resources: [] });

    mockMessagesItem.mockReturnValue({
        read: mockMessagesItemRead,
        replace: mockMessagesItemReplace,
    });
    mockMessagesItemRead.mockResolvedValue({ resource: null });
    mockMessagesItemReplace.mockResolvedValue({ resource: null });

    mockParticipantsQuery.mockReturnValue({ fetchAll: mockParticipantsFetchAll });
    mockParticipantsFetchAll.mockResolvedValue({ resources: [] });

    mockConversationsCreate.mockImplementation((item: any) =>
        Promise.resolve({ resource: item }),
    );
    mockMessagesCreate.mockImplementation((item: any) =>
        Promise.resolve({ resource: item }),
    );
    mockParticipantsCreate.mockImplementation((item: any) =>
        Promise.resolve({ resource: item }),
    );
    mockAuditLogCreate.mockImplementation((item: any) =>
        Promise.resolve({ resource: item }),
    );
}

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe('ConversationService — property-based tests', () => {
    let service: ConversationService;

    beforeEach(() => {
        resetMocks();
        service = new ConversationService();
    });

    // -------------------------------------------------------------------------
    // Property 4: Conversation creation is idempotent
    // Feature: proptii-communication, Property 4: Conversation creation is idempotent
    // -------------------------------------------------------------------------

    describe('Property 4: Conversation creation is idempotent', () => {
        /**
         * **Validates: Requirements 3.3**
         *
         * For any (propertyId, tenantId, landlordId) triple, calling
         * `getOrCreateConversation` twice must return the same conversationId
         * and only one document must exist in the conversations container.
         */
        it(
            'returns the same conversationId on repeated calls and creates only one document',
            async () => {
                await fc.assert(
                    fc.asyncProperty(
                        fc.record({
                            propertyId: fc.uuid(),
                            tenantId: fc.uuid(),
                            landlordId: fc.uuid(),
                        }),
                        async (dto) => {
                            resetMocks();
                            service = new ConversationService();

                            // Track created conversations in memory
                            const createdConversations: Conversation[] = [];

                            // First call: no existing conversation → create one
                            mockConversationsFetchAll.mockResolvedValueOnce({ resources: [] });
                            mockConversationsCreate.mockImplementationOnce((item: Conversation) => {
                                createdConversations.push(item);
                                return Promise.resolve({ resource: item });
                            });

                            const result1 = await service.getOrCreateConversation(dto);

                            // Second call: return the conversation created in the first call
                            mockConversationsFetchAll.mockResolvedValueOnce({
                                resources: [result1.conversation],
                            });

                            const result2 = await service.getOrCreateConversation(dto);

                            // Both calls must return the same conversationId
                            expect(result1.conversation.id).toBe(result2.conversation.id);

                            // First call created a new document; second call did not
                            expect(result1.created).toBe(true);
                            expect(result2.created).toBe(false);

                            // Only one document was ever inserted into the conversations container
                            expect(createdConversations).toHaveLength(1);
                        },
                    ),
                    { numRuns: 25 },
                );
            },
        );
    });

    // -------------------------------------------------------------------------
    // Property 6: Message body length validation
    // Feature: proptii-communication, Property 6: Message body length validation
    // -------------------------------------------------------------------------

    describe('Property 6: Message body length validation', () => {
        /**
         * **Validates: Requirements 4.6**
         *
         * Bodies longer than 4000 characters must be rejected with HTTP 422 /
         * MESSAGE_BODY_TOO_LONG. Bodies within [1, 4000] must be accepted.
         */
        it(
            'rejects bodies longer than 4000 characters with HTTP 422 MESSAGE_BODY_TOO_LONG',
            async () => {
                await fc.assert(
                    fc.asyncProperty(
                        fc.string({ minLength: 4001 }),
                        async (body) => {
                            resetMocks();
                            service = new ConversationService();

                            await expect(
                                service.createMessage('conv-1', { body }, 'sender-1', 'tenant'),
                            ).rejects.toMatchObject({
                                statusCode: 422,
                                code: 'MESSAGE_BODY_TOO_LONG',
                            });

                            // No message document should be created
                            expect(mockMessagesCreate).not.toHaveBeenCalled();
                        },
                    ),
                    { numRuns: 25 },
                );
            },
        );

        it(
            'accepts bodies within [1, 4000] characters and creates the message',
            async () => {
                await fc.assert(
                    fc.asyncProperty(
                        fc.string({ minLength: 1, maxLength: 4000 }),
                        async (body) => {
                            resetMocks();
                            service = new ConversationService();

                            // Provide a conversation for the lastMessageAt update
                            mockConversationsFetchAll.mockResolvedValue({
                                resources: [makeConversation({ id: 'conv-1' })],
                            });

                            const result = await service.createMessage(
                                'conv-1',
                                { body },
                                'sender-1',
                                'tenant',
                            );

                            expect(result.body).toBe(body);
                            expect(mockMessagesCreate).toHaveBeenCalledTimes(1);
                        },
                    ),
                    { numRuns: 25 },
                );
            },
        );
    });

    // -------------------------------------------------------------------------
    // Property 7: senderRole validation
    // Feature: proptii-communication, Property 7: senderRole validation
    // -------------------------------------------------------------------------

    describe('Property 7: senderRole validation', () => {
        /**
         * **Validates: Requirements 4.7**
         *
         * Any senderRole value that is not exactly 'tenant' or 'landlord' must
         * be rejected with HTTP 422 / INVALID_SENDER_ROLE.
         */
        it(
            'rejects any senderRole that is not "tenant" or "landlord" with HTTP 422 INVALID_SENDER_ROLE',
            async () => {
                await fc.assert(
                    fc.asyncProperty(
                        fc.string().filter((s) => s !== 'tenant' && s !== 'landlord'),
                        async (invalidRole) => {
                            resetMocks();
                            service = new ConversationService();

                            await expect(
                                service.createMessage(
                                    'conv-1',
                                    { body: 'Hello' },
                                    'sender-1',
                                    invalidRole as any,
                                ),
                            ).rejects.toMatchObject({
                                statusCode: 422,
                                code: 'INVALID_SENDER_ROLE',
                            });

                            expect(mockMessagesCreate).not.toHaveBeenCalled();
                        },
                    ),
                    { numRuns: 25 },
                );
            },
        );
    });

    // -------------------------------------------------------------------------
    // Property 9: conversations ordered by lastMessageAt descending
    // Feature: proptii-communication, Property 9: GET /conversations returns conversations ordered by lastMessageAt descending
    // -------------------------------------------------------------------------

    describe('Property 9: GET /conversations returns conversations ordered by lastMessageAt descending', () => {
        /**
         * **Validates: Requirements 6.1**
         *
         * `listConversationsForUser` must return conversations sorted by
         * `lastMessageAt` descending, with null values last.
         */
        it(
            'returns conversations sorted by lastMessageAt descending with nulls last',
            async () => {
                await fc.assert(
                    fc.asyncProperty(
                        fc.array(
                            fc.record({ lastMessageAt: fc.option(fc.date()) }),
                            { minLength: 2 },
                        ),
                        async (items) => {
                            resetMocks();
                            service = new ConversationService();

                            const userId = 'user-test';

                            // Build participant records and conversations from the generated items
                            const participants: ConversationParticipant[] = items.map((_, i) =>
                                makeParticipant({
                                    id: `part-${i}`,
                                    conversationId: `conv-${i}`,
                                    userId,
                                }),
                            );

                            const conversations: Conversation[] = items.map((item, i) =>
                                makeConversation({
                                    id: `conv-${i}`,
                                    lastMessageAt: item.lastMessageAt
                                        ? item.lastMessageAt.toISOString()
                                        : null,
                                }),
                            );

                            mockParticipantsFetchAll.mockResolvedValue({ resources: participants });

                            // Each conversation query returns the matching conversation
                            conversations.forEach((conv) => {
                                mockConversationsFetchAll.mockResolvedValueOnce({
                                    resources: [conv],
                                });
                            });

                            const result = await service.listConversationsForUser(userId);

                            expect(result).toHaveLength(conversations.length);

                            // Verify descending order with nulls last
                            for (let i = 0; i < result.length - 1; i++) {
                                const a = result[i].lastMessageAt;
                                const b = result[i + 1].lastMessageAt;

                                if (a === null) {
                                    // null must only appear at the end — b must also be null
                                    expect(b).toBeNull();
                                } else if (b !== null) {
                                    // Both non-null: a must be >= b (descending)
                                    expect(new Date(a).getTime()).toBeGreaterThanOrEqual(
                                        new Date(b).getTime(),
                                    );
                                }
                                // a non-null, b null → valid (non-null before null)
                            }
                        },
                    ),
                    { numRuns: 25 },
                );
            },
        );
    });

    // -------------------------------------------------------------------------
    // Property 10: messages exclude deleted and are ordered by sentAt ascending
    // Feature: proptii-communication, Property 10: GET /conversations/:id/messages excludes deleted messages and is ordered by sentAt ascending
    // -------------------------------------------------------------------------

    describe('Property 10: GET /conversations/:id/messages excludes deleted messages and is ordered by sentAt ascending', () => {
        /**
         * **Validates: Requirements 6.3, 6.7**
         *
         * `getMessages` must return only non-deleted messages, ordered by
         * `sentAt` ascending. The Cosmos DB query already filters and orders,
         * so we verify the service faithfully returns what the DB provides.
         */
        it(
            'returns only non-deleted messages in ascending sentAt order',
            async () => {
                await fc.assert(
                    fc.asyncProperty(
                        fc.array(
                            fc.record({
                                isDeleted: fc.boolean(),
                                sentAt: fc.date(),
                            }),
                        ),
                        async (items) => {
                            resetMocks();
                            service = new ConversationService();

                            // Simulate what Cosmos DB returns after applying
                            // `isDeleted = false ORDER BY sentAt ASC`
                            const nonDeleted = items
                                .filter((item) => !item.isDeleted)
                                .sort(
                                    (a, b) =>
                                        a.sentAt.getTime() - b.sentAt.getTime(),
                                );

                            const dbMessages: Message[] = nonDeleted.map((item, i) =>
                                makeMessage({
                                    id: `msg-${i}`,
                                    isDeleted: false,
                                    sentAt: item.sentAt.toISOString(),
                                }),
                            );

                            mockMessagesFetchAll.mockResolvedValue({ resources: dbMessages });

                            const result = await service.getMessages('conv-1');

                            // Only non-deleted messages are returned
                            expect(result.every((m: Message) => !m.isDeleted)).toBe(true);
                            expect(result).toHaveLength(nonDeleted.length);

                            // Messages are in ascending sentAt order
                            for (let i = 0; i < result.length - 1; i++) {
                                expect(
                                    new Date(result[i].sentAt).getTime(),
                                ).toBeLessThanOrEqual(
                                    new Date(result[i + 1].sentAt).getTime(),
                                );
                            }
                        },
                    ),
                    { numRuns: 25 },
                );
            },
        );
    });

    // -------------------------------------------------------------------------
    // Property 11: unread count matches expected formula
    // Feature: proptii-communication, Property 11: Unread count matches expected formula
    // -------------------------------------------------------------------------

    describe('Property 11: Unread count matches expected formula', () => {
        /**
         * **Validates: Requirements 6.6**
         *
         * The unread count must equal the number of messages where
         * `readAt === null AND senderId !== currentUserId`.
         */
        it(
            'unread count equals messages where readAt is null and senderId is not the current user',
            async () => {
                const currentUserId = 'fixed-user-id';

                await fc.assert(
                    fc.asyncProperty(
                        fc.array(
                            fc.record({
                                readAt: fc.option(fc.string()),
                                senderId: fc.uuid(),
                            }),
                        ),
                        async (messageInputs) => {
                            resetMocks();
                            service = new ConversationService();

                            // Set up a single conversation for the user
                            const participant = makeParticipant({
                                conversationId: 'conv-1',
                                userId: currentUserId,
                            });
                            mockParticipantsFetchAll.mockResolvedValue({
                                resources: [participant],
                            });

                            // Build messages that match the unread formula
                            const unreadMessages: Message[] = messageInputs
                                .filter(
                                    (m) => m.readAt === null && m.senderId !== currentUserId,
                                )
                                .map((m, i) =>
                                    makeMessage({
                                        id: `msg-${i}`,
                                        readAt: null,
                                        senderId: m.senderId,
                                    }),
                                );

                            // The DB query already filters for readAt=null and senderId!=userId
                            mockMessagesFetchAll.mockResolvedValue({
                                resources: unreadMessages,
                            });

                            const expectedCount = messageInputs.filter(
                                (m) => m.readAt === null && m.senderId !== currentUserId,
                            ).length;

                            const count = await service.getUnreadCount(currentUserId);

                            expect(count).toBe(expectedCount);
                        },
                    ),
                    { numRuns: 25 },
                );
            },
        );
    });

    // -------------------------------------------------------------------------
    // Property 24: soft delete sets isDeleted and deletedAt without removing document
    // Feature: proptii-communication, Property 24: Soft delete sets isDeleted and deletedAt without removing the document
    // -------------------------------------------------------------------------

    describe('Property 24: Soft delete sets isDeleted and deletedAt without removing the document', () => {
        /**
         * **Validates: Requirements 13.1, 13.2**
         *
         * After a soft delete, the document must still be retrievable with
         * `isDeleted === true` and `deletedAt` set to a valid ISO 8601 string.
         * The document must NOT be physically removed.
         */
        it(
            'sets isDeleted=true and a valid ISO 8601 deletedAt without removing the document',
            async () => {
                await fc.assert(
                    fc.asyncProperty(
                        fc.record({
                            messageId: fc.uuid(),
                            conversationId: fc.uuid(),
                        }),
                        async ({ messageId, conversationId }) => {
                            resetMocks();
                            service = new ConversationService();

                            const originalMessage = makeMessage({
                                id: messageId,
                                conversationId,
                                isDeleted: false,
                                deletedAt: null,
                            });

                            // Capture the replaced document
                            let replacedDocument: Message | null = null;

                            mockMessagesItem.mockReturnValue({
                                read: jest.fn().mockResolvedValue({ resource: originalMessage }),
                                replace: jest.fn().mockImplementation((updated: Message) => {
                                    replacedDocument = updated;
                                    return Promise.resolve({ resource: updated });
                                }),
                            });

                            await service.softDeleteMessage(messageId, conversationId, 'actor-1');

                            // Document was replaced (not deleted)
                            expect(replacedDocument).not.toBeNull();

                            // isDeleted must be true
                            expect(replacedDocument!.isDeleted).toBe(true);

                            // deletedAt must be a valid ISO 8601 string
                            expect(typeof replacedDocument!.deletedAt).toBe('string');
                            expect(
                                new Date(replacedDocument!.deletedAt!).toISOString(),
                            ).toBe(replacedDocument!.deletedAt);
                        },
                    ),
                    { numRuns: 25 },
                );
            },
        );
    });

    // -------------------------------------------------------------------------
    // Property 25: soft delete creates audit_log entry
    // Feature: proptii-communication, Property 25: Soft delete creates audit_log entry
    // -------------------------------------------------------------------------

    describe('Property 25: Soft delete creates audit_log entry', () => {
        /**
         * **Validates: Requirements 13.4**
         *
         * After each soft delete, an `audit_log` document must exist with
         * `entityType === 'message'`, the correct `entityId`, `actorId`, and
         * `action === 'soft_delete'`.
         */
        it(
            'creates an audit_log entry with correct entityType, entityId, actorId, and action',
            async () => {
                await fc.assert(
                    fc.asyncProperty(
                        fc.record({
                            messageId: fc.uuid(),
                            conversationId: fc.uuid(),
                        }),
                        async ({ messageId, conversationId }) => {
                            resetMocks();
                            service = new ConversationService();

                            const actorId = 'actor-fixed';
                            const originalMessage = makeMessage({
                                id: messageId,
                                conversationId,
                            });

                            mockMessagesItem.mockReturnValue({
                                read: jest.fn().mockResolvedValue({ resource: originalMessage }),
                                replace: jest.fn().mockResolvedValue({
                                    resource: { ...originalMessage, isDeleted: true },
                                }),
                            });

                            let capturedAuditEntry: AuditLog | null = null;
                            mockAuditLogCreate.mockImplementation((entry: AuditLog) => {
                                capturedAuditEntry = entry;
                                return Promise.resolve({ resource: entry });
                            });

                            await service.softDeleteMessage(messageId, conversationId, actorId);

                            expect(capturedAuditEntry).not.toBeNull();
                            expect(capturedAuditEntry!.entityType).toBe('message');
                            expect(capturedAuditEntry!.entityId).toBe(messageId);
                            expect(capturedAuditEntry!.actorId).toBe(actorId);
                            expect(capturedAuditEntry!.action).toBe('soft_delete');
                        },
                    ),
                    { numRuns: 25 },
                );
            },
        );
    });

    // -------------------------------------------------------------------------
    // Property 26: data isolation — user responses contain only their own conversation IDs
    // Feature: proptii-communication, Property 26: Data isolation — user responses contain only their own conversation IDs
    // -------------------------------------------------------------------------

    describe('Property 26: Data isolation — user responses contain only their own conversation IDs', () => {
        /**
         * **Validates: Requirements 14.3**
         *
         * `listConversationsForUser(userA)` must not return any conversation
         * whose `tenantId`, `landlordId`, or participant `userId` belongs
         * exclusively to userB's conversations.
         */
        it(
            'listConversationsForUser returns only conversations belonging to the requested user',
            async () => {
                await fc.assert(
                    fc.asyncProperty(
                        fc.record({
                            userA: fc.uuid(),
                            userB: fc.uuid(),
                        }).filter(({ userA, userB }) => userA !== userB),
                        async ({ userA, userB }) => {
                            resetMocks();
                            service = new ConversationService();

                            // userA has one conversation
                            const convA = makeConversation({
                                id: 'conv-a',
                                tenantId: userA,
                                landlordId: 'landlord-a',
                            });

                            // userB has a separate conversation that userA is NOT part of
                            const convB = makeConversation({
                                id: 'conv-b',
                                tenantId: userB,
                                landlordId: 'landlord-b',
                            });

                            // Participants: userA is only in conv-a
                            const participantsForA: ConversationParticipant[] = [
                                makeParticipant({
                                    id: 'part-a',
                                    conversationId: 'conv-a',
                                    userId: userA,
                                    role: 'tenant',
                                }),
                            ];

                            mockParticipantsFetchAll.mockResolvedValue({
                                resources: participantsForA,
                            });

                            // The conversations query for conv-a returns convA
                            mockConversationsFetchAll.mockResolvedValueOnce({
                                resources: [convA],
                            });

                            const result = await service.listConversationsForUser(userA);

                            // userA's result must not contain conv-b
                            const returnedIds = result.map((c: Conversation) => c.id);
                            expect(returnedIds).not.toContain(convB.id);

                            // No returned conversation should have userB as tenantId or landlordId
                            result.forEach((conv: Conversation) => {
                                expect(conv.tenantId).not.toBe(userB);
                                expect(conv.landlordId).not.toBe(userB);
                            });

                            // All returned conversations must be ones userA participates in
                            const participantConvIds = participantsForA.map(
                                (p) => p.conversationId,
                            );
                            result.forEach((conv: Conversation) => {
                                expect(participantConvIds).toContain(conv.id);
                            });
                        },
                    ),
                    { numRuns: 25 },
                );
            },
        );
    });
});
