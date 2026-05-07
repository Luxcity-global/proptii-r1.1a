// Feature: proptii-communication, Property 8: ConversationParticipantGuard rejects non-participants with HTTP 403

/**
 * Property 8: ConversationParticipantGuard rejects non-participants with HTTP 403
 *
 * Validates: Requirements 5.3
 *
 * For any (userId, conversationId) pair where the userId is NOT among the
 * conversation's participants, the guard MUST return HTTP 403 with the error
 * code `FORBIDDEN_NOT_PARTICIPANT`.
 */

import * as fc from 'fast-check';
import { HttpRequest, InvocationContext } from '@azure/functions';
import { withParticipantGuard } from '../../conversationParticipantGuard';

// ---------------------------------------------------------------------------
// Mocks — same pattern as the unit test
// ---------------------------------------------------------------------------

jest.mock('@azure/cosmos', () => {
    const mockFetchAll = jest.fn();
    const mockQuery = jest.fn(() => ({ fetchAll: mockFetchAll }));
    const mockContainer = { items: { query: mockQuery } };
    const mockDatabase = { container: jest.fn(() => mockContainer) };
    const MockCosmosClient = jest.fn(() => ({ database: jest.fn(() => mockDatabase) }));

    return {
        CosmosClient: MockCosmosClient,
        __mockFetchAll: mockFetchAll,
    };
});

jest.mock('../../../config/environment', () => ({
    validateEnv: jest.fn(() => ({
        COSMOS_DB_CONNECTION_STRING: 'mock_endpoint',
        COSMOS_DB_KEY: 'mock_key',
        COSMOS_DB_DATABASE_NAME: 'mock_db',
    })),
}));

jest.mock('jwt-decode', () => ({
    jwtDecode: jest.fn(),
}));

import { jwtDecode } from 'jwt-decode';
import * as cosmos from '@azure/cosmos';

const getMockFetchAll = () => (cosmos as any).__mockFetchAll as jest.Mock;

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Builds a minimal mock HttpRequest with the given conversationId in params
 * and a Bearer token whose `sub` claim is set to userId.
 */
function makeRequest(conversationId: string, userId: string): HttpRequest {
    (jwtDecode as jest.Mock).mockReturnValue({ sub: userId });

    return {
        url: `http://localhost/api/test`,
        method: 'GET',
        headers: {
            get: (name: string) =>
                name.toLowerCase() === 'authorization' ? 'Bearer mock.jwt.token' : null,
        },
        params: { conversationId },
        query: {
            get: (_name: string) => null,
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

/**
 * Builds a list of participant records that NEVER includes `excludedUserId`.
 * Uses a fixed set of other UUIDs so the conversation always "exists" (non-empty
 * participants list) but the requesting user is never among them.
 */
function makeParticipantsExcluding(conversationId: string, excludedUserId: string) {
    // Use a deterministic "other" userId that is guaranteed to differ from excludedUserId
    const otherUserId = excludedUserId === 'aaaaaaaa-0000-0000-0000-000000000001'
        ? 'bbbbbbbb-0000-0000-0000-000000000002'
        : 'aaaaaaaa-0000-0000-0000-000000000001';

    return [
        {
            id: 'part-1',
            conversationId,
            userId: otherUserId,
            role: 'tenant',
            joinedAt: new Date().toISOString(),
        },
    ];
}

// ---------------------------------------------------------------------------
// Property test
// ---------------------------------------------------------------------------

describe('Property 8: ConversationParticipantGuard rejects non-participants with HTTP 403', () => {
    let innerHandler: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        innerHandler = jest.fn().mockResolvedValue({ status: 200, jsonBody: { ok: true } });
    });

    it(
        'returns HTTP 403 with FORBIDDEN_NOT_PARTICIPANT for every non-participant (userId, conversationId) pair',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({ userId: fc.uuid(), conversationId: fc.uuid() }),
                    async ({ userId, conversationId }) => {
                        jest.clearAllMocks();
                        innerHandler.mockResolvedValue({ status: 200, jsonBody: { ok: true } });

                        // Cosmos DB returns participants that NEVER include the generated userId
                        getMockFetchAll().mockResolvedValue({
                            resources: makeParticipantsExcluding(conversationId, userId),
                        });

                        const request = makeRequest(conversationId, userId);
                        const context = makeContext();
                        const guardedHandler = withParticipantGuard(innerHandler);

                        const response = await guardedHandler(request, context);

                        // The inner handler must never be called for a non-participant
                        expect(innerHandler).not.toHaveBeenCalled();

                        // Must return HTTP 403
                        expect(response.status).toBe(403);

                        // Must include the FORBIDDEN_NOT_PARTICIPANT error code
                        expect((response as any).jsonBody).toEqual({
                            error: {
                                message: expect.any(String),
                                code: 'FORBIDDEN_NOT_PARTICIPANT',
                            },
                        });
                    },
                ),
                { numRuns: 25 },
            );
        },
    );
});
