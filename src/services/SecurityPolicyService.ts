import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig, b2cPolicies } from '../config/authConfig';

interface PasswordPolicy {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    preventPasswordReuse: number;
}

interface MFAPolicy {
    enabled: boolean;
    requiredMethods: ('email' | 'phone' | 'authenticator')[];
    riskBasedEnabled: boolean;
    bypassAllowed: boolean;
}

interface RiskDetectionConfig {
    suspiciousIPDetection: boolean;
    unusualLocationDetection: boolean;
    failedLoginThreshold: number;
    accountLockoutDuration: number;
}

interface PasswordRecoveryAttempt {
    timestamp: number;
    ipAddress: string;
    email: string;
    success: boolean;
}

interface RiskAssessment {
    riskLevel: 'low' | 'medium' | 'high';
    factors: string[];
    timestamp: number;
}

export class SecurityPolicyService {
    private static instance: SecurityPolicyService;
    private appInsights: ApplicationInsights;
    private msalInstance: PublicClientApplication;
    private readonly recoveryAttempts: Map<string, PasswordRecoveryAttempt[]> = new Map();
    private readonly maxAttemptsPerHour = 3;
    private readonly maxAttemptsPerDay = 10;
    private readonly passwordHistoryLimit = 5;

    private readonly passwordPolicy: PasswordPolicy = {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventPasswordReuse: 5
    };

    private readonly mfaPolicy: MFAPolicy = {
        enabled: true,
        requiredMethods: ['email', 'authenticator'],
        riskBasedEnabled: true,
        bypassAllowed: false
    };

    private readonly riskConfig: RiskDetectionConfig = {
        suspiciousIPDetection: true,
        unusualLocationDetection: true,
        failedLoginThreshold: 5,
        accountLockoutDuration: 30 // minutes
    };

    private constructor() {
        this.appInsights = new ApplicationInsights({
            config: {
                instrumentationKey: import.meta.env.VITE_APP_INSIGHTS_INSTRUMENTATION_KEY,
                enableAutoRouteTracking: true,
            }
        });
        this.msalInstance = new PublicClientApplication(msalConfig);
        this.initializeSecurityMonitoring();
    }

    public static getInstance(): SecurityPolicyService {
        if (!SecurityPolicyService.instance) {
            SecurityPolicyService.instance = new SecurityPolicyService();
        }
        return SecurityPolicyService.instance;
    }

    private initializeSecurityMonitoring(): void {
        // Monitor for suspicious activities
        this.monitorLoginAttempts();
        this.monitorLocationChanges();
        this.monitorPasswordChanges();
    }

