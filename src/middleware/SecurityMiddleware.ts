import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { SessionManager } from '../services/SessionManager';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

interface CSRFToken {
    token: string;
    timestamp: number;
    rotationCount: number;
}

interface SecurityHeaders {
    'X-CSRF-Token': string;
    'X-XSS-Protection': string;
    'X-Content-Type-Options': string;
    'X-Frame-Options': string;
    'Content-Security-Policy': string;
    'Referrer-Policy': string;
}

export class SecurityMiddleware {
    private static instance: SecurityMiddleware;
    private readonly csrfTokenKey = 'csrf_token';
    private readonly sessionManager: SessionManager;
    private axiosInstance: AxiosInstance;
    private appInsights: ApplicationInsights;
    private readonly tokenRotationInterval = 15 * 60 * 1000; // 15 minutes
    private readonly maxRotationCount = 100;
    private tokenRotationTimer: NodeJS.Timeout | null = null;
    private securityHeaders: SecurityHeaders;

    private constructor() {
        this.sessionManager = SessionManager.getInstance();
        this.appInsights = new ApplicationInsights({
            config: {
                connectionString: import.meta.env.VITE_APP_INSIGHTS_INSTRUMENTATION_KEY,
                enableAutoRouteTracking: true,
            }
        });
        this.securityHeaders = this.initializeSecurityHeaders();
        this.axiosInstance = this.createAxiosInstance();
        this.setupSecurityMeasures();
    }

    public static getInstance(): SecurityMiddleware {
        if (!SecurityMiddleware.instance) {
            SecurityMiddleware.instance = new SecurityMiddleware();
        }
        return SecurityMiddleware.instance;
    }

    private initializeSecurityHeaders(): SecurityHeaders {
        return {
            'X-CSRF-Token': '',
            'X-XSS-Protection': '1; mode=block',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'Content-Security-Policy': this.generateCSP(),
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        };
    }

    private generateCSP(): string {
        const isDevelopment = import.meta.env.DEV;
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const backendDomain = apiUrl.split('/api')[0];

        const connectSrc = isDevelopment
            ? "'self' https://proptii.b2clogin.com https://*.azure.com https://*.openai.azure.com http://localhost:* https://proptii-r1-1a.onrender.com"
            : "'self' https://proptii.b2clogin.com https://*.azure.com https://*.openai.azure.com https://proptii-r1-1a.onrender.com";

        return [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://proptii.b2clogin.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https:",
            `connect-src ${connectSrc}`,
            "frame-src 'self' https://proptii.b2clogin.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "upgrade-insecure-requests"
        ].join('; ');
    }

    private createAxiosInstance(): AxiosInstance {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const instance = axios.create({
            baseURL: apiUrl,
            timeout: 10000,
            headers: {
                ...this.securityHeaders,
                'Content-Type': 'application/json'
            }
        });

        // Request interceptor
        instance.interceptors.request.use(
            (config: AxiosRequestConfig) => {
                const token = this.getCurrentCSRFToken();
                if (token && config.headers) {
                    config.headers['X-CSRF-Token'] = token.token;
                }
                return config;
            },
            (error) => {
                this.logSecurityEvent('RequestError', error);
                return Promise.reject(error);
            }
        );

        // Response interceptor
        instance.interceptors.response.use(
            (response: AxiosResponse) => {
                this.validateResponseHeaders(response);
                return response;
            },
            (error) => {
                this.handleSecurityError(error);
                return Promise.reject(error);
            }
        );

        return instance;
    }

    private setupSecurityMeasures(): void {
        this.initializeCSRFToken();
        this.startTokenRotation();
        this.setupEventListeners();
        this.injectSecurityHeaders();
    }

    private initializeCSRFToken(): void {
        const token: CSRFToken = {
            token: uuidv4(),
            timestamp: Date.now(),
            rotationCount: 0
        };
        this.storeCSRFToken(token);
        this.securityHeaders['X-CSRF-Token'] = token.token;
    }

    private startTokenRotation(): void {
        if (this.tokenRotationTimer) {
            clearInterval(this.tokenRotationTimer);
        }

        this.tokenRotationTimer = setInterval(() => {
            this.rotateCSRFToken();
        }, this.tokenRotationInterval);
    }

    private rotateCSRFToken(): void {
        const currentToken = this.getCurrentCSRFToken();
        if (!currentToken) {
            this.initializeCSRFToken();
            return;
        }

        if (currentToken.rotationCount >= this.maxRotationCount) {
            this.logSecurityEvent('TokenRotationLimit', { rotationCount: currentToken.rotationCount });
            this.initializeCSRFToken();
            return;
        }

        const newToken: CSRFToken = {
            token: uuidv4(),
            timestamp: Date.now(),
            rotationCount: currentToken.rotationCount + 1
        };

        this.storeCSRFToken(newToken);
        this.securityHeaders['X-CSRF-Token'] = newToken.token;
        this.logSecurityEvent('TokenRotation', { oldToken: currentToken.token, newToken: newToken.token });
    }

