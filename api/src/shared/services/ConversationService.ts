import { BaseService } from './BaseService';
import { AppError } from '../middleware/error-handling';
import {
    Conversation,
    Message,
    ConversationParticipant,
    AuditLog,
    CreateConversationDto,
    CreateMessageDto,
    SenderRole,
} from '../types/messaging';
import {
    ConversationModel,
    MessageModel,
    ConversationParticipantModel,
    AuditLogModel,
} from '../models/messaging.models';
import { ScrapedPropertyModel } from '../models/property.model';

export class ConversationService extends BaseService {
    private messageService: BaseService;
    private participantService: BaseService;
    private auditService: BaseService;

    constructor() {
        super(ConversationModel);
        this.messageService = new (class extends BaseService {
            constructor() { super(MessageModel); }
        })();
        this.participantService = new (class extends BaseService {
            constructor() { super(ConversationParticipantModel); }
        })();
        this.auditService = new (class extends BaseService {
            constructor() { super(AuditLogModel); }
        })();
    }

    async getOrCreateConversation(
        dto: CreateConversationDto,
    ): Promise<{ conversation: Conversation; created: boolean }> {
        let { propertyId, tenantId, landlordId } = dto;

        // ------------------------------------------------------------------
        // Save-on-message: if this is a shadow conversation for a scraped
        // property, upsert the property snapshot to MongoDB now. This is the
        // ONLY place scraped properties are written to the database.
        // ------------------------------------------------------------------
        if (landlordId === 'UNCLAIMED' && dto.scrapedPropertySnapshot) {
            const snap = dto.scrapedPropertySnapshot;
            await (ScrapedPropertyModel as any).findOneAndUpdate(
                { url: snap.url },
                {
                    // $set updates all fields on every call (refresh on repeat messages)
                    $set: {
                        ...snap,
                        source: 'scraped',
                        scrapedAt: new Date(),
                    },
                    // $setOnInsert only runs on the initial insert (upsert=true)
                    // Preserves any landlordId set by a prior claim operation
                    $setOnInsert: { landlordId: null },
                },
                { upsert: true, returnDocument: 'after' },
            );
            // Use the URL as the stable propertyId within the conversation
            propertyId = snap.url;
        }

        const existing = await ConversationModel.findOne({
            propertyId,
            tenantId,
            landlordId,
            isDeleted: false,
        }).lean<Conversation>();

        if (existing) {
            return { conversation: existing, created: false };
        }

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
            agentEmail: dto.agentEmail,
            propertyTitle: dto.propertyTitle,
        };

        await ConversationModel.create(newConversation);

        const tenantParticipant: ConversationParticipant = {
            id: crypto.randomUUID(),
            conversationId,
            userId: tenantId,
            role: 'tenant',
            joinedAt: now,
        };

        const participantsToCreate = [ConversationParticipantModel.create(tenantParticipant)];

        if (landlordId !== 'UNCLAIMED') {
            const landlordParticipant: ConversationParticipant = {
                id: crypto.randomUUID(),
                conversationId,
                userId: landlordId,
                role: 'landlord',
                joinedAt: now,
            };
            participantsToCreate.push(ConversationParticipantModel.create(landlordParticipant));
        }

        await Promise.all(participantsToCreate);

