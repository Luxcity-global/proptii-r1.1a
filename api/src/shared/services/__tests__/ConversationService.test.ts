/**
 * Unit tests for ConversationService.
 * All Cosmos DB interactions are mocked.
 */

// ---------------------------------------------------------------------------
// Mocks — must be declared before any imports that trigger module resolution
// ---------------------------------------------------------------------------

// We need separate mock references for each container
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

// Map container names to their mock implementations
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

jest.mock('../../config/environment', () => ({
    validateEnv: jest.fn(() => ({
        COSMOS_DB_CONNECTION_STRING: 'mock_endpoint',
        COSMOS_DB_KEY: 'mock_key',
        COSMOS_DB_DATABASE_NAME: 'mock_db',
    })),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { ConversationService } from '../ConversationService';
import { AppError } from '../../middleware/error-handling';
import {
    Conversation,
    Message,
    ConversationParticipant,
    AuditLog,
    CreateConversationDto,
    CreateMessageDto,
} from '../../types/messaging';

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

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('ConversationService', () => {
    let service: ConversationService;

    beforeEach(() => {
        jest.clearAllMocks();

        // Default: conversations query returns empty (no existing conversation)
        mockConversationsQuery.mockReturnValue({ fetchAll: mockConversationsFetchAll });
        mockConversationsFetchAll.mockResolvedValue({ resources: [] });

        // Default: conversations item operations
        mockConversationsItem.mockReturnValue({
            read: mockConversationsItemRead,
            replace: mockConversationsItemReplace,
        });
        mockConversationsItemRead.mockResolvedValue({ resource: null });
        mockConversationsItemReplace.mockResolvedValue({ resource: null });

        // Default: messages query returns empty
        mockMessagesQuery.mockReturnValue({ fetchAll: mockMessagesFetchAll });
        mockMessagesFetchAll.mockResolvedValue({ resources: [] });

        // Default: messages item operations
        mockMessagesItem.mockReturnValue({
            read: mockMessagesItemRead,
            replace: mockMessagesItemReplace,
        });
        mockMessagesItemRead.mockResolvedValue({ resource: null });
        mockMessagesItemReplace.mockResolvedValue({ resource: null });

        // Default: participants query returns empty
        mockParticipantsQuery.mockReturnValue({ fetchAll: mockParticipantsFetchAll });
        mockParticipantsFetchAll.mockResolvedValue({ resources: [] });

        // Default: create operations return the item passed in
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

        service = new ConversationService();
    });

    // -------------------------------------------------------------------------
    // getOrCreateConversation
    // -------------------------------------------------------------------------

    describe('getOrCreateConversation', () => {
        const dto: CreateConversationDto = {
            propertyId: 'prop-1',
            tenantId: 'tenant-1',
            landlordId: 'landlord-1',
        };

        describe('when a conversation already exists', () => {
            it('returns the existing conversation with created: false', async () => {
                const existing = makeConversation();
                mockConversationsFetchAll.mockResolvedValue({ resources: [existing] });

                const result = await service.getOrCreateConversation(dto);

                expect(result.created).toBe(false);
                expect(result.conversation).toEqual(existing);
                // Should NOT create a new conversation
                expect(mockConversationsCreate).not.toHaveBeenCalled();
                expect(mockParticipantsCreate).not.toHaveBeenCalled();
            });
        });

        describe('when no conversation exists', () => {
            it('creates a new conversation and two participant records, returns created: true', async () => {
                mockConversationsFetchAll.mockResolvedValue({ resources: [] });

                const result = await service.getOrCreateConversation(dto);

                expect(result.created).toBe(true);
                expect(result.conversation.propertyId).toBe(dto.propertyId);
                expect(result.conversation.tenantId).toBe(dto.tenantId);
                expect(result.conversation.landlordId).toBe(dto.landlordId);
                expect(result.conversation.isDeleted).toBe(false);
                expect(result.conversation.lastMessageAt).toBeNull();
                expect(result.conversation.deletedAt).toBeNull();
                expect(typeof result.conversation.id).toBe('string');
                expect(typeof result.conversation.createdAt).toBe('string');
                expect(typeof result.conversation.updatedAt).toBe('string');

                // Two participant records should be created
                expect(mockParticipantsCreate).toHaveBeenCalledTimes(2);

                const participantCalls = mockParticipantsCreate.mock.calls.map(
                    (call: any[]) => call[0],
                );
                const tenantParticipant = participantCalls.find(
                    (p: ConversationParticipant) => p.userId === dto.tenantId,
                );
                const landlordParticipant = participantCalls.find(
                    (p: ConversationParticipant) => p.userId === dto.landlordId,
                );

                expect(tenantParticipant).toBeDefined();
                expect(tenantParticipant.role).toBe('tenant');
                expect(tenantParticipant.conversationId).toBe(result.conversation.id);

                expect(landlordParticipant).toBeDefined();
                expect(landlordParticipant.role).toBe('landlord');
                expect(landlordParticipant.conversationId).toBe(result.conversation.id);
            });
        });
    });

    // -------------------------------------------------------------------------
    // listConversationsForUser
    // -------------------------------------------------------------------------

    describe('listConversationsForUser', () => {
        it('returns empty array when user has no participant records', async () => {
            mockParticipantsFetchAll.mockResolvedValue({ resources: [] });

            const result = await service.listConversationsForUser('user-1');

            expect(result).toEqual([]);
        });

        it('returns conversations sorted by lastMessageAt descending, nulls last', async () => {
            const participants: ConversationParticipant[] = [
                makeParticipant({ conversationId: 'conv-1', userId: 'user-1' }),
                makeParticipant({ id: 'part-2', conversationId: 'conv-2', userId: 'user-1' }),
                makeParticipant({ id: 'part-3', conversationId: 'conv-3', userId: 'user-1' }),
            ];

            mockParticipantsFetchAll.mockResolvedValue({ resources: participants });

            const conv1 = makeConversation({ id: 'conv-1', lastMessageAt: '2024-01-03T00:00:00.000Z' });
            const conv2 = makeConversation({ id: 'conv-2', lastMessageAt: '2024-01-01T00:00:00.000Z' });
            const conv3 = makeConversation({ id: 'conv-3', lastMessageAt: null });

            // Each call to conversations query returns the matching conversation
            mockConversationsFetchAll
                .mockResolvedValueOnce({ resources: [conv1] })
                .mockResolvedValueOnce({ resources: [conv2] })
                .mockResolvedValueOnce({ resources: [conv3] });

            const result = await service.listConversationsForUser('user-1');

            expect(result).toHaveLength(3);
            expect(result[0].id).toBe('conv-1'); // most recent
            expect(result[1].id).toBe('conv-2');
            expect(result[2].id).toBe('conv-3'); // null last
        });

        it('filters out conversations that are not found (null results)', async () => {
            const participants: ConversationParticipant[] = [
                makeParticipant({ conversationId: 'conv-1', userId: 'user-1' }),
                makeParticipant({ id: 'part-2', conversationId: 'conv-deleted', userId: 'user-1' }),
            ];

            mockParticipantsFetchAll.mockResolvedValue({ resources: participants });

            mockConversationsFetchAll
                .mockResolvedValueOnce({ resources: [makeConversation({ id: 'conv-1' })] })
                .mockResolvedValueOnce({ resources: [] }); // deleted/not found

            const result = await service.listConversationsForUser('user-1');

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('conv-1');
        });
    });

    // -------------------------------------------------------------------------
    // getMessages
    // -------------------------------------------------------------------------

    describe('getMessages', () => {
        it('returns messages ordered by sentAt ascending (non-deleted only)', async () => {
            const messages: Message[] = [
                makeMessage({ id: 'msg-1', sentAt: '2024-01-01T10:00:00.000Z' }),
                makeMessage({ id: 'msg-2', sentAt: '2024-01-01T11:00:00.000Z' }),
            ];

            mockMessagesFetchAll.mockResolvedValue({ resources: messages });

            const result = await service.getMessages('conv-1');

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('msg-1');
            expect(result[1].id).toBe('msg-2');
        });

        it('returns empty array when no messages exist', async () => {
            mockMessagesFetchAll.mockResolvedValue({ resources: [] });

            const result = await service.getMessages('conv-1');

            expect(result).toEqual([]);
        });

        it('queries with isDeleted = false filter', async () => {
            mockMessagesFetchAll.mockResolvedValue({ resources: [] });

            await service.getMessages('conv-1');

            expect(mockMessagesQuery).toHaveBeenCalledWith(
                expect.objectContaining({
                    query: expect.stringContaining('isDeleted = false'),
                }),
            );
        });
    });

    // -------------------------------------------------------------------------
    // createMessage
    // -------------------------------------------------------------------------

    describe('createMessage', () => {
        const conversationId = 'conv-1';
        const senderId = 'tenant-1';
        const senderRole = 'tenant' as const;

        describe('valid message', () => {
            it('creates and returns the message', async () => {
                const dto: CreateMessageDto = { body: 'Hello, world!' };
                const conversation = makeConversation({ id: conversationId });

                // Mock conversation lookup for updating lastMessageAt
                mockConversationsFetchAll.mockResolvedValue({ resources: [conversation] });

                const result = await service.createMessage(conversationId, dto, senderId, senderRole);

                expect(result.body).toBe(dto.body);
                expect(result.conversationId).toBe(conversationId);
                expect(result.senderId).toBe(senderId);
                expect(result.senderRole).toBe(senderRole);
                expect(result.readAt).toBeNull();
                expect(result.isDeleted).toBe(false);
                expect(result.attachmentIds).toEqual([]);
                expect(mockMessagesCreate).toHaveBeenCalledTimes(1);
            });

            it('updates conversation lastMessageAt and updatedAt', async () => {
                const dto: CreateMessageDto = { body: 'Test message' };
                const conversation = makeConversation({ id: conversationId });

                mockConversationsFetchAll.mockResolvedValue({ resources: [conversation] });

                await service.createMessage(conversationId, dto, senderId, senderRole);

                expect(mockConversationsItemReplace).toHaveBeenCalledTimes(1);
                const replacedConversation = mockConversationsItemReplace.mock.calls[0][0];
                expect(replacedConversation.lastMessageAt).toBeTruthy();
                expect(replacedConversation.updatedAt).toBeTruthy();
            });

            it('includes attachmentIds when provided', async () => {
                const dto: CreateMessageDto = { body: 'With attachment', attachmentIds: ['att-1'] };
                mockConversationsFetchAll.mockResolvedValue({ resources: [makeConversation()] });

                const result = await service.createMessage(conversationId, dto, senderId, senderRole);

                expect(result.attachmentIds).toEqual(['att-1']);
            });
        });

        describe('body too long', () => {
            it('throws AppError 422 with MESSAGE_BODY_TOO_LONG when body exceeds 4000 chars', async () => {
                const dto: CreateMessageDto = { body: 'a'.repeat(4001) };

                await expect(
                    service.createMessage(conversationId, dto, senderId, senderRole),
                ).rejects.toThrow(AppError);

                await expect(
                    service.createMessage(conversationId, dto, senderId, senderRole),
                ).rejects.toMatchObject({
                    statusCode: 422,
                    code: 'MESSAGE_BODY_TOO_LONG',
                });

                expect(mockMessagesCreate).not.toHaveBeenCalled();
            });

            it('throws AppError 422 when body is empty', async () => {
                const dto: CreateMessageDto = { body: '' };

                await expect(
                    service.createMessage(conversationId, dto, senderId, senderRole),
                ).rejects.toMatchObject({
                    statusCode: 422,
                    code: 'MESSAGE_BODY_TOO_LONG',
                });
            });

            it('accepts body of exactly 4000 characters', async () => {
                const dto: CreateMessageDto = { body: 'a'.repeat(4000) };
                mockConversationsFetchAll.mockResolvedValue({ resources: [makeConversation()] });

                await expect(
                    service.createMessage(conversationId, dto, senderId, senderRole),
                ).resolves.toBeDefined();
            });

            it('accepts body of exactly 1 character', async () => {
                const dto: CreateMessageDto = { body: 'a' };
                mockConversationsFetchAll.mockResolvedValue({ resources: [makeConversation()] });

                await expect(
                    service.createMessage(conversationId, dto, senderId, senderRole),
                ).resolves.toBeDefined();
            });
        });

        describe('invalid senderRole', () => {
            it('throws AppError 422 with INVALID_SENDER_ROLE for unknown role', async () => {
                const dto: CreateMessageDto = { body: 'Hello' };

                await expect(
                    service.createMessage(conversationId, dto, senderId, 'admin' as any),
                ).rejects.toMatchObject({
                    statusCode: 422,
                    code: 'INVALID_SENDER_ROLE',
                });

                expect(mockMessagesCreate).not.toHaveBeenCalled();
            });

            it('accepts "tenant" as a valid senderRole', async () => {
                const dto: CreateMessageDto = { body: 'Hello' };
                mockConversationsFetchAll.mockResolvedValue({ resources: [makeConversation()] });

                await expect(
                    service.createMessage(conversationId, dto, senderId, 'tenant'),
                ).resolves.toBeDefined();
            });

            it('accepts "landlord" as a valid senderRole', async () => {
                const dto: CreateMessageDto = { body: 'Hello' };
                mockConversationsFetchAll.mockResolvedValue({ resources: [makeConversation()] });

                await expect(
                    service.createMessage(conversationId, dto, 'landlord-1', 'landlord'),
                ).resolves.toBeDefined();
            });
        });
    });

    // -------------------------------------------------------------------------
    // markMessageRead
    // -------------------------------------------------------------------------

    describe('markMessageRead', () => {
        it('sets readAt to current UTC ISO string', async () => {
            const message = makeMessage({ readAt: null });
            mockMessagesItemRead.mockResolvedValue({ resource: message });
            mockMessagesItemReplace.mockImplementation((updated: Message) =>
                Promise.resolve({ resource: updated }),
            );

            const result = await service.markMessageRead('msg-1', 'conv-1');

            expect(result.readAt).toBeTruthy();
            expect(new Date(result.readAt!).toISOString()).toBe(result.readAt);
        });

        it('throws AppError 404 when message is not found', async () => {
            mockMessagesItemRead.mockResolvedValue({ resource: null });

            await expect(service.markMessageRead('missing-msg', 'conv-1')).rejects.toMatchObject({
                statusCode: 404,
                code: 'MESSAGE_NOT_FOUND',
            });
        });

        it('calls replace on the messages container with updated readAt', async () => {
            const message = makeMessage({ readAt: null });
            mockMessagesItemRead.mockResolvedValue({ resource: message });
            mockMessagesItemReplace.mockImplementation((updated: Message) =>
                Promise.resolve({ resource: updated }),
            );

            await service.markMessageRead('msg-1', 'conv-1');

            expect(mockMessagesItemReplace).toHaveBeenCalledTimes(1);
            const replacedMessage = mockMessagesItemReplace.mock.calls[0][0];
            expect(replacedMessage.readAt).toBeTruthy();
        });
    });

    // -------------------------------------------------------------------------
    // getUnreadCount
    // -------------------------------------------------------------------------

    describe('getUnreadCount', () => {
        it('returns 0 when user has no participant records', async () => {
            mockParticipantsFetchAll.mockResolvedValue({ resources: [] });

            const count = await service.getUnreadCount('user-1');

            expect(count).toBe(0);
        });

        it('counts messages where readAt is null and senderId is not the user', async () => {
            const participants: ConversationParticipant[] = [
                makeParticipant({ conversationId: 'conv-1', userId: 'user-1' }),
                makeParticipant({ id: 'part-2', conversationId: 'conv-2', userId: 'user-1' }),
            ];

            mockParticipantsFetchAll.mockResolvedValue({ resources: participants });

            // conv-1 has 2 unread messages from other users
            // conv-2 has 1 unread message from other user
            mockMessagesFetchAll
                .mockResolvedValueOnce({
                    resources: [
                        makeMessage({ id: 'msg-1', conversationId: 'conv-1', senderId: 'other-user', readAt: null }),
                        makeMessage({ id: 'msg-2', conversationId: 'conv-1', senderId: 'other-user', readAt: null }),
                    ],
                })
                .mockResolvedValueOnce({
                    resources: [
                        makeMessage({ id: 'msg-3', conversationId: 'conv-2', senderId: 'other-user', readAt: null }),
                    ],
                });

            const count = await service.getUnreadCount('user-1');

            expect(count).toBe(3);
        });

        it('returns 0 when all messages are read', async () => {
            const participants: ConversationParticipant[] = [
                makeParticipant({ conversationId: 'conv-1', userId: 'user-1' }),
            ];

            mockParticipantsFetchAll.mockResolvedValue({ resources: participants });
            mockMessagesFetchAll.mockResolvedValue({ resources: [] });

            const count = await service.getUnreadCount('user-1');

            expect(count).toBe(0);
        });
    });

    // -------------------------------------------------------------------------
    // softDeleteMessage
    // -------------------------------------------------------------------------

    describe('softDeleteMessage', () => {
        it('sets isDeleted and deletedAt on the message', async () => {
            const message = makeMessage({ isDeleted: false, deletedAt: null });
            mockMessagesItemRead.mockResolvedValue({ resource: message });
            mockMessagesItemReplace.mockImplementation((updated: Message) =>
                Promise.resolve({ resource: updated }),
            );

            await service.softDeleteMessage('msg-1', 'conv-1', 'actor-1');

            expect(mockMessagesItemReplace).toHaveBeenCalledTimes(1);
            const replacedMessage = mockMessagesItemReplace.mock.calls[0][0];
            expect(replacedMessage.isDeleted).toBe(true);
            expect(replacedMessage.deletedAt).toBeTruthy();
            expect(new Date(replacedMessage.deletedAt).toISOString()).toBe(replacedMessage.deletedAt);
        });

        it('does NOT physically remove the document from Cosmos DB', async () => {
            const message = makeMessage();
            mockMessagesItemRead.mockResolvedValue({ resource: message });
            mockMessagesItemReplace.mockResolvedValue({ resource: { ...message, isDeleted: true } });

            await service.softDeleteMessage('msg-1', 'conv-1', 'actor-1');

            // replace was called (soft delete), not delete
            expect(mockMessagesItemReplace).toHaveBeenCalled();
        });

        it('creates an audit_log entry with correct fields', async () => {
            const message = makeMessage({ id: 'msg-1' });
            mockMessagesItemRead.mockResolvedValue({ resource: message });
            mockMessagesItemReplace.mockResolvedValue({ resource: { ...message, isDeleted: true } });

            await service.softDeleteMessage('msg-1', 'conv-1', 'actor-user-1');

            expect(mockAuditLogCreate).toHaveBeenCalledTimes(1);
            const auditEntry: AuditLog = mockAuditLogCreate.mock.calls[0][0];
            expect(auditEntry.entityType).toBe('message');
            expect(auditEntry.entityId).toBe('msg-1');
            expect(auditEntry.actorId).toBe('actor-user-1');
            expect(auditEntry.action).toBe('soft_delete');
            expect(typeof auditEntry.timestamp).toBe('string');
            expect(new Date(auditEntry.timestamp).toISOString()).toBe(auditEntry.timestamp);
        });

        it('throws AppError 404 when message is not found', async () => {
            mockMessagesItemRead.mockResolvedValue({ resource: null });

            await expect(
                service.softDeleteMessage('missing-msg', 'conv-1', 'actor-1'),
            ).rejects.toMatchObject({
                statusCode: 404,
                code: 'MESSAGE_NOT_FOUND',
            });

            // No audit log should be created
            expect(mockAuditLogCreate).not.toHaveBeenCalled();
        });
    });
});
