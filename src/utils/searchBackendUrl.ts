/** Canonical production search service (property scraper on Render). */
export const PROD_SEARCH_BACKEND_URL = 'https://proptii-r1-1a-search.onrender.com';

/** Search service staging URL from Renter Report handover (Aug 2026). */
export const STAGING_SEARCH_BACKEND_URL = 'https://proptii-r1-1a-q95f.onrender.com';

const LOCAL_SEARCH_BACKEND_URL = 'http://localhost:3001';

/**
 * Hosts that belong to the main Nest API, not the search scraper.
 * Using them for /api/v1/search causes ERR_NAME_NOT_RESOLVED or 404.
 */
const NON_SEARCH_API_HOST_FRAGMENTS = [
  'railway.app',
  'proptii-r1-1a-new-backend.onrender.com',
  'proptii-r1-1a-1.onrender.com',
  'api.proptii.com',
  'api-staging.proptii.com',
];

const normalizeBackendUrl = (rawUrl: string): string => {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return LOCAL_SEARCH_BACKEND_URL;
  }
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/$/, '');
};

const isLocalBrowserHost = (): boolean => {
  if (typeof window === 'undefined') {
    return import.meta.env.DEV;
  }
  const hostname = window.location.hostname.toLowerCase();
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname === '::1'
  );
};

const isDeployedProptiiHost = (): boolean => {
  if (typeof window === 'undefined') {
    return !import.meta.env.DEV;
  }
  const hostname = window.location.hostname.toLowerCase();
  return (
    hostname === 'proptii.co' ||
    hostname.endsWith('.proptii.co') ||
    hostname === 'proptii.com' ||
    hostname.endsWith('.proptii.com') ||
    hostname.includes('onrender.com')
  );
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
  const envUrl = readEnvSearchBackendUrl();
  if (envUrl) {
    return envUrl;
  }

  if (isDeployedProptiiHost()) {
    return PROD_SEARCH_BACKEND_URL;
  }

  if (isLocalBrowserHost()) {
    return LOCAL_SEARCH_BACKEND_URL;
  }

  if (import.meta.env.VITE_USE_STAGING_SEARCH === 'true') {
    return STAGING_SEARCH_BACKEND_URL;
  }

  return PROD_SEARCH_BACKEND_URL;
};