        return { conversation: newConversation, created: true };
    }

    async listConversationsForUser(userId: string): Promise<Conversation[]> {
        const participantRecords = await ConversationParticipantModel.find({ userId }).lean<ConversationParticipant[]>();

        if (!participantRecords || participantRecords.length === 0) {
            return [];
        }

        const conversationIds = participantRecords.map((p) => p.conversationId);

        const conversations = await ConversationModel.find({
            id: { $in: conversationIds },
            isDeleted: false,
        }).lean<Conversation[]>();

        return conversations.sort((a, b) => {
            if (a.lastMessageAt === null && b.lastMessageAt === null) return 0;
            if (a.lastMessageAt === null) return 1;
            if (b.lastMessageAt === null) return -1;
            return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
        });
    }

    async getMessages(conversationId: string): Promise<Message[]> {
        return MessageModel.find({ conversationId, isDeleted: false })
            .sort({ sentAt: 1 })
            .lean<Message[]>();
    }

    async getConversationById(id: string): Promise<Conversation | null> {
        return ConversationModel.findOne({ id }).lean<Conversation>();
    }

    async createMessage(
        conversationId: string,
        dto: CreateMessageDto,
        senderId: string,
        senderRole: SenderRole,
    ): Promise<Message> {
        const { body, attachmentIds = [] } = dto;

        if (body.length > 4000) {
            throw new AppError(422, 'Message body must be 4000 characters or fewer', 'MESSAGE_BODY_TOO_LONG');
        }

        if (body.length === 0 && attachmentIds.length === 0) {
            throw new AppError(422, 'Message must have a body or at least one attachment', 'MESSAGE_EMPTY');
        }

        if (senderRole !== 'tenant' && senderRole !== 'landlord') {
            throw new AppError(422, 'senderRole must be "tenant" or "landlord"', 'INVALID_SENDER_ROLE');
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

        await MessageModel.create(newMessage);

        await ConversationModel.findOneAndUpdate(
            { id: conversationId },
            { $set: { lastMessageAt: now, updatedAt: now } },
        );

        return newMessage;
    }

    async markMessageRead(messageId: string, conversationId: string): Promise<Message> {
        const updated = await MessageModel.findOneAndUpdate(
            { id: messageId, conversationId },
            { $set: { readAt: new Date().toISOString() } },
            { new: true },
        ).lean<Message>();

        if (!updated) {
            throw new AppError(404, 'Message not found', 'MESSAGE_NOT_FOUND');
        }

        return updated;
    }

    async getUnreadCount(userId: string): Promise<number> {
        const participantRecords = await ConversationParticipantModel.find({ userId }).lean<ConversationParticipant[]>();

        if (!participantRecords || participantRecords.length === 0) {
            return 0;
        }

        const conversationIds = participantRecords.map((p) => p.conversationId);

        return MessageModel.countDocuments({
            conversationId: { $in: conversationIds },
            readAt: null,
            senderId: { $ne: userId },
            isDeleted: false,
        });
    }

    async softDeleteMessage(messageId: string, conversationId: string, actorId: string): Promise<void> {
        const now = new Date().toISOString();

        const updated = await MessageModel.findOneAndUpdate(
            { id: messageId, conversationId },
            { $set: { isDeleted: true, deletedAt: now } },
            { new: true },
        ).lean<Message>();

        if (!updated) {
            throw new AppError(404, 'Message not found', 'MESSAGE_NOT_FOUND');
        }

        const auditEntry: AuditLog = {
            id: crypto.randomUUID(),
            entityType: 'message',
            entityId: messageId,
            actorId,
            action: 'soft_delete',
            timestamp: now,
        };

        await AuditLogModel.create(auditEntry);
    }

    async assignShadowConversations(propertyId: string, newLandlordId: string): Promise<void> {
        const conversations = await ConversationModel.find({
            propertyId,
            landlordId: 'UNCLAIMED',
            isDeleted: false
        }).lean<Conversation[]>();

        if (!conversations || conversations.length === 0) {
            return;
        }

        const now = new Date().toISOString();

        for (const conv of conversations) {
            // Update the conversation document
            await ConversationModel.updateOne(
                { id: conv.id, tenantId: conv.tenantId },
                { $set: { landlordId: newLandlordId, updatedAt: now } }
            );

            // Add the landlord participant
            const landlordParticipant: ConversationParticipant = {
                id: crypto.randomUUID(),
                conversationId: conv.id,
                userId: newLandlordId,
                role: 'landlord',
                joinedAt: now,
            };
            await ConversationParticipantModel.create(landlordParticipant);
        }
    }
}
