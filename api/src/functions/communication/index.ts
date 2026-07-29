import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { ConversationService } from '../../shared/services/ConversationService';
import { AttachmentService } from '../../shared/services/AttachmentService';
import { NotificationService } from '../../shared/services/NotificationService';
import { LeadService } from '../../shared/services/LeadService';
import { MonitoringService } from '../../shared/services/MonitoringService';
import { withAuth } from '../../shared/middleware/auth';
import { withParticipantGuard } from '../../shared/middleware/conversationParticipantGuard';
import { AppError } from '../../shared/middleware/error-handling';
import { CreateConversationDto, CreateMessageDto, SenderRole } from '../../shared/types/messaging';

/**
 * Extracts the userId (sub claim) from the verified request context.
 * Returns null if the context is missing.
 */
function extractUserIdFromToken(request: HttpRequest): string | null {
    const user = (request as any).user;
    return user?.sub ?? null;
}

/**
 * Extracts the sender display name from the verified request context.
 */
function extractSenderNameFromToken(request: HttpRequest): string {
    const user = (request as any).user;
    if (!user) return 'Unknown';

    if (user.name) return user.name;
    const parts = [user.given_name, user.family_name].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
    
    return 'Unknown';
}

/**
 * Logs a 401 or 403 response to MonitoringService (fire-and-forget, non-blocking).
 */
function logAuthFailure(
    monitoringService: MonitoringService,
    status: number,
    context: InvocationContext,
    request: HttpRequest,
): void {
    monitoringService
        .trackOperationMetrics({
            successCount: 0,
            errorCount: 1,
            requestDistribution: {
                [`${status}_${request.method}_${request.url}`]: 1,
            },
        })
        .catch((err) => context.error('MonitoringService.trackOperationMetrics failed:', err));
}

export class CommunicationController {
    private conversationService: ConversationService;
    private attachmentService: AttachmentService;
    private notificationService: NotificationService;
    private leadService: LeadService;
    private monitoringService: MonitoringService;

    constructor() {
        this.conversationService = new ConversationService();
        this.attachmentService = new AttachmentService();
        this.notificationService = new NotificationService();
        this.leadService = new LeadService();
        this.monitoringService = new MonitoringService();
    }

