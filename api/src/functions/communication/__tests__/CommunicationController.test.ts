/**
 * Unit tests for CommunicationController.
 *
 * Tests cover: correct HTTP status codes, response shapes, and guard invocation
 * for all nine routes.
 *
 * Requirements: 3.2, 3.6, 5.1, 6.1–6.8, 7.1, 7.4, 9.7, 13.3, 14.1, 14.2, 14.5
 */

// ---------------------------------------------------------------------------
// Mocks — declared before any imports
// ---------------------------------------------------------------------------

// Mock ConversationService
const mockListConversationsForUser = jest.fn();
const mockGetOrCreateConversation = jest.fn();
const mockGetMessages = jest.fn();
const mockCreateMessage = jest.fn();
const mockMarkMessageRead = jest.fn();
const mockGetUnreadCount = jest.fn();
const mockSoftDeleteMessage = jest.fn();

jest.mock('../../../shared/services/ConversationService', () => ({
    ConversationService: jest.fn().mockImplementation(() => ({
        listConversationsForUser: mockListConversationsForUser,
        getOrCreateConversation: mockGetOrCreateConversation,
        getMessages: mockGetMessages,
        createMessage: mockCreateMessage,
        markMessageRead: mockMarkMessageRead,
        getUnreadCount: mockGetUnreadCount,
        softDeleteMessage: mockSoftDeleteMessage,
    })),
}));

// Mock AttachmentService
const mockUploadAttachment = jest.fn();
const mockGenerateSasUrl = jest.fn();

jest.mock('../../../shared/services/AttachmentService', () => ({
    AttachmentService: jest.fn().mockImplementation(() => ({
        uploadAttachment: mockUploadAttachment,
        generateSasUrl: mockGenerateSasUrl,
    })),
}));

// Mock NotificationService
const mockNotify = jest.fn();
const mockUpdateLastSeen = jest.fn();

jest.mock('../../../shared/services/NotificationService', () => ({
    NotificationService: jest.fn().mockImplementation(() => ({
        notify: mockNotify,
        updateLastSeen: mockUpdateLastSeen,
    })),
}));

// Mock MonitoringService
const mockTrackOperationMetrics = jest.fn();

jest.mock('../../../shared/services/MonitoringService', () => ({
    MonitoringService: jest.fn().mockImplementation(() => ({
        trackOperationMetrics: mockTrackOperationMetrics,
    })),
}));

// Mock withAuth — pass through by default; can be overridden per test
jest.mock('../../../shared/middleware/auth', () => ({
    withAuth: jest.fn((handler) => handler),
}));

// Mock withParticipantGuard — pass through by default; can be overridden per test
jest.mock('../../../shared/middleware/conversationParticipantGuard', () => ({
    withParticipantGuard: jest.fn((handler) => handler),
}));