    private getCurrentCSRFToken(): CSRFToken | null {
        try {
            const stored = sessionStorage.getItem(this.csrfTokenKey);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            this.logSecurityEvent('TokenRetrievalError', error);
            return null;
        }
    }

    private storeCSRFToken(token: CSRFToken): void {
        try {
            sessionStorage.setItem(this.csrfTokenKey, JSON.stringify(token));
        } catch (error) {
            this.logSecurityEvent('TokenStorageError', error);
        }
    }

    private setupEventListeners(): void {
        // Listen for session changes
        window.addEventListener('sessionEnd', () => {
            this.handleSessionEnd();
        });

        // Monitor for XSS attempts
        window.addEventListener('error', (event) => {
            if (this.isXSSAttempt(event)) {
                this.handleXSSAttempt(event);
            }
        });

        // Monitor for CSRF attempts
        document.addEventListener('submit', (event) => {
            if (!this.validateFormSubmission(event)) {
                event.preventDefault();
            }
        });
    }

    private isXSSAttempt(event: ErrorEvent): boolean {
        const suspiciousPatterns = [
            /<script>/i,
            /javascript:/i,
            /data:/i,
            /vbscript:/i,
            /on\w+=/i
        ];

        return suspiciousPatterns.some(pattern =>
            pattern.test(event.error?.toString() || '') ||
            pattern.test(event.message)
        );
    }

    private handleXSSAttempt(event: ErrorEvent): void {
        this.logSecurityEvent('XSSAttempt', {
            message: event.message,
            source: event.filename,
            line: event.lineno,
            column: event.colno
        });
    }

    private validateFormSubmission(event: Event): boolean {
        const form = event.target as HTMLFormElement;
        if (!form || form.nodeName !== 'FORM') return true;

        const token = this.getCurrentCSRFToken();
        if (!token) {
            this.logSecurityEvent('CSRFValidationError', { error: 'No CSRF token found' });
            return false;
        }

        const formToken = form.querySelector('input[name="csrf_token"]')?.value;
        if (!formToken || formToken !== token.token) {
            this.logSecurityEvent('CSRFValidationError', {
                error: 'Token mismatch',
                formToken,
                expectedToken: token.token
            });
            return false;
        }

        return true;
    }

    private validateResponseHeaders(response: AxiosResponse): void {
        const expectedHeaders = [
            'X-Content-Type-Options',
            'X-Frame-Options',
            'X-XSS-Protection'
        ];

        const missingHeaders = expectedHeaders.filter(
            header => !response.headers[header.toLowerCase()]
        );

        if (missingHeaders.length > 0) {
            this.logSecurityEvent('MissingSecurityHeaders', { missingHeaders });
        }
    }

    private handleSecurityError(error: any): void {
        const securityErrors = {
            401: 'Unauthorized',
            403: 'Forbidden',
            419: 'CSRF Token Mismatch',
            440: 'Session Expired'
        };

        const statusCode = error.response?.status;
        if (statusCode && securityErrors[statusCode as keyof typeof securityErrors]) {
            this.logSecurityEvent('SecurityError', {
                type: securityErrors[statusCode as keyof typeof securityErrors],
                status: statusCode,
                url: error.config?.url
            });
        }
    }

    private handleSessionEnd(): void {
        this.initializeCSRFToken();
        this.logSecurityEvent('SessionEnd', { timestamp: Date.now() });
    }

    private injectSecurityHeaders(): void {
        // Add meta tags for security
        const metaTags = [
            { httpEquiv: 'X-XSS-Protection', content: this.securityHeaders['X-XSS-Protection'] },
            { httpEquiv: 'X-Content-Type-Options', content: this.securityHeaders['X-Content-Type-Options'] },
            { httpEquiv: 'Content-Security-Policy', content: this.securityHeaders['Content-Security-Policy'] },
            { name: 'referrer', content: this.securityHeaders['Referrer-Policy'] }
        ];

        metaTags.forEach(({ httpEquiv, content, name }) => {
            const meta = document.createElement('meta');
            if (httpEquiv) meta.httpEquiv = httpEquiv;
            if (name) meta.name = name;
            meta.content = content;
            document.head.appendChild(meta);
        });
    }

    private logSecurityEvent(eventName: string, data?: any): void {
        this.appInsights.trackEvent({
            name: `Security_${eventName}`,
            properties: {
                ...data,
                sessionId: this.sessionManager.getSessionId(),
                timestamp: new Date().toISOString()
            }
        });
    }

    // Public methods
    public getAxiosInstance(): AxiosInstance {
        return this.axiosInstance;
    }

    public getCSRFToken(): string {
        const token = this.getCurrentCSRFToken();
        return token ? token.token : '';
    }

    public validateRequest(config: AxiosRequestConfig): boolean {
        const token = this.getCurrentCSRFToken();
        if (!token) return false;

        const headerToken = config.headers?.['X-CSRF-Token'];
        return headerToken === token.token;
    }

    public refreshSecurityHeaders(): void {
        this.securityHeaders = this.initializeSecurityHeaders();
        this.injectSecurityHeaders();
    }
}

export default SecurityMiddleware; 