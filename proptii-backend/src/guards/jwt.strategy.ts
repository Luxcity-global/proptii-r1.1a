import { Injectable, Logger } from '@nestjs/common';
import { getFirestore } from '../config/firestore.config';

const roleCache = new Map<string, { role: string; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * B2C policy base URL only — no trailing /v2.0/ (Nest appends that for `iss` checks and builds JWKS URL).
 * Wrong: .../B2C_1_xxx/v2.0/  → would produce .../v2.0/discovery/... and .../v2.0/v2.0/ (invalid).
 */
function normalizeB2cAuthority(raw: string): string {
  if (!raw?.trim()) return '';
  let a = raw.trim().replace(/\/+$/, '');
  a = a.replace(/\/v2\.0$/i, '');
  return a;
}

/**
 * JWT strategy that validates Bearer tokens against the Azure AD B2C JWKS endpoint.
 * The JWKS URI follows the pattern:
 *   https://<tenant>.b2clogin.com/<tenant>.onmicrosoft.com/<policy>/discovery/v2.0/keys
 *
 * Required env vars:
 *   MSAL_AUTHORITY (or AZURE_AD_B2C_AUTHORITY)  – e.g. https://proptii.b2clogin.com/proptii.onmicrosoft.com/B2C_1_signupsignin
 *   MSAL_CLIENT_ID (or AZURE_AD_B2C_CLIENT_ID)  – Azure AD B2C application (client) ID
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const rawAuthority = process.env.MSAL_AUTHORITY ?? process.env.AZURE_AD_B2C_AUTHORITY ?? '';
    const authority = normalizeB2cAuthority(rawAuthority);
    const clientId = process.env.MSAL_CLIENT_ID ?? process.env.AZURE_AD_B2C_CLIENT_ID ?? '';
    const extraAudiences = (process.env.MSAL_ADDITIONAL_AUDIENCES ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    /** B2C access tokens sometimes use `aud` = client GUID, sometimes an app-id URI — allow both. */
    const audienceList = [clientId, ...extraAudiences].filter(Boolean);

    // IMPORTANT: `jwks-rsa` pulls in `jose` which is ESM.
    // Jest (CommonJS) can't parse it by default, breaking e2e tests.
    // For Jest runs we use a simple static secret so passport-jwt can still reject
    // missing/invalid tokens without loading `jwks-rsa`.
    const isJestTestEnv = process.env.NODE_ENV === 'test';
    const jwksUri = authority
      ? `${authority.replace(/\/$/, '')}/discovery/v2.0/keys`
      : '';

    super({
      ...(isJestTestEnv
        ? { secretOrKey: process.env.JWT_TEST_SECRET ?? 'test-jwt-secret' }
        : (() => {
            if (!jwksUri || !jwksUri.startsWith('http')) {
              const logger = new Logger('JwtStrategy');
              logger.warn(`MSAL_AUTHORITY is missconfigured or missing. Value: "${rawAuthority}". JWT auth disabled.`);
              return { secretOrKey: 'missing-jwks-secret-fallback' };
            }
            if (!clientId) {
              const logger = new Logger('JwtStrategy');
              logger.warn(
                'MSAL_CLIENT_ID is empty — set it to the same value as VITE_AZURE_AD_CLIENT_ID (SPA app ID) or JWT validation will fail.',
              );
            }
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { passportJwtSecret } = require('jwks-rsa') as typeof import('jwks-rsa');
            return {
              secretOrKeyProvider: passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri,
              }),
            };
          })()),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ...(audienceList.length > 0
        ? {
            audience:
              audienceList.length === 1 ? audienceList[0] : audienceList,
          }
        : {}),
      /**
       * Do not set `issuer` by default. Azure AD B2C access token `iss` often does **not** equal
       * `${MSAL_AUTHORITY}/v2.0/` — it may use a tenant GUID path, `tfp/`, or token compatibility
       * settings. A wrong `issuer` makes every valid token fail verification while the UI is signed in.
       * Signature is still verified via JWKS from your authority; `aud` must match `MSAL_CLIENT_ID`.
       * Optional strict check: set env `JWT_EXPECTED_ISSUER` to the exact `iss` from jwt.ms.
       */
      ...(process.env.JWT_EXPECTED_ISSUER?.trim()
        ? { issuer: process.env.JWT_EXPECTED_ISSUER.trim() }
        : {}),
      algorithms: ['RS256'],
    });

    if (!isJestTestEnv && jwksUri?.startsWith('http') && clientId && process.env.NODE_ENV !== 'production') {
      const log = new Logger('JwtStrategy');
      log.log(
        `JWT validation enabled — authority ends with …${authority.length > 48 ? authority.slice(-48) : authority}; audience clientId prefix ${clientId.slice(0, 8)}… (must match SPA VITE_AZURE_AD_CLIENT_ID)`,
      );
    }
  }

  /** The payload is already verified by passport-jwt; return it as the user. */
  async validate(payload: Record<string, any>): Promise<Record<string, any>> {
    let role = 'tenant';
    const email = payload.emails?.[0] || payload.email || payload.preferred_username;
    
    if (email) {
      const emailLower = email.toLowerCase();
      const cached = roleCache.get(emailLower);
      if (cached && cached.expires > Date.now()) {
        role = cached.role;
      } else {
        const firestore = getFirestore();
        if (firestore) {
          try {
            const snapshot = await firestore.collection('landlordUsers')
              .where('email', '==', emailLower)
              .limit(1)
              .get();
            if (!snapshot.empty) {
              const docRole = snapshot.docs[0].data().role;
              if (docRole === 'landlord' || docRole === 'agent') {
                role = docRole;
              }
            }
            roleCache.set(emailLower, { role, expires: Date.now() + CACHE_TTL_MS });
          } catch (err) {
            Logger.error(`Error resolving role for ${email}:`, err, 'JwtStrategy');
          }
        }
      }
    }
    
    return { ...payload, role };
  }
}
