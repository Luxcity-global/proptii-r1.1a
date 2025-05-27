import { AppError } from '../middleware/error-handling';

interface AlertThreshold {
    ruThreshold: number;
    latencyThreshold: number;
    errorRateThreshold: number;
    storageThreshold: number;
    costThreshold: number;
}

interface Alert {
    id: string;
    type: 'performance' | 'resource' | 'cost';
    severity: 'low' | 'medium' | 'high';
    message: string;
    timestamp: string;
    metadata: Record<string, any>;
}

export class AlertService {
    private thresholds: AlertThreshold;
    private alerts: Alert[] = [];

    constructor(thresholds: AlertThreshold) {
        this.thresholds = thresholds;
    }

    checkPerformanceAlert(ruConsumption: number, latency: number): Alert | null {
        if (ruConsumption > this.thresholds.ruThreshold) {
            return this.createAlert('performance', 'high', 
                `RU consumption (${ruConsumption}) exceeded threshold (${this.thresholds.ruThreshold})`,
                { ruConsumption, threshold: this.thresholds.ruThreshold }
            );
        }

        if (latency > this.thresholds.latencyThreshold) {
            return this.createAlert('performance', 'medium',
                `Latency (${latency}ms) exceeded threshold (${this.thresholds.latencyThreshold}ms)`,
                { latency, threshold: this.thresholds.latencyThreshold }
            );
        }

        return null;
    }

    checkResourceAlert(storageUsage: number): Alert | null {
        if (storageUsage > this.thresholds.storageThreshold) {
            return this.createAlert('resource', 'high',
                `Storage usage (${storageUsage}GB) exceeded threshold (${this.thresholds.storageThreshold}GB)`,
                { storageUsage, threshold: this.thresholds.storageThreshold }
            );
        }

        return null;
    }

    checkCostAlert(cost: number): Alert | null {
        if (cost > this.thresholds.costThreshold) {
            return this.createAlert('cost', 'high',
                `Cost (${cost}) exceeded threshold (${this.thresholds.costThreshold})`,
                { cost, threshold: this.thresholds.costThreshold }
            );
        }

        return null;
    }

    checkErrorRateAlert(errorRate: number): Alert | null {
        if (errorRate > this.thresholds.errorRateThreshold) {
            return this.createAlert('performance', 'high',
                `Error rate (${errorRate}%) exceeded threshold (${this.thresholds.errorRateThreshold}%)`,
                { errorRate, threshold: this.thresholds.errorRateThreshold }
            );
        }

        return null;
    }

    private createAlert(
        type: Alert['type'],
        severity: Alert['severity'],
        message: string,
        metadata: Record<string, any>
    ): Alert {
        const alert: Alert = {
            id: `alert_${Date.now()}`,
            type,
            severity,
            message,
            timestamp: new Date().toISOString(),
            metadata
        };

        this.alerts.push(alert);
        return alert;
    }

    getAlerts(startTime?: string, endTime?: string): Alert[] {
        let filteredAlerts = this.alerts;

        if (startTime) {
            filteredAlerts = filteredAlerts.filter(alert => alert.timestamp >= startTime);
        }

        if (endTime) {
            filteredAlerts = filteredAlerts.filter(alert => alert.timestamp <= endTime);
        }

        return filteredAlerts;
    }

    getAlertsBySeverity(severity: Alert['severity']): Alert[] {
        return this.alerts.filter(alert => alert.severity === severity);
    }

    getAlertsByType(type: Alert['type']): Alert[] {
        return this.alerts.filter(alert => alert.type === type);
    }

    clearAlerts(): void {
        this.alerts = [];
    }
} 