/**
 * Frontend API wrapper for the Proptii Communication feature.
 *
 * Calls go to the NestJS v2 backend (VITE_API_ENDPOINT).
 *
 * Requirements: 3.2, 6.1–6.6, 7.1, 7.4
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessTokenForApiRequest } from './msalAccessToken';
import { storage } from '../config/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import type {
    Conversation,
    Message,
    MessageAttachment,
    CreateConversationDto,
    SendMessageDto,
} from '../types/messaging';

import { getResolvedApiBaseUrl } from '../config/apiBaseUrl';

const BASE = `${getResolvedApiBaseUrl()}/communication`;

/** Axios 1.x may use AxiosHeaders — set Authorization in a way that always applies. */
function setBearerAuth(config: InternalAxiosRequestConfig, accessToken: string): void {
    const value = `Bearer ${accessToken}`;
    const headers = config.headers;
    if (!headers) return;
    if (typeof (headers as { set?: (k: string, v: string) => void }).set === 'function') {
        (headers as { set: (k: string, v: string) => void }).set('Authorization', value);
    } else {
        (headers as Record<string, string>)['Authorization'] = value;
    }
}

// Dedicated Axios instance for communication module
const commApi = axios.create({
    baseURL: BASE,
    timeout: 30000,
});

// Request interceptor: attach Bearer token (MSAL silent → popup → auth_token fallback)
commApi.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = await getAccessTokenForApiRequest();
        if (token) {
            setBearerAuth(config, token);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: on 401, clear the stale cached token and retry once
// with a freshly acquired MSAL token before giving up.
commApi.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retried?: boolean };
        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retried
        ) {
            originalRequest._retried = true;
            localStorage.removeItem('auth_token');
            try {
                const freshToken = await getAccessTokenForApiRequest();
                if (freshToken) {
                    setBearerAuth(originalRequest, freshToken);
                    return commApi.request(originalRequest);
                }
            } catch {
                // Fresh token acquisition failed — fall through to error handling
            }
        }
        return Promise.reject(error);
    }
);

/**
 * Unwrap the Azure Functions response envelope `{ data: T }` → T.
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
        try {
            const { data } = await commApi.get('/conversations');
            return unwrap<Conversation[]>(data) || [];
        } catch (err) {
            console.warn('⚠️ Communication service getConversations failed, falling back to empty list:', err);
            return [];
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
     * Retrieve all messages for a conversation.
     * GET /api/communication/conversations/{id}/messages
     * Requirements: 6.3
     */
    async getMessages(conversationId: string): Promise<Message[]> {
        try {
            const { data } = await commApi.get(`/conversations/${conversationId}/messages`);
            return unwrap<Message[]>(data) || [];
        } catch (err) {
            console.warn('⚠️ Communication service getMessages failed:', err);
            return [];
        }
    },

    /**
     * Send a new message within a conversation.
     * POST /api/communication/conversations/{id}/messages
     * Requirements: 6.4
     */
    async sendMessage(conversationId: string, dto: SendMessageDto): Promise<Message> {
        const { data } = await commApi.post(`/conversations/${conversationId}/messages`, dto);
        return unwrap<Message>(data);
    },

    /**
     * Mark a message as read.
     * PATCH /api/communication/messages/{id}/read?conversationId={conversationId}
     * Requirements: 6.5
     */
    async markRead(messageId: string, conversationId: string): Promise<void> {
        try {
            await commApi.patch(
                `/messages/${messageId}/read`,
                {},
                { params: { conversationId } },
            );
        } catch (err) {
            console.warn('⚠️ Communication service markRead failed:', err);
        }
    },

    /**
     * Get the total unread message count for the authenticated user.
     * GET /api/communication/conversations/unread-count
     * Requirements: 6.6
     */
    async getUnreadCount(): Promise<number> {
        try {
            const { data } = await commApi.get('/conversations/unread-count');
            const result = unwrap<{ unreadCount: number } | number>(data);
            // Backend returns { unreadCount: N } — unwrap the inner field if needed
            if (result !== null && typeof result === 'object' && 'unreadCount' in result) {
                return (result as { unreadCount: number }).unreadCount;
            }
            return (result as number) || 0;
        } catch (err) {
            console.warn('⚠️ Communication service getUnreadCount failed, falling back to 0:', err);
            return 0;
        }
    },

    /**
     * Upload a file attachment for a conversation directly to Firebase Storage,
     * then notify the backend to create the attachment record.
     * Requirements: 7.1
     */
    async uploadAttachment(file: File, conversationId: string): Promise<MessageAttachment> {
        // Derive MIME type from the file extension when the browser doesn't provide one.
        const extensionMimeMap: Record<string, string> = {
            pdf: 'application/pdf',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            txt: 'text/plain',
        };
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        const mimeType = file.type || extensionMimeMap[ext] || 'application/octet-stream';

        // 1. Upload to Firebase Storage
        const fileId = uuidv4();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storageRef = ref(storage, `attachments/${conversationId}/${fileId}-${safeName}`);
        
        await uploadBytes(storageRef, file, { contentType: mimeType });
        const blobUrl = await getDownloadURL(storageRef);

        // 2. Register attachment with backend
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
     * Get attachment metadata (including Firebase Storage blobUrl).
     * GET /api/communication/attachments/{id}
     * Requirements: 7.4
     */
    async getAttachment(attachmentId: string): Promise<MessageAttachment> {
        const { data } = await commApi.get(`/attachments/${attachmentId}`);
        return unwrap<MessageAttachment>(data);
    },
};

export default communicationService;
