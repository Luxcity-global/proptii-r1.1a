/**
 * Native Properties Azure Function
 *
 * Single source of truth for landlord-created property listings (MongoDB).
 * Replaces direct Firestore writes from the landlord dashboard.
 *
 * Routes:
 *   POST   /api/native-properties           – create a property
 *   GET    /api/native-properties           – list by userId or email
 *   GET    /api/native-properties/{id}      – get single property
 *   PUT    /api/native-properties/{id}      – full update (ownership-guarded)
 *   DELETE /api/native-properties/{id}      – delete (ownership-guarded)
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withAuth } from '../../shared/middleware/auth';
import { NativePropertyService } from '../../shared/services/NativePropertyService';
import { AppError } from '../../shared/middleware/error-handling';
import { getMongoConnection } from '../../shared/config/mongodb';

const nativePropertyService = new NativePropertyService();

const json = (body: unknown, status = 200): HttpResponseInit => ({
    status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
});

function extractUserId(request: HttpRequest): string | null {
    return (request as any).user?.sub ?? null;
}

// ---------------------------------------------------------------------------
// POST /api/native-properties — create
// ---------------------------------------------------------------------------
app.http('native-properties-create', {
    route: 'native-properties',
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: withAuth(async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        try {
            await getMongoConnection();
            const userId = extractUserId(request);
            if (!userId) return json({ error: 'Unauthorized' }, 401);

            const body = await request.json() as any;

            const property = await nativePropertyService.createNativeProperty({
                title:         body.title        ?? body.address ?? '',
                address:       body.address      ?? body.title   ?? '',
                city:          body.city,
                postcode:      body.postcode,
                price:         body.price        ?? '£0 pcm',
                bedrooms:      body.bedrooms,
                bathrooms:     body.bathrooms,
                squareFootage: body.squareFootage,
                type:          body.type         ?? body.propertyType,
                amenities:     body.amenities    ?? [],
                notes:         body.notes        ?? body.description ?? '',
                photos:        body.photos       ?? [],
                documents:     body.documents    ?? [],
                status:        body.status       ?? 'vacant',
                userId,
                ownerEmail:    body.ownerEmail   ?? body.contactEmail,
            });

            return json(property, 201);
        } catch (error) {
            context.error('native-properties-create error:', error);
            if (error instanceof AppError) return json({ error: error.message }, error.statusCode);
            return json({ error: 'Internal server error' }, 500);
        }
    }),
});

// ---------------------------------------------------------------------------
// GET /api/native-properties — list by userId or ownerEmail
// ---------------------------------------------------------------------------
app.http('native-properties-list', {
    route: 'native-properties',
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        try {
            await getMongoConnection();
            const userId = request.query.get('userId');
            const email  = request.query.get('email');

            if (!userId && !email) {
                return json({ error: 'userId or email query parameter is required' }, 400);
            }

            let properties;
            if (userId) {
                properties = await nativePropertyService.getNativePropertiesByUserId(userId);
            } else {
                // Fallback: look up by ownerEmail field
                const { NativePropertyModel } = await import('../../shared/models/property.model');
                properties = await NativePropertyModel
                    .find({ ownerEmail: email!.toLowerCase().trim() })
                    .lean();
            }

            return json(properties);
        } catch (error) {
            context.error('native-properties-list error:', error);
            return json({ error: 'Internal server error' }, 500);
        }
    },
});

// ---------------------------------------------------------------------------
// GET /api/native-properties/{id} — get single
// ---------------------------------------------------------------------------
app.http('native-properties-get', {
    route: 'native-properties/{id}',
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        try {
            await getMongoConnection();
            const id = request.params['id'];
            const property = await nativePropertyService.getNativePropertyById(id);
            if (!property) return json({ error: 'Property not found' }, 404);
            return json(property);
        } catch (error) {
            context.error('native-properties-get error:', error);
            return json({ error: 'Internal server error' }, 500);
        }
    },
});

// ---------------------------------------------------------------------------
// PUT /api/native-properties/{id} — update (ownership-guarded)
// ---------------------------------------------------------------------------
app.http('native-properties-update', {
    route: 'native-properties/{id}',
    methods: ['PUT'],
    authLevel: 'anonymous',
    handler: withAuth(async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        try {
            await getMongoConnection();
            const userId = extractUserId(request);
            if (!userId) return json({ error: 'Unauthorized' }, 401);

            const id   = request.params['id'];
            const body = await request.json() as any;

            // Strip undefined values so existing fields are not overwritten
            const updates: Record<string, any> = {};
            const allowed = ['title','address','city','postcode','price','bedrooms','bathrooms',
                             'squareFootage','type','amenities','notes','photos','documents',
                             'status','tenantId'] as const;
            for (const key of allowed) {
                if (body[key] !== undefined) updates[key] = body[key];
            }

            const updated = await nativePropertyService.updateNativeProperty(id, userId, updates);

            return json(updated);
        } catch (error) {
            context.error('native-properties-update error:', error);
            if (error instanceof AppError) return json({ error: error.message }, error.statusCode);
            return json({ error: 'Internal server error' }, 500);
        }
    }),
});

// ---------------------------------------------------------------------------
// DELETE /api/native-properties/{id} — delete (ownership-guarded)
// ---------------------------------------------------------------------------
app.http('native-properties-delete', {
    route: 'native-properties/{id}',
    methods: ['DELETE'],
    authLevel: 'anonymous',
    handler: withAuth(async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        try {
            await getMongoConnection();
            const userId = extractUserId(request);
            if (!userId) return json({ error: 'Unauthorized' }, 401);

            const id = request.params['id'];
            await nativePropertyService.deleteNativeProperty(id, userId);
            return json({ message: 'Property deleted' });
        } catch (error) {
            context.error('native-properties-delete error:', error);
            if (error instanceof AppError) return json({ error: error.message }, error.statusCode);
            return json({ error: 'Internal server error' }, 500);
        }
    }),
});
