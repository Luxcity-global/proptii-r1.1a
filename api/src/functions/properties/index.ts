import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { jwtDecode } from 'jwt-decode';
import { ConversationService } from "../../shared/services/ConversationService";
import { NativePropertyService } from "../../shared/services/NativePropertyService";
import { ScrapedPropertyModel, NativePropertyModel } from "../../shared/models/property.model";
import { withAuth } from "../../shared/middleware/auth";

interface JwtPayload {
    sub?: string;
    emails?: string[];
    email?: string;
    [key: string]: any;
}

function extractUserFromToken(request: HttpRequest): { id: string, email: string } | null {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) return null;

    if (process.env.NODE_ENV === 'development' && token.startsWith('mock-token-')) {
        return { id: token.replace('mock-token-', ''), email: 'test@example.com' };
    }

    try {
        const decoded = jwtDecode<JwtPayload>(token);
        const id = decoded.sub ?? '';
        const email = decoded.emails?.[0] ?? decoded.email ?? '';
        return id && email ? { id, email } : null;
    } catch {
        return null;
    }
}

const json = (body: unknown, status = 200): HttpResponseInit => ({
    status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
});

export class PropertiesController {
    private nativePropertyService = new NativePropertyService();
    private conversationService = new ConversationService();

    // -------------------------------------------------------------------------
    // GET /api/properties/search?q=...
    // Returns native_properties only. Scraped properties are streamed separately
    // via SSE from proptii-search and are only saved to MongoDB when a tenant
    // sends a message. See ConversationService.getOrCreateConversation().
    // -------------------------------------------------------------------------
    async searchProperties(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
        try {
            const q = request.query.get('q') ?? '';
            const limit = Math.min(parseInt(request.query.get('limit') ?? '50'), 100);

            if (!q.trim()) {
                return json({ results: [], total: 0 });
            }

            const nativeResults = await this.nativePropertyService
                .searchNativeProperties(q, limit)
                .then((results: any[]) => results.map((p: any) => ({ ...p, source: 'native' })))
                .catch(() => []);

            return json({ results: nativeResults, total: nativeResults.length });

        } catch (error) {

            context.error('Error searching properties:', error);
            return json({ error: 'Search failed' }, 500);
        }
    }

    // -------------------------------------------------------------------------
    // POST /api/properties/{propertyId}/claim
    // Checks scraped_properties first, then native_properties
    // -------------------------------------------------------------------------
    async claimProperty(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
        try {
            const propertyId = request.params.propertyId;
            const user = extractUserFromToken(request);

            if (!user) {
                return json({ error: 'Unauthorized' }, 401);
            }

            const userEmail = user.email.toLowerCase().trim();

            // 1. Try scraped_properties first (most claim requests come from agents)
            const scraped = await (ScrapedPropertyModel as any).findOne({
                $or: [{ _id: propertyId }, { url: propertyId }]
            }).lean();

            if (scraped) {
                const agentEmail = (scraped.agent?.email ?? '').toLowerCase().trim();

                // Idempotency guard
                if (scraped.landlordId === user.id) {
                    return json({ message: 'Property already claimed by you' });
                }
                // Conflict guard
                if (scraped.landlordId && scraped.landlordId !== 'UNCLAIMED') {
                    return json({ error: 'This property has already been claimed by another user.' }, 409);
                }
                // Email guard
                if (!agentEmail) {
                    return json({ error: 'No agent email on record for this property.' }, 403);
                }
                if (agentEmail !== userEmail) {
                    return json({ error: 'Your email does not match the agent email for this property.' }, 403);
                }

                // Write landlordId to scraped_properties
                await (ScrapedPropertyModel as any).findOneAndUpdate(
                    { $or: [{ _id: propertyId }, { url: propertyId }] },
                    { landlordId: user.id }
                );

                await this.conversationService.assignShadowConversations(propertyId, user.id);
                context.log(`[Claim] Scraped property ${propertyId} claimed by ${user.email}`);
                return json({ message: 'Property claimed successfully' });
            }

            // 2. Try native_properties
            const native = await NativePropertyModel.findOne({ id: propertyId }).lean<any>();

            if (native) {
                const ownerEmail = (native.ownerEmail ?? '').toLowerCase().trim();

                if (native.landlordId === user.id) {
                    return json({ message: 'Property already claimed by you' });
                }
                if (native.landlordId && native.landlordId !== 'UNCLAIMED') {
                    return json({ error: 'This property has already been claimed by another user.' }, 409);
                }
                if (!ownerEmail) {
                    return json({ error: 'No owner email on record for this property.' }, 403);
                }
                if (ownerEmail !== userEmail) {
                    return json({ error: 'Your email does not match the owner email for this property.' }, 403);
                }

                await NativePropertyModel.findOneAndUpdate(
                    { id: propertyId },
                    { landlordId: user.id, updatedAt: new Date().toISOString() }
                );

                await this.conversationService.assignShadowConversations(propertyId, user.id);
                context.log(`[Claim] Native property ${propertyId} claimed by ${user.email}`);
                return json({ message: 'Property claimed successfully' });
            }

            return json({ error: 'Property not found' }, 404);

        } catch (error) {
            context.error('Error claiming property:', error);
            return json({ error: 'Failed to claim property' }, 500);
        }
    }
}

const controller = new PropertiesController();

// ---------------------------------------------------------------------------
// Route: Unified search
// ---------------------------------------------------------------------------
app.http('properties-search', {
    route: 'properties/search',
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: (req, ctx) => controller.searchProperties(req, ctx),
});

// ---------------------------------------------------------------------------
// Route: Claim
// ---------------------------------------------------------------------------
app.http('properties-claim', {
    route: 'properties/{propertyId}/claim',
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: withAuth((req, ctx) => controller.claimProperty(req, ctx)),
});