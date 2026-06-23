import { AppError } from '../middleware/error-handling';
import {
    EnquiryThreadModel,
    IEnquiryThread,
    EnquiryThreadStatus,
    QuickRequestCategory,
} from '../models/enquiry-thread.model';
import {
    ThreadMessageModel,
    IThreadMessage,
    ThreadMessageSenderType,
    ThreadMessageSource,
} from '../models/thread-message.model';
import {
    ConversationModel,
    MessageModel,
    ConversationParticipantModel,
} from '../models/messaging.models';
import {
    Conversation,
    Message,
    ConversationParticipant,
} from '../types/messaging';

// ---------------------------------------------------------------------------
// EnquiryThreadService
//
// Manages enquiry threads for ghost accounts:
//   - Creates threads when a Quick Request is submitted
//   - Enforces the 20-message limit for ghost threads
//   - Retrieves threads via token for the tokenised reply page
//   - Migrates threads into the main messaging system on account claim
// ---------------------------------------------------------------------------

const GHOST_THREAD_MESSAGE_LIMIT = 20;
const RELAY_DOMAIN = 'reply.proptii.co';

export interface CreateThreadOpts {
    listingId: string;
    listingSource: 'native' | 'scraped';
    listingTitle: string | null;
    ghostTenantId: string;
    ghostTenantName: string | null;
    landlordId: string;
    categories: QuickRequestCategory[];
    firstMessage: {
        body: string;
        senderName: string | null;
    };
}

export interface AddReplyOpts {
    threadToken: string;
    senderType: ThreadMessageSenderType;
    senderId: string;
    senderName: string | null;
    body: string;
    source: ThreadMessageSource;
}

export interface ThreadWithMessages {
    thread: IEnquiryThread;
    messages: IThreadMessage[];
}

export class EnquiryThreadService {

    // -------------------------------------------------------------------------
    // Create
    // -------------------------------------------------------------------------

    /**
     * Creates an enquiry thread and appends the initial message.
     * Also increments message_count to 1.
     */
    async createThread(opts: CreateThreadOpts): Promise<ThreadWithMessages> {
        const {
            listingId,
            listingSource,
            listingTitle,
            ghostTenantId,
            ghostTenantName,
            landlordId,
            categories,
            firstMessage,
        } = opts;

        const now = new Date().toISOString();
        const threadId = crypto.randomUUID();

        // Compact token: UUID without hyphens (safe in email local-parts)
        const threadToken = crypto.randomUUID().replace(/-/g, '');
        const relayEmail = `reply+${threadToken}@${RELAY_DOMAIN}`;

        const thread: IEnquiryThread = {
            id: threadId,
            listing_id: listingId,
            listing_source: listingSource,
            listing_title: listingTitle,
            ghost_tenant_id: ghostTenantId,
            ghost_tenant_name: ghostTenantName,
            landlord_id: landlordId,
            thread_token: threadToken,
            relay_email: relayEmail,
            categories,
            status: 'open',
            message_count: 1,
            created_at: now,
            last_reply_at: null,
        };

        await EnquiryThreadModel.create(thread);

        const messageId = crypto.randomUUID();
        const message: IThreadMessage = {
            id: messageId,
            thread_id: threadId,
            sender_type: 'ghost_tenant',
            sender_id: ghostTenantId,
            sender_name: firstMessage.senderName,
            body: firstMessage.body,
            source: 'web_form',
            sent_at: now,
            read_at: null,
        };

        await ThreadMessageModel.create(message);

        return { thread, messages: [message] };
    }

    // -------------------------------------------------------------------------
    // Reply
    // -------------------------------------------------------------------------

    /**
     * Appends a new message to an existing thread.
     * Enforces the 20-message hard limit — throws 429 when exceeded.
     * On first landlord reply, updates thread status to 'replied'.
     */
    async addReply(opts: AddReplyOpts): Promise<IThreadMessage> {
        const { threadToken, senderType, senderId, senderName, body, source } = opts;

        const thread = await EnquiryThreadModel.findOne({
            thread_token: threadToken,
        }).lean<IEnquiryThread>();

        if (!thread) {
            throw new AppError(404, 'Thread not found', 'THREAD_NOT_FOUND');
        }

        if (thread.status === 'closed' || thread.status === 'archived') {
            throw new AppError(409, 'Thread is closed', 'THREAD_CLOSED');
        }

        if (thread.message_count >= GHOST_THREAD_MESSAGE_LIMIT) {
            throw new AppError(
                429,
                `Ghost threads are limited to ${GHOST_THREAD_MESSAGE_LIMIT} messages. Please create a Proptii account to continue this conversation.`,
                'GHOST_THREAD_LIMIT_REACHED',
            );
        }

        if (body.length > 4000) {
            throw new AppError(422, 'Message body must be 4000 characters or fewer', 'MESSAGE_BODY_TOO_LONG');
        }

        const now = new Date().toISOString();

        const newMessage: IThreadMessage = {
            id: crypto.randomUUID(),
            thread_id: thread.id,
            sender_type: senderType,
            sender_id: senderId,
            sender_name: senderName,
            body,
            source,
            sent_at: now,
            read_at: null,
        };

        await ThreadMessageModel.create(newMessage);

        // Determine new thread status
        const isLandlordReply =
            senderType === 'ghost_landlord' || senderType === 'platform_landlord';
        const newStatus: EnquiryThreadStatus =
            isLandlordReply && thread.status === 'open' ? 'replied' : thread.status;

        await EnquiryThreadModel.updateOne(
            { id: thread.id },
            {
                $set: {
                    message_count: thread.message_count + 1,
                    last_reply_at: now,
                    status: newStatus,
                },
            },
        );

        return newMessage;
    }

