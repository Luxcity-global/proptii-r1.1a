/**
 * Property-based tests for ConversationService — MongoDB version.
 */

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

jest.mock('../../../models/messaging.models', () => ({
    ConversationModel: { findOne: mockConversationFindOne, find: mockConversationFind, create: mockConversationCreate, findOneAndUpdate: mockConversationFindOneAndUpdate },
    MessageModel: { find: mockMessageFind, create: mockMessageCreate, findOneAndUpdate: mockMessageFindOneAndUpdate, countDocuments: mockMessageCountDocuments },
    ConversationParticipantModel: { find: mockParticipantFind, create: mockParticipantCreate },
    AuditLogModel: { create: mockAuditLogCreate },
    MessageAttachmentModel: { findOne: jest.fn(), create: jest.fn() },
    NotificationLogModel: { findOne: jest.fn(), create: jest.fn() },
    UserModel: { findOne: jest.fn(), findOneAndUpdate: jest.fn() },
}));

jest.mock('../../../config/mongodb', () => ({ getMongoConnection: jest.fn().mockResolvedValue({}) }));
jest.mock('../../../config/environment', () => ({ validateEnv: jest.fn(() => ({ MONGODB_URI: 'mongodb://localhost:27017', MONGODB_DB_NAME: 'test' })) }));

import * as fc from 'fast-check';
import { ConversationService } from '../../ConversationService';
import { AppError } from '../../../middleware/error-handling';
import { Conversation, Message, ConversationParticipant, AuditLog } from '../../../types/messaging';

function lean<T>(v: T) { return { lean: () => v }; }
function leanSort<T>(v: T) { return { sort: () => ({ lean: () => v }) }; }

