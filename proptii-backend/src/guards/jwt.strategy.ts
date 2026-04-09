import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

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
    const authority = process.env.MSAL_AUTHORITY ?? process.env.AZURE_AD_B2C_AUTHORITY ?? '';
    const clientId = process.env.MSAL_CLIENT_ID ?? process.env.AZURE_AD_B2C_CLIENT_ID ?? '';

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
              logger.warn(`MSAL_AUTHORITY is missconfigured or missing. Value: "${authority}". JWT auth disabled.`);
              return { secretOrKey: 'missing-jwks-secret-fallback' };
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
      audience: clientId,
      issuer: authority ? `${authority.replace(/\/$/, '')}/v2.0/` : undefined,
      algorithms: ['RS256'],
    });
  }

  /** The payload is already verified by passport-jwt; return it as the user. */
  async validate(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    return payload;
  }
}
