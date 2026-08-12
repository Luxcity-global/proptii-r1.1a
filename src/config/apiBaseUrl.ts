/**
 * Single source of truth for the backend base URL used by axios (VITE_API_URL).
 *
 * In dev, if you open the app at http://localhost:5173 but VITE_API_URL points at
 * a deployed host (e.g. onrender.com), the browser will hit production and often
 * fail CORS. We default to local Nest unless VITE_USE_REMOTE_API=true.
 */
const LOCAL_DEFAULT = 'http://127.0.0.1:3000/api';

function isBrowserLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1';
}

function isRemoteUrl(url: string): boolean {
  return url.length > 0 && !/localhost|127\.0\.0\.1/i.test(url);
}

export function getResolvedApiBaseUrl(): string {
  const envUrl = (
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_NEST_API_ENDPOINT ||
    import.meta.env.VITE_API_ENDPOINT ||
    ''
  ).trim().replace(/\/$/, '');

  const forceLocalBecauseRemoteEnvWhileOnLocalhost =
    import.meta.env.DEV &&
    isBrowserLocalhost() &&
    isRemoteUrl(envUrl) &&
    import.meta.env.VITE_USE_REMOTE_API !== 'true';

  if (forceLocalBecauseRemoteEnvWhileOnLocalhost) {
    console.warn(
      '[api] DEV on localhost: using local backend at',
      LOCAL_DEFAULT,
      '— VITE_API_URL points at a remote API. Set VITE_USE_REMOTE_API=true in .env to call that URL from localhost.',
    );
    return LOCAL_DEFAULT;
  }

  if (envUrl) {
    return envUrl.replace(/\/\/localhost(?=[:/])/gi, '//127.0.0.1');
  }

  return LOCAL_DEFAULT;
}
