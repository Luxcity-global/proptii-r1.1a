/**
 * Frontend TypeScript interfaces for the Proptii Communication Feature.
 *
 * These types mirror the Cosmos DB models defined in
 * `api/src/shared/types/messaging.ts`. Keep them in sync when the backend
 * schema changes.
 */

// ---------------------------------------------------------------------------
// Core domain interfaces
// ---------------------------------------------------------------------------

/**
 * Represents a messaging thread scoped to a (propertyId, tenantId, landlordId) triple.
 *
 * @container conversations
 * @partitionKey /tenantId
 */
export interface Conversation {
    /** UUID */
    id: string;
    propertyId: string;
    /** Partition key */
    tenantId: string;
    landlordId: string;
    /** ISO 8601 */
    createdAt: string;
    /** ISO 8601 */
    updatedAt: string;
    lastMessageAt: string | null;
    isDeleted: boolean;
    deletedAt: string | null;
}

/**
 * A single text or attachment-reference entry within a Conversation.
 *
 * @container messages
 * @partitionKey /conversationId
 */
export interface Message {
    /** UUID */
    id: string;
    /** Partition key */
    conversationId: string;
    senderId: string;
    senderRole: 'tenant' | 'landlord';
    /** Message body — max 4,000 characters */
    body: string;
    attachmentIds: string[];
    /** ISO 8601 */
    sentAt: string;
    readAt: string | null;
    isDeleted: boolean;
    deletedAt: string | null;
}

/**
 * Metadata for a file attached to a message, stored after a successful Blob Storage upload.
 *
 * @container message_attachments
 * @partitionKey /conversationId
 */
export interface MessageAttachment {
    /** UUID */
    id: string;
    /** Partition key */
    conversationId: string;
    messageId: string;
    uploaderId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    blobPath: string;
    /** ISO 8601 */
    uploadedAt: string;
}

/**
 * Records that a user is a participant of a conversation.
 *
 * @container conversation_participants
 * @partitionKey /conversationId
 */
export interface ConversationParticipant {
    /** UUID */
    id: string;
    /** Partition key */
    conversationId: string;
    userId: string;
    role: 'tenant' | 'landlord';
    /** ISO 8601 */
    joinedAt: string;
}

/**
 * Tracks email notifications sent to recipients. TTL is 90 days.
 *
 * @container notification_log
 * @partitionKey /recipientId
 * @ttl 90 days
 */
export interface NotificationLog {
    /** UUID */
    id: string;
    /** Partition key */
    recipientId: string;
    conversationId: string;
    channel: 'email';
    /** ISO 8601 */
    sentAt: string;
    /** Deduplication key in the format "{recipientId}:{conversationId}" */
    dedupKey: string;
    /** Cosmos DB system TTL timestamp (set automatically) */
    _ts?: number;
}

/**
 * Records every soft-delete event for GDPR audit purposes.
 *
 * @container audit_log
 * @partitionKey /actorId
 */
export interface AuditLog {
    /** UUID */
    id: string;
    entityType: 'message' | 'conversation';
    entityId: string;
    /** Partition key */
    actorId: string;
    action: 'soft_delete';
    /** ISO 8601 */
    timestamp: string;
}

// ---------------------------------------------------------------------------
// DTO types used by the frontend services
// ---------------------------------------------------------------------------

/**
 * Payload for creating or retrieving a conversation (idempotent get-or-create).
 */
export interface CreateConversationDto {
    propertyId: string;
    tenantId: string;
    landlordId: string;
}

/**
 * Payload for creating a new message within a conversation (minimal form).
 */
export interface CreateMessageDto {
    /** Message body — max 4,000 characters */
    body: string;
    attachmentIds?: string[];
}

/**
 * Payload for sending a message, including sender context required by the API.
 */
export interface SendMessageDto {
    /** Message body — max 4,000 characters */
    body: string;
    attachmentIds?: string[];
    senderRole: 'tenant' | 'landlord';
    recipientId?: string;
}
