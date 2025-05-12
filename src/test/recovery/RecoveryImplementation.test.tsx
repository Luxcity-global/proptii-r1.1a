import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecurityPolicyService } from '../../services/SecurityPolicyService';
import { AccountRecoveryService } from '../../services/AccountRecoveryService';
import { SessionManager } from '../../services/SessionManager';

describe('Recovery Implementation Tests', () => {
    let securityPolicyService: SecurityPolicyService;
    let accountRecoveryService: AccountRecoveryService;
    let sessionManager: SessionManager;

    beforeEach(() => {
        securityPolicyService = SecurityPolicyService.getInstance();
        accountRecoveryService = AccountRecoveryService.getInstance();
        sessionManager = SessionManager.getInstance();

        // Clear localStorage before each test
        localStorage.clear();

        // Reset mocks
        vi.clearAllMocks();
    });

    describe('Password Recovery', () => {
        it('should handle password recovery initiation', async () => {
            const email = 'test@example.com';
            const ipAddress = '192.168.1.1';

            await expect(
                securityPolicyService.initiatePasswordRecovery(email, ipAddress)
            ).resolves.not.toThrow();
        });

        it('should enforce rate limits', async () => {
            const email = 'test@example.com';
            const ipAddress = '192.168.1.1';

            // Make multiple attempts
            for (let i = 0; i < 3; i++) {
                await securityPolicyService.initiatePasswordRecovery(email, ipAddress);
            }

            // Next attempt should fail
            await expect(
                securityPolicyService.initiatePasswordRecovery(email, ipAddress)
            ).rejects.toThrow('Hourly password recovery attempt limit exceeded');
        });

        it('should detect suspicious activity', async () => {
            const email = 'test@example.com';
            const suspiciousIP = '10.0.0.1';

            // Mock suspicious IP detection
            vi.spyOn(securityPolicyService as any, 'checkIPReputation')
                .mockResolvedValueOnce({ suspicious: true });

            await expect(
                securityPolicyService.initiatePasswordRecovery(email, suspiciousIP)
            ).rejects.toThrow('High risk recovery attempt detected');
        });
    });

    describe('Account Recovery', () => {
        const mockUser = {
            userId: 'user123',
            email: 'test@example.com',
            deviceInfo: {
                userAgent: 'test-agent',
                platform: 'test-platform',
                language: 'en-US'
            }
        };

        it('should initiate account recovery process', async () => {
            const requestId = await accountRecoveryService.initiateAccountRecovery(
                mockUser.userId,
                mockUser.email,
                '192.168.1.1',
                mockUser.deviceInfo
            );

            expect(requestId).toBeDefined();
        });

        it('should verify recovery request', async () => {
            const requestId = await accountRecoveryService.initiateAccountRecovery(
                mockUser.userId,
                mockUser.email,
                '192.168.1.1',
                mockUser.deviceInfo
            );

            const isVerified = await accountRecoveryService.verifyRecoveryRequest(
                requestId,
                '123456' // Mock verification code
            );

            expect(isVerified).toBe(true);
        });

        it('should handle invalid verification codes', async () => {
            const requestId = await accountRecoveryService.initiateAccountRecovery(
                mockUser.userId,
                mockUser.email,
                '192.168.1.1',
                mockUser.deviceInfo
            );

            await expect(
                accountRecoveryService.verifyRecoveryRequest(requestId, '12345')
            ).rejects.toThrow('Invalid verification code');
        });

        it('should complete account recovery process', async () => {
            const requestId = await accountRecoveryService.initiateAccountRecovery(
                mockUser.userId,
                mockUser.email,
                '192.168.1.1',
                mockUser.deviceInfo
            );

            await accountRecoveryService.verifyRecoveryRequest(requestId, '123456');
            await expect(
                accountRecoveryService.completeAccountRecovery(requestId)
            ).resolves.not.toThrow();
        });
    });

    describe('Session Recovery', () => {
        it('should create and restore from backup', async () => {
            // Create a session
            const activity = {
                type: 'interaction' as const,
                details: 'test activity',
                timestamp: Date.now()
            };

            sessionManager.updateActivity(activity.type, activity.details);

            // Force backup creation
            await (sessionManager as any).createBackup();

            // Clear current session
            (sessionManager as any).sessionState = null;

            // Restore from backup
            const restored = await (sessionManager as any).restoreFromBackup();
            expect(restored).toBe(true);

            const activities = sessionManager.getActivityHistory();
            expect(activities[0].details).toBe(activity.details);
        });

        it('should handle encrypted state storage', async () => {
            const activity = {
                type: 'interaction' as const,
                details: 'encrypted test',
                timestamp: Date.now()
            };

            sessionManager.updateActivity(activity.type, activity.details);
            await (sessionManager as any).saveSessionState();

            // Verify stored data is encrypted
            const stored = localStorage.getItem((sessionManager as any).storageKey);
            expect(stored).not.toContain(activity.details);

            // Should be able to decrypt and load
            const loadedState = await (sessionManager as any).loadSessionState();
            expect(loadedState.activities[0].details).toBe(activity.details);
        });

        it('should handle backup versioning', async () => {
            // Create multiple versions
            for (let i = 0; i < 3; i++) {
                sessionManager.updateActivity('interaction', `activity ${i}`);
                await (sessionManager as any).createBackup();
            }

            // Check version increments
            const backups = Array.from((sessionManager as any).sessionBackups.values());
            expect(backups).toHaveLength(3);
            expect(backups[2].version).toBeGreaterThan(backups[0].version);
        });

        it('should handle storage failures gracefully', async () => {
            // Mock storage failure
            const mockSetItem = vi.spyOn(Storage.prototype, 'setItem')
                .mockImplementationOnce(() => { throw new Error('Storage error'); });

            // Should not throw when storage fails
            await expect(
                (sessionManager as any).saveSessionState()
            ).resolves.not.toThrow();

            mockSetItem.mockRestore();
        });

        it('should resolve multi-tab conflicts', () => {
            const sessionId = 'test-session';
            const conflicts = [
                {
                    sessionId,
                    tabId: 'tab1',
                    timestamp: Date.now() - 1000,
                    changes: { lastActivity: { type: 'interaction', timestamp: Date.now() - 1000 } }
                },
                {
                    sessionId,
                    tabId: 'tab2',
                    timestamp: Date.now(),
                    changes: { lastActivity: { type: 'interaction', timestamp: Date.now() } }
                }
            ];

            (sessionManager as any).sessionState = { sessionId };
            (sessionManager as any).resolveConflict(sessionId, conflicts);

            // Should apply most recent changes
            expect((sessionManager as any).sessionState.lastActivity.timestamp)
                .toBe(conflicts[1].changes.lastActivity.timestamp);
        });
    });
}); 