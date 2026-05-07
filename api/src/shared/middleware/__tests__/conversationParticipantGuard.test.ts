import { HttpRequest, InvocationContext } from '@azure/functions';
import { withParticipantGuard } from '../conversationParticipantGuard';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock the @azure/cosmos module so we can control what the DB returns
jest.mock('@azure/cosmos', () => {
    const mockFetchAll = jest.fn();
    const mockQuery = jest.fn(() => ({ fetchAll: mockFetchAll }));
    const mockContainer = { items: { query: mockQuery } };
    const mockDatabase = { container: jest.fn(() => mockContainer) };
    const MockCosmosClient = jest.fn(() => ({ database: jest.fn(() => mockDatabase) }));

    return {
        CosmosClient: MockCosmosClient,
        __mockFetchAll: mockFetchAll,
        __mockQuery: mockQuery,
    };
});

// Mock environment validation
jest.mock('../../config/environment', () => ({
    validateEnv: jest.fn(() => ({
        COSMOS_DB_CONNECTION_STRING: 'mock_endpoint',
        COSMOS_DB_KEY: 'mock_key',
        COSMOS_DB_DATABASE_NAME: 'mock_db',
    })),
}));

// Mock jwt-decode so we can control the sub claim
jest.mock('jwt-decode', () => ({
    jwtDecode: jest.fn(),
}));

import { jwtDecode } from 'jwt-decode';
import * as cosmos from '@azure/cosmos';

// Helpers to access the internal mocks
const getMockFetchAll = () => (cosmos as any).__mockFetchAll as jest.Mock;

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeRequest(options: {
    conversationId?: string;
    useQueryParam?: boolean;
    bearerToken?: string | null;
}): HttpRequest {
    const { conversationId, useQueryParam = false, bearerToken = 'Bearer valid.jwt.token' } = options;

    const url = conversationId && useQueryParam
        ? `http://localhost/api/test?conversationId=${conversationId}`
        : 'http://localhost/api/test';

    const headers: Record<string, string> = {};
    if (bearerToken !== null) {
        headers['authorization'] = bearerToken;
    }

    const params: Record<string, string> = {};
    if (conversationId && !useQueryParam) {
        params['conversationId'] = conversationId;
    }

    return {
        url,
        method: 'GET',
        headers: {
            get: (name: string) => headers[name.toLowerCase()] ?? null,
        },
        params,
        query: {
            get: (name: string) => {
                if (useQueryParam && name === 'conversationId' && conversationId) {
                    return conversationId;
                }
                return null;
            },
        },
    } as unknown as HttpRequest;
}

function makeContext(): InvocationContext {
    return {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        trace: jest.fn(),
    } as unknown as InvocationContext;
}

