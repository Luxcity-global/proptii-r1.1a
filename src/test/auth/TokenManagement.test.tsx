import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecurityPolicyService } from '../../services/SecurityPolicyService';
import { SessionManager } from '../../services/SessionManager';
import { msalConfig } from '../../config/authConfig';

// Mock MSAL
vi.mock('@azure/msal-browser', () => ({
    PublicClientApplication: vi.fn().mockImplementation(() => ({
        acquireTokenSilent: vi.fn(),
        acquireTokenPopup: vi.fn(),
        getActiveAccount: vi.fn(),
    }))
}));

describe('Token Management Tests', () => {
    let securityPolicyService: SecurityPolicyService;
    let sessionManager: SessionManager;

    beforeEach(() => {
        securityPolicyService = SecurityPolicyService.getInstance();
        sessionManager = SessionManager.getInstance();
        localStorage.clear();
        vi.clearAllMocks();
    });

    describe('Acquisition Tests', () => {
        it('should handle initial token acquisition', async () => {
            const mockToken = {
                accessToken: 'initial-token',
                idToken: 'initial-id-token',
                expiresOn: new Date(Date.now() + 3600000)
            };

            vi.mocked(PublicClientApplication.prototype.acquireTokenSilent)
                .mockResolvedValueOnce(mockToken);

            const result = await sessionManager.acquireToken();
            expect(result.accessToken).toBe(mockToken.accessToken);
            expect(result.expiresOn).toBeDefined();
        });

        it('should handle silent refresh flow', async () => {
            const mockToken = {
                accessToken: 'refreshed-token',
                idToken: 'refreshed-id-token',
                expiresOn: new Date(Date.now() + 3600000)
            };

            vi.mocked(PublicClientApplication.prototype.acquireTokenSilent)
                .mockResolvedValueOnce(mockToken);

            const result = await sessionManager.refreshTokenSilently();
            expect(result.accessToken).toBe(mockToken.accessToken);
        });

        it('should handle interactive refresh', async () => {
            const mockError = new Error('interaction_required');
            const mockToken = {
                accessToken: 'interactive-token',
                idToken: 'interactive-id-token',
                expiresOn: new Date(Date.now() + 3600000)
            };

            vi.mocked(PublicClientApplication.prototype.acquireTokenSilent)
                .mockRejectedValueOnce(mockError);
            vi.mocked(PublicClientApplication.prototype.acquireTokenPopup)
                .mockResolvedValueOnce(mockToken);

            const result = await sessionManager.acquireToken();
            expect(result.accessToken).toBe(mockToken.accessToken);
        });
    });

    describe('Validation Tests', () => {
        it('should validate token expiration', () => {
            const expiredToken = {
                accessToken: 'expired-token',
                expiresOn: new Date(Date.now() - 1000)
            };

            const isExpired = sessionManager.isTokenExpired(expiredToken);
            expect(isExpired).toBe(true);
        });

        it('should validate token claims', () => {
            const mockClaims = {
                aud: msalConfig.auth.clientId,
                iss: `https://${msalConfig.auth.authority}`,
                exp: Math.floor(Date.now() / 1000) + 3600,
                nbf: Math.floor(Date.now() / 1000),
                roles: ['User']
            };

            const isValid = securityPolicyService.validateTokenClaims(mockClaims);
            expect(isValid).toBe(true);
        });

        it('should validate token signature', async () => {
            const mockToken = 'valid.jwt.token';
            const isValid = await securityPolicyService.validateTokenSignature(mockToken);
            expect(isValid).toBe(true);
        });
    });

    describe('Error Handling', () => {
        it('should handle token acquisition failures', async () => {
            const mockError = new Error('Failed to acquire token');
            vi.mocked(PublicClientApplication.prototype.acquireTokenSilent)
                .mockRejectedValueOnce(mockError);
            vi.mocked(PublicClientApplication.prototype.acquireTokenPopup)
                .mockRejectedValueOnce(mockError);

            await expect(sessionManager.acquireToken()).rejects.toThrow('Failed to acquire token');
        });

        it('should handle invalid tokens', () => {
            const invalidToken = 'invalid.token.format';
            const isValid = securityPolicyService.validateTokenFormat(invalidToken);
            expect(isValid).toBe(false);
        });

        it('should handle token refresh failures', async () => {
            const mockError = new Error('Failed to refresh token');
            vi.mocked(PublicClientApplication.prototype.acquireTokenSilent)
                .mockRejectedValueOnce(mockError);

            await expect(sessionManager.refreshTokenSilently()).rejects.toThrow('Failed to refresh token');
        });
    });
}); 