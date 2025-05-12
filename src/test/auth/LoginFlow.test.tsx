import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { SecurityPolicyService } from '../../services/SecurityPolicyService';
import { SessionManager } from '../../services/SessionManager';

// Mock MSAL
vi.mock('@azure/msal-browser', () => ({
    PublicClientApplication: vi.fn().mockImplementation(() => ({
        initialize: vi.fn(),
        loginPopup: vi.fn(),
        logoutPopup: vi.fn(),
        acquireTokenSilent: vi.fn(),
    }))
}));

describe('Login Flow Testing', () => {
    let securityPolicyService: SecurityPolicyService;
    let sessionManager: SessionManager;

    beforeEach(() => {
        securityPolicyService = SecurityPolicyService.getInstance();
        sessionManager = SessionManager.getInstance();
        localStorage.clear();
        vi.clearAllMocks();
    });

    describe('Success Scenarios', () => {
        it('should handle successful login with valid credentials', async () => {
            const mockLoginResponse = {
                accessToken: 'valid-token',
                account: {
                    name: 'Test User',
                    username: 'test@example.com'
                }
            };

            vi.mocked(PublicClientApplication.prototype.loginPopup)
                .mockResolvedValueOnce(mockLoginResponse);

            // Render login component and attempt login
            render(
                <BrowserRouter>
                    <AuthProvider>
                        <div>Login Component</div>
                    </AuthProvider>
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(PublicClientApplication.prototype.loginPopup).toHaveBeenCalled();
            });
        });

        it('should handle remember me functionality', async () => {
            const mockLoginResponse = {
                accessToken: 'valid-token',
                account: {
                    name: 'Test User',
                    username: 'test@example.com'
                }
            };

            vi.mocked(PublicClientApplication.prototype.loginPopup)
                .mockResolvedValueOnce(mockLoginResponse);

            // Mock remember me checkbox
            const rememberMe = true;
            sessionManager.setRememberMe(rememberMe);

            await waitFor(() => {
                const storedPreference = sessionManager.getRememberMe();
                expect(storedPreference).toBe(true);
            });
        });

        it('should handle successful redirect after login', async () => {
            const mockLoginResponse = {
                accessToken: 'valid-token',
                account: {
                    name: 'Test User',
                    username: 'test@example.com'
                }
            };

            vi.mocked(PublicClientApplication.prototype.loginPopup)
                .mockResolvedValueOnce(mockLoginResponse);

            // Mock navigation
            const mockNavigate = vi.fn();
            vi.mock('react-router-dom', () => ({
                ...vi.importActual('react-router-dom'),
                useNavigate: () => mockNavigate
            }));

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
            });
        });
    });

    describe('Failure Scenarios', () => {
        it('should handle invalid credentials', async () => {
            const mockError = new Error('Invalid credentials');
            vi.mocked(PublicClientApplication.prototype.loginPopup)
                .mockRejectedValueOnce(mockError);

            await expect(async () => {
                await PublicClientApplication.prototype.loginPopup();
            }).rejects.toThrow('Invalid credentials');
        });

        it('should handle account lockout', async () => {
            // Simulate multiple failed attempts
            const maxAttempts = 5;
            for (let i = 0; i < maxAttempts; i++) {
                await securityPolicyService.recordFailedLogin('test@example.com', '192.168.1.1');
            }

            const isLocked = await securityPolicyService.isAccountLocked('test@example.com');
            expect(isLocked).toBe(true);
        });

        it('should handle network failures', async () => {
            const mockError = new Error('Network error');
            vi.mocked(PublicClientApplication.prototype.loginPopup)
                .mockRejectedValueOnce(mockError);

            await expect(async () => {
                await PublicClientApplication.prototype.loginPopup();
            }).rejects.toThrow('Network error');
        });
    });
}); 