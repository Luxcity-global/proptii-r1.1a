/**
 * DEPRECATED — Auth test endpoint.
 *
 * This was a debug endpoint that exposed B2C config values in the response body.
 * It has no callers in the frontend and exposes config detail unnecessarily.
 * Returns 410 Gone so any accidental caller gets a clear signal.
 */

import { app, HttpResponseInit } from '@azure/functions';

const DEPRECATED: HttpResponseInit = {
    status: 410,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        error: 'This debug endpoint has been removed.',
        deprecatedAt: '2024-11',
    }),
};

app.http('authTest', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async () => DEPRECATED,
});
