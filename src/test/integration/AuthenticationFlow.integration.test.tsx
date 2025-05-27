import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { SecurityPolicyService } from '../../services/SecurityPolicyService';
import { SessionManager } from '../../services/SessionManager';
import { AccountRecoveryService } from '../../services/AccountRecoveryService';
import { msalConfig } from '../../config/authConfig';

// Mock MSAL
vi.mock('@azure/msal-browser', () => ({
    PublicClientApplication: vi.fn().mockImplementation(() => ({
        initialize: vi.fn(),
        loginPopup: vi.fn(),
        logoutPopup: vi.fn(),
        acquireTokenSilent: vi.fn(),
        acquireTokenPopup: vi.fn()
    }))
}));

describe('Authentication Flow Integration', () => {
    let securityPolicyService: SecurityPolicyService;
    let sessionManager: SessionManager;
    let accountRecoveryService: AccountRecoveryService;

    beforeEach(() => {
        securityPolicyService = SecurityPolicyService.getInstance();
        sessionManager = SessionManager.getInstance();
        accountRecoveryService = AccountRecoveryService.getInstance();
        localStorage.clear();
        sessionStorage.clear();
        vi.clearAllMocks();
    });

    describe('Complete Authentication Lifecycle', () => {
        it('should handle full authentication lifecycle with MFA', async () => {
            // Initial state check
            expect(sessionManager.isSessionActive()).toBe(false);
            expect(securityPolicyService.getMFAStatus()).toBe(null);

            // 1. Initial login attempt
            const mockLoginResponse = {
                accessToken: 'initial-token',
                account: {
                    name: 'Test User',
                    username: 'test@example.com'
                }
            };

            vi.mocked(PublicClientApplication.prototype.loginPopup)
                .mockResolvedValueOnce(mockLoginResponse);

            // Trigger login
            await sessionManager.login();
            expect(sessionManager.isSessionActive()).toBe(true);

            // 2. MFA Challenge
            const mfaResponse = await securityPolicyService.initiateMFAChallenge();
            expect(mfaResponse.challengeId).toBeDefined();

            // Verify MFA
            const mockMFACode = '123456';
            const mfaVerification = await securityPolicyService.verifyMFAChallenge(
                mfaResponse.challengeId,
                mockMFACode
            );
            expect(mfaVerification.success).toBe(true);

            // 3. Token acquisition and refresh
            const mockToken = {
                accessToken: 'refreshed-token',
                idToken: 'refreshed-id-token',
                expiresOn: new Date(Date.now() + 3600000)
            };

            vi.mocked(PublicClientApplication.prototype.acquireTokenSilent)
                .mockResolvedValueOnce(mockToken);

            const tokenResult = await sessionManager.refreshTokenSilently();
            expect(tokenResult.accessToken).toBe(mockToken.accessToken);

            // 4. Session activity monitoring
            sessionManager.recordActivity('page_navigation', '/dashboard');
            const lastActivity = sessionManager.getLastActivity();
            expect(lastActivity?.type).toBe('page_navigation');

            // 5. Logout process
            await sessionManager.logout();
            expect(sessionManager.isSessionActive()).toBe(false);
        });

        it('should handle authentication with device registration and recovery', async () => {
            // 1. Device Registration
            const deviceInfo = {
                platform: 'web',
                userAgent: navigator.userAgent,
                deviceId: 'test-device-id'
            };

            const registrationResult = await securityPolicyService.registerDevice(deviceInfo);
            expect(registrationResult.success).toBe(true);

            // 2. Authentication with registered device
            const mockLoginResponse = {
                accessToken: 'device-token',
                account: {
                    name: 'Test User',
                    username: 'test@example.com'
                }
            };

            vi.mocked(PublicClientApplication.prototype.loginPopup)
                .mockResolvedValueOnce(mockLoginResponse);

            await sessionManager.login();
            expect(sessionManager.isSessionActive()).toBe(true);

            // 3. Device verification
            const verificationResult = await securityPolicyService.verifyDevice(deviceInfo.deviceId);
            expect(verificationResult.verified).toBe(true);

            // 4. Simulate device loss and recovery
            const recoveryRequest = {
                userId: 'test-user',
                email: 'test@example.com',
                deviceInfo: {
                    platform: 'web',
                    userAgent: navigator.userAgent,
                    deviceId: 'new-device-id'
                }
            };

            const recoveryResult = await accountRecoveryService.initiateDeviceRecovery(recoveryRequest);
            expect(recoveryResult.recoveryToken).toBeDefined();

            // 5. Complete recovery process
            const completionResult = await accountRecoveryService.completeDeviceRecovery(
                recoveryResult.recoveryToken,
                recoveryRequest.deviceInfo
            );
            expect(completionResult.success).toBe(true);
        });
    });

    describe('Error Handling and Recovery', () => {
        it('should handle network interruptions during authentication', async () => {
            // 1. Simulate network error during login
            vi.mocked(PublicClientApplication.prototype.loginPopup)
                .mockRejectedValueOnce(new Error('Network Error'));

            try {
                await sessionManager.login();
            } catch (error) {
                expect(error.message).toBe('Network Error');
            }

            // 2. Retry mechanism
            const mockLoginResponse = {
                accessToken: 'retry-token',
                account: {
                    name: 'Test User',
                    username: 'test@example.com'
                }
            };

            vi.mocked(PublicClientApplication.prototype.loginPopup)
                .mockResolvedValueOnce(mockLoginResponse);

            const retryResult = await sessionManager.retryLogin();
            expect(retryResult.success).toBe(true);

            // 3. Verify session state after recovery
            expect(sessionManager.isSessionActive()).toBe(true);
        });

        it('should handle token refresh failures', async () => {
            // 1. Initial successful login
            const mockLoginResponse = {
                accessToken: 'initial-token',
                account: {
                    name: 'Test User',
                    username: 'test@example.com'
                }
            };

            vi.mocked(PublicClientApplication.prototype.loginPopup)
                .mockResolvedValueOnce(mockLoginResponse);

            await sessionManager.login();

            // 2. Simulate token refresh failure
            vi.mocked(PublicClientApplication.prototype.acquireTokenSilent)
                .mockRejectedValueOnce(new Error('Refresh Failed'));

            // 3. Attempt interactive token acquisition
            const mockInteractiveToken = {
                accessToken: 'interactive-token',
                idToken: 'interactive-id-token',
                expiresOn: new Date(Date.now() + 3600000)
            };

            vi.mocked(PublicClientApplication.prototype.acquireTokenPopup)
                .mockResolvedValueOnce(mockInteractiveToken);

            const refreshResult = await sessionManager.handleTokenRefreshFailure();
            expect(refreshResult.accessToken).toBe(mockInteractiveToken.accessToken);

            // 4. Verify session continuity
            expect(sessionManager.isSessionActive()).toBe(true);
        });
    });

    describe('Security Policy Integration', () => {
        it('should enforce security policies during authentication', async () => {
            // 1. Set security policies
            await securityPolicyService.updateSecurityPolicies({
                requireMFA: true,
                passwordComplexity: 'high',
                sessionTimeout: 30, // minutes
                allowedIPs: ['192.168.1.*']
            });

            // 2. Attempt login with policy checks
            const mockLoginResponse = {
                accessToken: 'policy-token',
                account: {
                    name: 'Test User',
                    username: 'test@example.com'
                }
            };

            vi.mocked(PublicClientApplication.prototype.loginPopup)
                .mockResolvedValueOnce(mockLoginResponse);

            await sessionManager.login();

            // 3. Verify MFA requirement
            const mfaRequired = await securityPolicyService.checkMFARequirement();
            expect(mfaRequired).toBe(true);

            // 4. Complete MFA verification
            const mfaResult = await securityPolicyService.completeMFAVerification('123456');
            expect(mfaResult.success).toBe(true);

            // 5. Session timeout check
            vi.advanceTimersByTime(31 * 60 * 1000); // Advance past timeout
            expect(sessionManager.isSessionActive()).toBe(false);
        });
    });
}); 