    public validatePassword(password: string): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (password.length < this.passwordPolicy.minLength) {
            errors.push(`Password must be at least ${this.passwordPolicy.minLength} characters long`);
        }
        if (this.passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (this.passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (this.passwordPolicy.requireNumbers && !/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (this.passwordPolicy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    public async initiatePasswordReset(email: string): Promise<void> {
        try {
            await this.msalInstance.loginPopup({
                ...msalConfig.auth,
                authority: `${msalConfig.auth.authority}/${b2cPolicies.forgotPassword}`
            });

            this.appInsights.trackEvent({
                name: 'PasswordResetInitiated',
                properties: { email }
            });
        } catch (error) {
            console.error('Password reset initiation failed:', error);
            this.appInsights.trackException({ exception: error as Error });
            throw error;
        }
    }

    public async configureMFA(methods: ('email' | 'phone' | 'authenticator')[]): Promise<void> {
        try {
            // Update MFA configuration
            this.mfaPolicy.requiredMethods = methods;

            this.appInsights.trackEvent({
                name: 'MFAConfigured',
                properties: { methods: methods.join(',') }
            });
        } catch (error) {
            console.error('MFA configuration failed:', error);
            this.appInsights.trackException({ exception: error as Error });
            throw error;
        }
    }

    private monitorLoginAttempts(): void {
        const failedAttempts = new Map<string, number>();

        window.addEventListener('auth-state-changed', ((event: CustomEvent) => {
            const userId = event.detail?.userId;
            if (!userId) return;

            if (event.detail?.success === false) {
                const attempts = (failedAttempts.get(userId) || 0) + 1;
                failedAttempts.set(userId, attempts);

                if (attempts >= this.riskConfig.failedLoginThreshold) {
                    this.handleAccountLockout(userId);
                }
            } else {
                failedAttempts.delete(userId);
            }
        }) as EventListener);
    }

    private monitorLocationChanges(): void {
        if (this.riskConfig.unusualLocationDetection) {
            navigator.geolocation?.getCurrentPosition(
                (position) => {
                    const lastLocation = localStorage.getItem('last_login_location');
                    const currentLocation = `${position.coords.latitude},${position.coords.longitude}`;

                    if (lastLocation && this.isLocationSignificantlyDifferent(lastLocation, currentLocation)) {
                        this.handleUnusualLocation();
                    }

                    localStorage.setItem('last_login_location', currentLocation);
                }
            );
        }
    }

    private monitorPasswordChanges(): void {
        const passwordHistory = new Set<string>();

        window.addEventListener('password-changed', ((event: CustomEvent) => {
            const newPassword = event.detail?.password;
            if (!newPassword) return;

            if (passwordHistory.has(newPassword)) {
                this.handlePasswordReuseAttempt();
            } else {
                passwordHistory.add(newPassword);
                if (passwordHistory.size > this.passwordPolicy.preventPasswordReuse) {
                    const oldestPassword = Array.from(passwordHistory)[0];
                    passwordHistory.delete(oldestPassword);
                }
            }
        }) as EventListener);
    }

    private async handleAccountLockout(userId: string): Promise<void> {
        this.appInsights.trackEvent({
            name: 'AccountLockout',
            properties: { userId }
        });

        // Implement account lockout logic
        await this.msalInstance.logoutPopup();

        // Notify user
        window.dispatchEvent(new CustomEvent('account-locked', {
            detail: {
                userId,
                duration: this.riskConfig.accountLockoutDuration
            }
        }));
    }

    private handleUnusualLocation(): void {
        this.appInsights.trackEvent({
            name: 'UnusualLocationDetected'
        });

        // Trigger additional verification if needed
        if (this.mfaPolicy.riskBasedEnabled) {
            this.requireAdditionalVerification();
        }
    }

    private handlePasswordReuseAttempt(): void {
        this.appInsights.trackEvent({
            name: 'PasswordReuseAttempted'
        });

        window.dispatchEvent(new CustomEvent('password-reuse-attempt'));
    }

    private async requireAdditionalVerification(): Promise<void> {
        try {
            await this.msalInstance.loginPopup({
                ...msalConfig.auth,
                prompt: 'login'
            });
        } catch (error) {
            console.error('Additional verification failed:', error);
            this.appInsights.trackException({ exception: error as Error });
            throw error;
        }
    }

    private isLocationSignificantlyDifferent(loc1: string, loc2: string): boolean {
        const [lat1, lon1] = loc1.split(',').map(Number);
        const [lat2, lon2] = loc2.split(',').map(Number);

        // Calculate distance using Haversine formula
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return distance > 100; // Consider locations different if more than 100km apart
    }

    private toRad(degrees: number): number {
        return degrees * Math.PI / 180;
    }

    public getPasswordPolicy(): PasswordPolicy {
        return { ...this.passwordPolicy };
    }

    public getMFAPolicy(): MFAPolicy {
        return { ...this.mfaPolicy };
    }

    public getRiskConfig(): RiskDetectionConfig {
        return { ...this.riskConfig };
    }

    public async initiatePasswordRecovery(email: string, ipAddress: string): Promise<void> {
        try {
            // Check rate limits
            this.enforceRateLimits(email, ipAddress);

            // Perform risk assessment
            const riskAssessment = await this.assessRecoveryRisk(email, ipAddress);

            if (riskAssessment.riskLevel === 'high') {
                throw new Error('High risk recovery attempt detected');
            }

            // Initialize recovery flow with Azure AD B2C
            await this.msalInstance.loginPopup({
                ...msalConfig.auth,
                authority: `${msalConfig.auth.authority}/${b2cPolicies.forgotPassword}`
            });

            // Record attempt
            this.recordRecoveryAttempt(email, ipAddress, true);

            // Send notification
            await this.sendRecoveryNotification(email, riskAssessment);

            this.appInsights.trackEvent({
                name: 'PasswordRecoveryInitiated',
                properties: {
                    email,
                    riskLevel: riskAssessment.riskLevel,
                    factors: riskAssessment.factors
                }
            });
        } catch (error) {
            this.recordRecoveryAttempt(email, ipAddress, false);
            this.appInsights.trackException({ exception: error as Error });
            throw error;
        }
    }

    private enforceRateLimits(email: string, ipAddress: string): void {
        const attempts = this.recoveryAttempts.get(email) || [];
        const now = Date.now();
        const hourAgo = now - 3600000;
        const dayAgo = now - 86400000;

        const hourlyAttempts = attempts.filter(a => a.timestamp > hourAgo).length;
        const dailyAttempts = attempts.filter(a => a.timestamp > dayAgo).length;

        if (hourlyAttempts >= this.maxAttemptsPerHour) {
            throw new Error('Hourly password recovery attempt limit exceeded');
        }

        if (dailyAttempts >= this.maxAttemptsPerDay) {
            throw new Error('Daily password recovery attempt limit exceeded');
        }
    }

    private async assessRecoveryRisk(email: string, ipAddress: string): Promise<RiskAssessment> {
        const factors: string[] = [];
        let riskLevel: 'low' | 'medium' | 'high' = 'low';

        // Check for suspicious patterns
        const recentAttempts = this.recoveryAttempts.get(email) || [];
        const distinctIPs = new Set(recentAttempts.map(a => a.ipAddress));

        if (distinctIPs.size > 3) {
            factors.push('Multiple IP addresses used');
            riskLevel = 'medium';
        }

        // Check for failed attempts
        const recentFailures = recentAttempts.filter(a => !a.success).length;
        if (recentFailures > 5) {
            factors.push('Multiple failed attempts');
            riskLevel = 'high';
        }

        // Check IP reputation (mock implementation)
        const ipRisk = await this.checkIPReputation(ipAddress);
        if (ipRisk.suspicious) {
            factors.push('Suspicious IP address');
            riskLevel = 'high';
        }

        return {
            riskLevel,
            factors,
            timestamp: Date.now()
        };
    }

    private async checkIPReputation(ipAddress: string): Promise<{ suspicious: boolean }> {
        // Mock implementation - in production, this would call an IP reputation service
        return { suspicious: false };
    }

    private recordRecoveryAttempt(email: string, ipAddress: string, success: boolean): void {
        const attempts = this.recoveryAttempts.get(email) || [];
        attempts.push({
            timestamp: Date.now(),
            ipAddress,
            email,
            success
        });
        this.recoveryAttempts.set(email, attempts);
    }

    private async sendRecoveryNotification(email: string, riskAssessment: RiskAssessment): Promise<void> {
        // In production, this would use a proper email service
        console.log(`Recovery notification sent to ${email}`, {
            riskAssessment,
            timestamp: new Date().toISOString()
        });
    }
}

export default SecurityPolicyService; 