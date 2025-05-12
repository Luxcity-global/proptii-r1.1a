import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

class WebVitalsMonitor {
    private appInsights: ApplicationInsights;
    private readonly thresholds = {
        LCP: 2500, // 2.5 seconds
        FID: 100,  // 100 milliseconds
        CLS: 0.1,  // 0.1 score
        FCP: 1800, // 1.8 seconds
        TTFB: 800  // 800 milliseconds
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
    }

    public initialize(): void {
        // Monitor Largest Contentful Paint (LCP)
        onLCP((metric) => {
            this.trackMetric('LCP', metric.value);
            if (metric.value > this.thresholds.LCP) {
                this.sendAlert('LCP', metric.value);
            }
        });

        // Monitor First Input Delay (FID)
        onFID((metric) => {
            this.trackMetric('FID', metric.value);
            if (metric.value > this.thresholds.FID) {
                this.sendAlert('FID', metric.value);
            }
        });

        // Monitor Cumulative Layout Shift (CLS)
        onCLS((metric) => {
            this.trackMetric('CLS', metric.value);
            if (metric.value > this.thresholds.CLS) {
                this.sendAlert('CLS', metric.value);
            }
        });

        // Monitor First Contentful Paint (FCP)
        onFCP((metric) => {
            this.trackMetric('FCP', metric.value);
            if (metric.value > this.thresholds.FCP) {
                this.sendAlert('FCP', metric.value);
            }
        });

        // Monitor Time to First Byte (TTFB)
        onTTFB((metric) => {
            this.trackMetric('TTFB', metric.value);
            if (metric.value > this.thresholds.TTFB) {
                this.sendAlert('TTFB', metric.value);
            }
        });
    }

    private trackMetric(name: string, value: number): void {
        this.appInsights.trackMetric({
            name: `WebVitals.${name}`,
            average: value,
            properties: {
                pageUrl: window.location.href,
                pageTitle: document.title,
                timestamp: new Date().toISOString()
            }
        });
    }

    private sendAlert(metricName: string, value: number): void {
        this.appInsights.trackEvent({
            name: 'WebVitalsAlert',
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

export const webVitalsMonitor = new WebVitalsMonitor(); 