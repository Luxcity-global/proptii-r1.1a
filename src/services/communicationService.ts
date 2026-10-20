/**
 * Frontend API wrapper for the Proptii Communication feature.
 *
 * Calls go to the NestJS v2 backend (VITE_API_ENDPOINT).
 *
 * Requirements: 3.2, 6.1â€“6.6, 7.1, 7.4
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessTokenForApiRequest } from './msalAccessToken';
import { v4 as uuidv4 } from 'uuid';
import type {
    Conversation,
    Message,
    MessageAttachment,
    CreateConversationDto,
    SendMessageDto,
} from '../types/messaging';

import { getResolvedApiBaseUrl } from '../config/apiBaseUrl';
import {
    deleteDemoMessage,
    editDemoMessage,
    getDemoConversations,
    getDemoMessages,
    getDemoUnreadCount,
    isDemoConversation,
    isDemoMessage,
    isDemoMessagingSession,
    markDemoRead,
    sendDemoMessage,
} from '../data/demoMessages';

// Resolve lazily at request time so env changes take effect without a hard refresh.
// A module-level const would freeze the URL at import time.
function getBase(): string {
    return `${getResolvedApiBaseUrl()}/communication`;
}

interface ApiResponse<T = any> {
    data: T;
}

// Dedicated API client for communication module
const commApi = {
    async request<T = any>(method: string, endpoint: string, body?: any, params?: Record<string, string>): Promise<ApiResponse<T>> {
        let url = `${getBase()}${endpoint}`;
        if (params && Object.keys(params).length > 0) {
            const sp = new URLSearchParams(params);
            url += (url.includes('?') ? '&' : '?') + sp.toString();
        }
        let token = await getAccessTokenForApiRequest().catch(() => null);
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const init: RequestInit = {
            method,
            headers,
        };
        if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
            init.body = typeof body === 'string' ? body : JSON.stringify(body);
        }

        let res = await fetch(url, init);
        if (res.status === 401) {
            localStorage.removeItem('auth_token');
            const freshToken = await getAccessTokenForApiRequest().catch(() => null);
            if (freshToken) {
                headers['Authorization'] = `Bearer ${freshToken}`;
                res = await fetch(url, init);
            }
        }
        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            throw new Error(`API error ${res.status}: ${errText}`);
        }
        const json = await res.json().catch(() => null);
        return { data: json };
    },
    get<T = any>(endpoint: string, config?: { params?: any }): Promise<ApiResponse<T>> {
        return this.request<T>('GET', endpoint, undefined, config?.params);
    },
    post<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
        return this.request<T>('POST', endpoint, body);
    },
    patch<T = any>(endpoint: string, body?: any, config?: { params?: any }): Promise<ApiResponse<T>> {
        return this.request<T>('PATCH', endpoint, body, config?.params);
    },
    delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>('DELETE', endpoint);
    },
};

/**
 * Unwrap the Azure Functions / NestJS response envelope `{ data: T }` â†’ T.
 * Falls back to the raw body if the envelope is absent (future-proofing).
 */
function unwrap<T>(body: any): T {
    if (body !== null && typeof body === 'object' && 'data' in body) {
        return body.data as T;
    }
    return body as T;
}

