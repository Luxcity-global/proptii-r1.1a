import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { jwtDecode } from 'jwt-decode';
import { GhostAccountService } from '../../shared/services/GhostAccountService';
import { EnquiryThreadService } from '../../shared/services/EnquiryThreadService';
import { EmailRelayService } from '../../shared/services/EmailRelayService';
import { AppError } from '../../shared/middleware/error-handling';
import { QuickRequestCategory } from '../../shared/models/enquiry-thread.model';
import { SourcePlatform } from '../../shared/models/ghost-account.model';
import { UserModel } from '../../shared/models/messaging.models';
import { withAuth } from '../../shared/middleware/auth';

const json = (body: unknown, status = 200): HttpResponseInit => ({
    status,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL ?? 'https://proptii.co',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    },
    body: JSON.stringify(body),
});

function handleError(error: unknown, context: InvocationContext): HttpResponseInit {
    context.error('guest-enquiry error:', error);
    if (error instanceof AppError) {
        return json({ error: { message: error.message, code: error.code } }, error.statusCode);
    }
    return json({ error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } }, 500);
}

interface JwtPayload {
    sub?: string;
    [key: string]: any;
}

function extractUserIdFromToken(request: HttpRequest): string | null {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) return null;

    if (process.env.NODE_ENV === 'development' && token.startsWith('mock-token-')) {
        return token.replace('mock-token-', '');
    }

    try {
        const decoded = jwtDecode<JwtPayload>(token);
        return decoded.sub ?? null;
    } catch {
        return null;
    }
}

const VALID_CATEGORIES: QuickRequestCategory[] = [
    'Book Viewing', 'Property Price', 'Availability',
    'Mortgage Info', 'Neighbourhood Info', 'Other',
];

