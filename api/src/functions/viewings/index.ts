/**
 * DEPRECATED — Cosmos DB–backed viewings endpoints.
 *
 * The frontend uses Firestore (viewingBookings collection) directly via the
 * client-side viewingService.ts. These routes were never called by any live UI
 * code and are replaced by Firestore real-time subscriptions.
 *
 * Routes are kept registered but return 410 Gone with a clear deprecation
 * message so any accidental callers get an informative error instead of a
 * silent 500 from a missing Cosmos DB connection.
 *
 * To remove entirely: delete this file and remove `import './functions/viewings'`
 * from api/src/index.ts.
 */

import { app, HttpRequest, HttpResponseInit } from '@azure/functions';

const DEPRECATED: HttpResponseInit = {
    status: 410,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        error: 'This endpoint is deprecated. Viewings are managed via Firestore in real-time by the frontend.',
        deprecatedAt: '2024-11',
    }),
};

app.http('viewings', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async () => DEPRECATED,
});

app.http('viewings-by-id', {
    route: 'viewings/{viewingId}',
    methods: ['GET', 'PUT', 'DELETE'],
    authLevel: 'anonymous',
    handler: async () => DEPRECATED,
});
