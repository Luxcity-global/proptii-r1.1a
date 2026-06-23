import mongoose, { Schema, Document, Model } from 'mongoose';
import {
    Conversation,
    Message,
    MessageAttachment,
    ConversationParticipant,
    NotificationLog,
    AuditLog,
} from '../types/messaging';

// ---------------------------------------------------------------------------
// Conversation
// ---------------------------------------------------------------------------

export type ConversationDocument = Conversation & Document;

const ConversationSchema = new Schema<ConversationDocument>(
    {
        id: { type: String, required: true, unique: true },
        propertyId: { type: String, required: true },
        tenantId: { type: String, required: true, index: true },
        landlordId: { type: String, required: true },
        createdAt: { type: String, required: true },
        updatedAt: { type: String, required: true },
        lastMessageAt: { type: String, default: null },
        isDeleted: { type: Boolean, required: true, default: false },
        deletedAt: { type: String, default: null },
    },
    { collection: 'conversations' },
);

ConversationSchema.index({ propertyId: 1, tenantId: 1, landlordId: 1 }, { unique: true });

export const ConversationModel: Model<ConversationDocument> =
    mongoose.models.Conversation ||
    mongoose.model<ConversationDocument>('Conversation', ConversationSchema);

// ---------------------------------------------------------------------------
// Message
// ---------------------------------------------------------------------------

export type MessageDocument = Message & Document;

const MessageSchema = new Schema<MessageDocument>(
    {
        id: { type: String, required: true, unique: true },
        conversationId: { type: String, required: true, index: true },
        senderId: { type: String, required: true },
        senderRole: { type: String, enum: ['tenant', 'landlord'], required: true },
        body: { type: String, required: false, default: '', maxlength: 4000 },
        attachmentIds: { type: [String], default: [] },
        sentAt: { type: String, required: true },
        readAt: { type: String, default: null },
        isDeleted: { type: Boolean, required: true, default: false },
        deletedAt: { type: String, default: null },
    },
    { collection: 'messages' },
);

MessageSchema.index({ conversationId: 1, sentAt: 1 });

export const MessageModel: Model<MessageDocument> =
    mongoose.models.Message ||
    mongoose.model<MessageDocument>('Message', MessageSchema);

// ---------------------------------------------------------------------------
// MessageAttachment
// ---------------------------------------------------------------------------

export type MessageAttachmentDocument = MessageAttachment & Document;

const MessageAttachmentSchema = new Schema<MessageAttachmentDocument>(
    {
        id: { type: String, required: true, unique: true },
        conversationId: { type: String, required: true, index: true },
        messageId: { type: String, required: false, default: '' },
        uploaderId: { type: String, required: true },
        fileName: { type: String, required: true },
        mimeType: { type: String, required: true },
        sizeBytes: { type: Number, required: true },
        blobPath: { type: String, required: true },
        uploadedAt: { type: String, required: true },
    },
    { collection: 'message_attachments' },
);

export const MessageAttachmentModel: Model<MessageAttachmentDocument> =
    mongoose.models.MessageAttachment ||
    mongoose.model<MessageAttachmentDocument>('MessageAttachment', MessageAttachmentSchema);

// ---------------------------------------------------------------------------
// ConversationParticipant
// ---------------------------------------------------------------------------

export type ConversationParticipantDocument = ConversationParticipant & Document;

const ConversationParticipantSchema = new Schema<ConversationParticipantDocument>(
    {
        id: { type: String, required: true, unique: true },
        conversationId: { type: String, required: true, index: true },
        userId: { type: String, required: true },
        role: { type: String, enum: ['tenant', 'landlord'], required: true },
        joinedAt: { type: String, required: true },
    },
    { collection: 'conversation_participants' },
);

ConversationParticipantSchema.index({ conversationId: 1, userId: 1 });

export const ConversationParticipantModel: Model<ConversationParticipantDocument> =
    mongoose.models.ConversationParticipant ||
    mongoose.model<ConversationParticipantDocument>(
        'ConversationParticipant',
        ConversationParticipantSchema,
    );

// ---------------------------------------------------------------------------
// NotificationLog — TTL 90 days
// ---------------------------------------------------------------------------

export type NotificationLogDocument = NotificationLog & Document;

const NotificationLogSchema = new Schema<NotificationLogDocument>(
    {
        id: { type: String, required: true, unique: true },
        recipientId: { type: String, required: true, index: true },
        conversationId: { type: String, required: true },
        channel: { type: String, enum: ['email'], required: true },
        sentAt: { type: String, required: true },
        dedupKey: { type: String, required: true, index: true },
    },
    {
        collection: 'notification_log',
        timestamps: { createdAt: 'createdAt', updatedAt: false },
    },
);

// TTL index: 90 days
NotificationLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7_776_000 });

export const NotificationLogModel: Model<NotificationLogDocument> =
    mongoose.models.NotificationLog ||
    mongoose.model<NotificationLogDocument>('NotificationLog', NotificationLogSchema);

// ---------------------------------------------------------------------------
// AuditLog
// ---------------------------------------------------------------------------

export type AuditLogDocument = AuditLog & Document;

const AuditLogSchema = new Schema<AuditLogDocument>(
    {
        id: { type: String, required: true, unique: true },
        entityType: { type: String, enum: ['message', 'conversation'], required: true },
        entityId: { type: String, required: true },
        actorId: { type: String, required: true, index: true },
        action: { type: String, enum: ['soft_delete'], required: true },
        timestamp: { type: String, required: true },
    },
    { collection: 'audit_log' },
);

export const AuditLogModel: Model<AuditLogDocument> =
    mongoose.models.AuditLog ||
    mongoose.model<AuditLogDocument>('AuditLog', AuditLogSchema);

// ---------------------------------------------------------------------------
// User (minimal — for lastSeenAt tracking)
// ---------------------------------------------------------------------------

export interface UserRecord {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    lastSeenAt?: string;
    /** Set after a ghost account is claimed and merged into this full account. */
    ghostAccountId?: string;
}

export type UserDocument = UserRecord & Document;

const UserSchema = new Schema<UserDocument>(
    {
        id: { type: String, required: true, unique: true },
        email: { type: String, required: true },
        firstName: { type: String },
        lastName: { type: String },
        lastSeenAt: { type: String },
        ghostAccountId: { type: String, index: true, sparse: true },
    },
    { collection: 'Users' },
);

export const UserModel: Model<UserDocument> =
    mongoose.models.User ||
    mongoose.model<UserDocument>('User', UserSchema);

