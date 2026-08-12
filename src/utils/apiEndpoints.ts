const normalizeBaseUrl = (url: string) => url.replace(/\/$/, '');

export const CANONICAL_PROD_API_BASE_URL =
  (import.meta as any)?.env?.VITE_API_URL?.trim?.() ||
  ((import.meta as any)?.env?.VITE_NEST_API_ENDPOINT?.trim?.()
    ? `${(import.meta as any).env.VITE_NEST_API_ENDPOINT.trim().replace(/\/$/, '')}/api`
    : (typeof window !== 'undefined' ? `${window.location.origin}/api` : ''));

/** Nest backend for local development (port 3000). */
export const DEV_LOCAL_API_BASE = 'http://127.0.0.1:3000/api';

const RENDER_REMOTE_FALLBACKS = Array.from(new Set([
  CANONICAL_PROD_API_BASE_URL,
  (import.meta as any)?.env?.VITE_API_URL?.trim?.(),
  (import.meta as any)?.env?.VITE_NEST_API_ENDPOINT?.trim?.()
    ? `${(import.meta as any).env.VITE_NEST_API_ENDPOINT.trim().replace(/\/$/, '')}/api`
    : null,
].filter(Boolean) as string[]));

const LEGACY_REMOTE_FALLBACKS: string[] = [];

/** Origins allowed in CSP connect-src dynamically built from environment variables. */
export const KNOWN_API_ORIGINS = Array.from(new Set([
  ...(typeof window !== 'undefined' ? [window.location.origin] : []),
  ...RENDER_REMOTE_FALLBACKS.map(url => {
    try {
      return new URL(url).origin;
    } catch {
      return null;
    }
  }).filter(Boolean) as string[]
]));

/** Windows: `localhost` often resolves to ::1 and can hit a hung listener on :3000. */
const toIpv4Loopback = (url: string) =>
  url.replace(/\/\/localhost(?=[:/])/gi, '//127.0.0.1');

// Only include URLs for services that actually exist in this project.
// Port 3002 was a ghost entry — nothing runs there; every call waited 2 s
// for a connection-refused before moving on.
const LOCAL_FALLBACKS = [
  DEV_LOCAL_API_BASE,             // NestJS backend (npm run start:backend)
];

const isLocalApiUrl = (url: string) => /localhost|127\.0\.0\.1/i.test(url);

// Reduced from 6 s → 2 s for local (connection-refused is instant; the delay
// was masking the real problem of too many fallback URLs).
// Remote timeout kept at 12 s for Render cold-start tolerance.
const LOCAL_FETCH_TIMEOUT_MS  = 2_000;
const REMOTE_FETCH_TIMEOUT_MS = 12_000;

/** True when the UI is served from a machine-local origin (Vite dev, etc.). */
export function isBrowserLocalDevOrigin(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '::1';
}

const ensureApiPathPrefix = (base: string) => {
  const normalized = normalizeBaseUrl(toIpv4Loopback(base));
  return /\/api$/i.test(normalized) ? normalized : `${normalized}/api`;
};

const buildCandidateList = () => {
  const envUrl = (import.meta as any)?.env?.VITE_API_URL?.trim?.() || '';
  const isLocalDevOrigin = isBrowserLocalDevOrigin();

  /**
   * When the app runs on localhost but VITE_API_URL points at a deployed API, putting env first
   * forces the browser to call production from http://localhost — which triggers CORS unless the
   * remote server lists your origin. Prefer local Nest/API bases first; remote URL remains as fallback.
   */
  const remoteFallbacks = isLocalDevOrigin
    ? [...RENDER_REMOTE_FALLBACKS, ...LEGACY_REMOTE_FALLBACKS]
    : RENDER_REMOTE_FALLBACKS;

  let candidates: string[];
  if (envUrl) {
    candidates = [
      envUrl,
      ...(isLocalDevOrigin ? LOCAL_FALLBACKS : []),
      ...remoteFallbacks,
    ];
  } else {
    candidates = [
      ...(isLocalDevOrigin ? LOCAL_FALLBACKS : []),
      ...remoteFallbacks,
      ...(!isLocalDevOrigin && (import.meta as any)?.env?.DEV ? LOCAL_FALLBACKS : []),
    ];
  }

  return Array.from(
    new Set(candidates.filter(Boolean).map((u) => ensureApiPathPrefix(u))),
  );
};

