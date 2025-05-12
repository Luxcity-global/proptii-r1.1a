import { ApplicationInsights } from '@microsoft/applicationinsights-web';

type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
type AlertChannel = 'appInsights' | 'console' | 'email' | 'slack';

interface AlertConfig {
    severity: AlertSeverity;
    channels: AlertChannel[];
    threshold: number;
    cooldown: number; // milliseconds
}

interface Alert {
    id: string;
    metric: string;
    value: number;
    threshold: number;
    severity: AlertSeverity;
    timestamp: Date;
    acknowledged: boolean;
}

class AlertManager {
    private appInsights: ApplicationInsights;
    private alerts: Map<string, Alert> = new Map();
    private lastAlertTime: Map<string, number> = new Map();
    private readonly configs: Map<string, AlertConfig> = new Map();

    constructor() {
        this.appInsights = new ApplicationInsights({
            config: {
                instrumentationKey: process.env.VITE_APP_INSIGHTS_INSTRUMENTATION_KEY,
                enableAutoRouteTracking: true,
                enableCorsCorrelation: true,
                enableRequestTracking: true,
                enableAjaxPerfTracking: true,
                enableUnhandledPromiseRejectionTracking: true
            }
        });
        this.appInsights.loadAppInsights();
        this.initializeConfigs();
    }

    private initializeConfigs(): void {
        // Core Web Vitals
        this.configs.set('LCP', {
            severity: 'error',
            channels: ['appInsights', 'slack'],
            threshold: 2500,
            cooldown: 5 * 60 * 1000 // 5 minutes
        });

        this.configs.set('FID', {
            severity: 'warning',
            channels: ['appInsights', 'console'],
            threshold: 100,
            cooldown: 5 * 60 * 1000
        });

        this.configs.set('CLS', {
            severity: 'warning',
            channels: ['appInsights', 'console'],
            threshold: 0.1,
            cooldown: 5 * 60 * 1000
        });

        // Custom Metrics
        this.configs.set('apiResponseTime', {
            severity: 'error',
            channels: ['appInsights', 'slack'],
            threshold: 1000,
            cooldown: 1 * 60 * 1000 // 1 minute
        });

        this.configs.set('errorRate', {
            severity: 'critical',
            channels: ['appInsights', 'slack', 'email'],
            threshold: 0.01,
            cooldown: 1 * 60 * 1000
        });

        this.configs.set('memoryUsage', {
            severity: 'warning',
            channels: ['appInsights', 'console'],
            threshold: 50 * 1024 * 1024,
            cooldown: 5 * 60 * 1000
        });
    }

    public createAlert(metric: string, value: number): void {
        const config = this.configs.get(metric);
        if (!config) return;

        const now = Date.now();
        const lastAlert = this.lastAlertTime.get(metric) || 0;
        if (now - lastAlert < config.cooldown) return;

        const alert: Alert = {
            id: `${metric}-${now}`,
            metric,
            value,
            threshold: config.threshold,
            severity: config.severity,
            timestamp: new Date(),
            acknowledged: false
        };

        this.alerts.set(alert.id, alert);
        this.lastAlertTime.set(metric, now);

        this.sendAlert(alert, config);
    }

    private async sendAlert(alert: Alert, config: AlertConfig): Promise<void> {
        const alertData = {
            id: alert.id,
            metric: alert.metric,
            value: alert.value,
            threshold: alert.threshold,
            severity: alert.severity,
            timestamp: alert.timestamp.toISOString(),
            pageUrl: window.location.href,
            pageTitle: document.title
        };

        // Send to Application Insights
        if (config.channels.includes('appInsights')) {
            this.appInsights.trackEvent({
                name: 'PerformanceAlert',
                properties: alertData
            });
        }

        // Log to console
        if (config.channels.includes('console')) {
            console.warn(`[${alert.severity.toUpperCase()}] ${alert.metric} alert:`, alertData);
        }

        // Send to Slack
        if (config.channels.includes('slack')) {
            await this.sendToSlack(alertData);
        }

        // Send email
        if (config.channels.includes('email')) {
            await this.sendEmail(alertData);
        }
    }

    private async sendToSlack(alertData: any): Promise<void> {
        const webhookUrl = process.env.VITE_SLACK_WEBHOOK_URL;
        if (!webhookUrl) return;

        try {
            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: `🚨 *${alertData.severity.toUpperCase()} Alert*\n` +
                        `*Metric:* ${alertData.metric}\n` +
                        `*Value:* ${alertData.value}\n` +
                        `*Threshold:* ${alertData.threshold}\n` +
                        `*Page:* ${alertData.pageTitle}\n` +
                        `*URL:* ${alertData.pageUrl}\n` +
                        `*Time:* ${alertData.timestamp}`
                })
            });
        } catch (error) {
            console.error('Failed to send Slack alert:', error);
        }
    }

    private async sendEmail(alertData: any): Promise<void> {
        const emailEndpoint = process.env.VITE_ALERT_EMAIL_ENDPOINT;
        if (!emailEndpoint) return;

        try {
            await fetch(emailEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alertData)
            });
        } catch (error) {
            console.error('Failed to send email alert:', error);
        }
    }

    public acknowledgeAlert(alertId: string): void {
        const alert = this.alerts.get(alertId);
        if (alert) {
            alert.acknowledged = true;
            this.alerts.set(alertId, alert);
        }
    }

    public getActiveAlerts(): Alert[] {
        return Array.from(this.alerts.values())
            .filter(alert => !alert.acknowledged)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
}

export const alertManager = new AlertManager(); 