    // -------------------------------------------------------------------------
    // GET /api/communication/conversations
    // -------------------------------------------------------------------------
    async listConversationsForUser(
        request: HttpRequest,
        context: InvocationContext,
    ): Promise<HttpResponseInit> {
        try {
            const userId = extractUserIdFromToken(request);
            if (!userId) {
                const resp = { status: 401, jsonBody: { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } } };
                logAuthFailure(this.monitoringService, 401, context, request);
                return resp;
            }

            await this.notificationService.updateLastSeen(userId);

            const conversations = await this.conversationService.listConversationsForUser(userId);
            return { status: 200, jsonBody: { data: conversations } };
        } catch (error) {
            context.error('listConversationsForUser error:', error);
            if (error instanceof AppError) {
                if (error.statusCode === 401 || error.statusCode === 403) {
                    logAuthFailure(this.monitoringService, error.statusCode, context, request);
                }
                return { status: error.statusCode, jsonBody: { error: { message: error.message, code: error.code } } };
            }
            return { status: 500, jsonBody: { error: { message: 'Internal server error' } } };
        }
    }

    // -------------------------------------------------------------------------
    // POST /api/communication/conversations
    // -------------------------------------------------------------------------
    async getOrCreateConversation(
        request: HttpRequest,
        context: InvocationContext,
    ): Promise<HttpResponseInit> {
        try {
            const userId = extractUserIdFromToken(request);
            if (!userId) {
                logAuthFailure(this.monitoringService, 401, context, request);
                return { status: 401, jsonBody: { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } } };
            }

            await this.notificationService.updateLastSeen(userId);

            const body = (await request.json()) as CreateConversationDto;
            
            if (userId !== body.tenantId && userId !== body.landlordId) {
                logAuthFailure(this.monitoringService, 403, context, request);
                return { status: 403, jsonBody: { error: { message: 'You can only create conversations for yourself', code: 'FORBIDDEN' } } };
            }

            const { conversation, created } = await this.conversationService.getOrCreateConversation(body);
            return { status: created ? 201 : 200, jsonBody: { data: conversation } };
        } catch (error) {
            context.error('getOrCreateConversation error:', error);
            if (error instanceof AppError) {
                if (error.statusCode === 401 || error.statusCode === 403) {
                    logAuthFailure(this.monitoringService, error.statusCode, context, request);
                }
                return { status: error.statusCode, jsonBody: { error: { message: error.message, code: error.code } } };
            }
            return { status: 500, jsonBody: { error: { message: 'Internal server error' } } };
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/communication/conversations/unread-count
    // -------------------------------------------------------------------------
    async getUnreadCount(
        request: HttpRequest,
        context: InvocationContext,
    ): Promise<HttpResponseInit> {
        try {
            const userId = extractUserIdFromToken(request);
            if (!userId) {
                logAuthFailure(this.monitoringService, 401, context, request);
                return { status: 401, jsonBody: { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } } };
            }

            await this.notificationService.updateLastSeen(userId);

            const count = await this.conversationService.getUnreadCount(userId);
            return { status: 200, jsonBody: { data: { unreadCount: count } } };
        } catch (error) {
            context.error('getUnreadCount error:', error);
            if (error instanceof AppError) {
                if (error.statusCode === 401 || error.statusCode === 403) {
                    logAuthFailure(this.monitoringService, error.statusCode, context, request);
                }
                return { status: error.statusCode, jsonBody: { error: { message: error.message, code: error.code } } };
            }
            return { status: 500, jsonBody: { error: { message: 'Internal server error' } } };
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/communication/conversations/{id}/messages
    // -------------------------------------------------------------------------
    async getMessages(
        request: HttpRequest,
        context: InvocationContext,
    ): Promise<HttpResponseInit> {
        try {
            const userId = extractUserIdFromToken(request);
            if (!userId) {
                logAuthFailure(this.monitoringService, 401, context, request);
                return { status: 401, jsonBody: { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } } };
            }

            await this.notificationService.updateLastSeen(userId);

            const conversationId = request.params['id'];
            const messages = await this.conversationService.getMessages(conversationId);
            return { status: 200, jsonBody: { data: messages } };
        } catch (error) {
            context.error('getMessages error:', error);
            if (error instanceof AppError) {
                if (error.statusCode === 401 || error.statusCode === 403) {
                    logAuthFailure(this.monitoringService, error.statusCode, context, request);
                }
                return { status: error.statusCode, jsonBody: { error: { message: error.message, code: error.code } } };
            }
            return { status: 500, jsonBody: { error: { message: 'Internal server error' } } };
        }
    }

    // -------------------------------------------------------------------------
    // POST /api/communication/conversations/{id}/messages
    // -------------------------------------------------------------------------
    async createMessage(
        request: HttpRequest,
        context: InvocationContext,
    ): Promise<HttpResponseInit> {
        try {
            const userId = extractUserIdFromToken(request);
            if (!userId) {
                logAuthFailure(this.monitoringService, 401, context, request);
                return { status: 401, jsonBody: { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } } };
            }

            await this.notificationService.updateLastSeen(userId);

            const conversationId = request.params['id'];
            const body = (await request.json()) as CreateMessageDto & { senderRole?: SenderRole; recipientId?: string; agentEmail?: string; propertyTitle?: string; };
            
            const conversation = await this.conversationService.getConversationById(conversationId);
            if (!conversation) {
                return { status: 404, jsonBody: { error: { message: 'Conversation not found', code: 'NOT_FOUND' } } };
            }

            let senderRole: SenderRole = 'tenant';
            if (userId === conversation.landlordId) {
                senderRole = 'landlord';
            } else if (userId === conversation.tenantId) {
                senderRole = 'tenant';
            } else {
                logAuthFailure(this.monitoringService, 403, context, request);
                return { status: 403, jsonBody: { error: { message: 'You are not a participant in this conversation', code: 'FORBIDDEN' } } };
            }

            const dto: CreateMessageDto = { body: body.body, attachmentIds: body.attachmentIds };

            const message = await this.conversationService.createMessage(
                conversationId,
                dto,
                userId,
                senderRole,
            );

            // Notify the other participant after successful create
            if (body.recipientId) {
                const senderName = extractSenderNameFromToken(request);
                if (body.recipientId === 'UNCLAIMED' && body.agentEmail && body.propertyTitle) {
                    this.leadService
                        .sendLeadEmail(body.agentEmail, senderName, body.propertyTitle, dto.body, conversation.propertyId)
                        .catch((err) => context.error('LeadService.sendLeadEmail failed:', err));
                } else if (body.recipientId !== 'UNCLAIMED') {
                    this.notificationService
                        .notify(body.recipientId, conversationId, senderName)
                        .catch((err) => context.error('NotificationService.notify failed:', err));
                }
            }

            return { status: 201, jsonBody: { data: message } };
        } catch (error) {
            context.error('createMessage error:', error);
            if (error instanceof AppError) {
                if (error.statusCode === 401 || error.statusCode === 403) {
                    logAuthFailure(this.monitoringService, error.statusCode, context, request);
                }
                return { status: error.statusCode, jsonBody: { error: { message: error.message, code: error.code } } };
            }
            return { status: 500, jsonBody: { error: { message: 'Internal server error' } } };
        }
    }

    // -------------------------------------------------------------------------
    // PATCH /api/communication/messages/{id}/read
    // -------------------------------------------------------------------------
    async markMessageRead(
        request: HttpRequest,
        context: InvocationContext,
    ): Promise<HttpResponseInit> {
        try {
            const userId = extractUserIdFromToken(request);
            if (!userId) {
                logAuthFailure(this.monitoringService, 401, context, request);
                return { status: 401, jsonBody: { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } } };
            }

            await this.notificationService.updateLastSeen(userId);

            const messageId = request.params['id'];
            const conversationId = request.query.get('conversationId') ?? '';
            const message = await this.conversationService.markMessageRead(messageId, conversationId);
            return { status: 200, jsonBody: { data: message } };
        } catch (error) {
            context.error('markMessageRead error:', error);
            if (error instanceof AppError) {
                if (error.statusCode === 401 || error.statusCode === 403) {
                    logAuthFailure(this.monitoringService, error.statusCode, context, request);
                }
                return { status: error.statusCode, jsonBody: { error: { message: error.message, code: error.code } } };
            }
            return { status: 500, jsonBody: { error: { message: 'Internal server error' } } };
        }
    }

    // -------------------------------------------------------------------------
    // DELETE /api/communication/messages/{id}
    // -------------------------------------------------------------------------
    async softDeleteMessage(
        request: HttpRequest,
        context: InvocationContext,
    ): Promise<HttpResponseInit> {
        try {
            const userId = extractUserIdFromToken(request);
            if (!userId) {
                logAuthFailure(this.monitoringService, 401, context, request);
                return { status: 401, jsonBody: { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } } };
            }

            await this.notificationService.updateLastSeen(userId);

            const messageId = request.params['id'];
            const conversationId = request.query.get('conversationId') ?? '';
            await this.conversationService.softDeleteMessage(messageId, conversationId, userId);
            return { status: 204 };
        } catch (error) {
            context.error('softDeleteMessage error:', error);
            if (error instanceof AppError) {
                if (error.statusCode === 401 || error.statusCode === 403) {
                    logAuthFailure(this.monitoringService, error.statusCode, context, request);
                }
                return { status: error.statusCode, jsonBody: { error: { message: error.message, code: error.code } } };
            }
            return { status: 500, jsonBody: { error: { message: 'Internal server error' } } };
        }
    }

    // -------------------------------------------------------------------------
    // POST /api/communication/attachments/upload
    // -------------------------------------------------------------------------
    async uploadAttachment(
        request: HttpRequest,
        context: InvocationContext,
    ): Promise<HttpResponseInit> {
        try {
            const userId = extractUserIdFromToken(request);
            if (!userId) {
                logAuthFailure(this.monitoringService, 401, context, request);
                return { status: 401, jsonBody: { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } } };
            }

            await this.notificationService.updateLastSeen(userId);

            const conversationId = request.query.get('conversationId') ?? '';

            // Parse multipart body — read raw buffer and extract fields from JSON body
            // For simplicity, we accept a JSON body with base64-encoded file content
            const body = (await request.json()) as {
                file: string; // base64-encoded file content
                fileName: string;
                mimeType: string;
                sizeBytes: number;
            };

            const fileBuffer = Buffer.from(body.file, 'base64');
            const attachment = await this.attachmentService.uploadAttachment(
                fileBuffer,
                body.fileName,
                body.mimeType,
                body.sizeBytes,
                userId,
                conversationId,
            );

            return { status: 201, jsonBody: { data: attachment } };
        } catch (error) {
            context.error('uploadAttachment error:', error);
            if (error instanceof AppError) {
                if (error.statusCode === 401 || error.statusCode === 403) {
                    logAuthFailure(this.monitoringService, error.statusCode, context, request);
                }
                return { status: error.statusCode, jsonBody: { error: { message: error.message, code: error.code } } };
            }
            const detail = error instanceof Error ? error.message : String(error);
            return {
                status: 500,
                jsonBody: {
                    error: {
                        message: process.env.NODE_ENV === 'development' ? detail : 'Internal server error',
                        code: 'INTERNAL_ERROR',
                    },
                },
            };
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/communication/attachments/{id}/url
    // -------------------------------------------------------------------------
    async generateSasUrl(
        request: HttpRequest,
        context: InvocationContext,
    ): Promise<HttpResponseInit> {
        try {
            const userId = extractUserIdFromToken(request);
            if (!userId) {
                logAuthFailure(this.monitoringService, 401, context, request);
                return { status: 401, jsonBody: { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } } };
            }

            await this.notificationService.updateLastSeen(userId);

            const attachmentId = request.params['id'];
            const conversationId = request.query.get('conversationId') ?? '';
            const url = await this.attachmentService.generateSasUrl(attachmentId, conversationId);
            return { status: 200, jsonBody: { data: { url } } };
        } catch (error) {
            context.error('generateSasUrl error:', error);
            if (error instanceof AppError) {
                if (error.statusCode === 401 || error.statusCode === 403) {
                    logAuthFailure(this.monitoringService, error.statusCode, context, request);
                }
                return { status: error.statusCode, jsonBody: { error: { message: error.message, code: error.code } } };
            }
            return { status: 500, jsonBody: { error: { message: 'Internal server error' } } };
        }
    }
}

