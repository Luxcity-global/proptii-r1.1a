import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecurityPolicyService } from '../../services/SecurityPolicyService';
import { SecurityMiddleware } from '../../middleware/SecurityMiddleware';

describe('Security Policy Tests', () => {
    let securityPolicyService: SecurityPolicyService;
    let securityMiddleware: SecurityMiddleware;

    beforeEach(() => {
        securityPolicyService = SecurityPolicyService.getInstance();
        securityMiddleware = SecurityMiddleware.getInstance();
        localStorage.clear();
        vi.clearAllMocks();
    });

    describe('Policy Enforcement', () => {
        it('should enforce password policies', () => {
            const validPassword = 'StrongP@ss123';
            const invalidPasswords = [
                'weak',
                'noNumbers',
                'no-special-chars',
                'short'
            ];

            const { isValid } = securityPolicyService.validatePassword(validPassword);
            expect(isValid).toBe(true);

            invalidPasswords.forEach(password => {
                const { isValid } = securityPolicyService.validatePassword(password);
                expect(isValid).toBe(false);
            });
        });

        it('should enforce session policies', async () => {
            // Configure session timeout
            const sessionTimeout = 30 * 60 * 1000; // 30 minutes
            securityPolicyService.setSessionTimeout(sessionTimeout);

            // Fast-forward time
            vi.advanceTimersByTime(sessionTimeout + 1000);

            const isSessionValid = await securityPolicyService.validateSession();
            expect(isSessionValid).toBe(false);
        });

        it('should enforce MFA policies', async () => {
            const mfaConfig = {
                required: true,
                methods: ['authenticator', 'email'],
                graceLoginCount: 3
            };

            await securityPolicyService.setMFAPolicy(mfaConfig);
            const requiresMFA = await securityPolicyService.checkMFARequirement();
            expect(requiresMFA).toBe(true);
        });

        it('should enforce IP-based policies', async () => {
            const allowedIPs = ['192.168.1.*', '10.0.0.*'];
            await securityPolicyService.setAllowedIPs(allowedIPs);

            const validIP = '192.168.1.100';
            const invalidIP = '172.16.0.1';

            expect(await securityPolicyService.validateIP(validIP)).toBe(true);
            expect(await securityPolicyService.validateIP(invalidIP)).toBe(false);
        });
    });

    describe('Policy Validation', () => {
        it('should validate security headers', () => {
            const headers = securityMiddleware.getSecurityHeaders();

            expect(headers).toEqual(expect.objectContaining({
                'Strict-Transport-Security': expect.any(String),
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'Content-Security-Policy': expect.any(String)
            }));
        });

        it('should validate CORS policies', async () => {
            const allowedOrigins = ['https://app.example.com'];
            await securityPolicyService.setCORSPolicy({ allowedOrigins });

            const validOrigin = 'https://app.example.com';
            const invalidOrigin = 'https://malicious.com';

            expect(await securityPolicyService.validateOrigin(validOrigin)).toBe(true);
            expect(await securityPolicyService.validateOrigin(invalidOrigin)).toBe(false);
        });

        it('should validate rate limiting policies', async () => {
            const rateLimitConfig = {
                maxRequests: 100,
                windowMs: 15 * 60 * 1000 // 15 minutes
            };

            await securityPolicyService.setRateLimitPolicy(rateLimitConfig);

            // Simulate requests
            for (let i = 0; i < rateLimitConfig.maxRequests; i++) {
                await securityPolicyService.trackRequest('test-user');
            }

            const isLimited = await securityPolicyService.checkRateLimit('test-user');
            expect(isLimited).toBe(true);
        });
    });

    describe('Compliance Checks', () => {
        it('should validate GDPR compliance', async () => {
            const gdprConfig = {
                dataRetention: 30, // days
                requireConsent: true,
                allowDataExport: true
            };

            await securityPolicyService.setGDPRPolicy(gdprConfig);
            const complianceStatus = await securityPolicyService.checkGDPRCompliance();

            expect(complianceStatus.compliant).toBe(true);
            expect(complianceStatus.requirements).toContain('data_retention');
            expect(complianceStatus.requirements).toContain('consent_management');
        });

        it('should enforce data protection policies', async () => {
            const sensitiveData = {
                type: 'PII',
                content: 'test@example.com'
            };

            const encryptedData = await securityPolicyService.protectSensitiveData(sensitiveData);
            expect(encryptedData).not.toContain(sensitiveData.content);

            const accessAttempt = await securityPolicyService.validateDataAccess(
                encryptedData,
                ['read:PII']
            );
            expect(accessAttempt.granted).toBe(true);
        });

        it('should track security events', async () => {
            const securityEvent = {
                type: 'policy_violation',
                severity: 'high',
                details: 'Unauthorized access attempt'
            };

            await securityPolicyService.logSecurityEvent(securityEvent);
            const auditLog = await securityPolicyService.getSecurityAuditLog();

            expect(auditLog).toContainEqual(expect.objectContaining(securityEvent));
        });

        it('should enforce compliance reporting', async () => {
            const reportingPeriod = {
                start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                end: new Date()
            };

            const report = await securityPolicyService.generateComplianceReport(reportingPeriod);
            expect(report.violations).toBeDefined();
            expect(report.recommendations).toBeDefined();
            expect(report.complianceScore).toBeGreaterThanOrEqual(0);
            expect(report.complianceScore).toBeLessThanOrEqual(100);
        });
    });
}); 