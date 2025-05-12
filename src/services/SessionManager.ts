import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { PublicClientApplication } from '@azure/msal-browser';
import { v4 as uuidv4 } from 'uuid';
import { msalConfig } from '../config/authConfig';

interface SessionMetadata {
    deviceInfo: {
        userAgent: string;
        platform: string;
        language: string;
    };
    location: {
        timezone: string;
        locale: string;
    };
    security: {
        lastPasswordChange?: Date;
        mfaEnabled: boolean;
        lastMfaVerification?: Date;
    };
}

interface SessionActivity {
    timestamp: number;
    type: 'interaction' | 'api_call' | 'navigation' | 'authentication' | 'idle';
    details?: string;
    metadata?: {
        route?: string;
        component?: string;
        status?: string;
    };
}

interface SessionState {
    sessionId: string;
    startTime: number;
    lastActivity: SessionActivity;
    tabId: string;
    isActive: boolean;
    metadata: SessionMetadata;
    activities: SessionActivity[];
}

interface SessionBackup {
    version: number;
    timestamp: number;
    data: string; // Encrypted session data
    checksum: string;
}

interface SessionConflict {
    sessionId: string;
    tabId: string;
    timestamp: number;
    changes: Partial<SessionState>;
}

export class SessionManager {
    private static instance: SessionManager;
    private sessionState: SessionState | null = null;
    private readonly storageKey = 'app_session_state';
    private readonly activityTimeout = 30 * 60 * 1000; // 30 minutes
    private readonly warningTimeout = 25 * 60 * 1000; // 25 minutes
    private activityCheckInterval: NodeJS.Timeout | null = null;
    private syncInterval: NodeJS.Timeout | null = null;
    private appInsights: ApplicationInsights;
    private msalInstance: PublicClientApplication;
    private readonly maxStoredActivities = 100;
    private readonly backupKey = 'app_session_backup';
    private readonly maxBackups = 5;
    private readonly encryptionKey: string;
    private sessionBackups: Map<string, SessionBackup> = new Map();
    private sessionConflicts: Map<string, SessionConflict[]> = new Map();
    private currentVersion = 1;

    private constructor() {
        this.appInsights = new ApplicationInsights({
            config: {
                connectionString: import.meta.env.VITE_APP_INSIGHTS_INSTRUMENTATION_KEY,
                enableAutoRouteTracking: true,
            }
        });
        this.msalInstance = new PublicClientApplication(msalConfig);
        
        // Initialize encryption key (32 bytes for AES-256)
        const keyBytes = new Uint8Array(32);
        crypto.getRandomValues(keyBytes);
        this.encryptionKey = Array.from(keyBytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
            
        this.initializeSession();
        this.setupActivityListeners();
        this.setupTabSync();
    }

    public static getInstance(): SessionManager {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }

    private initializeSession(): void {
        const existingSession = this.loadSessionState();
        if (existingSession && this.isSessionValid(existingSession)) {
            this.sessionState = existingSession;
            this.updateActivity('authentication', 'Session restored');
        } else {
            this.createNewSession();
        }
        this.startActivityCheck();
    }

    private createNewSession(): void {
        this.sessionState = {
            sessionId: uuidv4(),
            startTime: Date.now(),
            tabId: uuidv4(),
            isActive: true,
            metadata: this.collectSessionMetadata(),
            activities: [],
            lastActivity: {
                timestamp: Date.now(),
                type: 'authentication',
                details: 'Session initialized'
            }
        };
        this.saveSessionState();
    }

    private collectSessionMetadata(): SessionMetadata {
        return {
            deviceInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language
            },
            location: {
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                locale: navigator.language
            },
            security: {
                mfaEnabled: false // Will be updated when MFA status is known
            }
        };
    }

    private setupActivityListeners(): void {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => {
            window.addEventListener(event, () => this.updateActivity('interaction'));
        });

        // Track route changes
        window.addEventListener('popstate', () => {
            this.updateActivity('navigation', window.location.pathname);
        });

