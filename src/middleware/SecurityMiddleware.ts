/**
 * SecurityMiddleware — thin axios factory.
 *
 * The previous implementation maintained a client-side CSRF token that the
 * NestJS backend never validated, injected CSP via <meta> tags (overridden by
 * Render's HTTP headers anyway), and ran XSS detection by regex on error
 * events (never actionable). All of that has been removed.
 *
 * This module now exports:
 *   - createApiClient(baseURL)  — an axios instance pre-configured with auth
 *   - SecurityMiddleware        — a backward-compatible singleton that wraps
 *                                  createApiClient so existing call-sites compile
 */

import axios, { AxiosInstance } from 'axios';
import { waitForMsalReady } from '../contexts/AuthContext';
import SessionManager from '../services/SessionManager';

const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Create a pre-configured axios instance.
 * The request interceptor attaches the MSAL Bearer token when available.
 */
export function createApiClient(baseURL: string): AxiosInstance {
  const client = axios.create({ baseURL, timeout: DEFAULT_TIMEOUT_MS });

  client.interceptors.request.use(async (config) => {
    try {
      await waitForMsalReady();
      const mockToken = localStorage.getItem('mock_token');
      if (mockToken) {
        config.headers['Authorization'] = `Bearer ${mockToken}`;
        return config;
      }
      const { getAccessTokenForApiRequest } = await import('../services/msalAccessToken');
      const token = await getAccessTokenForApiRequest();
      if (token) config.headers['Authorization'] = `Bearer ${token}`;
    } catch {
      // Non-fatal — unauthenticated requests are allowed; the server will 401.
    }
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401) {
        window.dispatchEvent(new CustomEvent('auth-state-changed'));
      }
      return Promise.reject(err);
    },
  );

  return client;
}

// ─── Backward-compatible singleton ──────────────────────────────────────────
// Tests and any remaining call-sites that do SecurityMiddleware.getInstance()
// receive an object that exposes getAxiosInstance().

export class SecurityMiddleware {
  private static _instance: SecurityMiddleware;
  private readonly _client: AxiosInstance;

  private constructor() {
    const baseURL = import.meta.env.VITE_API_URL ?? '';
    this._client = createApiClient(baseURL);
  }

  public static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware._instance) {
      SecurityMiddleware._instance = new SecurityMiddleware();
    }
    return SecurityMiddleware._instance;
  }

  public getAxiosInstance(): AxiosInstance {
    return this._client;
  }

  /** No-op kept for call-site compatibility. */
  public getSessionId(): string {
    return SessionManager.getInstance().getSessionId();
  }
}

export default SecurityMiddleware;
