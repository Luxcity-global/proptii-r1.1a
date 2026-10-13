/**
 * Unit tests for communicationService.
 *
 * Mocks fetch to assert correct endpoints, HTTP methods, headers, and payloads
 * for all communication service methods.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import communicationService from '../communicationService';
import type {
    Conversation,
    Message,
    MessageAttachment,
    CreateConversationDto,
    SendMessageDto,
} from '../../types/messaging';

vi.mock('../msalAccessToken', () => ({
    getAccessTokenForApiRequest: vi.fn().mockResolvedValue('test-token'),
}));

vi.mock('../../config/apiBaseUrl', () => ({
    getResolvedApiBaseUrl: () => 'http://localhost:3002/api',
}));

const BASE = 'http://localhost:3002/api/communication';

const conversation: Conversation = {
    id: 'conv-1',
    propertyId: 'prop-1',
    tenantId: 'tenant-1',
    landlordId: 'landlord-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    lastMessageAt: null,
    isDeleted: false,
    deletedAt: null,
};

const message: Message = {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'tenant-1',
    senderRole: 'tenant',
    body: 'Hello!',
    attachmentIds: [],
    sentAt: '2024-01-01T00:00:00.000Z',
    readAt: null,
    isDeleted: false,
    deletedAt: null,
};

const attachment: MessageAttachment = {
    id: 'att-1',
    conversationId: 'conv-1',
    messageId: 'msg-1',
    uploaderId: 'tenant-1',
    fileName: 'document.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
    blobPath: 'attachments/conv-1/att-1.pdf',
    uploadedAt: '2024-01-01T00:00:00.000Z',
};

function mockFetchJson(status: number, data: any) {
    return vi.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        json: async () => data,
        text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
    });
}

describe('communicationService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getConversations', () => {
        it('calls GET /communication/conversations and returns the list', async () => {
            globalThis.fetch = mockFetchJson(200, { data: [conversation] });

            const result = await communicationService.getConversations();

            expect(globalThis.fetch).toHaveBeenCalledOnce();
            const [url, init] = (globalThis.fetch as any).mock.calls[0];
            expect(url).toBe(`${BASE}/conversations`);
            expect(init.method).toBe('GET');
            expect(result).toEqual([conversation]);
        });

        it('returns an empty array when the API returns an empty list', async () => {
            globalThis.fetch = mockFetchJson(200, { data: [] });

            const result = await communicationService.getConversations();

            expect(result).toEqual([]);
        });
    });

    describe('getOrCreateConversation', () => {
        it('calls POST /communication/conversations with the DTO and returns the conversation', async () => {
            const dto: CreateConversationDto = {
                propertyId: 'prop-1',
                tenantId: 'tenant-1',
                landlordId: 'landlord-1',
            };
            globalThis.fetch = mockFetchJson(200, { data: conversation });

            const result = await communicationService.getOrCreateConversation(dto);

            expect(globalThis.fetch).toHaveBeenCalledOnce();
            const [url, init] = (globalThis.fetch as any).mock.calls[0];
            expect(url).toBe(`${BASE}/conversations`);
            expect(init.method).toBe('POST');
            expect(JSON.parse(init.body)).toEqual(dto);
            expect(result).toEqual(conversation);
        });
    });

    describe('getMessages', () => {
        it('calls GET /communication/conversations/{id}/messages and returns messages', async () => {
            globalThis.fetch = mockFetchJson(200, { data: [message], hasMore: false });

            const result = await communicationService.getMessages('conv-1');

            expect(globalThis.fetch).toHaveBeenCalledOnce();
            const [url] = (globalThis.fetch as any).mock.calls[0];
            expect(url).toContain(`${BASE}/conversations/conv-1/messages`);
            expect(result.messages).toEqual([message]);
            expect(result.hasMore).toBe(false);
        });
    });

    describe('sendMessage', () => {
        it('calls POST /communication/conversations/{id}/messages and returns the sent message', async () => {
            const dto: SendMessageDto = {
                body: 'Hello!',
                senderRole: 'tenant',
            };
            globalThis.fetch = mockFetchJson(200, { data: message });

            const result = await communicationService.sendMessage('conv-1', dto);

            expect(globalThis.fetch).toHaveBeenCalledOnce();
            const [url, init] = (globalThis.fetch as any).mock.calls[0];
            expect(url).toBe(`${BASE}/conversations/conv-1/messages`);
            expect(init.method).toBe('POST');
            expect(JSON.parse(init.body)).toEqual(dto);
            expect(result).toEqual(message);
        });
    });

    describe('markRead', () => {
        it('calls PATCH /communication/messages/{id}/read with conversationId', async () => {
            globalThis.fetch = mockFetchJson(200, { success: true });

            await communicationService.markRead('msg-1', 'conv-1');

            expect(globalThis.fetch).toHaveBeenCalledOnce();
            const [url, init] = (globalThis.fetch as any).mock.calls[0];
            expect(url).toContain(`${BASE}/messages/msg-1/read?conversationId=conv-1`);
            expect(init.method).toBe('PATCH');
        });
    });

    describe('editMessage', () => {
        it('calls PATCH /communication/messages/{id}/body with updated body', async () => {
            const updated = { ...message, body: 'Edited text' };
            globalThis.fetch = mockFetchJson(200, { data: updated });

            const result = await communicationService.editMessage('msg-1', 'Edited text');

            expect(globalThis.fetch).toHaveBeenCalledOnce();
            const [url, init] = (globalThis.fetch as any).mock.calls[0];
            expect(url).toBe(`${BASE}/messages/msg-1/body`);
            expect(init.method).toBe('PATCH');
            expect(JSON.parse(init.body)).toEqual({ body: 'Edited text' });
            expect(result).toEqual(updated);
        });
    });

    describe('deleteMessage', () => {
        it('calls DELETE /communication/messages/{id}', async () => {
            const deleted = { ...message, isDeleted: true };
            globalThis.fetch = mockFetchJson(200, { data: deleted });

            const result = await communicationService.deleteMessage('msg-1');

            expect(globalThis.fetch).toHaveBeenCalledOnce();
            const [url, init] = (globalThis.fetch as any).mock.calls[0];
            expect(url).toBe(`${BASE}/messages/msg-1`);
            expect(init.method).toBe('DELETE');
            expect(result).toEqual(deleted);
        });
    });

    describe('getUnreadCount', () => {
        it('calls GET /communication/conversations/unread-count and returns count', async () => {
            globalThis.fetch = mockFetchJson(200, { count: 3 });

            const result = await communicationService.getUnreadCount();

            expect(result).toBe(3);
        });
    });

    describe('uploadAttachment', () => {
        it('uploads file to storage and registers attachment record', async () => {
            const fetchMock = vi.fn();
            // 1. Storage upload
            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ url: 'https://storage.example.com/test.pdf' }),
                text: async () => JSON.stringify({ url: 'https://storage.example.com/test.pdf' }),
            });
            // 2. Attachment registration
            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ data: attachment }),
                text: async () => JSON.stringify({ data: attachment }),
            });
            globalThis.fetch = fetchMock;

            const file = new File(['test'], 'document.pdf', { type: 'application/pdf' });
            const result = await communicationService.uploadAttachment(file, 'conv-1');

            expect(fetchMock).toHaveBeenCalledTimes(2);
            expect(result).toEqual(attachment);
        });
    });
});
