import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, fireEvent, waitFor } from '@testing-library/react';
import { SessionManager } from '../../services/SessionManager';
import { SecurityMiddleware } from '../../middleware/SecurityMiddleware';

// Mock Application Insights
vi.mock('@microsoft/applicationinsights-web', () => ({
    ApplicationInsights: vi.fn().mockImplementation(() => ({
        trackEvent: vi.fn(),
        loadAppInsights: vi.fn()
    }))
}));

// Mock MSAL
vi.mock('@azure/msal-browser', () => ({
    PublicClientApplication: vi.fn().mockImplementation(() => ({
        initialize: vi.fn(),
        acquireTokenSilent: vi.fn(),
        acquireTokenPopup: vi.fn()
    }))
}));

describe('Enhanced Security Features', () => {
    let sessionManager: SessionManager;
    let securityMiddleware: SecurityMiddleware;
    let mockStorage: { [key: string]: string } = {};

    beforeEach(() => {
        // Mock localStorage and sessionStorage
        Storage.prototype.setItem = vi.fn((key, value) => {
            mockStorage[key] = value;
        });
        Storage.prototype.getItem = vi.fn((key) => mockStorage[key] || null);
        Storage.prototype.removeItem = vi.fn((key) => {
            delete mockStorage[key];
        });

        // Reset mocks and storage before each test
        mockStorage = {};
        vi.clearAllMocks();

        // Initialize instances
        sessionManager = SessionManager.getInstance();
        securityMiddleware = SecurityMiddleware.getInstance();
    });

    afterEach(() => {
        vi.clearAllMocks();
        mockStorage = {};
    });

    describe('Session Management', () => {
        describe('Activity Tracking', () => {
            it('should track user interactions correctly', async () => {
                const trackEventSpy = vi.spyOn(sessionManager['appInsights'], 'trackEvent');

                // Simulate user interactions
                act(() => {
                    fireEvent.mouseDown(document.body);
                    fireEvent.keyDown(document.body);
                    fireEvent.scroll(window);
                });

                await waitFor(() => {
                    expect(trackEventSpy).toHaveBeenCalledTimes(3);
                });

                const activities = sessionManager.getActivityHistory();
                expect(activities.length).toBeGreaterThan(0);
                expect(activities[0].type).toBe('interaction');
            });

            it('should handle API call tracking', async () => {
                const mockFetch = vi.fn().mockResolvedValue({ ok: true });
                global.fetch = mockFetch;

                await act(async () => {
                    await fetch('/api/test');
                });

                const activities = sessionManager.getActivityHistory();
                expect(activities.some(a => a.type === 'api_call')).toBe(true);
            });

            it('should maintain activity history within limits', () => {
                const maxActivities = 100;

                // Generate more activities than the limit
                for (let i = 0; i < maxActivities + 10; i++) {
                    act(() => {
                        sessionManager['updateActivity']('interaction', `Activity ${i}`);
                    });
                }

                const activities = sessionManager.getActivityHistory();
                expect(activities.length).toBeLessThanOrEqual(maxActivities);
            });
        });

        describe('Multi-tab Support', () => {
            it('should synchronize session state across tabs', () => {
                // Simulate activity in first tab
                act(() => {
                    sessionManager['updateActivity']('interaction', 'Tab 1 activity');
                });

                // Simulate storage event from another tab
                const newState = {
                    ...sessionManager['sessionState'],
                    activities: [
                        { timestamp: Date.now(), type: 'interaction', details: 'Tab 2 activity' }
                    ]
                };

                act(() => {
                    window.dispatchEvent(
                        new StorageEvent('storage', {
                            key: sessionManager['storageKey'],
                            newValue: JSON.stringify(newState)
                        })
                    );
                });

                const activities = sessionManager.getActivityHistory();
                expect(activities.some(a => a.details === 'Tab 2 activity')).toBe(true);
            });

            it('should handle tab visibility changes', async () => {
                // Simulate tab becoming hidden
                act(() => {
                    Object.defineProperty(document, 'hidden', { value: true, writable: true });
                    document.dispatchEvent(new Event('visibilitychange'));
                });

                await waitFor(() => {
                    const activities = sessionManager.getActivityHistory();
                    expect(activities.some(a => a.type === 'idle')).toBe(true);
                });

                // Simulate tab becoming visible
                act(() => {
                    Object.defineProperty(document, 'hidden', { value: false, writable: true });
                    document.dispatchEvent(new Event('visibilitychange'));
                });

                await waitFor(() => {
                    const activities = sessionManager.getActivityHistory();
                    expect(activities.some(a => a.type === 'interaction')).toBe(true);
                });
            });
        });

        describe('Session Timeout', () => {
            it('should emit warning before session timeout', async () => {
                const warningHandler = vi.fn();
                window.addEventListener('sessionWarning', warningHandler);

                // Fast-forward time to near timeout
                const warningTime = 25 * 60 * 1000; // 25 minutes
                vi.advanceTimersByTime(warningTime);

                await waitFor(() => {
                    expect(warningHandler).toHaveBeenCalled();
                });
            });

            it('should handle session timeout correctly', async () => {
                const timeoutHandler = vi.fn();
                window.addEventListener('sessionEnd', timeoutHandler);

                // Fast-forward time past timeout
                const timeoutDuration = 30 * 60 * 1000; // 30 minutes
                vi.advanceTimersByTime(timeoutDuration);

                await waitFor(() => {
                    expect(timeoutHandler).toHaveBeenCalled();
                    expect(sessionManager['sessionState']?.isActive).toBe(false);
                });
            });
        });
    });

    describe('Security Features', () => {
        describe('CSRF Protection', () => {
            it('should rotate CSRF tokens periodically', async () => {
                const initialToken = securityMiddleware.getCSRFToken();

                // Fast-forward time to token rotation
                vi.advanceTimersByTime(15 * 60 * 1000); // 15 minutes

                const newToken = securityMiddleware.getCSRFToken();
                expect(newToken).not.toBe(initialToken);
            });

            it('should validate form submissions with CSRF token', () => {
                const form = document.createElement('form');
                const tokenInput = document.createElement('input');
                tokenInput.name = 'csrf_token';
                tokenInput.value = securityMiddleware.getCSRFToken();
                form.appendChild(tokenInput);

                const submitEvent = new Event('submit');
                let prevented = false;
                submitEvent.preventDefault = () => { prevented = true; };

                act(() => {
                    form.dispatchEvent(submitEvent);
                });

                expect(prevented).toBe(false);
            });

            it('should block form submissions with invalid CSRF token', () => {
                const form = document.createElement('form');
                const tokenInput = document.createElement('input');
                tokenInput.name = 'csrf_token';
                tokenInput.value = 'invalid_token';
                form.appendChild(tokenInput);

                const submitEvent = new Event('submit');
                let prevented = false;
                submitEvent.preventDefault = () => { prevented = true; };

                act(() => {
                    form.dispatchEvent(submitEvent);
                });

                expect(prevented).toBe(true);
            });
        });

        describe('XSS Protection', () => {
            it('should detect and handle XSS attempts', () => {
                const errorEvent = new ErrorEvent('error', {
                    error: new Error('<script>alert("xss")</script>'),
                    message: 'Suspicious content detected'
                });

                act(() => {
                    window.dispatchEvent(errorEvent);
                });

                // Verify that the XSS attempt was logged
                expect(securityMiddleware['appInsights'].trackEvent).toHaveBeenCalledWith(
                    expect.objectContaining({
                        name: 'Security_XSSAttempt'
                    })
                );
            });

            it('should properly set security headers', () => {
                const headers = document.querySelectorAll('meta[http-equiv]');
                const headerValues = Array.from(headers).map(h => h.getAttribute('http-equiv'));

                expect(headerValues).toContain('Content-Security-Policy');
                expect(headerValues).toContain('X-XSS-Protection');
                expect(headerValues).toContain('X-Content-Type-Options');
            });
        });

        describe('Security Event Logging', () => {
            it('should log security-related events', () => {
                const trackEventSpy = vi.spyOn(securityMiddleware['appInsights'], 'trackEvent');

                // Simulate security event
                act(() => {
                    securityMiddleware['logSecurityEvent']('TestEvent', { test: true });
                });

                expect(trackEventSpy).toHaveBeenCalledWith(
                    expect.objectContaining({
                        name: 'Security_TestEvent',
                        properties: expect.objectContaining({
                            test: true
                        })
                    })
                );
            });

            it('should include necessary context in security logs', () => {
                const trackEventSpy = vi.spyOn(securityMiddleware['appInsights'], 'trackEvent');

                act(() => {
                    securityMiddleware['logSecurityEvent']('ContextTest');
                });

                expect(trackEventSpy).toHaveBeenCalledWith(
                    expect.objectContaining({
                        properties: expect.objectContaining({
                            sessionId: expect.any(String),
                            timestamp: expect.any(String)
                        })
                    })
                );
            });
        });
    });
}); 