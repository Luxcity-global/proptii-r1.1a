/**
 * Frontend API wrapper for the Proptii Communication feature.
 *
 * Calls go directly to the Azure Functions host (VITE_API_ENDPOINT, default
 * http://localhost:7071) rather than through the NestJS apiService, because
 * the communication module is an Azure Function — not a NestJS route.
 *
 * The MSAL Bearer token (or mock-token-* in dev) is attached manually so the
 * same auth bypass that works for the NestJS service also works here.
 *
 * Requirements: 3.2, 6.1–6.6, 7.1, 7.4
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessTokenForApiRequest } from './msalAccessToken';
import type {
    Conversation,
    Message,
    MessageAttachment,
    CreateConversationDto,
    SendMessageDto,
} from '../types/messaging';

// Azure Functions base endpoint — single source of truth is VITE_API_ENDPOINT.
// Falls back to window.location.origin in production (same-origin deployment)
// and http://localhost:7071 in development.
const FUNCTIONS_BASE = (() => {
    const env = import.meta.env.VITE_API_ENDPOINT?.trim();
    if (env) return env.replace(/\/api$/, '').replace(/\/$/, '');
    if (import.meta.env.DEV) return 'http://localhost:7071';
    if (typeof window !== 'undefined') return window.location.origin;
    return '';
})();

if (!FUNCTIONS_BASE && import.meta.env.DEV) {
    console.error('[communicationService] VITE_API_ENDPOINT is not set — messaging will not work. Add it to .env.local.');
}

const BASE = `${FUNCTIONS_BASE}/api/communication`;

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
     * Upload a file attachment for a conversation.
     * POST /api/communication/attachments/upload?conversationId={conversationId}
     *
     * The API expects JSON with a base64-encoded file body (not multipart/form-data).
     * Requirements: 7.1
     */
    async uploadAttachment(file: File, conversationId: string): Promise<MessageAttachment> {
        // Read file as base64
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                // Strip the data URL prefix (e.g. "data:application/pdf;base64,")
                resolve(result.split(',')[1] ?? result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        // Derive MIME type from the file extension when the browser doesn't provide one.
        // The API only accepts pdf, doc, docx, and txt — map extensions explicitly.
        const extensionMimeMap: Record<string, string> = {
            pdf: 'application/pdf',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            txt: 'text/plain',
        };
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        const mimeType = file.type || extensionMimeMap[ext] || 'application/octet-stream';

        const { data } = await commApi.post(
            `/attachments/upload?conversationId=${encodeURIComponent(conversationId)}`,
            {
                file: base64,
                fileName: file.name,
                mimeType,
                sizeBytes: file.size,
            },
        );
        return unwrap<MessageAttachment>(data);
    },

    /**
     * Get a time-limited SAS URL for an attachment.
     * GET /api/communication/attachments/{id}/url?conversationId={conversationId}
     * Requirements: 7.4
     */
    async getAttachmentUrl(attachmentId: string, conversationId: string): Promise<string> {
        const { data } = await commApi.get(`/attachments/${attachmentId}/url`, {
            params: { conversationId },
        });
        const result = unwrap<{ url: string } | string>(data);
        if (result !== null && typeof result === 'object' && 'url' in result) {
            return (result as { url: string }).url;
        }
        return result as string;
    },
};

export default communicationService;
