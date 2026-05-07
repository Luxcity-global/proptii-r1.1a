import { CosmosClient, Container } from '@azure/cosmos';
import { BaseService } from './BaseService';
import { AppError } from '../middleware/error-handling';
import { validateEnv } from '../config/environment';
import {
    Conversation,
    Message,
    ConversationParticipant,
    AuditLog,
    CreateConversationDto,
    CreateMessageDto,
    SenderRole,
} from '../types/messaging';

/**
 * Service for managing conversations, messages, and related messaging entities.
 * Extends BaseService with the `conversations` container as the primary container.
 */
export class ConversationService extends BaseService {
    /** Container for messages (partitionKey: /conversationId) */
    private messagesContainer: Container;
    /** Container for conversation participants (partitionKey: /conversationId) */
    private participantsContainer: Container;
    /** Container for audit log entries (partitionKey: /actorId) */
    private auditLogContainer: Container;

    constructor() {
        super('conversations');

        const config = validateEnv();
        const db = this.client.database(config.COSMOS_DB_DATABASE_NAME);

        this.messagesContainer = db.container('messages');
        this.participantsContainer = db.container('conversation_participants');
        this.auditLogContainer = db.container('audit_log');
    }

    /**
     * Idempotent get-or-create for a conversation scoped to a (propertyId, tenantId, landlordId) triple.
     * Returns the existing conversation if found, or creates a new one with two participant records.
     *
     * @returns `{ conversation, created }` — `created` is true when a new document was inserted.
     */
    async getOrCreateConversation(
        dto: CreateConversationDto,
    ): Promise<{ conversation: Conversation; created: boolean }> {
        const { propertyId, tenantId, landlordId } = dto;

        // Query for an existing conversation matching the triple
        const existing = await this.query<Conversation>(
            'SELECT * FROM c WHERE c.propertyId = @propertyId AND c.tenantId = @tenantId AND c.landlordId = @landlordId AND c.isDeleted = false',
            [
                { name: '@propertyId', value: propertyId },
                { name: '@tenantId', value: tenantId },
                { name: '@landlordId', value: landlordId },
            ],
        );

        if (existing.length > 0) {
            return { conversation: existing[0], created: false };
        }

        // Create a new conversation document
        const now = new Date().toISOString();
        const conversationId = crypto.randomUUID();

        const newConversation: Conversation = {
            id: conversationId,
            propertyId,
            tenantId,
            landlordId,
            createdAt: now,
            updatedAt: now,
            lastMessageAt: null,
            isDeleted: false,
            deletedAt: null,
        };

        const created = await this.create<Conversation>(newConversation);

        // Create participant records for both tenant and landlord simultaneously
        const tenantParticipant: ConversationParticipant = {
            id: crypto.randomUUID(),
            conversationId,
            userId: tenantId,
            role: 'tenant',
            joinedAt: now,
        };

        const landlordParticipant: ConversationParticipant = {
            id: crypto.randomUUID(),
            conversationId,
            userId: landlordId,
            role: 'landlord',
            joinedAt: now,
        };

        await Promise.all([
            this.participantsContainer.items.create(tenantParticipant),
            this.participantsContainer.items.create(landlordParticipant),
        ]);

        return { conversation: created, created: true };
    }

    /**
     * Returns all conversations where the given user is a participant,
     * sorted by lastMessageAt descending (null values last).
     */
    async listConversationsForUser(userId: string): Promise<Conversation[]> {
        // First, find all conversationIds where this user is a participant
        const { resources: participantRecords } = await this.participantsContainer.items
            .query<ConversationParticipant>({
                query: 'SELECT * FROM c WHERE c.userId = @userId',
                parameters: [{ name: '@userId', value: userId }],
            })
            .fetchAll();

        if (!participantRecords || participantRecords.length === 0) {
            return [];
        }

        const conversationIds = participantRecords.map((p) => p.conversationId);

        // Fetch each conversation document
        const conversations = await Promise.all(
            conversationIds.map((id) =>
                this.query<Conversation>(
                    'SELECT * FROM c WHERE c.id = @id AND c.isDeleted = false',
                    [{ name: '@id', value: id }],
                ).then((results) => results[0] ?? null),
            ),
        );

        // Filter out nulls (conversations that were deleted or not found)
        const validConversations = conversations.filter(
            (c): c is Conversation => c !== null,
        );

        // Sort by lastMessageAt descending; null values go last
        return validConversations.sort((a, b) => {
            if (a.lastMessageAt === null && b.lastMessageAt === null) return 0;
            if (a.lastMessageAt === null) return 1;
            if (b.lastMessageAt === null) return -1;
            return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
        });
    }

    /**
     * Returns all non-deleted messages for a conversation, ordered by sentAt ascending.
     */
    async getMessages(conversationId: string): Promise<Message[]> {
        const { resources } = await this.messagesContainer.items
            .query<Message>({
                query: 'SELECT * FROM c WHERE c.conversationId = @conversationId AND c.isDeleted = false ORDER BY c.sentAt ASC',
                parameters: [{ name: '@conversationId', value: conversationId }],
            })
            .fetchAll();

        return resources ?? [];
    }