// ---------------------------------------------------------------------------
// Instantiate controller
// ---------------------------------------------------------------------------
const controller = new CommunicationController();

// ---------------------------------------------------------------------------
// Route: GET /api/communication/conversations
// ---------------------------------------------------------------------------
app.http('communication-list-conversations', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'communication/conversations',
    handler: withAuth(
        async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> =>
            controller.listConversationsForUser(request, context),
    ),
});

// ---------------------------------------------------------------------------
// Route: POST /api/communication/conversations
// ---------------------------------------------------------------------------
app.http('communication-get-or-create-conversation', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'communication/conversations',
    handler: withAuth(
        async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> =>
            controller.getOrCreateConversation(request, context),
    ),
});

// ---------------------------------------------------------------------------
// Route: GET /api/communication/conversations/unread-count
// ---------------------------------------------------------------------------
app.http('communication-unread-count', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'communication/conversations/unread-count',
    handler: withAuth(
        async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> =>
            controller.getUnreadCount(request, context),
    ),
});

// ---------------------------------------------------------------------------
// Route: GET /api/communication/conversations/{id}/messages
// ---------------------------------------------------------------------------
app.http('communication-get-messages', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'communication/conversations/{id}/messages',
    handler: withAuth(
        withParticipantGuard(
            async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> =>
                controller.getMessages(request, context),
        ),
    ),
});

