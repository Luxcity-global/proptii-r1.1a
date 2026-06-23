import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AppError } from './error-handling';
import { validateEnv } from '../config/environment';
import { jwtDecode } from 'jwt-decode';
import { createRemoteJWKSet, jwtVerify } from 'jose';

interface JwtPayload {
    iss?: string;
    sub?: string;
    aud?: string | string[];
    exp?: number;
    [key: string]: any;
}

export async function authenticate(request: HttpRequest): Promise<void> {
    const config = validateEnv();
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
        throw new AppError(401, 'No authorization header', 'UNAUTHORIZED');
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        throw new AppError(401, 'Invalid authorization header format', 'INVALID_AUTH_FORMAT');
    }

    // Support mock authentication in development mode
    if (config.NODE_ENV === 'development' && token.startsWith('mock-token-')) {
        console.log('🧪 Bypassing real auth for mock token in development');
        return;
    }

    try {
        await validateToken(token, config);
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError(401, 'Authentication failed', 'AUTH_FAILED');
    }
}

async function validateToken(token: string, config: any): Promise<void> {
    try {
        // Decode the token to get the header and payload
        const decoded = jwtDecode<JwtPayload>(token);

        // Get the issuer from the token
        const issuer = decoded.iss;
        if (!issuer) {
            throw new AppError(401, 'Invalid token: missing issuer', 'INVALID_TOKEN');
        }

        // Construct the B2C JWKS endpoint correctly
        const tenantDomain = config.AZURE_AD_B2C_TENANT_NAME || 'proptii.onmicrosoft.com';
        const tenantPrefix = tenantDomain.split('.')[0];
        const policyName = config.AZURE_AD_B2C_POLICY_NAME || 'B2C_1_SignUpandSignInProptii';
        const jwksEndpoint = `https://${tenantPrefix}.b2clogin.com/${tenantDomain}/${policyName}/discovery/v2.0/keys`;

        // Create a JWKS client
        const JWKS = createRemoteJWKSet(new URL(jwksEndpoint));

        // Verify the token
        const { payload } = await jwtVerify(token, JWKS, {
            audience: config.AZURE_AD_B2C_CLIENT_ID,
            algorithms: ['RS256']
        });

        // Validate issuer manually since B2C issuer URLs can vary (tenant ID vs domain, policy inclusion)
        if (!payload.iss || !payload.iss.startsWith(`https://${tenantPrefix}.b2clogin.com/`)) {
            throw new AppError(401, `Invalid token: issuer mismatch (${payload.iss})`, 'INVALID_TOKEN');
        }

        // Validate required claims
        if (!payload.sub || !payload.aud || !payload.exp) {
            throw new AppError(401, 'Invalid token: missing required claims', 'INVALID_TOKEN');
        }

        // Check if token is expired
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        if (Date.now() >= expirationTime) {
            throw new AppError(401, 'Token has expired', 'TOKEN_EXPIRED');
        }

        // Validate audience matches the client ID
        if (payload.aud !== config.AZURE_AD_B2C_CLIENT_ID) {
            throw new AppError(401, 'Invalid token: audience mismatch', 'INVALID_TOKEN');
        }

    } catch (error) {
        console.error('Token validation failed:', error);
        if (error instanceof AppError) throw error;
        const msg = error instanceof Error ? error.message : String(error);
        throw new AppError(401, `Token validation failed: ${msg}`, 'TOKEN_VALIDATION_FAILED');
    }
}

export function withAuth(handler: (request: HttpRequest, context: InvocationContext) => Promise<HttpResponseInit>) {
    return async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        try {
            await authenticate(request);
        } catch (error) {
            if (error instanceof AppError) {
                return { status: error.statusCode, jsonBody: { error: { message: error.message, code: error.code } } };
            }
            return { status: 401, jsonBody: { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } } };
        }
        return handler(request, context);
    };
}