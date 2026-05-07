import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { CosmosClient } from '@azure/cosmos';
import { jwtDecode } from 'jwt-decode';
import { validateEnv } from '../config/environment';
import { ConversationParticipant } from '../types/messaging';

interface JwtPayload {
    sub?: string;
    [key: string]: any;
}

/**
 * Extracts the userId (sub claim) from the Bearer token in the Authorization header.
 * Returns null if the header is missing or malformed.
 */
function extractUserIdFromToken(request: HttpRequest): string | null {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) return null;

    try {
        const decoded = jwtDecode<JwtPayload>(token);
        return decoded.sub ?? null;
    } catch {
        return null;
    }
}

/**
 * Extracts the conversationId from request.params first, then falls back to
 * request.query.get('conversationId').
 */
function extractConversationId(request: HttpRequest): string | null {
    // params is a plain object on Azure Functions v4 HttpRequest
    const fromParams = (request.params as Record<string, string>)?.['conversationId'];
    if (fromParams) return fromParams;

    return request.query.get('conversationId') ?? null;
}

/**
 * Higher-order function that wraps a handler with participant verification.
 *
 * - Extracts `conversationId` from path params or query string.
 * - Extracts `userId` from the Bearer token's `sub` claim.
 * - Queries the `conversation_participants` Cosmos DB container.
 * - Returns HTTP 404 (`CONVERSATION_NOT_FOUND`) if no participants exist for the conversation.
 * - Returns HTTP 403 (`FORBIDDEN_NOT_PARTICIPANT`) if the userId is not among them.
 * - Calls the original handler if the user is a verified participant.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
export function withParticipantGuard(
    handler: (request: HttpRequest, context: InvocationContext) => Promise<HttpResponseInit>,
): (request: HttpRequest, context: InvocationContext) => Promise<HttpResponseInit> {
    return async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        const conversationId = extractConversationId(request);
        if (!conversationId) {
            return {
                status: 400,
                jsonBody: {
                    error: {
                        message: 'Missing conversationId',
                        code: 'MISSING_CONVERSATION_ID',
                    },
                },
            };
        }

        const userId = extractUserIdFromToken(request);
        if (!userId) {
            return {
                status: 401,
                jsonBody: {
                    error: {
                        message: 'Unauthorized',
                        code: 'UNAUTHORIZED',
                    },
                },
            };
        }

        try {
            const config = validateEnv();
            const client = new CosmosClient({
                endpoint: config.COSMOS_DB_CONNECTION_STRING,
                key: config.COSMOS_DB_KEY,
            });

            const container = client
                .database(config.COSMOS_DB_DATABASE_NAME)
                .container('conversation_participants');

            // Query all participants for this conversation
            const { resources: participants } = await container.items
                .query<ConversationParticipant>({
                    query: 'SELECT * FROM c WHERE c.conversationId = @conversationId',
                    parameters: [{ name: '@conversationId', value: conversationId }],
                })
                .fetchAll();

            // No participants found — conversation does not exist
            if (!participants || participants.length === 0) {
                return {
                    status: 404,
                    jsonBody: {
                        error: {
                            message: 'Conversation not found',
                            code: 'CONVERSATION_NOT_FOUND',
                        },
                    },
                };
            }

            // Check if the authenticated user is among the participants
            const isParticipant = participants.some((p) => p.userId === userId);
            if (!isParticipant) {
                return {
                    status: 403,
                    jsonBody: {
                        error: {
                            message: 'Forbidden: you are not a participant of this conversation',
                            code: 'FORBIDDEN_NOT_PARTICIPANT',
                        },
                    },
                };
            }

            // User is a verified participant — proceed to the original handler
            return handler(request, context);
        } catch (error) {
            context.error('ConversationParticipantGuard error:', error);
            return {
                status: 500,
                jsonBody: {
                    error: {
                        message: 'Internal server error',
                        code: 'INTERNAL_ERROR',
                    },
                },
            };
        }
    };
}
