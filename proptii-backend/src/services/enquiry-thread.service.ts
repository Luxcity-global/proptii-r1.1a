import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { AppError } from '../utils/app-error';
import {
  EnquiryThread,
  EnquiryThreadDocument,
  EnquiryThreadStatus,
  QuickRequestCategory,
} from '../schemas/enquiry-thread.schema';
import {
  ThreadMessage,
  ThreadMessageDocument,
  ThreadMessageSenderType,
  ThreadMessageSource,
} from '../schemas/thread-message.schema';
import { Conversation, ConversationDocument } from '../schemas/conversation.schema';
import { Message, MessageDocument } from '../schemas/message.schema';
import {
  ConversationParticipant,
  ConversationParticipantDocument,
} from '../schemas/conversation-participant.schema';

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
  thread: EnquiryThread;
  messages: ThreadMessage[];
}

@Injectable()
export class EnquiryThreadService {
  constructor(
    @InjectModel(EnquiryThread.name)
    private readonly enquiryThreadModel: Model<EnquiryThreadDocument>,
    @InjectModel(ThreadMessage.name)
    private readonly threadMessageModel: Model<ThreadMessageDocument>,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel(ConversationParticipant.name)
    private readonly conversationParticipantModel: Model<ConversationParticipantDocument>,
  ) {}

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
    const threadId = randomUUID();

    // Compact token: UUID without hyphens (safe in email local-parts)
    const threadToken = randomUUID().replace(/-/g, '');
    const relayEmail = `reply+${threadToken}@${RELAY_DOMAIN}`;

    const thread: EnquiryThread = {
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

    await this.enquiryThreadModel.create(thread);

    const messageId = randomUUID();
    const message: ThreadMessage = {
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

    await this.threadMessageModel.create(message);

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
  async addReply(opts: AddReplyOpts): Promise<ThreadMessage> {
    const { threadToken, senderType, senderId, senderName, body, source } = opts;

    const thread = await this.enquiryThreadModel
      .findOne({
        thread_token: threadToken,
      })
      .lean<EnquiryThread>();

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
      throw new AppError(
        422,
        'Message body must be 4000 characters or fewer',
        'MESSAGE_BODY_TOO_LONG',
      );
    }

    const now = new Date().toISOString();

    const newMessage: ThreadMessage = {
      id: randomUUID(),
      thread_id: thread.id,
      sender_type: senderType,
      sender_id: senderId,
      sender_name: senderName,
      body,
      source,
      sent_at: now,
      read_at: null,
    };

    await this.threadMessageModel.create(newMessage);

    // Determine new thread status
    const isLandlordReply =
      senderType === 'ghost_landlord' || senderType === 'platform_landlord';
    const newStatus: EnquiryThreadStatus =
      isLandlordReply && thread.status === 'open' ? 'replied' : thread.status;

    await this.enquiryThreadModel.updateOne(
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
    const thread = await this.enquiryThreadModel
      .findOne({
        thread_token: token,
      })
      .lean<EnquiryThread>();

    if (!thread) return null;

    const messages = await this.threadMessageModel
      .find({ thread_id: thread.id })
      .sort({ sent_at: 1 })
      .lean<ThreadMessage[]>();

    return { thread, messages };
  }

  async getThreadsForGhost(ghostAccountId: string): Promise<EnquiryThread[]> {
    return this.enquiryThreadModel
      .find({
        $or: [{ ghost_tenant_id: ghostAccountId }, { landlord_id: ghostAccountId }],
        status: { $ne: 'archived' },
      })
      .sort({ last_reply_at: -1, created_at: -1 })
      .lean<EnquiryThread[]>();
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
    const threads = await this.enquiryThreadModel
      .find({
        $or: [{ ghost_tenant_id: ghostAccountId }, { landlord_id: ghostAccountId }],
      })
      .lean<EnquiryThread[]>();

    let migrated = 0;

    for (const thread of threads) {
      const conversationId = randomUUID();
      const now = new Date().toISOString();

      // Determine the actual tenant and landlord IDs after migration
      const tenantId = role === 'tenant' ? fullUserId : thread.ghost_tenant_id;
      const landlordId = role === 'landlord' ? fullUserId : thread.landlord_id;

      // Get all messages for this thread
      const threadMessages = await this.threadMessageModel
        .find({
          thread_id: thread.id,
        })
        .sort({ sent_at: 1 })
        .lean<ThreadMessage[]>();

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

      await this.conversationModel.create(conversation);

      // Create participant records
      const participants: ConversationParticipant[] = [];

      // Always add the (now-real) claiming user as a participant
      participants.push({
        id: randomUUID(),
        conversationId,
        userId: fullUserId,
        role,
        joinedAt: now,
      });

      // Add the other party if they are a real (non-ghost) user
      const otherId = role === 'tenant' ? landlordId : tenantId;
      const otherIsGhost =
        otherId === ghostAccountId ||
        otherId.length === 32; // ghost IDs are 32-char (UUID no hyphens)

      if (!otherIsGhost && otherId !== 'UNCLAIMED') {
        participants.push({
          id: randomUUID(),
          conversationId,
          userId: otherId,
          role: role === 'tenant' ? 'landlord' : 'tenant',
          joinedAt: now,
        });
      }

      await Promise.all(
        participants.map((p) => this.conversationParticipantModel.create(p)),
      );

      // Migrate messages
      for (const tm of threadMessages) {
        const senderRole = tm.sender_type === 'ghost_tenant' ? 'tenant' : 'landlord';
        const senderId =
          tm.sender_type === 'ghost_tenant'
            ? role === 'tenant'
              ? fullUserId
              : tm.sender_id
            : role === 'landlord'
              ? fullUserId
              : tm.sender_id;

        const message: Message = {
          id: randomUUID(),
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

        await this.messageModel.create(message);
      }

      // Archive the ghost thread
      await this.enquiryThreadModel.updateOne(
        { id: thread.id },
        { $set: { status: 'archived' as EnquiryThreadStatus } },
      );

      migrated++;
    }

    return migrated;
  }
}