// ---------------------------------------------------------------------------
// Route: POST /api/communication/conversations/{id}/messages
// ---------------------------------------------------------------------------
app.http('communication-create-message', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'communication/conversations/{id}/messages',
    handler: withAuth(
        withParticipantGuard(
            async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> =>
                controller.createMessage(request, context),
        ),
    ),
});

// ---------------------------------------------------------------------------
// Route: PATCH /api/communication/messages/{id}/read
// ---------------------------------------------------------------------------
app.http('communication-mark-read', {
    methods: ['PATCH'],
    authLevel: 'anonymous',
    route: 'communication/messages/{id}/read',
    handler: withAuth(
        withParticipantGuard(
            async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> =>
                controller.markMessageRead(request, context),
        ),
    ),
});

// ---------------------------------------------------------------------------
// Route: DELETE /api/communication/messages/{id}
// ---------------------------------------------------------------------------
app.http('communication-delete-message', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'communication/messages/{id}',
    handler: withAuth(
        withParticipantGuard(
            async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> =>
                controller.softDeleteMessage(request, context),
        ),
    ),
});

// ---------------------------------------------------------------------------
// Route: POST /api/communication/attachments/upload
// ---------------------------------------------------------------------------
app.http('communication-upload-attachment', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'communication/attachments/upload',
    handler: withAuth(
        withParticipantGuard(
            async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> =>
                controller.uploadAttachment(request, context),
        ),
    ),
});

// ---------------------------------------------------------------------------
// Route: GET /api/communication/attachments/{id}/url
// ---------------------------------------------------------------------------
app.http('communication-get-attachment-url', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'communication/attachments/{id}/url',
    handler: withAuth(
        withParticipantGuard(
            async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> =>
                controller.generateSasUrl(request, context),
        ),
    ),
});
