import {
  activateLead,
  enforceRateLimit,
  exportLeadsCsv,
  getLeadBySession,
  hmacSecretFromEnv,
  listLeads,
  submitLead,
} from './leads';
import { LeadValidationError, parseCreateLead, parseEmail } from './validation';

function json(data: unknown, status = 200, extra?: HeadersInit): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extra,
    },
  });
}

function clientIp(request: Request): string | null {
  return request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || null;
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }

    try {
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'access-control-allow-origin': url.origin,
            'access-control-allow-methods': 'GET,POST,OPTIONS',
            'access-control-allow-headers': 'content-type',
          },
        });
      }

      if (request.method === 'POST' && url.pathname === '/api/leads') {
        const allowed = await enforceRateLimit(env.DB, clientIp(request));
        if (!allowed) return json({ message: 'Too many submissions. Please try again later.' }, 429);

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ message: 'Invalid JSON body' }, 400);
        }
        const dto = parseCreateLead(body);
        const result = await submitLead(env.DB, dto, hmacSecretFromEnv(env), clientIp(request) ?? undefined);
        return json(result, 201);
      }

      if (request.method === 'GET' && url.pathname === '/api/leads/session') {
        const token = url.searchParams.get('token') || '';
        if (!token) return json({ message: 'token is required' }, 400);
        try {
          const payload = await getLeadBySession(env.DB, token, hmacSecretFromEnv(env));
          return json(payload);
        } catch {
          return json({ message: 'Invalid or expired session token' }, 401);
        }
      }

      if (request.method === 'GET' && url.pathname === '/api/leads/export') {
        const csv = await exportLeadsCsv(env.DB);
        const filename = `proptii-leads-${new Date().toISOString().split('T')[0]}.csv`;
        return new Response(csv, {
          status: 200,
          headers: {
            'content-type': 'text/csv; charset=utf-8',
            'content-disposition': `attachment; filename="${filename}"`,
            'cache-control': 'no-store',
          },
        });
      }

      if (request.method === 'GET' && url.pathname === '/api/leads') {
        const limit = Number.parseInt(url.searchParams.get('limit') || '100', 10);
        const startAfter = url.searchParams.get('startAfter') || undefined;
        const leads = await listLeads(env.DB, Number.isFinite(limit) ? limit : 100, startAfter);
        return json(leads);
      }

      const activateMatch = url.pathname.match(/^\/api\/leads\/([^/]+)\/activate$/);
      if (request.method === 'POST' && activateMatch) {
        const allowed = await enforceRateLimit(env.DB, clientIp(request));
        if (!allowed) return json({ success: false, message: 'Too many requests' }, 429);
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ success: false }, 400);
        }
        const email = parseEmail((body as { email?: unknown }).email);
        await activateLead(env.DB, decodeURIComponent(activateMatch[1]), email);
        return json({ success: true });
      }

      return json({ message: 'Not found' }, 404);
    } catch (error) {
      if (error instanceof LeadValidationError) {
        return json({ message: error.message }, 400);
      }
      if (error instanceof Error && error.message === 'Lead not found') {
        return json({ message: error.message }, 400);
      }
      console.error('Worker error', error instanceof Error ? error.message : error);
      return json({ message: 'Internal error' }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
