/**
 * Single source of truth for the backend base URL used by axios (VITE_API_URL).
 *
 * In local DEV we prefer same-origin `/api` so Vite's proxy forwards to Nest on
 * :3002. That avoids cross-origin CORS/preflight flakiness that was causing
 * browser uploads and dashboard GETs to hang while curl to :3002 worked.
 *
 * Set VITE_USE_REMOTE_API=true to call a remote/staging API from localhost.
 */
const LOCAL_PROXY = '/api';
const LOCAL_ABSOLUTE = 'http://127.0.0.1:3002/api';

function isBrowserLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1';
}

function isRemoteUrl(url: string): boolean {
  return url.length > 0 && !/localhost|127\.0\.0\.1/i.test(url) && !url.startsWith('/');
}

export function getResolvedApiBaseUrl(): string {
  const envUrl = (
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_NEST_API_ENDPOINT ||
    import.meta.env.VITE_API_ENDPOINT ||
    ''
  ).trim().replace(/\/$/, '');

  const useRemoteFromLocalhost =
    import.meta.env.DEV &&
    isBrowserLocalhost() &&
    import.meta.env.VITE_USE_REMOTE_API === 'true' &&
    isRemoteUrl(envUrl);

  if (useRemoteFromLocalhost) {
    let resolved = envUrl;
    if (!resolved.endsWith('/api')) resolved = `${resolved}/api`;
    return resolved;
  }

  // Local Vite + Nest: same-origin proxy (see vite.config.ts server.proxy['/api'])
  if (import.meta.env.DEV && isBrowserLocalhost()) {
    return LOCAL_PROXY;
  }

  if (envUrl) {
    let resolved = envUrl.replace(/\/\/localhost(?=[:/])/gi, '//127.0.0.1');
    if (!resolved.endsWith('/api')) {
      resolved = `${resolved}/api`;
    }
    return resolved;
  }

  if (import.meta.env.DEV) {
    return LOCAL_ABSOLUTE;
  }

  return '/api';
}
