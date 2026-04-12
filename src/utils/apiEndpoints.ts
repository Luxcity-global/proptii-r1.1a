const normalizeBaseUrl = (url: string) => url.replace(/\/$/, '');

export const CANONICAL_PROD_API_BASE_URL =
  'https://proptii-r1-1a-new-backend.onrender.com/api';

const REMOTE_FALLBACKS = [
  CANONICAL_PROD_API_BASE_URL,
  'https://proptii-r1-1a-1.onrender.com/api',
  'https://api.proptii.com',
  'https://api-staging.proptii.com'
];

const LOCAL_FALLBACKS = [
  'http://localhost:3000/api',
  'http://localhost:3002',
  'http://localhost:7071/api'
];

const isLocalApiUrl = (url: string) => /localhost|127\.0\.0\.1/i.test(url);

const buildCandidateList = () => {
  const envUrl = (import.meta as any)?.env?.VITE_API_URL?.trim?.() || '';
  const isLocalDevOrigin =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  /**
   * When the app runs on localhost but VITE_API_URL points at a deployed API, putting env first
   * forces the browser to call production from http://localhost — which triggers CORS unless the
   * remote server lists your origin. Prefer local Nest/API bases first; remote URL remains as fallback.
   */
  let candidates: string[];
  if (isLocalDevOrigin && envUrl && !isLocalApiUrl(envUrl)) {
    candidates = [...LOCAL_FALLBACKS, envUrl, ...REMOTE_FALLBACKS];
  } else {
    candidates = [
      ...(envUrl ? [envUrl] : []),
      ...(isLocalDevOrigin ? LOCAL_FALLBACKS : []),
      ...REMOTE_FALLBACKS,
      ...(!isLocalDevOrigin && (import.meta as any)?.env?.DEV ? LOCAL_FALLBACKS : []),
    ];
  }

  return Array.from(new Set(candidates.filter(Boolean).map(normalizeBaseUrl)));
};

export const API_BASE_CANDIDATES = buildCandidateList();

export const PRIMARY_API_BASE_URL = API_BASE_CANDIDATES[0] || CANONICAL_PROD_API_BASE_URL;

const ensureLeadingSlash = (path: string) => (path.startsWith('/') ? path : `/${path}`);

export const buildApiUrl = (base: string, path: string) => {
  const normalizedBase = normalizeBaseUrl(base);
  return `${normalizedBase}${ensureLeadingSlash(path)}`;
};

interface FetchWithApiFallbackOptions {
  retryOnHttpErrors?: boolean;
}

export const fetchWithApiFallback = async (
  path: string,
  init?: RequestInit,
  options?: FetchWithApiFallbackOptions
) => {
  const normalizedPath = ensureLeadingSlash(path);
  let lastError: Error | null = null;

  for (const base of API_BASE_CANDIDATES) {
    const url = buildApiUrl(base, normalizedPath);
    try {
      const response = await fetch(url, init);
      if (!response.ok && options?.retryOnHttpErrors) {
        lastError = new Error(`HTTP ${response.status} ${response.statusText} from ${url}`);
        continue;
      }
      return { response, baseUrl: base, url };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError || new Error(`All API base URLs failed for path ${normalizedPath}`);
};

