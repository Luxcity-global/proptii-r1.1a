import type { AuthenticationResult } from '@azure/msal-browser';
import { getMsalInstance, waitForMsalReady } from '../utils/msalInstance';
import { loginRequest, msalConfig } from '../config/authConfig';

/** Three Base64url segments — opaque B2C access tokens are not valid JWTs for our Nest guard. */
function isJwtFormat(token: string): boolean {
  const parts = token.split('.');
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

/**
 * Pick a Bearer string the backend can verify (RS256 + aud = SPA client id).
 * B2C often returns an **opaque** `accessToken` while `idToken` is a JWT — sending the opaque
 * string breaks passport-jwt. If both are JWTs, prefer `idToken` so `aud` matches `MSAL_CLIENT_ID`
 * (access can target another resource after refresh).
 */
function bearerJwtFromResult(r: AuthenticationResult | null | undefined): string | null {
  if (!r) return null;
  const access = r.accessToken?.trim() ?? '';
  const idTok = r.idToken?.trim() ?? '';
  const accessJwt = access && isJwtFormat(access);
  const idJwt = idTok && isJwtFormat(idTok);
  // Prefer id_token when it is a JWT: `aud` matches the SPA app; access_token may be opaque or for another resource.
  if (idJwt) return idTok;
  if (accessJwt) return access;
  return access || idTok || null;
}

/**
 * Returns a Bearer token for API calls: MSAL silent (+ id_token fallback) → ssoSilent → localStorage `auth_token`.
 * Does not open popups (those were flashing closed and only read accessToken, missing id_token).
 */
export async function getAccessTokenForApiRequest(): Promise<string | null> {
  await waitForMsalReady();
  const msalInstance = getMsalInstance();
  const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];

  const fromStorage = () => localStorage.getItem('auth_token');

  if (!account) {
    return fromStorage();
  }

  if (!msalInstance.getActiveAccount()) {
    msalInstance.setActiveAccount(account);
  }

  try {
    const r = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account,
    });
    const t = bearerJwtFromResult(r);
    if (t) return t;
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn('[msal] acquireTokenSilent failed:', e);
    }
  }

  // Hidden iframe SSO — no popup; helps when silent refresh fails but session cookies exist
  try {
    const r = await msalInstance.ssoSilent({
      scopes: loginRequest.scopes,
      authority: msalConfig.auth.authority,
      loginHint: account.username,
    });
    const t = bearerJwtFromResult(r);
    if (t) return t;
  } catch {
    // Expected when no server session or iframe blocked
  }

  return fromStorage();
}
