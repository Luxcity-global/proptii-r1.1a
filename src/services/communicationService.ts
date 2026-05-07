/**
 * Frontend API wrapper for the Proptii Communication feature.
 *
 * All calls are routed through the existing `apiService` singleton, which
 * attaches the MSAL Bearer token via its Axios request interceptor.
 *
 * Requirements: 3.2, 6.1–6.6, 7.1, 7.4
 */

import apiService from './api';
import type {
    Conversation,
    Message,
    MessageAttachment,
    CreateConversationDto,
    SendMessageDto,
} from '../types/messaging';

const BASE = '/api/communication';

const communicationService = {
    /**
     * Retrieve all conversations for the authenticated user.
     * GET /api/communication/conversations
     * Requirements: 6.1
     */
    async getConversations(): Promise<Conversation[]> {
        const response = await apiService.get<Conversation[]>(`${BASE}/conversations`);
        return response.data as Conversation[];
    },

    /**
     * Idempotent get-or-create a conversation for a (propertyId, tenantId, landlordId) triple.
     * POST /api/communication/conversations
     * Requirements: 3.2, 6.2
     */
    async getOrCreateConversation(dto: CreateConversationDto): Promise<Conversation> {
        const response = await apiService.post<Conversation>(`${BASE}/conversations`, dto);
        return response.data as Conversation;
    },

    /**
     * Retrieve all messages for a conversation.
     * GET /api/communication/conversations/{id}/messages
     * Requirements: 6.3
     */
    async getMessages(conversationId: string): Promise<Message[]> {
        const response = await apiService.get<Message[]>(
            `${BASE}/conversations/${conversationId}/messages`,
        );
        return response.data as Message[];
    },

    /**
     * Send a new message within a conversation.
     * POST /api/communication/conversations/{id}/messages
     * Requirements: 6.4
     */
    async sendMessage(conversationId: string, dto: SendMessageDto): Promise<Message> {
        const response = await apiService.post<Message>(
            `${BASE}/conversations/${conversationId}/messages`,
            dto,
        );
        return response.data as Message;
    },

    /**
     * Mark a message as read.
     * PATCH /api/communication/messages/{id}/read?conversationId={conversationId}
     * Requirements: 6.5
     */
    async markRead(messageId: string, conversationId: string): Promise<void> {
        await apiService.request<void>({
            method: 'PATCH',
            url: `${BASE}/messages/${messageId}/read`,
            params: { conversationId },
        });
    },

    /**
     * Get the total unread message count for the authenticated user.
     * GET /api/communication/conversations/unread-count
     * Requirements: 6.6
     */
    async getUnreadCount(): Promise<number> {
        const response = await apiService.get<number>(`${BASE}/conversations/unread-count`);
        return response.data as number;
    },

    /**
     * Upload a file attachment for a conversation.
     * POST /api/communication/attachments/upload?conversationId={conversationId}
     * Requirements: 7.1
     */
    async uploadAttachment(file: File, conversationId: string): Promise<MessageAttachment> {
        const response = await apiService.uploadFile<MessageAttachment>(
            `${BASE}/attachments/upload?conversationId=${encodeURIComponent(conversationId)}`,
            file,
        );
        return response.data as MessageAttachment;
    },

    /**
     * Get a time-limited SAS URL for an attachment.
     * GET /api/communication/attachments/{id}/url?conversationId={conversationId}
     * Requirements: 7.4
     */
    async getAttachmentUrl(attachmentId: string, conversationId: string): Promise<string> {
        const response = await apiService.get<string>(
            `${BASE}/attachments/${attachmentId}/url`,
            { conversationId },
        );
        return response.data as string;
    },
};

export default communicationService;
