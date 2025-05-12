import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecurityPolicyService } from '../../services/SecurityPolicyService';
import { AccountRecoveryService } from '../../services/AccountRecoveryService';
import { SessionManager } from '../../services/SessionManager';

describe('MFA Implementation Tests', () => {
    let securityPolicyService: SecurityPolicyService;
    let accountRecoveryService: AccountRecoveryService;
    let sessionManager: SessionManager;

    beforeEach(() => {
        securityPolicyService = SecurityPolicyService.getInstance();
        accountRecoveryService = AccountRecoveryService.getInstance();
        sessionManager = SessionManager.getInstance();
        localStorage.clear();
        vi.clearAllMocks();
    });

    describe('MFA Enrollment', () => {
        it('should handle device registration', async () => {
            const mockDevice = {
                deviceId: 'test-device',
                deviceName: 'Test Phone',
                platform: 'iOS',
                enrollmentDate: new Date()
            };

            const result = await securityPolicyService.registerMFADevice(mockDevice);
            expect(result.success).toBe(true);
            expect(result.deviceId).toBe(mockDevice.deviceId);
        });

        it('should generate and validate backup codes', async () => {
            const backupCodes = await securityPolicyService.generateBackupCodes();
            expect(backupCodes).toHaveLength(10); // Standard number of backup codes

            // Validate a backup code
            const isValid = await securityPolicyService.validateBackupCode(backupCodes[0]);
            expect(isValid).toBe(true);
        });

        it('should handle recovery flow setup', async () => {
            const recoveryMethods = ['email', 'phone'];
            const result = await securityPolicyService.setupRecoveryMethods(recoveryMethods);
            expect(result.configuredMethods).toEqual(recoveryMethods);
        });

        it('should enforce MFA policy requirements', async () => {
            const weakSetup = {
                methods: ['email'],
                backupCodesGenerated: false
            };

            await expect(
                securityPolicyService.validateMFASetup(weakSetup)
            ).rejects.toThrow('Insufficient MFA methods configured');
        });
    });

    describe('MFA Verification', () => {
        it('should validate verification codes', async () => {
            const mockCode = '123456';
            const isValid = await securityPolicyService.validateMFACode(mockCode);
            expect(isValid).toBe(true);
        });

        it('should handle device verification', async () => {
            const mockDevice = {
                deviceId: 'test-device',
                timestamp: Date.now(),
                signature: 'valid-signature'
            };

            const isVerified = await securityPolicyService.verifyDevice(mockDevice);
            expect(isVerified).toBe(true);
        });

        it('should manage fallback methods', async () => {
            // Simulate primary method failure
            vi.spyOn(securityPolicyService, 'validateMFACode')
                .mockRejectedValueOnce(new Error('Primary method failed'));

            // Should fall back to backup method
            const backupResult = await securityPolicyService.useFallbackMethod('email');
            expect(backupResult.success).toBe(true);
        });

        it('should handle verification timeouts', async () => {
            // Mock a delayed response
            vi.spyOn(securityPolicyService, 'validateMFACode')
                .mockImplementationOnce(() => new Promise(resolve => {
                    setTimeout(() => resolve(true), 31000); // 31 seconds
                }));

            await expect(
                securityPolicyService.validateMFACode('123456')
            ).rejects.toThrow('Verification timeout');
        });
    });

    describe('Recovery Scenarios', () => {
        it('should handle lost device recovery', async () => {
            const recoveryRequest = {
                userId: 'test-user',
                deviceId: 'lost-device',
                timestamp: Date.now()
            };

            const result = await accountRecoveryService.handleLostDevice(recoveryRequest);
            expect(result.newDeviceEnrollmentToken).toBeDefined();
        });

        it('should handle backup code usage', async () => {
            const backupCode = 'BACKUP-123456';
            const result = await securityPolicyService.useBackupCode(backupCode);
            expect(result.success).toBe(true);
            expect(result.remainingCodes).toBeDefined();
        });

        it('should manage temporary bypass', async () => {
            const bypassRequest = {
                userId: 'test-user',
                reason: 'Emergency access',
                approver: 'admin'
            };

            const result = await securityPolicyService.requestMFABypass(bypassRequest);
            expect(result.granted).toBe(true);
            expect(result.expiresAt).toBeDefined();
        });
    });

    describe('Edge Cases', () => {
        it('should handle concurrent verifications', async () => {
            const verificationPromises = [
                securityPolicyService.validateMFACode('123456'),
                securityPolicyService.validateMFACode('123456')
            ];

            await expect(Promise.all(verificationPromises)).rejects.toThrow('Concurrent verification not allowed');
        });

        it('should handle device sync issues', async () => {
            const mockDevice = {
                deviceId: 'test-device',
                lastSync: new Date(Date.now() - 86400000) // 24 hours ago
            };

            const result = await securityPolicyService.checkDeviceSync(mockDevice);
            expect(result.requiresSync).toBe(true);
        });

        it('should handle network interruptions', async () => {
            // Simulate network failure during verification
            vi.spyOn(securityPolicyService, 'validateMFACode')
                .mockRejectedValueOnce(new Error('Network error'));

            // Should retry automatically
            const result = await securityPolicyService.validateMFACode('123456');
            expect(result).toBe(true);
        });
    });
}); 