import { ApplicationInsights } from '@microsoft/applicationinsights-web';

class CustomMetricsMonitor {
    private appInsights: ApplicationInsights;
    private readonly metrics: Map<string, number[]> = new Map();
    private readonly thresholds = {
        apiResponseTime: 1000,    // 1 second
        renderTime: 100,          // 100 milliseconds
        memoryUsage: 50 * 1024 * 1024, // 50MB
        errorRate: 0.01,          // 1%
        cacheHitRatio: 0.8        // 80%
    };

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
        this.initializeMetrics();
    }

    private initializeMetrics(): void {
        this.metrics.set('apiResponseTime', []);
        this.metrics.set('renderTime', []);
        this.metrics.set('memoryUsage', []);
        this.metrics.set('errorRate', []);
        this.metrics.set('cacheHitRatio', []);
    }

    public trackApiResponseTime(duration: number): void {
        this.trackMetric('apiResponseTime', duration);
        if (duration > this.thresholds.apiResponseTime) {
            this.sendAlert('apiResponseTime', duration);
        }
    }

    public trackRenderTime(duration: number): void {
        this.trackMetric('renderTime', duration);
        if (duration > this.thresholds.renderTime) {
            this.sendAlert('renderTime', duration);
        }
    }

    public trackMemoryUsage(): void {
        if (performance.memory) {
            const usage = performance.memory.usedJSHeapSize;
            this.trackMetric('memoryUsage', usage);
            if (usage > this.thresholds.memoryUsage) {
                this.sendAlert('memoryUsage', usage);
            }
        }
    }

    public trackErrorRate(errors: number, total: number): void {
        const rate = errors / total;
        this.trackMetric('errorRate', rate);
        if (rate > this.thresholds.errorRate) {
            this.sendAlert('errorRate', rate);
        }
    }

    public trackCacheHitRatio(hits: number, total: number): void {
        const ratio = hits / total;
        this.trackMetric('cacheHitRatio', ratio);
        if (ratio < this.thresholds.cacheHitRatio) {
            this.sendAlert('cacheHitRatio', ratio);
        }
    }

    private trackMetric(name: string, value: number): void {
        const values = this.metrics.get(name) || [];
        values.push(value);
        this.metrics.set(name, values);

        // Calculate and track statistics
        const stats = this.calculateStats(values);
        this.appInsights.trackMetric({
            name: `CustomMetrics.${name}`,
            average: stats.average,
            min: stats.min,
            max: stats.max,
            properties: {
                pageUrl: window.location.href,
                pageTitle: document.title,
                timestamp: new Date().toISOString(),
                count: values.length
            }
        });
    }

    private calculateStats(values: number[]): { average: number; min: number; max: number } {
        const sum = values.reduce((a, b) => a + b, 0);
        return {
            average: sum / values.length,
            min: Math.min(...values),
            max: Math.max(...values)
        };
    }

    private sendAlert(metricName: string, value: number): void {
        this.appInsights.trackEvent({
            name: 'CustomMetricsAlert',
            properties: {
                metric: metricName,
                value: value.toString(),
                threshold: this.thresholds[metricName].toString(),
                pageUrl: window.location.href,
                pageTitle: document.title,
                timestamp: new Date().toISOString()
            }
        });
    }
}

export const customMetricsMonitor = new CustomMetricsMonitor(); 