const CONVERSATION_ID = 'conv-123';
const PARTICIPANT_USER_ID = 'user-abc';
const NON_PARTICIPANT_USER_ID = 'user-xyz';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('withParticipantGuard', () => {
    let innerHandler: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        innerHandler = jest.fn().mockResolvedValue({ status: 200, jsonBody: { ok: true } });

        // Default: jwtDecode returns the participant user
        (jwtDecode as jest.Mock).mockReturnValue({ sub: PARTICIPANT_USER_ID });
    });

    // -----------------------------------------------------------------------
    // Scenario 1: Participant is allowed through
    // -----------------------------------------------------------------------
    describe('when the user is a participant', () => {
        beforeEach(() => {
            getMockFetchAll().mockResolvedValue({
                resources: [
                    {
                        id: 'part-1',
                        conversationId: CONVERSATION_ID,
                        userId: PARTICIPANT_USER_ID,
                        role: 'tenant',
                        joinedAt: new Date().toISOString(),
                    },
                ],
            });
        });

        it('calls the inner handler and returns its response (conversationId from params)', async () => {
            const request = makeRequest({ conversationId: CONVERSATION_ID });
            const context = makeContext();
            const guardedHandler = withParticipantGuard(innerHandler);

            const response = await guardedHandler(request, context);

            expect(innerHandler).toHaveBeenCalledTimes(1);
            expect(innerHandler).toHaveBeenCalledWith(request, context);
            expect(response.status).toBe(200);
            expect((response as any).jsonBody).toEqual({ ok: true });
        });

        it('calls the inner handler when conversationId is in the query string', async () => {
            const request = makeRequest({ conversationId: CONVERSATION_ID, useQueryParam: true });
            const context = makeContext();
            const guardedHandler = withParticipantGuard(innerHandler);

            const response = await guardedHandler(request, context);

            expect(innerHandler).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
        });
    });

    // -----------------------------------------------------------------------
    // Scenario 2: Non-participant is rejected with HTTP 403
    // -----------------------------------------------------------------------
    describe('when the user is NOT a participant', () => {
        beforeEach(() => {
            // The conversation exists but the requesting user is not in it
            (jwtDecode as jest.Mock).mockReturnValue({ sub: NON_PARTICIPANT_USER_ID });

            getMockFetchAll().mockResolvedValue({
                resources: [
                    {
                        id: 'part-1',
                        conversationId: CONVERSATION_ID,
                        userId: PARTICIPANT_USER_ID, // a different user
                        role: 'tenant',
                        joinedAt: new Date().toISOString(),
                    },
                ],
            });
        });

        it('returns HTTP 403 with FORBIDDEN_NOT_PARTICIPANT', async () => {
            const request = makeRequest({ conversationId: CONVERSATION_ID });
            const context = makeContext();
            const guardedHandler = withParticipantGuard(innerHandler);

            const response = await guardedHandler(request, context);

            expect(innerHandler).not.toHaveBeenCalled();
            expect(response.status).toBe(403);
            expect((response as any).jsonBody).toEqual({
                error: {
                    message: expect.any(String),
                    code: 'FORBIDDEN_NOT_PARTICIPANT',
                },
            });
        });
    });

    // -----------------------------------------------------------------------
    // Scenario 3: Conversation does not exist — returns HTTP 404
    // -----------------------------------------------------------------------
    describe('when the conversation does not exist', () => {
        beforeEach(() => {
            // No participants found for this conversationId
            getMockFetchAll().mockResolvedValue({ resources: [] });
        });

        it('returns HTTP 404 with CONVERSATION_NOT_FOUND', async () => {
            const request = makeRequest({ conversationId: CONVERSATION_ID });
            const context = makeContext();
            const guardedHandler = withParticipantGuard(innerHandler);

            const response = await guardedHandler(request, context);

            expect(innerHandler).not.toHaveBeenCalled();
            expect(response.status).toBe(404);
            expect((response as any).jsonBody).toEqual({
                error: {
                    message: expect.any(String),
                    code: 'CONVERSATION_NOT_FOUND',
                },
            });
        });

        it('also returns HTTP 404 when resources is null/undefined', async () => {
            getMockFetchAll().mockResolvedValue({ resources: null });

            const request = makeRequest({ conversationId: CONVERSATION_ID });
            const context = makeContext();
            const guardedHandler = withParticipantGuard(innerHandler);

            const response = await guardedHandler(request, context);

            expect(response.status).toBe(404);
            expect((response as any).jsonBody.error.code).toBe('CONVERSATION_NOT_FOUND');
        });
    });

    // -----------------------------------------------------------------------
    // Edge cases
    // -----------------------------------------------------------------------
    describe('edge cases', () => {
        it('returns HTTP 400 when conversationId is missing from both params and query', async () => {
            const request = makeRequest({ bearerToken: 'Bearer valid.jwt.token' });
            const context = makeContext();
            const guardedHandler = withParticipantGuard(innerHandler);

            const response = await guardedHandler(request, context);

            expect(innerHandler).not.toHaveBeenCalled();
            expect(response.status).toBe(400);
            expect((response as any).jsonBody.error.code).toBe('MISSING_CONVERSATION_ID');
        });

        it('returns HTTP 401 when the Authorization header is missing', async () => {
            const request = makeRequest({ conversationId: CONVERSATION_ID, bearerToken: null });
            const context = makeContext();
            const guardedHandler = withParticipantGuard(innerHandler);

            const response = await guardedHandler(request, context);

            expect(innerHandler).not.toHaveBeenCalled();
            expect(response.status).toBe(401);
        });

        it('returns HTTP 401 when the token has no sub claim', async () => {
            (jwtDecode as jest.Mock).mockReturnValue({ sub: undefined });

            const request = makeRequest({ conversationId: CONVERSATION_ID });
            const context = makeContext();
            const guardedHandler = withParticipantGuard(innerHandler);

            const response = await guardedHandler(request, context);

            expect(innerHandler).not.toHaveBeenCalled();
            expect(response.status).toBe(401);
        });
    });
});
