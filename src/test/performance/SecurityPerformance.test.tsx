import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecurityPolicyService } from '../../services/SecurityPolicyService';
import { AccountRecoveryService } from '../../services/AccountRecoveryService';
import { SessionManager } from '../../services/SessionManager';

describe('Security Performance Testing', () => {
    let securityPolicyService: SecurityPolicyService;
    let accountRecoveryService: AccountRecoveryService;
    let sessionManager: SessionManager;
    let performanceObserver: PerformanceObserver;
    const performanceEntries: PerformanceEntry[] = [];

    beforeEach(() => {
        securityPolicyService = SecurityPolicyService.getInstance();
        accountRecoveryService = AccountRecoveryService.getInstance();
        sessionManager = SessionManager.getInstance();
        localStorage.clear();
        vi.clearAllMocks();

        // Setup Performance Observer
        performanceObserver = new PerformanceObserver((list) => {
            performanceEntries.push(...list.getEntries());
        });
        performanceObserver.observe({ entryTypes: ['measure'] });
    });

    describe('Token Management Performance', () => {
        it('should maintain performance under high token refresh load', async () => {
            performance.mark('tokenRefresh-start');

            // Simulate multiple token refreshes
            const refreshes = Array(100).fill(null).map(() => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        securityPolicyService.refreshToken();
                        resolve(true);
                    }, Math.random() * 100);
                });
            });

            await Promise.all(refreshes);
            performance.mark('tokenRefresh-end');
            performance.measure('tokenRefresh', 'tokenRefresh-start', 'tokenRefresh-end');

            const measure = performanceEntries.find(entry => entry.name === 'tokenRefresh');
            expect(measure?.duration).toBeLessThan(5000); // Should complete within 5 seconds
        });

        it('should handle concurrent token validations efficiently', async () => {
            const mockToken = 'mock.jwt.token';
            performance.mark('tokenValidation-start');

            // Simulate concurrent token validations
            const validations = Array(1000).fill(null).map(() => {
                return securityPolicyService.validateToken(mockToken);
            });

            await Promise.all(validations);
            performance.mark('tokenValidation-end');
            performance.measure('tokenValidation', 'tokenValidation-start', 'tokenValidation-end');

            const measure = performanceEntries.find(entry => entry.name === 'tokenValidation');
            expect(measure?.duration).toBeLessThan(1000); // Should complete within 1 second
        });
    });

    describe('Session Management Performance', () => {
        it('should maintain performance with multiple active sessions', async () => {
            performance.mark('sessionManagement-start');

            // Simulate multiple session activities
            for (let i = 0; i < 100; i++) {
                sessionManager.updateActivity('interaction', `test activity ${i}`);
                await (sessionManager as any).createBackup();
            }

            performance.mark('sessionManagement-end');
            performance.measure('sessionManagement', 'sessionManagement-start', 'sessionManagement-end');

            const measure = performanceEntries.find(entry => entry.name === 'sessionManagement');
            expect(measure?.duration).toBeLessThan(2000); // Should complete within 2 seconds
        });

        it('should handle rapid session state changes efficiently', async () => {
            performance.mark('stateChanges-start');

            // Simulate rapid state changes
            const stateChanges = Array(500).fill(null).map((_, index) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        sessionManager.updateActivity('interaction', `rapid change ${index}`);
                        resolve(true);
                    }, Math.random() * 10);
                });
            });

            await Promise.all(stateChanges);
            performance.mark('stateChanges-end');
            performance.measure('stateChanges', 'stateChanges-start', 'stateChanges-end');

            const measure = performanceEntries.find(entry => entry.name === 'stateChanges');
            expect(measure?.duration).toBeLessThan(1000); // Should complete within 1 second
        });
    });

    describe('Recovery Process Performance', () => {
        const mockUser = {
            userId: 'user123',
            email: 'test@example.com',
            deviceInfo: {
                userAgent: 'test-agent',
                platform: 'test-platform',
                language: 'en-US'
            }
        };

        it('should handle multiple concurrent recovery requests efficiently', async () => {
            performance.mark('concurrentRecovery-start');

            // Simulate concurrent recovery requests
            const recoveryRequests = Array(50).fill(null).map((_, index) => {
                return accountRecoveryService.initiateAccountRecovery(
                    `user${index}`,
                    `test${index}@example.com`,
                    '192.168.1.1',
                    mockUser.deviceInfo
                );
            });

            await Promise.all(recoveryRequests);
            performance.mark('concurrentRecovery-end');
            performance.measure('concurrentRecovery', 'concurrentRecovery-start', 'concurrentRecovery-end');

            const measure = performanceEntries.find(entry => entry.name === 'concurrentRecovery');
            expect(measure?.duration).toBeLessThan(3000); // Should complete within 3 seconds
        });

        it('should maintain performance during backup operations', async () => {
            performance.mark('backupOperations-start');

            // Simulate intensive backup operations
            const backupOperations = Array(100).fill(null).map(async () => {
                sessionManager.updateActivity('interaction', 'backup test');
                await (sessionManager as any).createBackup();
                await (sessionManager as any).restoreFromBackup();
            });

            await Promise.all(backupOperations);
            performance.mark('backupOperations-end');
            performance.measure('backupOperations', 'backupOperations-start', 'backupOperations-end');

            const measure = performanceEntries.find(entry => entry.name === 'backupOperations');
            expect(measure?.duration).toBeLessThan(5000); // Should complete within 5 seconds
        });
    });

    describe('Memory Usage Monitoring', () => {
        it('should maintain stable memory usage during intensive operations', async () => {
            const initialMemory = performance.memory?.usedJSHeapSize;

            // Perform intensive operations
            for (let i = 0; i < 1000; i++) {
                sessionManager.updateActivity('interaction', `memory test ${i}`);
                await (sessionManager as any).createBackup();
            }

            const finalMemory = performance.memory?.usedJSHeapSize;
            const memoryIncrease = finalMemory - initialMemory;

            // Memory increase should be reasonable (less than 50MB)
            expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
        });
    });
}); 