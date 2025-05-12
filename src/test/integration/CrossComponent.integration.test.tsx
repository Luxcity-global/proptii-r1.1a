import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { SecurityPolicyService } from '../../services/SecurityPolicyService';
import { SessionManager } from '../../services/SessionManager';
import { APIService } from '../../services/APIService';
import { AccountRecoveryService } from '../../services/AccountRecoveryService';

// Mock components
const MockDashboard = () => <div>Dashboard</div>;
const MockProfile = () => <div>Profile</div>;
const MockSettings = () => <div>Settings</div>;
const MockLogin = () => <div>Login</div>;

describe('Cross-Component Integration', () => {
    let securityPolicyService: SecurityPolicyService;
    let sessionManager: SessionManager;
    let apiService: APIService;
    let accountRecoveryService: AccountRecoveryService;

    beforeEach(() => {
        securityPolicyService = SecurityPolicyService.getInstance();
        sessionManager = SessionManager.getInstance();
        apiService = APIService.getInstance();
        accountRecoveryService = AccountRecoveryService.getInstance();
        localStorage.clear();
        sessionStorage.clear();
        vi.clearAllMocks();
    });

    const renderApp = (initialRoute = '/') => {
        return render(
            <BrowserRouter>
                <AuthProvider>
                    <Routes>
                        <Route path="/dashboard" element={<MockDashboard />} />
                        <Route path="/profile" element={<MockProfile />} />
                        <Route path="/settings" element={<MockSettings />} />
                        <Route path="/login" element={<MockLogin />} />
                    </Routes>
                </AuthProvider>
            </BrowserRouter>
        );
    };

    describe('Navigation and Authentication State', () => {
        it('should maintain authentication state across navigation', async () => {
            // 1. Initial authentication
            const mockToken = {
                accessToken: 'test-token',
                idToken: 'test-id-token',
                expiresOn: new Date(Date.now() + 3600000)
            };

            vi.spyOn(sessionManager, 'getAccessToken')
                .mockResolvedValue(mockToken.accessToken);

            // 2. Render app
            renderApp('/dashboard');

            // 3. Navigate between routes
            const mockNavigate = vi.fn();
            vi.mock('react-router-dom', () => ({
                ...vi.importActual('react-router-dom'),
                useNavigate: () => mockNavigate
            }));

            // Navigate to profile
            mockNavigate('/profile');
            await waitFor(() => {
                expect(screen.getByText('Profile')).toBeInTheDocument();
            });

            // Verify authentication state maintained
            expect(sessionManager.isSessionActive()).toBe(true);

            // Navigate to settings
            mockNavigate('/settings');
            await waitFor(() => {
                expect(screen.getByText('Settings')).toBeInTheDocument();
            });

            // Verify authentication state still maintained
            expect(sessionManager.isSessionActive()).toBe(true);
        });

        it('should handle session expiration during navigation', async () => {
            // 1. Initial authentication
            const mockToken = {
                accessToken: 'test-token',
                idToken: 'test-id-token',
                expiresOn: new Date(Date.now() + 3600000)
            };

            vi.spyOn(sessionManager, 'getAccessToken')
                .mockResolvedValue(mockToken.accessToken);

            // 2. Render app
            renderApp('/dashboard');

            // 3. Simulate session expiration
            vi.spyOn(sessionManager, 'isSessionActive')
                .mockReturnValue(false);

            // 4. Navigate to protected route
            const mockNavigate = vi.fn();
            vi.mock('react-router-dom', () => ({
                ...vi.importActual('react-router-dom'),
                useNavigate: () => mockNavigate
            }));

            mockNavigate('/profile');
            await waitFor(() => {
                expect(screen.getByText('Login')).toBeInTheDocument();
            });
        });
    });

    describe('Component Data Synchronization', () => {
        it('should synchronize user data across components', async () => {
            // 1. Mock user data
            const mockUserData = {
                id: 'user-1',
                name: 'Test User',
                email: 'test@example.com',
                preferences: {
                    theme: 'dark',
                    notifications: true
                }
            };

            // 2. Mock API responses
            vi.spyOn(apiService, 'get')
                .mockResolvedValue({ data: mockUserData });

            // 3. Render components
            renderApp('/profile');

            // 4. Update user preferences
            const updatedPreferences = {
                ...mockUserData.preferences,
                theme: 'light'
            };

            vi.spyOn(apiService, 'put')
                .mockResolvedValue({ data: { ...mockUserData, preferences: updatedPreferences } });

            // 5. Verify data synchronization
            await waitFor(() => {
                expect(screen.getByText('Profile')).toBeInTheDocument();
            });

            // Navigate to settings
            const mockNavigate = vi.fn();
            vi.mock('react-router-dom', () => ({
                ...vi.importActual('react-router-dom'),
                useNavigate: () => mockNavigate
            }));

            mockNavigate('/settings');
            await waitFor(() => {
                expect(screen.getByText('Settings')).toBeInTheDocument();
            });

            // Verify updated preferences reflected
            expect(apiService.get).toHaveBeenCalledWith('/api/user/preferences');
            expect(apiService.put).toHaveBeenCalledWith('/api/user/preferences', updatedPreferences);
        });
    });

    describe('Security Policy Enforcement', () => {
        it('should enforce security policies across components', async () => {
            // 1. Set security policies
            const policies = {
                requireMFA: true,
                sessionTimeout: 30,
                maxFailedAttempts: 3
            };

            await securityPolicyService.updateSecurityPolicies(policies);

            // 2. Mock authentication
            const mockToken = {
                accessToken: 'test-token',
                idToken: 'test-id-token',
                expiresOn: new Date(Date.now() + 3600000)
            };

            vi.spyOn(sessionManager, 'getAccessToken')
                .mockResolvedValue(mockToken.accessToken);

            // 3. Render app
            renderApp('/dashboard');

            // 4. Verify MFA requirement
            const mfaRequired = await securityPolicyService.checkMFARequirement();
            expect(mfaRequired).toBe(true);

            // 5. Navigate to sensitive section
            const mockNavigate = vi.fn();
            vi.mock('react-router-dom', () => ({
                ...vi.importActual('react-router-dom'),
                useNavigate: () => mockNavigate
            }));

            mockNavigate('/settings');
            await waitFor(() => {
                expect(screen.getByText('Settings')).toBeInTheDocument();
            });

            // 6. Verify security checks maintained
            expect(securityPolicyService.checkMFARequirement).toHaveBeenCalled();
        });

        it('should handle security violations across components', async () => {
            // 1. Set security policies
            const policies = {
                requireMFA: true,
                sessionTimeout: 30,
                maxFailedAttempts: 3
            };

            await securityPolicyService.updateSecurityPolicies(policies);

            // 2. Mock failed authentication attempts
            for (let i = 0; i < policies.maxFailedAttempts; i++) {
                await securityPolicyService.recordFailedAttempt('test@example.com');
            }

            // 3. Verify account lockout
            const isLocked = await securityPolicyService.isAccountLocked('test@example.com');
            expect(isLocked).toBe(true);

            // 4. Attempt navigation
            renderApp('/dashboard');
            await waitFor(() => {
                expect(screen.getByText('Login')).toBeInTheDocument();
            });

            // 5. Verify security state maintained
            expect(securityPolicyService.isAccountLocked).toHaveBeenCalled();
        });
    });

    describe('Error Recovery Across Components', () => {
        it('should handle error recovery across navigation', async () => {
            // 1. Initial error state
            const errorState = {
                type: 'auth_error',
                message: 'Session expired',
                timestamp: Date.now()
            };

            vi.spyOn(sessionManager, 'handleError')
                .mockImplementation(async () => {
                    // Simulate error recovery
                    await sessionManager.clearError();
                    return true;
                });

            // 2. Render app with error
            renderApp('/dashboard');
            sessionManager.setError(errorState);

            // 3. Trigger error recovery
            await sessionManager.handleError();

            // 4. Navigate to verify error state cleared
            const mockNavigate = vi.fn();
            vi.mock('react-router-dom', () => ({
                ...vi.importActual('react-router-dom'),
                useNavigate: () => mockNavigate
            }));

            mockNavigate('/profile');
            await waitFor(() => {
                expect(screen.getByText('Profile')).toBeInTheDocument();
            });

            // 5. Verify error state
            expect(sessionManager.getError()).toBeNull();
        });

        it('should synchronize error recovery across components', async () => {
            // 1. Setup error handlers
            const errorHandlers = {
                dashboard: vi.fn(),
                profile: vi.fn(),
                settings: vi.fn()
            };

            // 2. Mock error state
            const errorState = {
                type: 'network_error',
                message: 'API unavailable',
                timestamp: Date.now()
            };

            // 3. Render app
            renderApp('/dashboard');
            sessionManager.setError(errorState);

            // 4. Verify error handled in current component
            expect(errorHandlers.dashboard).toHaveBeenCalled();

            // 5. Navigate to other components
            const mockNavigate = vi.fn();
            vi.mock('react-router-dom', () => ({
                ...vi.importActual('react-router-dom'),
                useNavigate: () => mockNavigate
            }));

            // Navigate and verify error state maintained
            mockNavigate('/profile');
            await waitFor(() => {
                expect(screen.getByText('Profile')).toBeInTheDocument();
                expect(errorHandlers.profile).toHaveBeenCalled();
            });

            mockNavigate('/settings');
            await waitFor(() => {
                expect(screen.getByText('Settings')).toBeInTheDocument();
                expect(errorHandlers.settings).toHaveBeenCalled();
            });
        });
    });
}); 