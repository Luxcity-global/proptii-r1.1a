/**
 * Property 8: ConversationParticipantGuard rejects non-participants with HTTP 403 — MongoDB version.
 */

const mockParticipantFind = jest.fn();

jest.mock('../../../models/messaging.models', () => ({
    ConversationParticipantModel: { find: mockParticipantFind },
    ConversationModel: { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), findOneAndUpdate: jest.fn() },
    MessageModel: { find: jest.fn(), create: jest.fn(), findOneAndUpdate: jest.fn(), countDocuments: jest.fn() },
    AuditLogModel: { create: jest.fn() },
    MessageAttachmentModel: { findOne: jest.fn(), create: jest.fn() },
    NotificationLogModel: { findOne: jest.fn(), create: jest.fn() },
    UserModel: { findOne: jest.fn(), findOneAndUpdate: jest.fn() },
}));

jest.mock('../../../config/mongodb', () => ({ getMongoConnection: jest.fn().mockResolvedValue({}) }));
jest.mock('jwt-decode', () => ({ jwtDecode: jest.fn() }));

import * as fc from 'fast-check';
import { HttpRequest, InvocationContext } from '@azure/functions';
import { withParticipantGuard } from '../../conversationParticipantGuard';
import { jwtDecode } from 'jwt-decode';

function lean<T>(v: T) { return { lean: () => v }; }

function makeRequest(conversationId: string, userId: string): HttpRequest {
    (jwtDecode as jest.Mock).mockReturnValue({ sub: userId });
    return {
        url: 'http://localhost/api/test', method: 'GET',
        headers: { get: (name: string) => name.toLowerCase() === 'authorization' ? 'Bearer mock.jwt.token' : null },
        params: { conversationId },
        query: { get: (_name: string) => null },
    } as unknown as HttpRequest;
}

function makeContext(): InvocationContext {
    return { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn(), trace: jest.fn() } as unknown as InvocationContext;
}

function makeParticipantsExcluding(conversationId: string, excludedUserId: string) {
    const otherUserId = excludedUserId === 'aaaaaaaa-0000-0000-0000-000000000001'
        ? 'bbbbbbbb-0000-0000-0000-000000000002'
        : 'aaaaaaaa-0000-0000-0000-000000000001';
    return [{ id: 'part-1', conversationId, userId: otherUserId, role: 'tenant', joinedAt: new Date().toISOString() }];
}

describe('Property 8: ConversationParticipantGuard rejects non-participants with HTTP 403', () => {
    let innerHandler: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        innerHandler = jest.fn().mockResolvedValue({ status: 200, jsonBody: { ok: true } });
    });

    it('returns HTTP 403 with FORBIDDEN_NOT_PARTICIPANT for every non-participant (userId, conversationId) pair', async () => {
        await fc.assert(fc.asyncProperty(
            fc.record({ userId: fc.uuid(), conversationId: fc.uuid() }),
            async ({ userId, conversationId }) => {
                jest.clearAllMocks();
                innerHandler.mockResolvedValue({ status: 200, jsonBody: { ok: true } });
                mockParticipantFind.mockReturnValue(lean(makeParticipantsExcluding(conversationId, userId)));

                const response = await withParticipantGuard(innerHandler)(makeRequest(conversationId, userId), makeContext());

                expect(innerHandler).not.toHaveBeenCalled();
                expect(response.status).toBe(403);
                expect((response as any).jsonBody.error.code).toBe('FORBIDDEN_NOT_PARTICIPANT');
            },
        ), { numRuns: 25 });
    });
});