function sanitiseCategories(raw: unknown): QuickRequestCategory[] {
    if (!Array.isArray(raw)) return [];
    return raw.filter((c): c is QuickRequestCategory => VALID_CATEGORIES.includes(c as any));
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------
export class GuestEnquiryController {
    private ghostAccountService = new GhostAccountService();
    private enquiryThreadService = new EnquiryThreadService();
    private emailRelayService = new EmailRelayService();

    // POST /api/guest/enquiry
    async submitEnquiry(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
        try {
            const body = await request.json() as {
                email?: string; name?: string; message?: string; categories?: unknown;
                listingId?: string; listingTitle?: string; listingSource?: string;
                landlordId?: string; agentEmail?: string; agentName?: string;
                sourcePlatform?: string; gdprConsent?: boolean;
            };

            if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()))
                throw new AppError(422, 'A valid email address is required', 'INVALID_EMAIL');
            if (!body.message || body.message.trim().length < 10)
                throw new AppError(422, 'Message must be at least 10 characters', 'MESSAGE_TOO_SHORT');
            if (body.message.trim().length > 1000)
                throw new AppError(422, 'Message must be 1000 characters or fewer', 'MESSAGE_TOO_LONG');
            if (!body.listingId)
                throw new AppError(422, 'listingId is required', 'MISSING_LISTING_ID');
            if (!body.gdprConsent)
                throw new AppError(422, 'GDPR consent is required', 'GDPR_CONSENT_REQUIRED');

            const listingSource = body.listingSource === 'scraped' ? 'scraped' : 'native';
            const categories = sanitiseCategories(body.categories);

            const { account: ghostTenant, created: tenantCreated } = await this.ghostAccountService.getOrCreateGhostTenant(
                body.email.trim(), body.name?.trim(),
            );

            let landlordId: string;
            // Gap 2: track whether the agent has a deliverable email
            const hasAgentEmail = listingSource === 'scraped' ? !!body.agentEmail : true;

            if (listingSource === 'scraped') {
                const sourcePlatform = (['onthemove', 'rightmarket'].includes(body.sourcePlatform ?? '')
                    ? body.sourcePlatform : 'direct') as SourcePlatform;
                const { account: ghostLandlord } = await this.ghostAccountService.getOrCreateGhostLandlord({
                    email: body.agentEmail ?? null,
                    name: body.agentName,
                    sourcePlatform,
                });
                landlordId = ghostLandlord.id;
            } else {
                if (!body.landlordId || body.landlordId === 'UNCLAIMED')
                    throw new AppError(422, 'landlordId is required for native listings', 'MISSING_LANDLORD_ID');
                landlordId = body.landlordId;
            }

            const { thread, messages } = await this.enquiryThreadService.createThread({
                listingId: body.listingId,
                listingSource,
                listingTitle: body.listingTitle ?? null,
                ghostTenantId: ghostTenant.id,
                ghostTenantName: ghostTenant.name,  // Gap 3: denormalise name onto thread
                landlordId,
                categories,
                firstMessage: { body: body.message.trim(), senderName: ghostTenant.name },
            });

            // Gap 6: issue claim token immediately for brand-new ghost tenants
            let claimToken: string | null = null;
            if (tenantCreated && ghostTenant.status === 'ghost') {
                try {
                    const updatedTenant = await this.ghostAccountService.issueClaimToken(ghostTenant.id);
                    claimToken = updatedTenant.claim_token;
                } catch (claimErr) {
                    context.warn('Failed to issue immediate claim token:', claimErr);
                    // Non-fatal — continue without claim token in the email
                }
            }

            this.emailRelayService
                .sendEnquiryEmails({
                    thread, firstMessage: messages[0], ghostTenant, listingSource,
                    agentEmail: body.agentEmail ?? null, agentName: body.agentName ?? null,
                    landlordId, claimToken,  // Gap 6: pass claim token to email relay
                })
                .catch(err => context.error('sendEnquiryEmails failed:', err));

            // Gap 2: include agentDelivery in response so frontend can show appropriate UI
            const agentDelivery = hasAgentEmail ? 'sent' : 'no_contact_email';

            return json({ data: {
                threadToken: thread.thread_token,
                ghostTenantId: ghostTenant.id,
                confirmationSent: true,
                agentDelivery,
            }}, 201);
        } catch (err) {
            return handleError(err, context);
        }
    }

    // GET /api/guest/thread/{token}
    async getThread(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
        try {
            const token = request.params['token'];
            if (!token) throw new AppError(400, 'Thread token is required', 'MISSING_TOKEN');

            const result = await this.enquiryThreadService.getThreadByToken(token);
            if (!result) throw new AppError(404, 'Thread not found', 'THREAD_NOT_FOUND');

            return json({
                data: {
                    thread: {
                        id: result.thread.id,
                        listing_title: result.thread.listing_title,
                        categories: result.thread.categories,
                        status: result.thread.status,
                        message_count: result.thread.message_count,
                        created_at: result.thread.created_at,
                        last_reply_at: result.thread.last_reply_at,
                        limit_reached: result.thread.message_count >= 20,
                        ghost_tenant_id: result.thread.ghost_tenant_id,
                        ghost_tenant_name: result.thread.ghost_tenant_name ?? null,  // Gap 3
                        landlord_id: result.thread.landlord_id,
                    },
                    messages: result.messages.map(m => ({
                        id: m.id, sender_type: m.sender_type, sender_name: m.sender_name,
                        body: m.body, sent_at: m.sent_at, read_at: m.read_at,
                    })),
                },
            });
        } catch (err) {
            return handleError(err, context);
        }
    }

    // POST /api/guest/thread/{token}/reply
    async addReply(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
        try {
            const token = request.params['token'];
            if (!token) throw new AppError(400, 'Thread token is required', 'MISSING_TOKEN');

            const body = await request.json() as {
                message?: string; senderType?: string; senderId?: string; senderName?: string;
            };

            if (!body.message || body.message.trim().length < 1)
                throw new AppError(422, 'Message is required', 'MESSAGE_REQUIRED');

            const allowedSenderTypes = ['ghost_tenant', 'ghost_landlord', 'platform_landlord'];
            if (!body.senderType || !allowedSenderTypes.includes(body.senderType))
                throw new AppError(422, 'Valid senderType is required', 'INVALID_SENDER_TYPE');
            if (!body.senderId)
                throw new AppError(422, 'senderId is required', 'MISSING_SENDER_ID');

            // Gap 4: verify the senderId actually belongs to this thread
            const thread = await this.enquiryThreadService.getThreadByToken(token);
            if (!thread) throw new AppError(404, 'Thread not found', 'THREAD_NOT_FOUND');

            if (body.senderType === 'ghost_tenant' && body.senderId !== thread.thread.ghost_tenant_id) {
                throw new AppError(403, 'Sender ID does not match this thread', 'SENDER_MISMATCH');
            }
            if (body.senderType === 'ghost_landlord' && body.senderId !== thread.thread.landlord_id) {
                throw new AppError(403, 'Sender ID does not match this thread', 'SENDER_MISMATCH');
            }

            const message = await this.enquiryThreadService.addReply({
                threadToken: token, senderType: body.senderType as any,
                senderId: body.senderId, senderName: body.senderName ?? null,
                body: body.message.trim(), source: 'tokenised_page',
            });

            this.emailRelayService
                .sendReplyNotification(token, message)
                .catch(err => context.error('sendReplyNotification failed:', err));

            return json({ data: { id: message.id, sent_at: message.sent_at } }, 201);
        } catch (err) {
            return handleError(err, context);
        }
    }

    // POST /api/guest/claim/validate
    async validateClaimToken(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
        try {
            const body = await request.json() as { token?: string };
            if (!body.token) throw new AppError(400, 'token is required', 'MISSING_TOKEN');

            const account = await this.ghostAccountService.validateClaimToken(body.token);
            return json({ data: { email: account.email, name: account.name, role: account.role, expires_at: account.claim_token_expires_at } });
        } catch (err) {
            return handleError(err, context);
        }
    }

    // POST /api/guest/claim/resend
    async resendClaimToken(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
        try {
            const body = await request.json() as { email?: string };
            if (!body.email) throw new AppError(400, 'email is required', 'MISSING_EMAIL');

            try {
                const updated = await this.ghostAccountService.resendClaimToken(body.email.trim());
                this.emailRelayService
                    .sendClaimEmail(updated)
                    .catch(err => context.error('sendClaimEmail failed:', err));
            } catch {
                // Swallow — always 200 to avoid email enumeration
            }

            return json({ data: { sent: true } });
        } catch (err) {
            return handleError(err, context);
        }
    }

    // POST /api/guest/claim/confirm
    async confirmClaim(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
        try {
            const userId = extractUserIdFromToken(request);
            if (!userId) {
                return json({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } }, 401);
            }

            const body = await request.json() as { token?: string };
            if (!body.token) throw new AppError(400, 'token is required', 'MISSING_TOKEN');

            const ghostAccount = await this.ghostAccountService.claimAccount(body.token, userId);
            
            const role = ghostAccount.role === 'ghost_landlord' ? 'landlord' : 'tenant';
            const migratedCount = await this.enquiryThreadService.migrateThreadsToUser(
                ghostAccount.id,
                userId,
                role
            );

            // Sync user to Mongo users collection
            await UserModel.findOneAndUpdate(
                { id: userId },
                {
                    $set: {
                        id: userId,
                        email: ghostAccount.email,
                        firstName: ghostAccount.name?.split(' ')[0] ?? '',
                        lastName: ghostAccount.name?.split(' ').slice(1).join(' ') ?? '',
                        ghostAccountId: ghostAccount.id
                    }
                },
                { upsert: true }
            );

            return json({ data: { success: true, migratedCount, ghostAccount } });
        } catch (err) {
            return handleError(err, context);
        }
    }

    // POST /api/guest/claim/auto-merge
    async autoMerge(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
        try {
            const userId = extractUserIdFromToken(request);
            if (!userId) {
                return json({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } }, 401);
            }

            const body = await request.json() as { email?: string };
            if (!body.email) throw new AppError(400, 'email is required', 'MISSING_EMAIL');

            // Find matching ghost accounts
            const ghostAccounts = await this.ghostAccountService.findGhostAccountsByEmail(body.email.trim());
            let totalMigrated = 0;

            for (const ghostAccount of ghostAccounts) {
                if (ghostAccount.status !== 'claimed') {
                    // Update state to claimed
                    await this.ghostAccountService.claimAccountDirect(ghostAccount.id, userId);
                    
                    const role = ghostAccount.role === 'ghost_landlord' ? 'landlord' : 'tenant';
                    const migrated = await this.enquiryThreadService.migrateThreadsToUser(
                        ghostAccount.id,
                        userId,
                        role
                    );
                    totalMigrated += migrated;
                }
            }

            if (ghostAccounts.length > 0) {
                // Sync user to Mongo users collection
                await UserModel.findOneAndUpdate(
                    { id: userId },
                    {
                        $set: {
                            id: userId,
                            email: body.email.trim(),
                            ghostAccountId: ghostAccounts[0].id
                        }
                    },
                    { upsert: true }
                );
            }

            return json({ data: { success: true, migratedCount: totalMigrated } });
        } catch (err) {
            return handleError(err, context);
        }
    }
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
const controller = new GuestEnquiryController();