    /**
     * Creates a new message in the given conversation.
     * Validates body length and senderRole before persisting.
     * Updates the conversation's lastMessageAt and updatedAt after creation.
     */
    async createMessage(
        conversationId: string,
        dto: CreateMessageDto,
        senderId: string,
        senderRole: SenderRole,
    ): Promise<Message> {
        const { body, attachmentIds = [] } = dto;

        // Validate body length
        if (body.length < 1 || body.length > 4000) {
            throw new AppError(
                422,
                'Message body must be between 1 and 4000 characters',
                'MESSAGE_BODY_TOO_LONG',
            );
        }

        // Validate senderRole
        if (senderRole !== 'tenant' && senderRole !== 'landlord') {
            throw new AppError(
                422,
                'senderRole must be "tenant" or "landlord"',
                'INVALID_SENDER_ROLE',
            );
        }

        const now = new Date().toISOString();
        const newMessage: Message = {
            id: crypto.randomUUID(),
            conversationId,
            senderId,
            senderRole,
            body,
            attachmentIds,
            sentAt: now,
            readAt: null,
            isDeleted: false,
            deletedAt: null,
        };

        const { resource: createdMessage } = await this.messagesContainer.items.create<Message>(newMessage);

        // Update the conversation's lastMessageAt and updatedAt
        const conversations = await this.query<Conversation>(
            'SELECT * FROM c WHERE c.id = @id',
            [{ name: '@id', value: conversationId }],
        );

        if (conversations.length > 0) {
            const conversation = conversations[0];
            const updatedConversation: Conversation = {
                ...conversation,
                lastMessageAt: now,
                updatedAt: now,
            };
            await this.container.item(conversation.id, conversation.tenantId).replace(updatedConversation);
        }

        return createdMessage as Message;
    }

    /**
     * Marks a message as read by setting readAt to the current UTC ISO string.
     */
    async markMessageRead(messageId: string, conversationId: string): Promise<Message> {
        const { resource: existing } = await this.messagesContainer
            .item(messageId, conversationId)
            .read<Message>();

        if (!existing) {
            throw new AppError(404, 'Message not found', 'MESSAGE_NOT_FOUND');
        }

        const updated: Message = {
            ...existing,
            readAt: new Date().toISOString(),
        };

        const { resource } = await this.messagesContainer
            .item(messageId, conversationId)
            .replace<Message>(updated);

        return resource as Message;
    }

    /**
     * Returns the count of unread messages for a user across all their conversations.
     * Unread = readAt is null AND senderId is not the given userId.
     */
    async getUnreadCount(userId: string): Promise<number> {
        // Get all conversations where the user is a participant
        const { resources: participantRecords } = await this.participantsContainer.items
            .query<ConversationParticipant>({
                query: 'SELECT * FROM c WHERE c.userId = @userId',
                parameters: [{ name: '@userId', value: userId }],
            })
            .fetchAll();

        if (!participantRecords || participantRecords.length === 0) {
            return 0;
        }

        const conversationIds = participantRecords.map((p) => p.conversationId);

        // Count unread messages across all conversations
        let totalUnread = 0;

        await Promise.all(
            conversationIds.map(async (conversationId) => {
                const { resources: messages } = await this.messagesContainer.items
                    .query<Message>({
                        query: 'SELECT * FROM c WHERE c.conversationId = @conversationId AND c.readAt = null AND c.senderId != @userId AND c.isDeleted = false',
                        parameters: [
                            { name: '@conversationId', value: conversationId },
                            { name: '@userId', value: userId },
                        ],
                    })
                    .fetchAll();

                totalUnread += messages?.length ?? 0;
            }),
        );

        return totalUnread;
    }

    /**
     * Soft-deletes a message and creates an audit_log entry.
     */
    async softDeleteMessage(
        messageId: string,
        conversationId: string,
        actorId: string,
    ): Promise<void> {
        // Use BaseService.softDelete — note: messages container uses conversationId as partition key
        // We need to soft-delete directly on the messages container
        const { resource: existing } = await this.messagesContainer
            .item(messageId, conversationId)
            .read<Message>();

        if (!existing) {
            throw new AppError(404, 'Message not found', 'MESSAGE_NOT_FOUND');
        }

        const now = new Date().toISOString();
        const softDeleted: Message = {
            ...existing,
            isDeleted: true,
            deletedAt: now,
        };

        await this.messagesContainer.item(messageId, conversationId).replace(softDeleted);

        // Create audit_log entry
        const auditEntry: AuditLog = {
            id: crypto.randomUUID(),
            entityType: 'message',
            entityId: messageId,
            actorId,
            action: 'soft_delete',
            timestamp: now,
        };

        await this.auditLogContainer.items.create(auditEntry);
    }
}
