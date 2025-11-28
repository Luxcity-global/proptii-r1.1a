const normalizeBaseUrl = (url: string) => url.replace(/\/$/, '');

const REMOTE_FALLBACKS = [
  'https://proptii-r1-1a-new-backend.onrender.com/api',
  'https://proptii-r1-1a-1.onrender.com/api',
  'https://proptii-backend.onrender.com/api',
  'https://api.proptii.com',
  'https://api-staging.proptii.com'
];

const LOCAL_FALLBACKS = [
  'http://localhost:3000/api',
  'http://localhost:3002',
  'http://localhost:7071/api'
];

const buildCandidateList = () => {
  const envUrl = (import.meta as any)?.env?.VITE_API_URL?.trim?.() || '';
  const candidates = [
    envUrl,
    ...REMOTE_FALLBACKS,
    ...((import.meta as any)?.env?.DEV ? LOCAL_FALLBACKS : [])
  ]
    .filter(Boolean)
    .map(normalizeBaseUrl);

  return Array.from(new Set(candidates));
};

export const API_BASE_CANDIDATES = buildCandidateList();

export const PRIMARY_API_BASE_URL = API_BASE_CANDIDATES[0] || 'https://proptii-r1-1a-new-backend.onrender.com/api';

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

