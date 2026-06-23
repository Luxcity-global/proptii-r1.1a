import { HttpRequest, InvocationContext } from '@azure/functions';
import { withParticipantGuard } from '../conversationParticipantGuard';

jest.mock('../../models/messaging.models', () => ({
    ConversationParticipantModel: { find: jest.fn() },
    ConversationModel: { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), findOneAndUpdate: jest.fn() },
    MessageModel: { find: jest.fn(), create: jest.fn(), findOneAndUpdate: jest.fn(), countDocuments: jest.fn() },
    AuditLogModel: { create: jest.fn() },
    MessageAttachmentModel: { findOne: jest.fn(), create: jest.fn() },
    NotificationLogModel: { findOne: jest.fn(), create: jest.fn() },
    UserModel: { findOne: jest.fn(), findOneAndUpdate: jest.fn() },
}));

jest.mock('../../config/mongodb', () => ({
    getMongoConnection: jest.fn().mockResolvedValue({}),
}));

jest.mock('jwt-decode', () => ({ jwtDecode: jest.fn() }));

import { jwtDecode } from 'jwt-decode';
import { ConversationParticipantModel } from '../../models/messaging.models';

// Typed reference to the mock
const mockParticipantFind = ConversationParticipantModel.find as jest.Mock;

function lean<T>(value: T) { return { lean: () => value }; }

function makeRequest(options: {
    conversationId?: string;
    useQueryParam?: boolean;
    bearerToken?: string | null;
}): HttpRequest {
    const { conversationId, useQueryParam = false, bearerToken = 'Bearer valid.jwt.token' } = options;
    const headers: Record<string, string> = {};
    if (bearerToken !== null) headers['authorization'] = bearerToken;
    const params: Record<string, string> = {};
    if (conversationId && !useQueryParam) params['conversationId'] = conversationId;

    return {
        url: 'http://localhost/api/test',
        method: 'GET',
        headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
        params,
        query: { get: (name: string) => (useQueryParam && name === 'conversationId' && conversationId) ? conversationId : null },
    } as unknown as HttpRequest;
}

function makeContext(): InvocationContext {
    return { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn(), trace: jest.fn() } as unknown as InvocationContext;
}

const CONVERSATION_ID = 'conv-123';
const PARTICIPANT_USER_ID = 'user-abc';
const NON_PARTICIPANT_USER_ID = 'user-xyz';

describe('withParticipantGuard', () => {
    let innerHandler: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        innerHandler = jest.fn().mockResolvedValue({ status: 200, jsonBody: { ok: true } });
        (jwtDecode as jest.Mock).mockReturnValue({ sub: PARTICIPANT_USER_ID });
    });

    describe('when the user is a participant', () => {
        beforeEach(() => {
            mockParticipantFind.mockReturnValue(lean([{
                id: 'part-1', conversationId: CONVERSATION_ID,
                userId: PARTICIPANT_USER_ID, role: 'tenant', joinedAt: new Date().toISOString(),
            }]));
        });

        it('calls the inner handler and returns its response (conversationId from params)', async () => {
            const response = await withParticipantGuard(innerHandler)(makeRequest({ conversationId: CONVERSATION_ID }), makeContext());
            expect(innerHandler).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
        });

        it('calls the inner handler when conversationId is in the query string', async () => {
            const response = await withParticipantGuard(innerHandler)(makeRequest({ conversationId: CONVERSATION_ID, useQueryParam: true }), makeContext());
            expect(innerHandler).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
        });
    });

    describe('when the user is NOT a participant', () => {
        beforeEach(() => {
            (jwtDecode as jest.Mock).mockReturnValue({ sub: NON_PARTICIPANT_USER_ID });
            mockParticipantFind.mockReturnValue(lean([{
                id: 'part-1', conversationId: CONVERSATION_ID,
                userId: PARTICIPANT_USER_ID, role: 'tenant', joinedAt: new Date().toISOString(),
            }]));
        });

        it('returns HTTP 403 with FORBIDDEN_NOT_PARTICIPANT', async () => {
            const response = await withParticipantGuard(innerHandler)(makeRequest({ conversationId: CONVERSATION_ID }), makeContext());
            expect(innerHandler).not.toHaveBeenCalled();
            expect(response.status).toBe(403);
            expect((response as any).jsonBody.error.code).toBe('FORBIDDEN_NOT_PARTICIPANT');
        });
    });

    describe('when the conversation does not exist', () => {
        beforeEach(() => {
            mockParticipantFind.mockReturnValue(lean([]));
        });

        it('returns HTTP 404 with CONVERSATION_NOT_FOUND', async () => {
            const response = await withParticipantGuard(innerHandler)(makeRequest({ conversationId: CONVERSATION_ID }), makeContext());
            expect(response.status).toBe(404);
            expect((response as any).jsonBody.error.code).toBe('CONVERSATION_NOT_FOUND');
        });

        it('also returns HTTP 404 when resources is null/undefined', async () => {
            mockParticipantFind.mockReturnValue(lean(null));
            const response = await withParticipantGuard(innerHandler)(makeRequest({ conversationId: CONVERSATION_ID }), makeContext());
            expect(response.status).toBe(404);
        });
    });

    describe('edge cases', () => {
        it('returns HTTP 400 when conversationId is missing', async () => {
            const response = await withParticipantGuard(innerHandler)(makeRequest({ bearerToken: 'Bearer valid.jwt.token' }), makeContext());
            expect(response.status).toBe(400);
            expect((response as any).jsonBody.error.code).toBe('MISSING_CONVERSATION_ID');
        });

        it('returns HTTP 401 when the Authorization header is missing', async () => {
            const response = await withParticipantGuard(innerHandler)(makeRequest({ conversationId: CONVERSATION_ID, bearerToken: null }), makeContext());
            expect(response.status).toBe(401);
        });

        it('returns HTTP 401 when the token has no sub claim', async () => {
            (jwtDecode as jest.Mock).mockReturnValue({ sub: undefined });
            const response = await withParticipantGuard(innerHandler)(makeRequest({ conversationId: CONVERSATION_ID }), makeContext());
            expect(response.status).toBe(401);
        });
    });
});
