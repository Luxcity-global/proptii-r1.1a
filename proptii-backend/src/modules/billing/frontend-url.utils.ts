const PRODUCTION_FRONTEND_FALLBACK = 'https://proptii.co';

const LOCAL_DEV_ORIGINS = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]);

function normalizeOrigin(url: string): string {
  return url.replace(/\/+$/, '');
}

function parseOrigin(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return normalizeOrigin(parsed.origin);
  } catch {
    return null;
  }
}

function configuredFrontendOrigin(): string | null {
  const fromEnv = process.env.FRONTEND_URL?.trim();
  if (!fromEnv) return null;
  return parseOrigin(fromEnv) ?? normalizeOrigin(fromEnv);
}

function isAllowedReturnOrigin(origin: string): boolean {
  if (LOCAL_DEV_ORIGINS.has(origin)) return true;

  const configured = configuredFrontendOrigin();
  if (configured && origin === configured) return true;

  if (origin === PRODUCTION_FRONTEND_FALLBACK) return true;
  if (origin === 'https://www.proptii.co') return true;

  try {
    const { hostname } = new URL(origin);
    if (hostname.endsWith('.onrender.com')) return true;
    if (hostname.endsWith('.azurestaticapps.net')) return true;
  } catch {
    return false;
  }

  return false;
}

/**
 * Resolve the frontend origin for Stripe success/cancel URLs.
 * Prefers the browser origin sent at checkout time so live redirects match
 * where the user actually started (proptii.co, Render preview, localhost, etc.).
 */
export function resolveFrontendBaseUrl(returnBaseUrl?: string): string {
  const fromClient = returnBaseUrl?.trim()
    ? parseOrigin(returnBaseUrl.trim())
    : null;
  if (fromClient && isAllowedReturnOrigin(fromClient)) {
    return fromClient;
  }

  const fromEnv = configuredFrontendOrigin();
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === 'production') {
    return PRODUCTION_FRONTEND_FALLBACK;
  }

  return 'http://localhost:5173';
}