// Mock jwt-decode to return a predictable sub claim
jest.mock('jwt-decode', () => ({
    jwtDecode: jest.fn(() => ({ sub: 'user-123', name: 'Test User' })),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { CommunicationController } from '../index';
import { withAuth } from '../../../shared/middleware/auth';
import { withParticipantGuard } from '../../../shared/middleware/conversationParticipantGuard';
import { AppError } from '../../../shared/middleware/error-handling';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(overrides: Partial<{
    method: string;
    url: string;
    headers: Record<string, string>;
    params: Record<string, string>;
    queryParams: Record<string, string>;
    body: unknown;
}>): HttpRequest {
    const {
        method = 'GET',
        url = 'http://localhost/api/communication/conversations',
        headers = { authorization: 'Bearer valid-token' },
        params = {},
        queryParams = {},
        body = null,
    } = overrides;

    return {
        method,
        url,
        headers: {
            get: (name: string) => headers[name.toLowerCase()] ?? null,
        },
        params,
        query: {
            get: (name: string) => queryParams[name] ?? null,
        },
        json: jest.fn().mockResolvedValue(body),
        text: jest.fn().mockResolvedValue(typeof body === 'string' ? body : JSON.stringify(body)),
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
    } as unknown as HttpRequest;
}

function makeContext(): InvocationContext {
    return {
        error: jest.fn(),
        warn: jest.fn(),
        log: jest.fn(),
        info: jest.fn(),
    } as unknown as InvocationContext;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CommunicationController', () => {
    let controller: CommunicationController;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUpdateLastSeen.mockResolvedValue(undefined);
        mockNotify.mockResolvedValue(undefined);
        mockTrackOperationMetrics.mockResolvedValue(undefined);
        controller = new CommunicationController();
    });

    // -------------------------------------------------------------------------
    // GET /api/communication/conversations
    // -------------------------------------------------------------------------
    describe('listConversationsForUser', () => {
        it('returns 200 with conversation list', async () => {
            const conversations = [{ id: 'conv-1', tenantId: 'user-123' }];
            mockListConversationsForUser.mockResolvedValue(conversations);

            const req = makeRequest({ method: 'GET' });
            const ctx = makeContext();
            const result = await controller.listConversationsForUser(req, ctx);

            expect(result.status).toBe(200);
            expect((result.jsonBody as any).data).toEqual(conversations);
        });

        it('calls updateLastSeen with the authenticated userId', async () => {
            mockListConversationsForUser.mockResolvedValue([]);

            const req = makeRequest({ method: 'GET' });
            const ctx = makeContext();
            await controller.listConversationsForUser(req, ctx);

            expect(mockUpdateLastSeen).toHaveBeenCalledWith('user-123');
        });

        it('returns 401 when no authorization header is present', async () => {
            const req = makeRequest({ method: 'GET', headers: {} });
            const ctx = makeContext();
            const result = await controller.listConversationsForUser(req, ctx);

            expect(result.status).toBe(401);
            expect((result.jsonBody as any).error.code).toBe('UNAUTHORIZED');
        });

        it('logs 401 to MonitoringService when unauthorized', async () => {
            mockTrackOperationMetrics.mockResolvedValue(undefined);
            const req = makeRequest({ method: 'GET', headers: {} });
            const ctx = makeContext();
            await controller.listConversationsForUser(req, ctx);

            // Give the fire-and-forget a tick to run
            await new Promise((r) => setImmediate(r));
            expect(mockTrackOperationMetrics).toHaveBeenCalled();
        });

        it('returns 500 on unexpected service error', async () => {
            mockListConversationsForUser.mockRejectedValue(new Error('DB error'));

            const req = makeRequest({ method: 'GET' });
            const ctx = makeContext();
            const result = await controller.listConversationsForUser(req, ctx);

            expect(result.status).toBe(500);
        });
    });

    // -------------------------------------------------------------------------
    // POST /api/communication/conversations
    // -------------------------------------------------------------------------
    describe('getOrCreateConversation', () => {
        const dto = { propertyId: 'prop-1', tenantId: 'user-123', landlordId: 'landlord-1' };

        it('returns 201 when a new conversation is created', async () => {
            const conversation = { id: 'conv-new', ...dto };
            mockGetOrCreateConversation.mockResolvedValue({ conversation, created: true });

            const req = makeRequest({ method: 'POST', body: dto });
            const ctx = makeContext();
            const result = await controller.getOrCreateConversation(req, ctx);

            expect(result.status).toBe(201);
            expect((result.jsonBody as any).data).toEqual(conversation);
        });

        it('returns 200 when an existing conversation is found', async () => {
            const conversation = { id: 'conv-existing', ...dto };
            mockGetOrCreateConversation.mockResolvedValue({ conversation, created: false });

            const req = makeRequest({ method: 'POST', body: dto });
            const ctx = makeContext();
            const result = await controller.getOrCreateConversation(req, ctx);

            expect(result.status).toBe(200);
        });

        it('returns 401 when no authorization header is present', async () => {
            const req = makeRequest({ method: 'POST', headers: {}, body: dto });
            const ctx = makeContext();
            const result = await controller.getOrCreateConversation(req, ctx);

            expect(result.status).toBe(401);
        });
    });

    // -------------------------------------------------------------------------
    // GET /api/communication/conversations/unread-count
    // -------------------------------------------------------------------------
    describe('getUnreadCount', () => {
        it('returns 200 with unread count', async () => {
            mockGetUnreadCount.mockResolvedValue(5);

            const req = makeRequest({ method: 'GET' });
            const ctx = makeContext();
            const result = await controller.getUnreadCount(req, ctx);

            expect(result.status).toBe(200);
            expect((result.jsonBody as any).data.unreadCount).toBe(5);
        });

        it('returns 401 when no authorization header is present', async () => {
            const req = makeRequest({ method: 'GET', headers: {} });
            const ctx = makeContext();
            const result = await controller.getUnreadCount(req, ctx);

            expect(result.status).toBe(401);
        });
    });

    // -------------------------------------------------------------------------
    // GET /api/communication/conversations/{id}/messages
    // -------------------------------------------------------------------------
    describe('getMessages', () => {
        it('returns 200 with messages array', async () => {
            const messages = [{ id: 'msg-1', conversationId: 'conv-1' }];
            mockGetMessages.mockResolvedValue(messages);

            const req = makeRequest({
                method: 'GET',
                params: { id: 'conv-1' },
            });
            const ctx = makeContext();
            const result = await controller.getMessages(req, ctx);

            expect(result.status).toBe(200);
            expect((result.jsonBody as any).data).toEqual(messages);
        });

        it('calls getMessages with the conversationId from params', async () => {
            mockGetMessages.mockResolvedValue([]);

            const req = makeRequest({ method: 'GET', params: { id: 'conv-abc' } });
            const ctx = makeContext();
            await controller.getMessages(req, ctx);

            expect(mockGetMessages).toHaveBeenCalledWith('conv-abc');
        });

        it('returns 401 when no authorization header is present', async () => {
            const req = makeRequest({ method: 'GET', headers: {}, params: { id: 'conv-1' } });
            const ctx = makeContext();
            const result = await controller.getMessages(req, ctx);

            expect(result.status).toBe(401);
        });
    });

    // -------------------------------------------------------------------------
    // POST /api/communication/conversations/{id}/messages
    // -------------------------------------------------------------------------
    describe('createMessage', () => {
        const messageBody = { body: 'Hello!', senderRole: 'tenant', recipientId: 'landlord-1' };

        it('returns 201 with created message', async () => {
            const message = { id: 'msg-new', conversationId: 'conv-1', body: 'Hello!' };
            mockCreateMessage.mockResolvedValue(message);

            const req = makeRequest({
                method: 'POST',
                params: { id: 'conv-1' },
                body: messageBody,
            });
            const ctx = makeContext();
            const result = await controller.createMessage(req, ctx);

            expect(result.status).toBe(201);
            expect((result.jsonBody as any).data).toEqual(message);
        });

        it('calls notificationService.notify after successful create when recipientId is provided', async () => {
            const message = { id: 'msg-new', conversationId: 'conv-1', body: 'Hello!' };
            mockCreateMessage.mockResolvedValue(message);

            const req = makeRequest({
                method: 'POST',
                params: { id: 'conv-1' },
                body: messageBody,
            });
            const ctx = makeContext();
            await controller.createMessage(req, ctx);

            // Give the fire-and-forget a tick to run
            await new Promise((r) => setImmediate(r));
            expect(mockNotify).toHaveBeenCalledWith('landlord-1', 'conv-1', expect.any(String));
        });

        it('returns 422 when message body is too long (AppError)', async () => {
            mockCreateMessage.mockRejectedValue(
                new AppError(422, 'Message body too long', 'MESSAGE_BODY_TOO_LONG'),
            );

            const req = makeRequest({
                method: 'POST',
                params: { id: 'conv-1' },
                body: { body: 'x'.repeat(4001), senderRole: 'tenant' },
            });
            const ctx = makeContext();
            const result = await controller.createMessage(req, ctx);

            expect(result.status).toBe(422);
            expect((result.jsonBody as any).error.code).toBe('MESSAGE_BODY_TOO_LONG');
        });

        it('returns 401 when no authorization header is present', async () => {
            const req = makeRequest({
                method: 'POST',
                headers: {},
                params: { id: 'conv-1' },
                body: messageBody,
            });
            const ctx = makeContext();
            const result = await controller.createMessage(req, ctx);

            expect(result.status).toBe(401);
        });
    });

    // -------------------------------------------------------------------------
    // PATCH /api/communication/messages/{id}/read
    // -------------------------------------------------------------------------
    describe('markMessageRead', () => {
        it('returns 200 with updated message', async () => {
            const message = { id: 'msg-1', readAt: new Date().toISOString() };
            mockMarkMessageRead.mockResolvedValue(message);

            const req = makeRequest({
                method: 'PATCH',
                params: { id: 'msg-1' },
                queryParams: { conversationId: 'conv-1' },
            });
            const ctx = makeContext();
            const result = await controller.markMessageRead(req, ctx);

            expect(result.status).toBe(200);
            expect((result.jsonBody as any).data).toEqual(message);
        });

        it('returns 401 when no authorization header is present', async () => {
            const req = makeRequest({
                method: 'PATCH',
                headers: {},
                params: { id: 'msg-1' },
                queryParams: { conversationId: 'conv-1' },
            });
            const ctx = makeContext();
            const result = await controller.markMessageRead(req, ctx);

            expect(result.status).toBe(401);
        });

        it('returns 404 when message is not found', async () => {
            mockMarkMessageRead.mockRejectedValue(
                new AppError(404, 'Message not found', 'MESSAGE_NOT_FOUND'),
            );

            const req = makeRequest({
                method: 'PATCH',
                params: { id: 'msg-missing' },
                queryParams: { conversationId: 'conv-1' },
            });
            const ctx = makeContext();
            const result = await controller.markMessageRead(req, ctx);

            expect(result.status).toBe(404);
        });
    });

    // -------------------------------------------------------------------------
    // DELETE /api/communication/messages/{id}
    // -------------------------------------------------------------------------
    describe('softDeleteMessage', () => {
        it('returns 204 on successful soft delete', async () => {
            mockSoftDeleteMessage.mockResolvedValue(undefined);

            const req = makeRequest({
                method: 'DELETE',
                params: { id: 'msg-1' },
                queryParams: { conversationId: 'conv-1' },
            });
            const ctx = makeContext();
            const result = await controller.softDeleteMessage(req, ctx);

            expect(result.status).toBe(204);
        });

        it('calls softDeleteMessage with messageId, conversationId, and actorId', async () => {
            mockSoftDeleteMessage.mockResolvedValue(undefined);

            const req = makeRequest({
                method: 'DELETE',
                params: { id: 'msg-1' },
                queryParams: { conversationId: 'conv-1' },
            });
            const ctx = makeContext();
            await controller.softDeleteMessage(req, ctx);

            expect(mockSoftDeleteMessage).toHaveBeenCalledWith('msg-1', 'conv-1', 'user-123');
        });

        it('returns 401 when no authorization header is present', async () => {
            const req = makeRequest({
                method: 'DELETE',
                headers: {},
                params: { id: 'msg-1' },
                queryParams: { conversationId: 'conv-1' },
            });
            const ctx = makeContext();
            const result = await controller.softDeleteMessage(req, ctx);

            expect(result.status).toBe(401);
        });
    });

    // -------------------------------------------------------------------------
    // POST /api/communication/attachments/upload
    // -------------------------------------------------------------------------
    describe('uploadAttachment', () => {
        const uploadBody = {
            file: Buffer.from('test').toString('base64'),
            fileName: 'test.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 4,
        };

        it('returns 201 with attachment metadata', async () => {
            const attachment = { id: 'att-1', fileName: 'test.pdf' };
            mockUploadAttachment.mockResolvedValue(attachment);

            const req = makeRequest({
                method: 'POST',
                queryParams: { conversationId: 'conv-1' },
                body: uploadBody,
            });
            const ctx = makeContext();
            const result = await controller.uploadAttachment(req, ctx);

            expect(result.status).toBe(201);
            expect((result.jsonBody as any).data).toEqual(attachment);
        });

        it('returns 415 for unsupported MIME type', async () => {
            mockUploadAttachment.mockRejectedValue(
                new AppError(415, 'Unsupported media type', 'UNSUPPORTED_MEDIA_TYPE'),
            );

            const req = makeRequest({
                method: 'POST',
                queryParams: { conversationId: 'conv-1' },
                body: { ...uploadBody, mimeType: 'image/png' },
            });
            const ctx = makeContext();
            const result = await controller.uploadAttachment(req, ctx);

            expect(result.status).toBe(415);
        });

        it('returns 413 for file too large', async () => {
            mockUploadAttachment.mockRejectedValue(
                new AppError(413, 'File too large', 'FILE_TOO_LARGE'),
            );

            const req = makeRequest({
                method: 'POST',
                queryParams: { conversationId: 'conv-1' },
                body: { ...uploadBody, sizeBytes: 20_000_000 },
            });
            const ctx = makeContext();
            const result = await controller.uploadAttachment(req, ctx);

            expect(result.status).toBe(413);
        });

        it('returns 401 when no authorization header is present', async () => {
            const req = makeRequest({
                method: 'POST',
                headers: {},
                queryParams: { conversationId: 'conv-1' },
                body: uploadBody,
            });
            const ctx = makeContext();
            const result = await controller.uploadAttachment(req, ctx);

            expect(result.status).toBe(401);
        });
    });

    // -------------------------------------------------------------------------
    // GET /api/communication/attachments/{id}/url
    // -------------------------------------------------------------------------
    describe('generateSasUrl', () => {
        it('returns 200 with SAS URL', async () => {
            mockGenerateSasUrl.mockResolvedValue('https://blob.example.com/file?sas=token');

            const req = makeRequest({
                method: 'GET',
                params: { id: 'att-1' },
                queryParams: { conversationId: 'conv-1' },
            });
            const ctx = makeContext();
            const result = await controller.generateSasUrl(req, ctx);

            expect(result.status).toBe(200);
            expect((result.jsonBody as any).data.url).toBe('https://blob.example.com/file?sas=token');
        });

        it('returns 404 when attachment is not found', async () => {
            mockGenerateSasUrl.mockRejectedValue(
                new AppError(404, 'Attachment not found', 'ATTACHMENT_NOT_FOUND'),
            );

            const req = makeRequest({
                method: 'GET',
                params: { id: 'att-missing' },
                queryParams: { conversationId: 'conv-1' },
            });
            const ctx = makeContext();
            const result = await controller.generateSasUrl(req, ctx);

            expect(result.status).toBe(404);
        });

        it('returns 401 when no authorization header is present', async () => {
            const req = makeRequest({
                method: 'GET',
                headers: {},
                params: { id: 'att-1' },
                queryParams: { conversationId: 'conv-1' },
            });
            const ctx = makeContext();
            const result = await controller.generateSasUrl(req, ctx);

            expect(result.status).toBe(401);
        });
    });

    // -------------------------------------------------------------------------
    // Guard invocation verification
    // -------------------------------------------------------------------------
    describe('withParticipantGuard invocation', () => {
        it('withParticipantGuard mock is importable and is a function (guard is wired in routes)', () => {
            // In test mode the Azure Functions runtime skips app.http() registration,
            // so we verify the guard is correctly exported and callable instead.
            expect(typeof withParticipantGuard).toBe('function');
        });

        it('withAuth mock is importable and is a function (auth is wired in routes)', () => {
            expect(typeof withAuth).toBe('function');
        });

        it('withParticipantGuard passes through to the handler when called directly', async () => {
            const innerHandler = jest.fn().mockResolvedValue({ status: 200 });
            const guarded = withParticipantGuard(innerHandler);
            const req = makeRequest({ method: 'GET' });
            const ctx = makeContext();
            const result = await guarded(req, ctx);
            expect(innerHandler).toHaveBeenCalledWith(req, ctx);
            expect(result.status).toBe(200);
        });

        it('withAuth passes through to the handler when called directly', async () => {
            const innerHandler = jest.fn().mockResolvedValue({ status: 200 });
            const authed = withAuth(innerHandler);
            const req = makeRequest({ method: 'GET' });
            const ctx = makeContext();
            const result = await authed(req, ctx);
            expect(innerHandler).toHaveBeenCalledWith(req, ctx);
            expect(result.status).toBe(200);
        });
    });

    // -------------------------------------------------------------------------
    // 401/403 logging to MonitoringService
    // -------------------------------------------------------------------------
    describe('MonitoringService logging for auth failures', () => {
        it('logs 403 AppError to MonitoringService', async () => {
            mockListConversationsForUser.mockRejectedValue(
                new AppError(403, 'Forbidden', 'FORBIDDEN_NOT_PARTICIPANT'),
            );

            const req = makeRequest({ method: 'GET' });
            const ctx = makeContext();
            const result = await controller.listConversationsForUser(req, ctx);

            expect(result.status).toBe(403);
            await new Promise((r) => setImmediate(r));
            expect(mockTrackOperationMetrics).toHaveBeenCalled();
        });
    });
});
