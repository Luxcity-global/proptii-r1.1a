import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { jwtDecode } from 'jwt-decode';
import { NativePropertyService } from '../../shared/services/NativePropertyService';
import { withAuth } from '../../shared/middleware/auth';

interface JwtPayload {
    sub?: string;
    emails?: string[];
    email?: string;
    [key: string]: any;
}

function extractUser(request: HttpRequest): { id: string; email: string } | null {
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

const ok = (body: unknown, status = 200): HttpResponseInit => ({
    status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
});

const err = (status: number, message: string): HttpResponseInit => ({
    status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: message }),
});

class NativePropertiesController {
    private svc = new NativePropertyService();

    // GET /api/native-properties?userId=...
    async list(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
        try {
            const userId = req.query.get('userId');
            if (!userId) return err(400, 'userId query parameter is required');
            const properties = await this.svc.getNativePropertiesByUserId(userId);
            return ok(properties);
        } catch (e: any) {
            ctx.error('list native properties error:', e);
            return err(500, 'Failed to list properties');
        }
    }

    // GET /api/native-properties/{id}
    async getById(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
        try {
            const id = req.params.id;
            const property = await this.svc.getNativePropertyById(id);
            if (!property) return err(404, 'Property not found');
            return ok(property);
        } catch (e: any) {
            ctx.error('get native property error:', e);
            return err(500, 'Failed to get property');
        }
    }

    // POST /api/native-properties  (auth required)
    async create(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
        try {
            const user = extractUser(req);
            if (!user) return err(401, 'Unauthorized');

            const body = await req.json() as any;
            const property = await this.svc.createNativeProperty({
                ...body,
                userId: user.id,
                ownerEmail: user.email.toLowerCase().trim(),
                landlordId: user.id, // native properties are pre-claimed by the author
            });
            return ok(property, 201);
        } catch (e: any) {
            ctx.error('create native property error:', e);
            return err(500, 'Failed to create property');
        }
    }

    // PUT /api/native-properties/{id}  (auth required, owner only)
    async update(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
        try {
            const user = extractUser(req);
            if (!user) return err(401, 'Unauthorized');

            const id = req.params.id;
            const body = await req.json() as any;
            const property = await this.svc.updateNativeProperty(id, user.id, body);
            return ok(property);
        } catch (e: any) {
            if (e?.code === 'NOT_FOUND') return err(404, 'Property not found');
            if (e?.code === 'FORBIDDEN') return err(403, 'Forbidden');
            ctx.error('update native property error:', e);
            return err(500, 'Failed to update property');
        }
    }

    // DELETE /api/native-properties/{id}  (auth required, owner only)
    async remove(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
        try {
            const user = extractUser(req);
            if (!user) return err(401, 'Unauthorized');

            const id = req.params.id;
            await this.svc.deleteNativeProperty(id, user.id);
            return ok({ message: 'Property deleted' });
        } catch (e: any) {
            if (e?.code === 'NOT_FOUND') return err(404, 'Property not found');
            if (e?.code === 'FORBIDDEN') return err(403, 'Forbidden');
            ctx.error('delete native property error:', e);
            return err(500, 'Failed to delete property');
        }
    }
}

const controller = new NativePropertiesController();

// ---------------------------------------------------------------------------
// Route registrations — Azure Functions v4 requires one registration per route
// ---------------------------------------------------------------------------

// Collection: GET (list) + POST (create)
app.http('native-properties-collection', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    route: 'native-properties',
    handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
        if (req.method === 'GET')  return controller.list(req, ctx);
        if (req.method === 'POST') return withAuth((r, c) => controller.create(r, c))(req, ctx);
        return { status: 405, body: 'Method Not Allowed' };
    },
});

// Item: GET (single) + PUT (update) + DELETE (remove)
app.http('native-properties-item', {
    methods: ['GET', 'PUT', 'DELETE'],
    authLevel: 'anonymous',
    route: 'native-properties/{id}',
    handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
        if (req.method === 'GET')    return controller.getById(req, ctx);
        if (req.method === 'PUT')    return withAuth((r, c) => controller.update(r, c))(req, ctx);
        if (req.method === 'DELETE') return withAuth((r, c) => controller.remove(r, c))(req, ctx);
        return { status: 405, body: 'Method Not Allowed' };
    },
});