const communicationService = {
    /**
     * Retrieve all conversations for the authenticated user.
     * GET /api/communication/conversations
     * Requirements: 6.1
     */
    async getConversations(): Promise<Conversation[]> {
        const demo = isDemoMessagingSession() ? getDemoConversations() : [];
        try {
            const { data } = await commApi.get('/conversations');
            return [...demo, ...(unwrap<Conversation[]>(data) || [])];
        } catch (err) {
            console.warn('âš ï¸ Communication service getConversations failed, falling back to empty list:', err);
            return demo;
        }
    },

    /**
     * Idempotent get-or-create a conversation for a (propertyId, tenantId, landlordId) triple.
     * POST /api/communication/conversations
     * Requirements: 3.2, 6.2
     */
    async getOrCreateConversation(dto: CreateConversationDto): Promise<Conversation> {
        const { data } = await commApi.post('/conversations', dto);
        return unwrap<Conversation>(data);
    },

    /**
     * Retrieve messages for a conversation with optional cursor pagination.
     * GET /api/communication/conversations/{id}/messages?before={sentAt}&limit={n}
     * Requirements: 6.3
     */
    async getMessages(conversationId: string, before?: string, limit = 25): Promise<{ messages: Message[]; hasMore: boolean } & Message[]> {
        if (isDemoConversation(conversationId)) {
            const list = before ? [] : getDemoMessages(conversationId);
            return Object.assign([...list], { messages: list, hasMore: false });
        }
        try {
            const params = new URLSearchParams({ limit: String(limit) });
            if (before) params.set('before', before);
            const { data } = await commApi.get(`/conversations/${conversationId}/messages?${params}`);
            
            let list: Message[] = [];
            let hasMore = false;
            if (data && 'data' in data && Array.isArray(data.data)) {
                list = data.data;
                hasMore = !!data.hasMore;
            } else if (Array.isArray(data)) {
                list = data;
                hasMore = false;
            } else {
                const body = unwrap<{ data: Message[]; hasMore: boolean } | Message[]>(data);
                if (Array.isArray(body)) {
                    list = body;
                    hasMore = false;
                } else {
                    list = (body as any)?.data ?? [];
                    hasMore = (body as any)?.hasMore ?? false;
                }
            }
            return Object.assign([...list], { messages: list, hasMore });
        } catch (err) {
            console.warn('âš ï¸ Communication service getMessages failed:', err);
            return Object.assign([] as Message[], { messages: [] as Message[], hasMore: false });
        }
    },

    /**
     * Send a new message within a conversation.
     * POST /api/communication/conversations/{id}/messages
     * Requirements: 6.4
     */
    async sendMessage(conversationId: string, dto: SendMessageDto): Promise<Message> {
        if (isDemoConversation(conversationId)) return sendDemoMessage(conversationId, dto);
        const { data } = await commApi.post(`/conversations/${conversationId}/messages`, dto);
        return unwrap<Message>(data);
    },

    /**
     * Edit a message body.
     * PATCH /api/communication/messages/{id}/body
     */
    async editMessage(messageId: string, body: string): Promise<Message> {
        if (isDemoMessage(messageId)) return editDemoMessage(messageId, body);
        const { data } = await commApi.patch(`/messages/${messageId}/body`, { body });
        return unwrap<Message>(data);
    },

    /**
     * Delete a message (soft delete).
     * DELETE /api/communication/messages/{id}
     */
    async deleteMessage(messageId: string): Promise<Message> {
        if (isDemoMessage(messageId)) return deleteDemoMessage(messageId);
        const { data } = await commApi.delete(`/messages/${messageId}`);
        return unwrap<Message>(data);
    },

    /**
     * Mark a message as read.
     * PATCH /api/communication/messages/{id}/read?conversationId={conversationId}
     * Requirements: 6.5
     */
    async markRead(messageId: string, conversationId: string): Promise<void> {
        if (isDemoConversation(conversationId)) {
            markDemoRead(messageId);
            return;
        }
        try {
            await commApi.patch(
                `/messages/${messageId}/read`,
                {},
                { params: { conversationId } },
            );
        } catch (err) {
            console.warn('âš ï¸ Communication service markRead failed:', err);
        }
    },

    /**
     * Get the total unread message count for the authenticated user.
     * GET /api/communication/conversations/unread-count
     * Requirements: 6.6
     */
    async getUnreadCount(): Promise<number> {
        const demo = isDemoMessagingSession() ? getDemoUnreadCount() : 0;
        try {
            const { data } = await commApi.get('/conversations/unread-count');
            const result = unwrap<{ unreadCount: number } | number>(data);
            if (typeof result === 'number') {
                return demo + result;
            }
            if (result !== null && typeof result === 'object') {
                if (typeof (result as any).unreadCount === 'number') {
                    return demo + (result as { unreadCount: number }).unreadCount;
                }
                if (typeof (result as any).count === 'number') {
                    return demo + (result as { count: number }).count;
                }
            }
            return demo;
        } catch (err) {
            console.warn('âš ï¸ Communication service getUnreadCount failed, falling back to 0:', err);
            return demo;
        }
    },

    /**
     * Upload a file attachment for a conversation through the v2-backend storage endpoint,
     * then register the attachment record with the communication service.
     * Requirements: 7.1
     *
     * Files go to POST /api/storage/upload (v2-backend) instead of directly to Firebase Storage.
     * The backend signs the upload with the Admin SDK â€” no client-side Firebase SDK needed.
     */
    async uploadAttachment(file: File, conversationId: string): Promise<MessageAttachment> {
        const extensionMimeMap: Record<string, string> = {
            pdf: 'application/pdf',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            txt: 'text/plain',
        };
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        const mimeType = file.type || extensionMimeMap[ext] || 'application/octet-stream';

        // 1. Upload through the backend storage endpoint (POST /api/storage/upload)
        const fileId = uuidv4();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const folder = `attachments/${conversationId}`;

        const storageFormData = new FormData();
        // Rename the file to include the fileId to avoid collisions
        const renamedFile = new File([file], `${fileId}-${safeName}`, { type: mimeType });
        storageFormData.append('file', renamedFile);
        storageFormData.append('folder', folder);

        let blobUrl: string;
        try {
            const token = await getAccessTokenForApiRequest().catch(() => null);
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const storageRes = await fetch(`${getResolvedApiBaseUrl()}/storage/upload`, {
                method: 'POST',
                headers,
                body: storageFormData,
            });
            if (!storageRes.ok) {
                const errText = await storageRes.text().catch(() => '');
                throw new Error(`Storage upload failed (${storageRes.status}): ${errText}`);
            }
            const storageJson = await storageRes.json();
            if (!storageJson?.url) throw new Error('Storage upload succeeded but returned no URL');
            blobUrl = storageJson.url as string;
        } catch (uploadErr) {
            console.error('[communicationService] Attachment upload failed:', uploadErr);
            throw uploadErr;
        }

        // 2. Register attachment with the communication backend
        const { data } = await commApi.post('/attachments', {
            filename: file.name,
            mimeType,
            size: file.size,
            blobUrl,
            conversationId,
        });

        return unwrap<MessageAttachment>(data);
    },

    /**
     * Broadcast a typing indicator to conversation participants (fire-and-forget).
     * POST /api/communication/conversations/{id}/typing
     */
    async sendTyping(conversationId: string): Promise<void> {
        if (isDemoConversation(conversationId)) return;
        try {
            await commApi.post(`/conversations/${conversationId}/typing`, {});
        } catch (_e) { /* non-fatal â€” typing indicators are best-effort */ }
    },

    /**
     * GET /api/communication/attachments/{id}
     * Requirements: 7.4
     */
    async getAttachment(attachmentId: string): Promise<MessageAttachment> {
        const { data } = await commApi.get(`/attachments/${attachmentId}`);
        return unwrap<MessageAttachment>(data);
    },
};

export default communicationService;