    // -------------------------------------------------------------------------
    // Retrieval
    // -------------------------------------------------------------------------

    async getThreadByToken(token: string): Promise<ThreadWithMessages | null> {
        const thread = await EnquiryThreadModel.findOne({
            thread_token: token,
        }).lean<IEnquiryThread>();

        if (!thread) return null;

        const messages = await ThreadMessageModel.find({ thread_id: thread.id })
            .sort({ sent_at: 1 })
            .lean<IThreadMessage[]>();

        return { thread, messages };
    }

    async getThreadsForGhost(ghostAccountId: string): Promise<IEnquiryThread[]> {
        return EnquiryThreadModel.find({
            $or: [
                { ghost_tenant_id: ghostAccountId },
                { landlord_id: ghostAccountId },
            ],
            status: { $ne: 'archived' },
        })
            .sort({ last_reply_at: -1, created_at: -1 })
            .lean<IEnquiryThread[]>();
    }

    // -------------------------------------------------------------------------
    // Migration — called during account claim flow
    // -------------------------------------------------------------------------

    /**
     * Migrates all ghost enquiry threads belonging to a ghost account into the
     * main authenticated messaging system (conversations + messages collections).
     *
     * This is called after a user successfully claims their ghost account so
     * that all prior conversations appear in their Proptii inbox.
     *
     * Each EnquiryThread becomes a Conversation; each ThreadMessage becomes
     * a Message. Both the ghost tenant and (if they are a platform landlord)
     * the landlord get ConversationParticipant records.
     */
    async migrateThreadsToUser(
        ghostAccountId: string,
        fullUserId: string,
        role: 'tenant' | 'landlord' = 'tenant',
    ): Promise<number> {
        const threads = await EnquiryThreadModel.find({
            $or: [
                { ghost_tenant_id: ghostAccountId },
                { landlord_id: ghostAccountId },
            ],
        }).lean<IEnquiryThread[]>();

        let migrated = 0;

        for (const thread of threads) {
            const conversationId = crypto.randomUUID();
            const now = new Date().toISOString();

            // Determine the actual tenant and landlord IDs after migration
            const tenantId = role === 'tenant' ? fullUserId : thread.ghost_tenant_id;
            const landlordId = role === 'landlord' ? fullUserId : thread.landlord_id;

            // Get all messages for this thread
            const threadMessages = await ThreadMessageModel.find({
                thread_id: thread.id,
            })
                .sort({ sent_at: 1 })
                .lean<IThreadMessage[]>();

            const lastMessage = threadMessages[threadMessages.length - 1];

            // Create the Conversation
            const conversation: Conversation = {
                id: conversationId,
                propertyId: thread.listing_id,
                tenantId,
                landlordId,
                createdAt: thread.created_at,
                updatedAt: now,
                lastMessageAt: lastMessage?.sent_at ?? null,
                isDeleted: false,
                deletedAt: null,
                propertyTitle: thread.listing_title ?? undefined,
            };

            await ConversationModel.create(conversation);

            // Create participant records
            const participants: ConversationParticipant[] = [];

            // Always add the (now-real) claiming user as a participant
            participants.push({
                id: crypto.randomUUID(),
                conversationId,
                userId: fullUserId,
                role,
                joinedAt: now,
            });

            // Add the other party if they are a real (non-ghost) user
            const otherId = role === 'tenant' ? landlordId : tenantId;
            const otherIsGhost = otherId === ghostAccountId ||
                otherId.length === 32; // ghost IDs are 32-char (UUID no hyphens)

            if (!otherIsGhost && otherId !== 'UNCLAIMED') {
                participants.push({
                    id: crypto.randomUUID(),
                    conversationId,
                    userId: otherId,
                    role: role === 'tenant' ? 'landlord' : 'tenant',
                    joinedAt: now,
                });
            }

            await Promise.all(participants.map(p => ConversationParticipantModel.create(p)));

            // Migrate messages
            for (const tm of threadMessages) {
                const senderRole = tm.sender_type === 'ghost_tenant' ? 'tenant' : 'landlord';
                const senderId = tm.sender_type === 'ghost_tenant'
                    ? (role === 'tenant' ? fullUserId : tm.sender_id)
                    : (role === 'landlord' ? fullUserId : tm.sender_id);

                const message: Message = {
                    id: crypto.randomUUID(),
                    conversationId,
                    senderId,
                    senderRole,
                    body: tm.body,
                    attachmentIds: [],
                    sentAt: tm.sent_at,
                    readAt: tm.read_at,
                    isDeleted: false,
                    deletedAt: null,
                };

                await MessageModel.create(message);
            }

            // Archive the ghost thread
            await EnquiryThreadModel.updateOne(
                { id: thread.id },
                { $set: { status: 'archived' as EnquiryThreadStatus } },
            );

            migrated++;
        }

        return migrated;
    }
}