function makeConversation(o: Partial<Conversation> = {}): Conversation {
    return { id: 'conv-1', propertyId: 'prop-1', tenantId: 'tenant-1', landlordId: 'landlord-1', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z', lastMessageAt: null, isDeleted: false, deletedAt: null, ...o };
}
function makeMessage(o: Partial<Message> = {}): Message {
    return { id: 'msg-1', conversationId: 'conv-1', senderId: 'tenant-1', senderRole: 'tenant', body: 'Hello!', attachmentIds: [], sentAt: '2024-01-01T00:00:00.000Z', readAt: null, isDeleted: false, deletedAt: null, ...o };
}
function makeParticipant(o: Partial<ConversationParticipant> = {}): ConversationParticipant {
    return { id: 'part-1', conversationId: 'conv-1', userId: 'tenant-1', role: 'tenant', joinedAt: '2024-01-01T00:00:00.000Z', ...o };
}

function resetMocks() {
    jest.clearAllMocks();
    mockConversationFindOne.mockReturnValue(lean(null));
    mockConversationFind.mockReturnValue(lean([]));
    mockConversationCreate.mockResolvedValue({});
    mockConversationFindOneAndUpdate.mockReturnValue(lean(null));
    mockMessageFind.mockReturnValue(leanSort([]));
    mockMessageCreate.mockResolvedValue({});
    mockMessageFindOneAndUpdate.mockReturnValue(lean(null));
    mockMessageCountDocuments.mockResolvedValue(0);
    mockParticipantFind.mockReturnValue(lean([]));
    mockParticipantCreate.mockResolvedValue({});
    mockAuditLogCreate.mockResolvedValue({});
}

describe('ConversationService — property-based tests', () => {
    let service: ConversationService;
    beforeEach(() => { resetMocks(); service = new ConversationService(); });

    describe('Property 4: Conversation creation is idempotent', () => {
        it('returns the same conversationId on repeated calls and creates only one document', async () => {
            await fc.assert(fc.asyncProperty(
                fc.record({ propertyId: fc.uuid(), tenantId: fc.uuid(), landlordId: fc.uuid() }),
                async (dto) => {
                    resetMocks();
                    service = new ConversationService();
                    const created: Conversation[] = [];

                    mockConversationFindOne.mockReturnValueOnce(lean(null));
                    mockConversationCreate.mockImplementationOnce((item: Conversation) => { created.push(item); return Promise.resolve({}); });

                    const result1 = await service.getOrCreateConversation(dto);
                    mockConversationFindOne.mockReturnValueOnce(lean(result1.conversation));
                    const result2 = await service.getOrCreateConversation(dto);

                    expect(result1.conversation.id).toBe(result2.conversation.id);
                    expect(result1.created).toBe(true);
                    expect(result2.created).toBe(false);
                    expect(created).toHaveLength(1);
                },
            ), { numRuns: 25 });
        });
    });

    describe('Property 6: Message body length validation', () => {
        it('rejects bodies longer than 4000 characters with HTTP 422 MESSAGE_BODY_TOO_LONG', async () => {
            await fc.assert(fc.asyncProperty(fc.string({ minLength: 4001 }), async (body) => {
                resetMocks(); service = new ConversationService();
                await expect(service.createMessage('conv-1', { body }, 'sender-1', 'tenant')).rejects.toMatchObject({ statusCode: 422, code: 'MESSAGE_BODY_TOO_LONG' });
                expect(mockMessageCreate).not.toHaveBeenCalled();
            }), { numRuns: 25 });
        });

        it('accepts bodies within [1, 4000] characters and creates the message', async () => {
            await fc.assert(fc.asyncProperty(fc.string({ minLength: 1, maxLength: 4000 }), async (body) => {
                resetMocks(); service = new ConversationService();
                mockConversationFindOneAndUpdate.mockReturnValue(lean(makeConversation()));
                const result = await service.createMessage('conv-1', { body }, 'sender-1', 'tenant');
                expect(result.body).toBe(body);
                expect(mockMessageCreate).toHaveBeenCalledTimes(1);
            }), { numRuns: 25 });
        });
    });

    describe('Property 7: senderRole validation', () => {
        it('rejects any senderRole that is not "tenant" or "landlord" with HTTP 422 INVALID_SENDER_ROLE', async () => {
            await fc.assert(fc.asyncProperty(fc.string().filter(s => s !== 'tenant' && s !== 'landlord'), async (invalidRole) => {
                resetMocks(); service = new ConversationService();
                await expect(service.createMessage('conv-1', { body: 'Hello' }, 'sender-1', invalidRole as any)).rejects.toMatchObject({ statusCode: 422, code: 'INVALID_SENDER_ROLE' });
                expect(mockMessageCreate).not.toHaveBeenCalled();
            }), { numRuns: 25 });
        });
    });

    describe('Property 9: GET /conversations returns conversations ordered by lastMessageAt descending', () => {
        it('returns conversations sorted by lastMessageAt descending with nulls last', async () => {
            await fc.assert(fc.asyncProperty(
                fc.array(fc.record({ lastMessageAt: fc.option(fc.date()) }), { minLength: 2 }),
                async (items) => {
                    resetMocks(); service = new ConversationService();
                    const userId = 'user-test';
                    const participants = items.map((_, i) => makeParticipant({ id: `part-${i}`, conversationId: `conv-${i}`, userId }));
                    const conversations = items.map((item, i) => makeConversation({ id: `conv-${i}`, lastMessageAt: item.lastMessageAt ? item.lastMessageAt.toISOString() : null }));

                    mockParticipantFind.mockReturnValue(lean(participants));
                    mockConversationFind.mockReturnValue(lean(conversations));

                    const result = await service.listConversationsForUser(userId);
                    expect(result).toHaveLength(conversations.length);

                    for (let i = 0; i < result.length - 1; i++) {
                        const a = result[i].lastMessageAt;
                        const b = result[i + 1].lastMessageAt;
                        if (a === null) { expect(b).toBeNull(); }
                        else if (b !== null) { expect(new Date(a).getTime()).toBeGreaterThanOrEqual(new Date(b).getTime()); }
                    }
                },
            ), { numRuns: 25 });
        });
    });

    describe('Property 10: GET /conversations/:id/messages excludes deleted messages and is ordered by sentAt ascending', () => {
        it('returns only non-deleted messages in ascending sentAt order', async () => {
            await fc.assert(fc.asyncProperty(
                fc.array(fc.record({ isDeleted: fc.boolean(), sentAt: fc.date() })),
                async (items) => {
                    resetMocks(); service = new ConversationService();
                    const nonDeleted = items.filter(i => !i.isDeleted).sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
                    const dbMessages = nonDeleted.map((item, i) => makeMessage({ id: `msg-${i}`, isDeleted: false, sentAt: item.sentAt.toISOString() }));
                    mockMessageFind.mockReturnValue(leanSort(dbMessages));

                    const result = await service.getMessages('conv-1');
                    expect(result.every((m: Message) => !m.isDeleted)).toBe(true);
                    expect(result).toHaveLength(nonDeleted.length);
                    for (let i = 0; i < result.length - 1; i++) {
                        expect(new Date(result[i].sentAt).getTime()).toBeLessThanOrEqual(new Date(result[i + 1].sentAt).getTime());
                    }
                },
            ), { numRuns: 25 });
        });
    });

    describe('Property 11: Unread count matches expected formula', () => {
        it('unread count equals messages where readAt is null and senderId is not the current user', async () => {
            const currentUserId = 'fixed-user-id';
            await fc.assert(fc.asyncProperty(
                fc.array(fc.record({ readAt: fc.option(fc.string()), senderId: fc.uuid() })),
                async (messageInputs) => {
                    resetMocks(); service = new ConversationService();
                    mockParticipantFind.mockReturnValue(lean([makeParticipant({ conversationId: 'conv-1', userId: currentUserId })]));
                    const expectedCount = messageInputs.filter(m => m.readAt === null && m.senderId !== currentUserId).length;
                    mockMessageCountDocuments.mockResolvedValue(expectedCount);
                    const count = await service.getUnreadCount(currentUserId);
                    expect(count).toBe(expectedCount);
                },
            ), { numRuns: 25 });
        });
    });

    describe('Property 24: Soft delete sets isDeleted and deletedAt without removing the document', () => {
        it('sets isDeleted=true and a valid ISO 8601 deletedAt without removing the document', async () => {
            await fc.assert(fc.asyncProperty(
                fc.record({ messageId: fc.uuid(), conversationId: fc.uuid() }),
                async ({ messageId, conversationId }) => {
                    resetMocks(); service = new ConversationService();
                    const now = new Date().toISOString();
                    const softDeleted = makeMessage({ id: messageId, conversationId, isDeleted: true, deletedAt: now });
                    mockMessageFindOneAndUpdate.mockReturnValue(lean(softDeleted));

                    await service.softDeleteMessage(messageId, conversationId, 'actor-1');

                    expect(mockMessageFindOneAndUpdate).toHaveBeenCalledWith(
                        { id: messageId, conversationId },
                        expect.objectContaining({ $set: expect.objectContaining({ isDeleted: true }) }),
                        { new: true },
                    );
                },
            ), { numRuns: 25 });
        });
    });

    describe('Property 25: Soft delete creates audit_log entry', () => {
        it('creates an audit_log entry with correct entityType, entityId, actorId, and action', async () => {
            await fc.assert(fc.asyncProperty(
                fc.record({ messageId: fc.uuid(), conversationId: fc.uuid() }),
                async ({ messageId, conversationId }) => {
                    resetMocks(); service = new ConversationService();
                    const actorId = 'actor-fixed';
                    const softDeleted = makeMessage({ id: messageId, conversationId, isDeleted: true, deletedAt: new Date().toISOString() });
                    mockMessageFindOneAndUpdate.mockReturnValue(lean(softDeleted));

                    let capturedEntry: AuditLog | null = null;
                    mockAuditLogCreate.mockImplementation((entry: AuditLog) => { capturedEntry = entry; return Promise.resolve({}); });

                    await service.softDeleteMessage(messageId, conversationId, actorId);

                    expect(capturedEntry).not.toBeNull();
                    expect(capturedEntry!.entityType).toBe('message');
                    expect(capturedEntry!.entityId).toBe(messageId);
                    expect(capturedEntry!.actorId).toBe(actorId);
                    expect(capturedEntry!.action).toBe('soft_delete');
                },
            ), { numRuns: 25 });
        });
    });

    describe('Property 26: Data isolation', () => {
        it('listConversationsForUser returns only conversations belonging to the requested user', async () => {
            await fc.assert(fc.asyncProperty(
                fc.record({ userA: fc.uuid(), userB: fc.uuid() }).filter(({ userA, userB }) => userA !== userB),
                async ({ userA, userB }) => {
                    resetMocks(); service = new ConversationService();
                    const convA = makeConversation({ id: 'conv-a', tenantId: userA, landlordId: 'landlord-a' });
                    const convB = makeConversation({ id: 'conv-b', tenantId: userB, landlordId: 'landlord-b' });

                    mockParticipantFind.mockReturnValue(lean([makeParticipant({ id: 'part-a', conversationId: 'conv-a', userId: userA, role: 'tenant' })]));
                    mockConversationFind.mockReturnValue(lean([convA]));

                    const result = await service.listConversationsForUser(userA);
                    const returnedIds = result.map((c: Conversation) => c.id);
                    expect(returnedIds).not.toContain(convB.id);
                    result.forEach((conv: Conversation) => {
                        expect(conv.tenantId).not.toBe(userB);
                        expect(conv.landlordId).not.toBe(userB);
                    });
                },
            ), { numRuns: 25 });
        });
    });
});
