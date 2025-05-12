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

        // Get the JWKS endpoint from the issuer
        const jwksEndpoint = `${issuer}/discovery/v2.0/keys`;
        
        // Create a JWKS client
        const JWKS = createRemoteJWKSet(new URL(jwksEndpoint));

        // Verify the token
        const { payload } = await jwtVerify(token, JWKS, {
            issuer: config.AZURE_AD_B2C_ISSUER,
            audience: config.AZURE_AD_B2C_CLIENT_ID,
            algorithms: ['RS256']
        });

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
        if (error instanceof AppError) throw error;
        throw new AppError(401, 'Token validation failed', 'TOKEN_VALIDATION_FAILED');
    }
}

export function withAuth(handler: (request: HttpRequest, context: InvocationContext) => Promise<HttpResponseInit>) {
    return async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        await authenticate(request);
        return handler(request, context);
    };
} 