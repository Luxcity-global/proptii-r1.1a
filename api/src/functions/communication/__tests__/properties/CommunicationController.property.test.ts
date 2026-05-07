/**
 * Property-based tests for CommunicationController.
 *
 * Feature: proptii-communication, Property 5: Unauthenticated requests to /api/communication return HTTP 401
 *
 * Validates: Requirements 3.6, 6.8, 14.1
 */

// Feature: proptii-communication, Property 5: Unauthenticated requests to /api/communication return HTTP 401

// ---------------------------------------------------------------------------
// Mocks — declared before any imports
// ---------------------------------------------------------------------------

jest.mock('../../../../shared/services/ConversationService', () => ({
    ConversationService: jest.fn().mockImplementation(() => ({
        listConversationsForUser: jest.fn(),
        getOrCreateConversation: jest.fn(),
        getMessages: jest.fn(),
        createMessage: jest.fn(),
        markMessageRead: jest.fn(),
        getUnreadCount: jest.fn(),
        softDeleteMessage: jest.fn(),
    })),
}));

jest.mock('../../../../shared/services/AttachmentService', () => ({
    AttachmentService: jest.fn().mockImplementation(() => ({
        uploadAttachment: jest.fn(),
        generateSasUrl: jest.fn(),
    })),
}));

jest.mock('../../../../shared/services/NotificationService', () => ({
    NotificationService: jest.fn().mockImplementation(() => ({
        notify: jest.fn(),
        updateLastSeen: jest.fn(),
    })),
}));

jest.mock('../../../../shared/services/MonitoringService', () => ({
    MonitoringService: jest.fn().mockImplementation(() => ({
        trackOperationMetrics: jest.fn().mockResolvedValue(undefined),
    })),
}));

// withAuth: pass through (we test the controller's own auth check, not the middleware)
jest.mock('../../../../shared/middleware/auth', () => ({
    withAuth: jest.fn((handler) => handler),
}));

// withParticipantGuard: pass through
jest.mock('../../../../shared/middleware/conversationParticipantGuard', () => ({
    withParticipantGuard: jest.fn((handler) => handler),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
import * as fc from 'fast-check';
import { HttpRequest, InvocationContext } from '@azure/functions';
import { CommunicationController } from '../../index';

// ---------------------------------------------------------------------------
// All endpoints under test
// ---------------------------------------------------------------------------

type EndpointDef = {
    name: string;
    method: (
        controller: CommunicationController,
        request: HttpRequest,
        context: InvocationContext,
    ) => Promise<{ status?: number; jsonBody?: unknown }>;
};

const allEndpoints: EndpointDef[] = [
    {
        name: 'GET /api/communication/conversations',
        method: (c, req, ctx) => c.listConversationsForUser(req, ctx),
    },
    {
        name: 'POST /api/communication/conversations',
        method: (c, req, ctx) => c.getOrCreateConversation(req, ctx),
    },
    {
        name: 'GET /api/communication/conversations/unread-count',
        method: (c, req, ctx) => c.getUnreadCount(req, ctx),
    },
    {
        name: 'GET /api/communication/conversations/{id}/messages',
        method: (c, req, ctx) => c.getMessages(req, ctx),
    },
    {
        name: 'POST /api/communication/conversations/{id}/messages',
        method: (c, req, ctx) => c.createMessage(req, ctx),
    },
    {
        name: 'PATCH /api/communication/messages/{id}/read',
        method: (c, req, ctx) => c.markMessageRead(req, ctx),
    },
    {
        name: 'DELETE /api/communication/messages/{id}',
        method: (c, req, ctx) => c.softDeleteMessage(req, ctx),
    },
    {
        name: 'POST /api/communication/attachments/upload',
        method: (c, req, ctx) => c.uploadAttachment(req, ctx),
    },
    {
        name: 'GET /api/communication/attachments/{id}/url',
        method: (c, req, ctx) => c.generateSasUrl(req, ctx),
    },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a mock HttpRequest with the given Authorization header value (or none).
 */
function makeRequest(authHeaderValue: string | null): HttpRequest {
    return {
        method: 'GET',
        url: 'http://localhost/api/communication/test',
        headers: {
            get: (name: string) => {
                if (name.toLowerCase() === 'authorization') return authHeaderValue;
                return null;
            },
        },
        params: { id: 'test-id' },
        query: {
            get: (_name: string) => null,
        },
        json: jest.fn().mockResolvedValue({}),
        text: jest.fn().mockResolvedValue(''),
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
// Property 5: Unauthenticated requests return HTTP 401
// Validates: Requirements 3.6, 6.8, 14.1
// ---------------------------------------------------------------------------
describe('Property 5: Unauthenticated requests to /api/communication return HTTP 401', () => {
    let controller: CommunicationController;

    beforeEach(() => {
        jest.clearAllMocks();
        controller = new CommunicationController();
    });

    it('returns HTTP 401 for every endpoint when no Bearer token is provided', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom(...allEndpoints),
                async (endpoint) => {
                    // No Authorization header at all
                    const req = makeRequest(null);
                    const ctx = makeContext();

                    const result = await endpoint.method(controller, req, ctx);

                    expect(result.status).toBe(401);
                },
            ),
            { numRuns: 25 },
        );
    });

    it('returns HTTP 401 for every endpoint when an invalid (non-Bearer) token is provided', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom(...allEndpoints),
                // Generate invalid auth header values: not "Bearer <token>" format
                fc.oneof(
                    fc.constant(''),
                    fc.constant('Basic dXNlcjpwYXNz'),
                    fc.constant('Token abc123'),
                    fc.constant('invalid-header'),
                    fc.string({ minLength: 1, maxLength: 50 }).filter(
                        (s) => !s.startsWith('Bearer '),
                    ),
                ),
                async (endpoint, invalidAuthHeader) => {
                    const req = makeRequest(invalidAuthHeader);
                    const ctx = makeContext();

                    const result = await endpoint.method(controller, req, ctx);

                    expect(result.status).toBe(401);
                },
            ),
            { numRuns: 25 },
        );
    });
});