app.http('guest-enquiry-options', {
    methods: ['OPTIONS'], authLevel: 'anonymous', route: 'guest/{*route}',
    handler: () => ({ status: 204, headers: {
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL ?? 'https://proptii.co',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    }}),
});

app.http('guest-submit-enquiry', {
    methods: ['POST'], authLevel: 'anonymous', route: 'guest/enquiry',
    handler: (req, ctx) => controller.submitEnquiry(req, ctx),
});

app.http('guest-get-thread', {
    methods: ['GET'], authLevel: 'anonymous', route: 'guest/thread/{token}',
    handler: (req, ctx) => controller.getThread(req, ctx),
});

app.http('guest-add-reply', {
    methods: ['POST'], authLevel: 'anonymous', route: 'guest/thread/{token}/reply',
    handler: (req, ctx) => controller.addReply(req, ctx),
});

app.http('guest-validate-claim-token', {
    methods: ['POST'], authLevel: 'anonymous', route: 'guest/claim/validate',
    handler: (req, ctx) => controller.validateClaimToken(req, ctx),
});

app.http('guest-resend-claim-token', {
    methods: ['POST'], authLevel: 'anonymous', route: 'guest/claim/resend',
    handler: (req, ctx) => controller.resendClaimToken(req, ctx),
});

app.http('guest-confirm-claim', {
    methods: ['POST'], authLevel: 'anonymous', route: 'guest/claim/confirm',
    handler: withAuth((req, ctx) => controller.confirmClaim(req, ctx)),
});

app.http('guest-auto-merge', {
    methods: ['POST'], authLevel: 'anonymous', route: 'guest/claim/auto-merge',
    handler: withAuth((req, ctx) => controller.autoMerge(req, ctx)),
});