/** Resolved at call time so `window` is available (not during Vite prebundle). */
export function getApiBaseCandidates(): string[] {
  return buildCandidateList();
}

/**
 * Billing routes exist only on the local Nest backend until Render is redeployed.
 * In dev on a local origin, never fall back to production (returns 404 for /billing/*).
 */
export function getBillingApiBaseCandidates(): string[] {
  if (import.meta.env.DEV && isBrowserLocalDevOrigin()) {
    return [DEV_LOCAL_API_BASE];
  }
  return getApiBaseCandidates();
}

/** @deprecated Prefer getApiBaseCandidates() — may be stale if read before `window` exists. */
export const API_BASE_CANDIDATES = getApiBaseCandidates();

export const PRIMARY_API_BASE_URL =
  getApiBaseCandidates()[0] || CANONICAL_PROD_API_BASE_URL;

const ensureLeadingSlash = (path: string) => (path.startsWith('/') ? path : `/${path}`);

export const buildApiUrl = (base: string, path: string) => {
  const normalizedBase = normalizeBaseUrl(base);
  return `${normalizedBase}${ensureLeadingSlash(path)}`;
};

interface FetchWithApiFallbackOptions {
  /** Retry next base URL on any non-OK HTTP status. */
  retryOnHttpErrors?: boolean;
  /** Retry next base URL on 404 (undeployed route on that host). */
  retryOnNotFound?: boolean;
  /** Override candidate bases (e.g. billing dev-only list). */
  bases?: string[];
}

export const fetchWithApiFallback = async (
  path: string,
  init?: RequestInit,
  options?: FetchWithApiFallbackOptions,
) => {
  const normalizedPath = ensureLeadingSlash(path);
  const bases = options?.bases ?? getApiBaseCandidates();
  let lastError: Error | null = null;
  let lastResponse: Response | null = null;
  let lastUrl = '';

  for (const base of bases) {
    if (init?.signal?.aborted) {
      throw lastError ?? new DOMException('Aborted', 'AbortError');
    }

    const url = buildApiUrl(base, normalizedPath);
    const timeoutMs = isLocalApiUrl(base) ? LOCAL_FETCH_TIMEOUT_MS : REMOTE_FETCH_TIMEOUT_MS;
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

    const onParentAbort = () => timeoutController.abort();
    init?.signal?.addEventListener('abort', onParentAbort);

    try {
      const response = await fetch(url, {
        ...init,
        signal: timeoutController.signal,
      });
      lastResponse = response;
      lastUrl = url;

      const retryNotFound = options?.retryOnNotFound && response.status === 404;
      const retryOther =
        options?.retryOnHttpErrors && !response.ok && response.status !== 404;

      if (retryNotFound || retryOther) {
        lastError = new Error(`HTTP ${response.status} ${response.statusText} from ${url}`);
        continue;
      }

      return { response, baseUrl: base, url };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    } finally {
      clearTimeout(timeoutId);
      init?.signal?.removeEventListener('abort', onParentAbort);
    }
  }

  if (lastResponse) {
    const base = bases[bases.length - 1] ?? '';
    return { response: lastResponse, baseUrl: base, url: lastUrl };
  }

  throw lastError || new Error(`All API base URLs failed for path ${normalizedPath}`);
};

/** Billing API fetch — local-only in dev; retries 404 on other environments. */
export const fetchBillingWithApiFallback = (
  path: string,
  init?: RequestInit,
) =>
  fetchWithApiFallback(path, init, {
    bases: getBillingApiBaseCandidates(),
    retryOnNotFound: !import.meta.env.DEV || !isBrowserLocalDevOrigin(),
    retryOnHttpErrors: false,
  });
