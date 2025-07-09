import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionManager } from '../../services/SessionManager';
import { SecurityPolicyService } from '../../services/SecurityPolicyService';
import { APIService } from '../../services/APIService';
import { msalConfig } from '../../config/authConfig';

describe('API Integration Tests', () => {
    let sessionManager: SessionManager;
    let securityPolicyService: SecurityPolicyService;
    let apiService: APIService;

    beforeEach(() => {
        sessionManager = SessionManager.getInstance();
        securityPolicyService = SecurityPolicyService.getInstance();
        apiService = APIService.getInstance();
        localStorage.clear();
        sessionStorage.clear();
        vi.clearAllMocks();
    });

    describe('API Authentication Flow', () => {
        it('should handle authenticated API requests', async () => {
            // 1. Setup authentication
            const mockToken = {
                accessToken: 'test-access-token',
                idToken: 'test-id-token',
                expiresOn: new Date(Date.now() + 3600000)
            };

            vi.spyOn(sessionManager, 'getAccessToken')
                .mockResolvedValue(mockToken.accessToken);

            // 2. Make authenticated API request
            const mockResponse = { data: { message: 'Success' } };
            vi.spyOn(apiService, 'request')
                .mockResolvedValue(mockResponse);

            const response = await apiService.get('/api/protected-resource');
            expect(response).toEqual(mockResponse);

            // 3. Verify authorization header
            expect(apiService.request).toHaveBeenCalledWith(
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: `Bearer ${mockToken.accessToken}`
                    })
                })
            );
        });

        it('should handle token refresh during API requests', async () => {
            // 1. Initial expired token
            const expiredToken = {
                accessToken: 'expired-token',
                idToken: 'expired-id-token',
                expiresOn: new Date(Date.now() - 1000)
            };

            // 2. New token after refresh
            const newToken = {
                accessToken: 'new-token',
                idToken: 'new-id-token',
                expiresOn: new Date(Date.now() + 3600000)
            };

            // Mock token expiration check
            vi.spyOn(sessionManager, 'isTokenExpired')
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false);

            // Mock token refresh
            vi.spyOn(sessionManager, 'refreshTokenSilently')
                .mockResolvedValue(newToken);

            // Mock API request
            const mockResponse = { data: { message: 'Success' } };
            vi.spyOn(apiService, 'request')
                .mockResolvedValue(mockResponse);

            // Make request
            const response = await apiService.get('/api/protected-resource');
            expect(response).toEqual(mockResponse);

            // Verify token refresh was called
            expect(sessionManager.refreshTokenSilently).toHaveBeenCalled();
            expect(apiService.request).toHaveBeenCalledWith(
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: `Bearer ${newToken.accessToken}`
                    })
                })
            );
        });
    });

    describe('API Error Handling', () => {
        it('should handle unauthorized errors', async () => {
            // 1. Mock unauthorized response
            vi.spyOn(apiService, 'request')
                .mockRejectedValue({
                    response: {
                        status: 401,
                        data: { message: 'Unauthorized' }
                    }
                });

            // 2. Mock reauth attempt
            const newToken = {
                accessToken: 'reauth-token',
                idToken: 'reauth-id-token',
                expiresOn: new Date(Date.now() + 3600000)
            };

            vi.spyOn(sessionManager, 'reauthenticate')
                .mockResolvedValue(newToken);

            // 3. Mock successful retry
            const mockResponse = { data: { message: 'Success' } };
            vi.spyOn(apiService, 'retryRequest')
                .mockResolvedValue(mockResponse);

            // 4. Make request
            const response = await apiService.get('/api/protected-resource');
            expect(response).toEqual(mockResponse);

            // 5. Verify reauthentication flow
            expect(sessionManager.reauthenticate).toHaveBeenCalled();
            expect(apiService.retryRequest).toHaveBeenCalled();
        });

        it('should handle network errors', async () => {
            // 1. Mock network failure
            vi.spyOn(apiService, 'request')
                .mockRejectedValue(new Error('Network Error'));

            // 2. Mock retry mechanism
            const mockResponse = { data: { message: 'Success' } };
            vi.spyOn(apiService, 'retryWithBackoff')
                .mockResolvedValue(mockResponse);

            // 3. Make request
            const response = await apiService.get('/api/protected-resource');
            expect(response).toEqual(mockResponse);

            // 4. Verify retry mechanism
            expect(apiService.retryWithBackoff).toHaveBeenCalled();
        });

        it('should handle rate limiting', async () => {
            // 1. Mock rate limit response
            vi.spyOn(apiService, 'request')
                .mockRejectedValue({
                    response: {
                        status: 429,
                        headers: {
                            'retry-after': '5'
                        }
                    }
                });

            // 2. Mock retry after delay
            const mockResponse = { data: { message: 'Success' } };
            vi.spyOn(apiService, 'retryAfterDelay')
                .mockResolvedValue(mockResponse);

            // 3. Make request
            const response = await apiService.get('/api/protected-resource');
            expect(response).toEqual(mockResponse);

            // 4. Verify retry with delay
            expect(apiService.retryAfterDelay).toHaveBeenCalledWith(5000);
        });
    });

    describe('API Security Integration', () => {
        it('should handle security policy enforcement', async () => {
            // 1. Set security policies
            await securityPolicyService.updateSecurityPolicies({
                maxRequestsPerMinute: 60,
                requireSecureEndpoints: true
            });

            // 2. Mock rate limit check
            vi.spyOn(securityPolicyService, 'checkRateLimit')
                .mockResolvedValue(true);

            // 3. Mock endpoint security check
            vi.spyOn(securityPolicyService, 'validateEndpoint')
                .mockResolvedValue(true);

            // 4. Make request
            const mockResponse = { data: { message: 'Success' } };
            vi.spyOn(apiService, 'request')
                .mockResolvedValue(mockResponse);

            const response = await apiService.get('/api/protected-resource');
            expect(response).toEqual(mockResponse);

            // 5. Verify security checks
            expect(securityPolicyService.checkRateLimit).toHaveBeenCalled();
            expect(securityPolicyService.validateEndpoint).toHaveBeenCalled();
        });

        it('should handle security violations', async () => {
            // 1. Mock security policy violation
            vi.spyOn(securityPolicyService, 'checkRateLimit')
                .mockResolvedValue(false);

            // 2. Make request
            try {
                await apiService.get('/api/protected-resource');
                fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).toContain('Rate limit exceeded');
            }

            // 3. Verify security response
            expect(securityPolicyService.checkRateLimit).toHaveBeenCalled();
            expect(apiService.request).not.toHaveBeenCalled();
        });
    });
}); 