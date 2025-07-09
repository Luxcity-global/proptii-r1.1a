import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, fireEvent, waitFor } from '@testing-library/react';
import SessionManager from '../../services/SessionManager';
import SecurityMiddleware from '../../middleware/SecurityMiddleware';

// Mock Application Insights
vi.mock('@microsoft/applicationinsights-web', () => ({
    ApplicationInsights: vi.fn().mockImplementation(() => ({
        loadAppInsights: vi.fn(),
        trackEvent: vi.fn(),
    }))
}));

// Mock MSAL
vi.mock('@azure/msal-browser', () => ({
    PublicClientApplication: vi.fn().mockImplementation(() => ({
        initialize: vi.fn(),
        logoutPopup: vi.fn(),
    }))
}));

describe('Session Management', () => {
    let sessionManager: SessionManager;
    let securityMiddleware: SecurityMiddleware;

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();

        // Reset the singleton instances
        vi.resetModules();

        // Get fresh instances
        sessionManager = SessionManager.getInstance();
        securityMiddleware = SecurityMiddleware.getInstance();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Session Tracking', () => {
        it('should create a new session with valid ID', () => {
            const sessionId = sessionManager.getSessionId();
            expect(sessionId).toBeTruthy();
            expect(typeof sessionId).toBe('string');
        });

        it('should track user activity', () => {
            sessionManager.recordActivity('interaction', 'Test activity');
            const lastActivity = sessionManager.getLastActivity();
            expect(lastActivity).toBeTruthy();
            expect(lastActivity?.type).toBe('interaction');
            expect(lastActivity?.details).toBe('Test activity');
        });

        it('should handle multi-tab synchronization', async () => {
            // Simulate activity in first tab
            sessionManager.recordActivity('interaction', 'Tab 1 activity');

            // Simulate storage event from another tab
            const newState = {
                sessionId: 'test-session',
                startTime: Date.now(),
                lastActivity: {
                    timestamp: Date.now(),
                    type: 'interaction' as const,
                    details: 'Tab 2 activity'
                },
                tabId: 'tab-2',
                isActive: true
            };

            // Dispatch storage event
            const storageEvent = new StorageEvent('storage', {
                key: 'app_session_state',
                newValue: JSON.stringify(newState)
            });
            window.dispatchEvent(storageEvent);

            // Wait for state to sync
            await waitFor(() => {
                const lastActivity = sessionManager.getLastActivity();
                expect(lastActivity?.details).toBe('Tab 2 activity');
            });
        });
    });

    describe('Session Security', () => {
        it('should handle session timeout', async () => {
            const mockLogout = vi.fn();
            window.addEventListener('session_timeout', mockLogout);

            // Fast-forward time to trigger timeout
            vi.advanceTimersByTime(31 * 60 * 1000); // 31 minutes

            await waitFor(() => {
                expect(mockLogout).toHaveBeenCalled();
            });

            window.removeEventListener('session_timeout', mockLogout);
        });

        it('should maintain CSRF token', async () => {
            const testToken = 'test-csrf-token';
            await act(async () => {
                await securityMiddleware.refreshCsrfToken();
            });

            const axiosInstance = securityMiddleware.getAxiosInstance();
            expect(axiosInstance.defaults.headers.common['X-CSRF-Token']).toBeTruthy();
        });

        it('should sanitize user input', () => {
            const unsafeInput = '<script>alert("xss")</script>';
            const sanitizedInput = securityMiddleware.sanitizeInput(unsafeInput);
            expect(sanitizedInput).not.toContain('<script>');
        });
    });

    describe('Session Recovery', () => {
        it('should persist session state', () => {
            sessionManager.recordActivity('interaction', 'Test persistence');
            const storedState = localStorage.getItem('app_session_state');
            expect(storedState).toBeTruthy();

            const parsedState = JSON.parse(storedState!);
            expect(parsedState.lastActivity.details).toBe('Test persistence');
        });

        it('should recover from storage failures', () => {
            // Simulate storage error
            const mockSetItem = vi.spyOn(Storage.prototype, 'setItem');
            mockSetItem.mockImplementationOnce(() => {
                throw new Error('Storage full');
            });

            // Should not throw when storage fails
            expect(() => {
                sessionManager.recordActivity('interaction', 'Test recovery');
            }).not.toThrow();

            mockSetItem.mockRestore();
        });

        it('should handle network errors during CSRF refresh', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            // Mock network error
            const axiosInstance = securityMiddleware.getAxiosInstance();
            vi.spyOn(axiosInstance, 'get').mockRejectedValueOnce(new Error('Network error'));

            await expect(securityMiddleware.refreshCsrfToken()).rejects.toThrow('Network error');

            expect(consoleSpy).toHaveBeenCalledWith('Error refreshing CSRF token:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

    describe('Integration Tests', () => {
        it('should handle complete session lifecycle', async () => {
            // Initialize session
            expect(sessionManager.isSessionActive()).toBe(true);

            // Record some activity
            sessionManager.recordActivity('interaction', 'User login');
            expect(sessionManager.getLastActivity()?.details).toBe('User login');

            // Simulate tab switch
            fireEvent.blur(window);
            expect(sessionManager.isSessionActive()).toBe(false);

            fireEvent.focus(window);
            expect(sessionManager.isSessionActive()).toBe(true);

            // Simulate session end
            const mockLogout = vi.fn();
            window.addEventListener('session_timeout', mockLogout);

            // Fast-forward time
            vi.advanceTimersByTime(31 * 60 * 1000);

            await waitFor(() => {
                expect(mockLogout).toHaveBeenCalled();
            });
        });
    });
}); 