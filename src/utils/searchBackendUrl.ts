/** Canonical production search service (property scraper on Render). */
export const PROD_SEARCH_BACKEND_URL = 'https://proptii-r1-1a-q95f.onrender.com';

const LOCAL_SEARCH_BACKEND_URL = 'http://localhost:3001';

/**
 * Hosts that belong to the main Nest API or invalid ports, not the search scraper.
 * Using them for /api/v1/search causes ERR_NAME_NOT_RESOLVED or 404.
 */
const NON_SEARCH_API_HOST_FRAGMENTS = [
  'railway.app',
  'proptii-r1-1a-new-backend.onrender.com',
  'proptii-r1-1a-1.onrender.com',
  'api.proptii.com',
  'api-staging.proptii.com',
  'localhost:5000',
  '127.0.0.1:5000',
];

const normalizeBackendUrl = (rawUrl: string): string => {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return PROD_SEARCH_BACKEND_URL;
  }
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/$/, '');
};

const isMisconfiguredSearchBackendUrl = (url: string): boolean => {
  const lower = url.toLowerCase();
  return NON_SEARCH_API_HOST_FRAGMENTS.some((fragment) => lower.includes(fragment));
};

const readEnvSearchBackendUrl = (): string => {
  const envUrl = (import.meta.env.VITE_SEARCH_BACKEND_URL || '').trim();
  if (!envUrl || isMisconfiguredSearchBackendUrl(envUrl)) {
    return '';
  }
  return normalizeBackendUrl(envUrl);
};

/** Resolve the search scraper base URL (no trailing slash). */
export const resolveSearchBackendUrl = (): string => {
  // If in development mode (Vite), use the proxy path to avoid CORS issues
  if (import.meta.env.DEV) {
    return '/api/search-backend';
  }

  const envUrl = readEnvSearchBackendUrl();
  if (envUrl) {
    return envUrl;
  }

  // If local search is explicitly requested via VITE_USE_LOCAL_SEARCH=true
  if (import.meta.env.VITE_USE_LOCAL_SEARCH === 'true') {
    return LOCAL_SEARCH_BACKEND_URL;
  }

  // Default to live Render search service so scraping works seamlessly in all environments
  return PROD_SEARCH_BACKEND_URL;
};