        // Track API calls
        const originalFetch = window.fetch;
        window.fetch = async (input: RequestInfo, init?: RequestInit) => {
            const response = await originalFetch(input, init);
            this.updateActivity('api_call', typeof input === 'string' ? input : input.url);
            return response;
        };
    }

    private setupTabSync(): void {
        // Listen for storage changes from other tabs
        window.addEventListener('storage', (event) => {
            if (event.key === this.storageKey) {
                this.handleStorageChange(event.newValue);
            }
        });

        // Periodic sync across tabs
        this.syncInterval = setInterval(() => {
            this.synchronizeTabs();
        }, 5000);

        // Handle tab visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.updateActivity('idle', 'Tab hidden');
            } else {
                this.updateActivity('interaction', 'Tab visible');
            }
        });
    }

    private synchronizeTabs(): void {
        if (this.sessionState) {
            const currentState = this.loadSessionState();
            if (currentState && currentState.sessionId === this.sessionState.sessionId) {
                // Merge activities from other tabs
                this.sessionState.activities = this.mergeActivities(
                    this.sessionState.activities,
                    currentState.activities
                );
                this.saveSessionState();
            }
        }
    }

    private mergeActivities(local: SessionActivity[], remote: SessionActivity[]): SessionActivity[] {
        const merged = [...local, ...remote]
            .sort((a, b) => b.timestamp - a.timestamp)
            .filter((activity, index, self) =>
                index === self.findIndex(a =>
                    a.timestamp === activity.timestamp &&
                    a.type === activity.type &&
                    a.details === activity.details
                )
            )
            .slice(0, this.maxStoredActivities);

        return merged;
    }

    private handleStorageChange(newValue: string | null): void {
        if (!newValue || !this.sessionState) return;

        try {
            const newState = JSON.parse(newValue) as SessionState;
            if (newState.sessionId === this.sessionState.sessionId) {
                // Update local state with changes from other tabs
                this.sessionState.activities = this.mergeActivities(
                    this.sessionState.activities,
                    newState.activities
                );
                this.sessionState.lastActivity = newState.lastActivity;
                this.checkSessionValidity();
            }
        } catch (error) {
            console.error('Error parsing session state:', error);
        }
    }

    public updateActivity(type: SessionActivity['type'], details?: string): void {
        if (!this.sessionState) return;

        const activity: SessionActivity = {
            timestamp: Date.now(),
            type,
            details,
            metadata: {
                route: window.location.pathname,
                component: this.getCurrentComponent()
            }
        };

        this.sessionState.lastActivity = activity;
        this.sessionState.activities.unshift(activity);
        if (this.sessionState.activities.length > this.maxStoredActivities) {
            this.sessionState.activities.pop();
        }

        this.saveSessionState();
        this.trackActivityInInsights(activity);
    }

    private getCurrentComponent(): string {
        // This is a placeholder - implement based on your routing/component structure
        return 'Unknown';
    }

    private trackActivityInInsights(activity: SessionActivity): void {
        this.appInsights.trackEvent({
            name: 'UserActivity',
            properties: {
                type: activity.type,
                details: activity.details,
                sessionId: this.sessionState?.sessionId,
                tabId: this.sessionState?.tabId,
                ...activity.metadata
            }
        });
    }

    private startActivityCheck(): void {
        if (this.activityCheckInterval) {
            clearInterval(this.activityCheckInterval);
        }

        this.activityCheckInterval = setInterval(() => {
            this.checkSessionValidity();
        }, 60000); // Check every minute
    }

    private checkSessionValidity(): void {
        if (!this.sessionState || !this.sessionState.isActive) return;

        const now = Date.now();
        const lastActivityTime = this.sessionState.lastActivity.timestamp;
        const timeSinceLastActivity = now - lastActivityTime;

        if (timeSinceLastActivity >= this.activityTimeout) {
            this.endSession('timeout');
        } else if (timeSinceLastActivity >= this.warningTimeout) {
            this.emitSessionWarning(timeSinceLastActivity);
        }
    }

    private emitSessionWarning(inactiveTime: number): void {
        const remainingTime = Math.floor((this.activityTimeout - inactiveTime) / 1000);
        const event = new CustomEvent('sessionWarning', {
            detail: { remainingTime }
        });
        window.dispatchEvent(event);
    }

    private endSession(reason: string): void {
        if (!this.sessionState) return;

        this.sessionState.isActive = false;
        this.updateActivity('authentication', `Session ended: ${reason}`);
        this.saveSessionState();

        // Cleanup
        if (this.activityCheckInterval) {
            clearInterval(this.activityCheckInterval);
        }
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        // Emit session end event
        const event = new CustomEvent('sessionEnd', {
            detail: { reason }
        });
        window.dispatchEvent(event);
    }

    private async encryptData(data: any): Promise<string> {
        try {
            const jsonStr = JSON.stringify(data);
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(jsonStr);

            const key = await crypto.subtle.importKey(
                'raw',
                encoder.encode(this.encryptionKey),
                { name: 'AES-GCM' },
                false,
                ['encrypt']
            );

            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encryptedData = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv
                },
                key,
                dataBuffer
            );

            const encryptedArray = new Uint8Array(encryptedData);
            const combined = new Uint8Array(iv.length + encryptedArray.length);
            combined.set(iv);
            combined.set(encryptedArray, iv.length);

            return btoa(String.fromCharCode(...combined));
        } catch (error) {
            console.error('Encryption error:', error);
            throw error;
        }
    }

    private async decryptData(encryptedData: string): Promise<any> {
        try {
            const combined = new Uint8Array(
                atob(encryptedData)
                    .split('')
                    .map(c => c.charCodeAt(0))
            );

            const iv = combined.slice(0, 12);
            const data = combined.slice(12);

            const key = await crypto.subtle.importKey(
                'raw',
                new TextEncoder().encode(this.encryptionKey),
                { name: 'AES-GCM' },
                false,
                ['decrypt']
            );

            const decryptedBuffer = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv
                },
                key,
                data
            );

            const decoder = new TextDecoder();
            const jsonStr = decoder.decode(decryptedBuffer);
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error('Decryption error:', error);
            throw error;
        }
    }

    private async createBackup(): Promise<void> {
        if (!this.sessionState) return;

        try {
            const encryptedData = await this.encryptData(this.sessionState);
            const checksum = await this.generateChecksum(this.sessionState);

            const backup: SessionBackup = {
                version: this.currentVersion++,
                timestamp: Date.now(),
                data: encryptedData,
                checksum
            };

            // Store backup
            this.sessionBackups.set(this.sessionState.sessionId, backup);

            // Maintain backup limit
            const backups = Array.from(this.sessionBackups.entries())
                .sort(([, a], [, b]) => b.timestamp - a.timestamp);

            if (backups.length > this.maxBackups) {
                const toRemove = backups.slice(this.maxBackups);
                toRemove.forEach(([id]) => this.sessionBackups.delete(id));
            }

            // Store in localStorage as fallback
            localStorage.setItem(this.backupKey, JSON.stringify(Array.from(this.sessionBackups.entries())));
        } catch (error) {
            console.error('Backup creation failed:', error);
            this.appInsights.trackException({ exception: error as Error });
        }
    }

    private async restoreFromBackup(): Promise<boolean> {
        try {
            // Try to restore from memory first
            if (this.sessionBackups.size > 0) {
                const latestBackup = Array.from(this.sessionBackups.values())
                    .sort((a, b) => b.timestamp - a.timestamp)[0];

                const restoredData = await this.decryptData(latestBackup.data);
                const checksum = await this.generateChecksum(restoredData);

                if (checksum === latestBackup.checksum) {
                    this.sessionState = restoredData;
                    return true;
                }
            }

            // Try to restore from localStorage
            const storedBackups = localStorage.getItem(this.backupKey);
            if (storedBackups) {
                const backups = new Map<string, SessionBackup>(JSON.parse(storedBackups));
                const latestBackup = Array.from(backups.values())
                    .sort((a, b) => b.timestamp - a.timestamp)[0];

                const restoredData = await this.decryptData(latestBackup.data);
                const checksum = await this.generateChecksum(restoredData);

                if (checksum === latestBackup.checksum) {
                    this.sessionState = restoredData;
                    this.sessionBackups = backups;
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error('Backup restoration failed:', error);
            this.appInsights.trackException({ exception: error as Error });
            return false;
        }
    }

    private async generateChecksum(data: any): Promise<string> {
        const jsonStr = JSON.stringify(data);
        const buffer = new TextEncoder().encode(jsonStr);
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    private resolveConflict(sessionId: string, conflicts: SessionConflict[]): void {
        if (!this.sessionState || conflicts.length === 0) return;

        // Sort conflicts by timestamp
        const sortedConflicts = conflicts.sort((a, b) => b.timestamp - a.timestamp);

        // Apply changes from newest to oldest
        for (const conflict of sortedConflicts) {
            Object.assign(this.sessionState, conflict.changes);
        }

        // Clear resolved conflicts
        this.sessionConflicts.delete(sessionId);
    }

    // Override existing saveSessionState method
    private async saveSessionState(): Promise<void> {
        try {
            if (!this.sessionState) return;

            // Create backup before saving
            await this.createBackup();

            // Encrypt and save current state
            const encryptedState = await this.encryptData(this.sessionState);
            localStorage.setItem(this.storageKey, encryptedState);

            this.appInsights.trackEvent({
                name: 'SessionStateSaved',
                properties: {
                    sessionId: this.sessionState.sessionId,
                    version: this.currentVersion
                }
            });
        } catch (error) {
            console.error('Error saving session state:', error);
            this.appInsights.trackException({ exception: error as Error });
        }
    }

    // Override existing loadSessionState method
    private async loadSessionState(): Promise<SessionState | null> {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) return null;

            const decryptedState = await this.decryptData(stored);
            return decryptedState;
        } catch (error) {
            console.error('Error loading session state:', error);
            this.appInsights.trackException({ exception: error as Error });

            // Attempt recovery from backup
            if (await this.restoreFromBackup()) {
                return this.sessionState;
            }

            return null;
        }
    }

    private isSessionValid(session: SessionState): boolean {
        const now = Date.now();
        return (
            session.isActive &&
            session.lastActivity.timestamp > now - this.activityTimeout
        );
    }

    // Public methods for external use
    public getSessionId(): string | null {
        return this.sessionState?.sessionId || null;
    }

    public getSessionMetadata(): SessionMetadata | null {
        return this.sessionState?.metadata || null;
    }

    public getActivityHistory(): SessionActivity[] {
        return this.sessionState?.activities || [];
    }

    public extendSession(): void {
        this.updateActivity('interaction', 'Session manually extended');
    }

    public updateSecurityMetadata(updates: Partial<SessionMetadata['security']>): void {
        if (this.sessionState) {
            this.sessionState.metadata.security = {
                ...this.sessionState.metadata.security,
                ...updates
            };
            this.saveSessionState();
        }
    }
}

export default SessionManager; 