/**
 * Unit tests for ConversationService.
 * All MongoDB interactions are mocked via jest.mock('mongoose').
 */

// ---------------------------------------------------------------------------
// Mock mongoose models before any imports
// ---------------------------------------------------------------------------

const mockConversationFindOne = jest.fn();
const mockConversationFind = jest.fn();
const mockConversationCreate = jest.fn();
const mockConversationFindOneAndUpdate = jest.fn();

const mockMessageFind = jest.fn();
const mockMessageCreate = jest.fn();
const mockMessageFindOneAndUpdate = jest.fn();
const mockMessageCountDocuments = jest.fn();

const mockParticipantFind = jest.fn();
const mockParticipantCreate = jest.fn();

const mockAuditLogCreate = jest.fn();

jest.mock('../../models/messaging.models', () => ({
    ConversationModel: {
        findOne: mockConversationFindOne,
        find: mockConversationFind,
        create: mockConversationCreate,
        findOneAndUpdate: mockConversationFindOneAndUpdate,
    },
    MessageModel: {
        find: mockMessageFind,
        create: mockMessageCreate,
        findOneAndUpdate: mockMessageFindOneAndUpdate,
        countDocuments: mockMessageCountDocuments,
    },
    ConversationParticipantModel: {
        find: mockParticipantFind,
        create: mockParticipantCreate,
    },
    AuditLogModel: {
        create: mockAuditLogCreate,
    },
    MessageAttachmentModel: { find: jest.fn(), create: jest.fn() },
    NotificationLogModel: { find: jest.fn(), create: jest.fn(), findOne: jest.fn() },
    AuditLogDocument: {},
    UserModel: { findOne: jest.fn(), findOneAndUpdate: jest.fn() },
}));

