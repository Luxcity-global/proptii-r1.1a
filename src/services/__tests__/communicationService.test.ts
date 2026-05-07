/**
 * Unit tests for communicationService.
 *
 * Mocks `apiService` to assert correct endpoints, HTTP methods, and payloads
 * for each of the eight communication service methods.
 *
 * Requirements: 3.2, 6.1–6.6, 7.1, 7.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import communicationService from '../communicationService';
import apiService from '../api';
import type {
    Conversation,
    Message,
    MessageAttachment,
    CreateConversationDto,
    SendMessageDto,
} from '../../types/messaging';

// ---------------------------------------------------------------------------
// Mock apiService
// ---------------------------------------------------------------------------
vi.mock('../api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        request: vi.fn(),
        uploadFile: vi.fn(),
    },
}));

const mockApiService = apiService as {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    request: ReturnType<typeof vi.fn>;
    uploadFile: ReturnType<typeof vi.fn>;
};

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const BASE = '/api/communication';

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('communicationService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // -----------------------------------------------------------------------
    // getConversations
    // -----------------------------------------------------------------------
    describe('getConversations', () => {
        it('calls GET /api/communication/conversations and returns the data', async () => {
            mockApiService.get.mockResolvedValueOnce({ data: [conversation] });

            const result = await communicationService.getConversations();

            expect(mockApiService.get).toHaveBeenCalledOnce();
            expect(mockApiService.get).toHaveBeenCalledWith(`${BASE}/conversations`);
            expect(result).toEqual([conversation]);
        });

        it('returns an empty array when the API returns an empty list', async () => {
            mockApiService.get.mockResolvedValueOnce({ data: [] });

            const result = await communicationService.getConversations();

            expect(result).toEqual([]);
        });
    });

    // -----------------------------------------------------------------------
    // getOrCreateConversation
    // -----------------------------------------------------------------------
    describe('getOrCreateConversation', () => {
        it('calls POST /api/communication/conversations with the DTO and returns the conversation', async () => {
            const dto: CreateConversationDto = {
                propertyId: 'prop-1',
                tenantId: 'tenant-1',
                landlordId: 'landlord-1',
            };
            mockApiService.post.mockResolvedValueOnce({ data: conversation });

            const result = await communicationService.getOrCreateConversation(dto);

            expect(mockApiService.post).toHaveBeenCalledOnce();
            expect(mockApiService.post).toHaveBeenCalledWith(`${BASE}/conversations`, dto);
            expect(result).toEqual(conversation);
        });

        it('sends all three required DTO fields', async () => {
            const dto: CreateConversationDto = {
                propertyId: 'prop-abc',
                tenantId: 'tenant-xyz',
                landlordId: 'landlord-xyz',
            };
            mockApiService.post.mockResolvedValueOnce({ data: conversation });

            await communicationService.getOrCreateConversation(dto);

            const [, payload] = mockApiService.post.mock.calls[0];
            expect(payload).toMatchObject({
                propertyId: 'prop-abc',
                tenantId: 'tenant-xyz',
                landlordId: 'landlord-xyz',
            });
        });
    });

    // -----------------------------------------------------------------------
    // getMessages
    // -----------------------------------------------------------------------
    describe('getMessages', () => {
        it('calls GET /api/communication/conversations/{id}/messages and returns messages', async () => {
            mockApiService.get.mockResolvedValueOnce({ data: [message] });

            const result = await communicationService.getMessages('conv-1');

            expect(mockApiService.get).toHaveBeenCalledOnce();
            expect(mockApiService.get).toHaveBeenCalledWith(
                `${BASE}/conversations/conv-1/messages`,
            );
            expect(result).toEqual([message]);
        });

        it('interpolates the conversationId into the URL', async () => {
            mockApiService.get.mockResolvedValueOnce({ data: [] });

            await communicationService.getMessages('my-conv-id');

            expect(mockApiService.get).toHaveBeenCalledWith(
                `${BASE}/conversations/my-conv-id/messages`,
            );
        });
    });

    // -----------------------------------------------------------------------
    // sendMessage
    // -----------------------------------------------------------------------
    describe('sendMessage', () => {
        it('calls POST /api/communication/conversations/{id}/messages with the DTO', async () => {
            const dto: SendMessageDto = {
                body: 'Hello!',
                senderRole: 'tenant',
            };
            mockApiService.post.mockResolvedValueOnce({ data: message });

            const result = await communicationService.sendMessage('conv-1', dto);

            expect(mockApiService.post).toHaveBeenCalledOnce();
            expect(mockApiService.post).toHaveBeenCalledWith(
                `${BASE}/conversations/conv-1/messages`,
                dto,
            );
            expect(result).toEqual(message);
        });

        it('includes optional attachmentIds and recipientId when provided', async () => {
            const dto: SendMessageDto = {
                body: 'See attached',
                senderRole: 'landlord',
                attachmentIds: ['att-1'],
                recipientId: 'tenant-1',
            };
            mockApiService.post.mockResolvedValueOnce({ data: message });

            await communicationService.sendMessage('conv-1', dto);

            const [, payload] = mockApiService.post.mock.calls[0];
            expect(payload).toMatchObject({
                body: 'See attached',
                senderRole: 'landlord',
                attachmentIds: ['att-1'],
                recipientId: 'tenant-1',
            });
        });
    });

    // -----------------------------------------------------------------------
    // markRead
    // -----------------------------------------------------------------------
    describe('markRead', () => {
        it('calls PATCH /api/communication/messages/{id}/read with conversationId as query param', async () => {
            mockApiService.request.mockResolvedValueOnce({ data: undefined });

            await communicationService.markRead('msg-1', 'conv-1');

            expect(mockApiService.request).toHaveBeenCalledOnce();
            expect(mockApiService.request).toHaveBeenCalledWith({
                method: 'PATCH',
                url: `${BASE}/messages/msg-1/read`,
                params: { conversationId: 'conv-1' },
            });
        });

        it('interpolates the messageId into the URL', async () => {
            mockApiService.request.mockResolvedValueOnce({ data: undefined });

            await communicationService.markRead('my-msg-id', 'my-conv-id');

            const [call] = mockApiService.request.mock.calls;
            expect(call[0].url).toBe(`${BASE}/messages/my-msg-id/read`);
            expect(call[0].params).toEqual({ conversationId: 'my-conv-id' });
        });
    });

    // -----------------------------------------------------------------------
    // getUnreadCount
    // -----------------------------------------------------------------------
    describe('getUnreadCount', () => {
        it('calls GET /api/communication/conversations/unread-count and returns the count', async () => {
            mockApiService.get.mockResolvedValueOnce({ data: 5 });

            const result = await communicationService.getUnreadCount();

            expect(mockApiService.get).toHaveBeenCalledOnce();
            expect(mockApiService.get).toHaveBeenCalledWith(
                `${BASE}/conversations/unread-count`,
            );
            expect(result).toBe(5);
        });

        it('returns 0 when there are no unread messages', async () => {
            mockApiService.get.mockResolvedValueOnce({ data: 0 });

            const result = await communicationService.getUnreadCount();

            expect(result).toBe(0);
        });
    });

    // -----------------------------------------------------------------------
    // uploadAttachment
    // -----------------------------------------------------------------------
    describe('uploadAttachment', () => {
        it('calls uploadFile with the correct URL including conversationId query param', async () => {
            const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
            mockApiService.uploadFile.mockResolvedValueOnce({ data: attachment });

            const result = await communicationService.uploadAttachment(file, 'conv-1');

            expect(mockApiService.uploadFile).toHaveBeenCalledOnce();
            const [url, uploadedFile] = mockApiService.uploadFile.mock.calls[0];
            expect(url).toBe(`${BASE}/attachments/upload?conversationId=conv-1`);
            expect(uploadedFile).toBe(file);
            expect(result).toEqual(attachment);
        });

        it('URL-encodes the conversationId in the query string', async () => {
            const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });
            mockApiService.uploadFile.mockResolvedValueOnce({ data: attachment });

            await communicationService.uploadAttachment(file, 'conv id with spaces');

            const [url] = mockApiService.uploadFile.mock.calls[0];
            expect(url).toBe(
                `${BASE}/attachments/upload?conversationId=conv%20id%20with%20spaces`,
            );
        });
    });

    // -----------------------------------------------------------------------
    // getAttachmentUrl
    // -----------------------------------------------------------------------
    describe('getAttachmentUrl', () => {
        it('calls GET /api/communication/attachments/{id}/url with conversationId as query param', async () => {
            const sasUrl = 'https://storage.example.com/att-1?sas=token';
            mockApiService.get.mockResolvedValueOnce({ data: sasUrl });

            const result = await communicationService.getAttachmentUrl('att-1', 'conv-1');

            expect(mockApiService.get).toHaveBeenCalledOnce();
            expect(mockApiService.get).toHaveBeenCalledWith(
                `${BASE}/attachments/att-1/url`,
                { conversationId: 'conv-1' },
            );
            expect(result).toBe(sasUrl);
        });

        it('interpolates the attachmentId into the URL', async () => {
            mockApiService.get.mockResolvedValueOnce({ data: 'https://example.com/url' });

            await communicationService.getAttachmentUrl('my-att-id', 'my-conv-id');

            const [url, params] = mockApiService.get.mock.calls[0];
            expect(url).toBe(`${BASE}/attachments/my-att-id/url`);
            expect(params).toEqual({ conversationId: 'my-conv-id' });
        });
    });
});
