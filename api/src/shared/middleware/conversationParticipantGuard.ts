import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getMongoConnection } from '../config/mongodb';
import { ConversationParticipantModel } from '../models/messaging.models';
import { ConversationParticipant } from '../types/messaging';

function extractUserIdFromToken(request: HttpRequest): string | null {
    const user = (request as any).user;
    return user?.sub ?? null;
}

function extractConversationId(request: HttpRequest): string | null {
    const params = request.params as Record<string, string>;
    // For routes like conversations/{id}/messages, the route param is 'id'
    // but only use it as conversationId when there's no explicit conversationId query param
    // and the param looks like a conversation ID (not a message ID used in messages/{id}/read)
    const fromParams = params?.['conversationId'] ?? null;
    if (fromParams) return fromParams;
    // Query param takes priority over route {id} to avoid confusing message IDs with conversation IDs
    const fromQuery = request.query.get('conversationId');
    if (fromQuery) return fromQuery;
    // Only fall back to route {id} if the URL path contains 'conversations/'
    const url = request.url ?? '';
    if (url.includes('/conversations/') && params?.['id']) {
        return params['id'];
    }
    return null;
}

/**
 * Higher-order function that wraps a handler with MongoDB-backed participant verification.
 */
export function withParticipantGuard(
    handler: (request: HttpRequest, context: InvocationContext) => Promise<HttpResponseInit>,
): (request: HttpRequest, context: InvocationContext) => Promise<HttpResponseInit> {
    return async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        const conversationId = extractConversationId(request);
        if (!conversationId) {
            return {
                status: 400,
                jsonBody: { error: { message: 'Missing conversationId', code: 'MISSING_CONVERSATION_ID' } },
            };
        }

        const userId = extractUserIdFromToken(request);
        if (!userId) {
            return {
                status: 401,
                jsonBody: { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
            };
        }

        try {
            await getMongoConnection();

            const participants = await ConversationParticipantModel.find({ conversationId }).lean<ConversationParticipant[]>();

            if (!participants || participants.length === 0) {
                return {
                    status: 404,
                    jsonBody: { error: { message: 'Conversation not found', code: 'CONVERSATION_NOT_FOUND' } },
                };
            }

            const isParticipant = participants.some((p) => p.userId === userId);
            if (!isParticipant) {
                return {
                    status: 403,
                    jsonBody: { error: { message: 'Forbidden: you are not a participant of this conversation', code: 'FORBIDDEN_NOT_PARTICIPANT' } },
                };
            }

            return handler(request, context);
        } catch (error) {
            context.error('ConversationParticipantGuard error:', error);
            return {
                status: 500,
                jsonBody: { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
            };
        }
    };
}