jest.mock('../../config/mongodb', () => ({
    getMongoConnection: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../config/environment', () => ({
    validateEnv: jest.fn(() => ({
        MONGODB_URI: 'mongodb://localhost:27017',
        MONGODB_DB_NAME: 'test',
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

function lean<T>(value: T) {
    return { lean: () => value };
}

function leanSort<T>(value: T) {
    return { sort: () => ({ lean: () => value }) };
}

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
    return {
        id: 'conv-1', propertyId: 'prop-1', tenantId: 'tenant-1', landlordId: 'landlord-1',
        createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z',
        lastMessageAt: null, isDeleted: false, deletedAt: null, ...overrides,
    };
}

function makeMessage(overrides: Partial<Message> = {}): Message {
    return {
        id: 'msg-1', conversationId: 'conv-1', senderId: 'tenant-1', senderRole: 'tenant',
        body: 'Hello!', attachmentIds: [], sentAt: '2024-01-01T00:00:00.000Z',
        readAt: null, isDeleted: false, deletedAt: null, ...overrides,
    };
}

function makeParticipant(overrides: Partial<ConversationParticipant> = {}): ConversationParticipant {
    return {
        id: 'part-1', conversationId: 'conv-1', userId: 'tenant-1',
        role: 'tenant', joinedAt: '2024-01-01T00:00:00.000Z', ...overrides,
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ConversationService', () => {
    let service: ConversationService;

    beforeEach(() => {
        jest.clearAllMocks();
        // Default: findOne returns null (no existing conversation)
        mockConversationFindOne.mockReturnValue(lean(null));
        mockConversationCreate.mockResolvedValue({});
        mockConversationFindOneAndUpdate.mockReturnValue(lean(null));
        mockMessageFind.mockReturnValue(leanSort([]));
        mockMessageCreate.mockResolvedValue({});
        mockMessageFindOneAndUpdate.mockReturnValue(lean(null));
        mockMessageCountDocuments.mockResolvedValue(0);
        mockParticipantFind.mockReturnValue(lean([]));
        mockParticipantCreate.mockResolvedValue({});
        mockAuditLogCreate.mockResolvedValue({});
        service = new ConversationService();
    });

    // -------------------------------------------------------------------------
    // getOrCreateConversation
    // -------------------------------------------------------------------------

    describe('getOrCreateConversation', () => {
        const dto: CreateConversationDto = { propertyId: 'prop-1', tenantId: 'tenant-1', landlordId: 'landlord-1' };

        it('returns the existing conversation with created: false', async () => {
            const existing = makeConversation();
            mockConversationFindOne.mockReturnValue(lean(existing));

            const result = await service.getOrCreateConversation(dto);

            expect(result.created).toBe(false);
            expect(result.conversation).toEqual(existing);
            expect(mockConversationCreate).not.toHaveBeenCalled();
            expect(mockParticipantCreate).not.toHaveBeenCalled();
        });

        it('creates a new conversation and two participant records, returns created: true', async () => {
            mockConversationFindOne.mockReturnValue(lean(null));

            const result = await service.getOrCreateConversation(dto);

            expect(result.created).toBe(true);
            expect(result.conversation.propertyId).toBe(dto.propertyId);
            expect(result.conversation.tenantId).toBe(dto.tenantId);
            expect(result.conversation.landlordId).toBe(dto.landlordId);
            expect(result.conversation.isDeleted).toBe(false);
            expect(result.conversation.lastMessageAt).toBeNull();
            expect(typeof result.conversation.id).toBe('string');

            expect(mockConversationCreate).toHaveBeenCalledTimes(1);
            expect(mockParticipantCreate).toHaveBeenCalledTimes(2);

            const participantCalls = mockParticipantCreate.mock.calls.map((c: any[]) => c[0]);
            const tenantP = participantCalls.find((p: ConversationParticipant) => p.userId === dto.tenantId);
            const landlordP = participantCalls.find((p: ConversationParticipant) => p.userId === dto.landlordId);

            expect(tenantP?.role).toBe('tenant');
            expect(landlordP?.role).toBe('landlord');
        });
    });

    // -------------------------------------------------------------------------
    // listConversationsForUser
    // -------------------------------------------------------------------------

    describe('listConversationsForUser', () => {
        it('returns empty array when user has no participant records', async () => {
            mockParticipantFind.mockReturnValue(lean([]));
            const result = await service.listConversationsForUser('user-1');
            expect(result).toEqual([]);
        });

        it('returns conversations sorted by lastMessageAt descending, nulls last', async () => {
            const participants = [
                makeParticipant({ conversationId: 'conv-1', userId: 'user-1' }),
                makeParticipant({ id: 'part-2', conversationId: 'conv-2', userId: 'user-1' }),
                makeParticipant({ id: 'part-3', conversationId: 'conv-3', userId: 'user-1' }),
            ];
            mockParticipantFind.mockReturnValue(lean(participants));

            const conv1 = makeConversation({ id: 'conv-1', lastMessageAt: '2024-01-03T00:00:00.000Z' });
            const conv2 = makeConversation({ id: 'conv-2', lastMessageAt: '2024-01-01T00:00:00.000Z' });
            const conv3 = makeConversation({ id: 'conv-3', lastMessageAt: null });

            mockConversationFind.mockReturnValue(lean([conv1, conv2, conv3]));

            const result = await service.listConversationsForUser('user-1');

            expect(result).toHaveLength(3);
            expect(result[0].id).toBe('conv-1');
            expect(result[1].id).toBe('conv-2');
            expect(result[2].id).toBe('conv-3');
        });
    });

    // -------------------------------------------------------------------------
    // getMessages
    // -------------------------------------------------------------------------

    describe('getMessages', () => {
        it('returns messages ordered by sentAt ascending (non-deleted only)', async () => {
            const messages = [
                makeMessage({ id: 'msg-1', sentAt: '2024-01-01T10:00:00.000Z' }),
                makeMessage({ id: 'msg-2', sentAt: '2024-01-01T11:00:00.000Z' }),
            ];
            mockMessageFind.mockReturnValue(leanSort(messages));

            const result = await service.getMessages('conv-1');
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('msg-1');
        });

        it('returns empty array when no messages exist', async () => {
            mockMessageFind.mockReturnValue(leanSort([]));
            const result = await service.getMessages('conv-1');
            expect(result).toEqual([]);
        });

        it('queries with isDeleted: false filter', async () => {
            mockMessageFind.mockReturnValue(leanSort([]));
            await service.getMessages('conv-1');
            expect(mockMessageFind).toHaveBeenCalledWith(
                expect.objectContaining({ isDeleted: false }),
            );
        });
    });

    // -------------------------------------------------------------------------
    // createMessage
    // -------------------------------------------------------------------------

    describe('createMessage', () => {
        it('creates and returns the message', async () => {
            mockConversationFindOneAndUpdate.mockReturnValue(lean(makeConversation()));
            const dto: CreateMessageDto = { body: 'Hello, world!' };
            const result = await service.createMessage('conv-1', dto, 'tenant-1', 'tenant');
            expect(result.body).toBe(dto.body);
            expect(result.conversationId).toBe('conv-1');
            expect(result.readAt).toBeNull();
            expect(mockMessageCreate).toHaveBeenCalledTimes(1);
        });

        it('throws AppError 422 with MESSAGE_BODY_TOO_LONG when body exceeds 4000 chars', async () => {
            await expect(
                service.createMessage('conv-1', { body: 'a'.repeat(4001) }, 'tenant-1', 'tenant'),
            ).rejects.toMatchObject({ statusCode: 422, code: 'MESSAGE_BODY_TOO_LONG' });
            expect(mockMessageCreate).not.toHaveBeenCalled();
        });

        it('throws AppError 422 when body is empty', async () => {
            await expect(
                service.createMessage('conv-1', { body: '' }, 'tenant-1', 'tenant'),
            ).rejects.toMatchObject({ statusCode: 422, code: 'MESSAGE_EMPTY' });
        });

        it('accepts body of exactly 4000 characters', async () => {
            mockConversationFindOneAndUpdate.mockReturnValue(lean(makeConversation()));
            await expect(
                service.createMessage('conv-1', { body: 'a'.repeat(4000) }, 'tenant-1', 'tenant'),
            ).resolves.toBeDefined();
        });

        it('throws AppError 422 with INVALID_SENDER_ROLE for unknown role', async () => {
            await expect(
                service.createMessage('conv-1', { body: 'Hello' }, 'tenant-1', 'admin' as any),
            ).rejects.toMatchObject({ statusCode: 422, code: 'INVALID_SENDER_ROLE' });
        });
    });

    // -------------------------------------------------------------------------
    // markMessageRead
    // -------------------------------------------------------------------------

    describe('markMessageRead', () => {
        it('sets readAt to current UTC ISO string', async () => {
            const updated = makeMessage({ readAt: new Date().toISOString() });
            mockMessageFindOneAndUpdate.mockReturnValue(lean(updated));

            const result = await service.markMessageRead('msg-1', 'conv-1');
            expect(result.readAt).toBeTruthy();
        });

        it('throws AppError 404 when message is not found', async () => {
            mockMessageFindOneAndUpdate.mockReturnValue(lean(null));
            await expect(service.markMessageRead('missing', 'conv-1')).rejects.toMatchObject({
                statusCode: 404, code: 'MESSAGE_NOT_FOUND',
            });
        });
    });

    // -------------------------------------------------------------------------
    // getUnreadCount
    // -------------------------------------------------------------------------

    describe('getUnreadCount', () => {
        it('returns 0 when user has no participant records', async () => {
            mockParticipantFind.mockReturnValue(lean([]));
            expect(await service.getUnreadCount('user-1')).toBe(0);
        });

        it('counts unread messages correctly', async () => {
            mockParticipantFind.mockReturnValue(lean([makeParticipant({ userId: 'user-1' })]));
            mockMessageCountDocuments.mockResolvedValue(3);
            expect(await service.getUnreadCount('user-1')).toBe(3);
        });
    });

    // -------------------------------------------------------------------------
    // softDeleteMessage
    // -------------------------------------------------------------------------

    describe('softDeleteMessage', () => {
        it('sets isDeleted and deletedAt on the message', async () => {
            const softDeleted = makeMessage({ isDeleted: true, deletedAt: new Date().toISOString() });
            mockMessageFindOneAndUpdate.mockReturnValue(lean(softDeleted));

            await service.softDeleteMessage('msg-1', 'conv-1', 'actor-1');

            expect(mockMessageFindOneAndUpdate).toHaveBeenCalledWith(
                { id: 'msg-1', conversationId: 'conv-1' },
                expect.objectContaining({ $set: expect.objectContaining({ isDeleted: true }) }),
                { new: true },
            );
        });

        it('creates an audit_log entry with correct fields', async () => {
            const softDeleted = makeMessage({ isDeleted: true, deletedAt: new Date().toISOString() });
            mockMessageFindOneAndUpdate.mockReturnValue(lean(softDeleted));

            await service.softDeleteMessage('msg-1', 'conv-1', 'actor-user-1');

            expect(mockAuditLogCreate).toHaveBeenCalledTimes(1);
            const auditEntry: AuditLog = mockAuditLogCreate.mock.calls[0][0];
            expect(auditEntry.entityType).toBe('message');
            expect(auditEntry.entityId).toBe('msg-1');
            expect(auditEntry.actorId).toBe('actor-user-1');
            expect(auditEntry.action).toBe('soft_delete');
        });

        it('throws AppError 404 when message is not found', async () => {
            mockMessageFindOneAndUpdate.mockReturnValue(lean(null));
            await expect(
                service.softDeleteMessage('missing', 'conv-1', 'actor-1'),
            ).rejects.toMatchObject({ statusCode: 404, code: 'MESSAGE_NOT_FOUND' });
            expect(mockAuditLogCreate).not.toHaveBeenCalled();
        });
    });
});
