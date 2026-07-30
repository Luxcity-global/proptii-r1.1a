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

import axios from 'axios';
import { getAccessTokenForApiRequest } from './msalAccessToken';
import type {
    Conversation,
    Message,
    MessageAttachment,
    CreateConversationDto,
    SendMessageDto,
} from '../types/messaging';

// Azure Functions or Nest backend base endpoint — resolved dynamically from env
const FUNCTIONS_BASE = (
    import.meta.env.VITE_API_ENDPOINT ||
    import.meta.env.VITE_NEST_API_ENDPOINT ||
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? 'http://localhost:7071' : (typeof window !== 'undefined' ? window.location.origin : ''))
).replace(/\/api$/, '').replace(/\/$/, '');
const BASE = `${FUNCTIONS_BASE}/api/communication`;

/** Build an Authorization header using the mock token or MSAL token. */
async function authHeaders(): Promise<Record<string, string>> {
    const token = await getAccessTokenForApiRequest();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

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
        const { data } = await axios.get(`${BASE}/conversations`, { headers: await authHeaders() });
        return unwrap<Conversation[]>(data);
    },

    /**
     * Idempotent get-or-create a conversation for a (propertyId, tenantId, landlordId) triple.
     * POST /api/communication/conversations
     * Requirements: 3.2, 6.2
     */
    async getOrCreateConversation(dto: CreateConversationDto): Promise<Conversation> {
        const { data } = await axios.post(`${BASE}/conversations`, dto, { headers: await authHeaders() });
        return unwrap<Conversation>(data);
    },

    /**
     * Retrieve all messages for a conversation.
     * GET /api/communication/conversations/{id}/messages
     * Requirements: 6.3
     */
    async getMessages(conversationId: string): Promise<Message[]> {
        const { data } = await axios.get(`${BASE}/conversations/${conversationId}/messages`, {
            headers: await authHeaders(),
        });
        return unwrap<Message[]>(data);
    },

    /**
     * Send a new message within a conversation.
     * POST /api/communication/conversations/{id}/messages
     * Requirements: 6.4
     */
    async sendMessage(conversationId: string, dto: SendMessageDto): Promise<Message> {
        const { data } = await axios.post(`${BASE}/conversations/${conversationId}/messages`, dto, {
            headers: await authHeaders(),
        });
        return unwrap<Message>(data);
    },

    /**
     * Mark a message as read.
     * PATCH /api/communication/messages/{id}/read?conversationId={conversationId}
     * Requirements: 6.5
     */
    async markRead(messageId: string, conversationId: string): Promise<void> {
        await axios.patch(
            `${BASE}/messages/${messageId}/read`,
            {},
            { headers: await authHeaders(), params: { conversationId } },
        );
    },

    /**
     * Get the total unread message count for the authenticated user.
     * GET /api/communication/conversations/unread-count
     * Requirements: 6.6
     */
    async getUnreadCount(): Promise<number> {
        const { data } = await axios.get(`${BASE}/conversations/unread-count`, {
            headers: await authHeaders(),
        });
        const result = unwrap<{ unreadCount: number } | number>(data);
        // Backend returns { unreadCount: N } — unwrap the inner field if needed
        if (result !== null && typeof result === 'object' && 'unreadCount' in result) {
            return (result as { unreadCount: number }).unreadCount;
        }
        return result as number;
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

        const { data } = await axios.post(
            `${BASE}/attachments/upload?conversationId=${encodeURIComponent(conversationId)}`,
            {
                file: base64,
                fileName: file.name,
                mimeType,
                sizeBytes: file.size,
            },
            { headers: await authHeaders() },
        );
        return unwrap<MessageAttachment>(data);
    },

    /**
     * Get a time-limited SAS URL for an attachment.
     * GET /api/communication/attachments/{id}/url?conversationId={conversationId}
     * Requirements: 7.4
     */
    async getAttachmentUrl(attachmentId: string, conversationId: string): Promise<string> {
        const { data } = await axios.get(`${BASE}/attachments/${attachmentId}/url`, {
            headers: await authHeaders(),
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
