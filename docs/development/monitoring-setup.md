# Performance Monitoring Setup

## Overview
This document describes the performance monitoring setup for the application, including Core Web Vitals tracking, custom metrics monitoring, and alerting system.

## Core Web Vitals Monitoring

### Implementation
Core Web Vitals are monitored using the `web-vitals` library and Application Insights. The following metrics are tracked:

- **Largest Contentful Paint (LCP)**
  - Threshold: 2.5 seconds
  - Alert Level: Error
  - Channels: Application Insights, Slack

- **First Input Delay (FID)**
  - Threshold: 100 milliseconds
  - Alert Level: Warning
  - Channels: Application Insights, Console

- **Cumulative Layout Shift (CLS)**
  - Threshold: 0.1
  - Alert Level: Warning
  - Channels: Application Insights, Console

### Usage
```typescript
import { webVitalsMonitor } from '@/utils/webVitalsMonitor';

// Initialize monitoring
webVitalsMonitor.initialize();
```

## Custom Metrics Monitoring

### Implementation
Custom metrics are tracked using Application Insights and include:

- **API Response Time**
  - Threshold: 1 second
  - Alert Level: Error
  - Channels: Application Insights, Slack

- **Render Time**
  - Threshold: 100 milliseconds
  - Alert Level: Warning
  - Channels: Application Insights, Console

- **Memory Usage**
  - Threshold: 50MB
  - Alert Level: Warning
  - Channels: Application Insights, Console

- **Error Rate**
  - Threshold: 1%
  - Alert Level: Critical
  - Channels: Application Insights, Slack, Email

- **Cache Hit Ratio**
  - Threshold: 80%
  - Alert Level: Warning
  - Channels: Application Insights, Console

### Usage
```typescript
import { customMetricsMonitor } from '@/utils/customMetricsMonitor';

// Track API response time
customMetricsMonitor.trackApiResponseTime(duration);

// Track render time
customMetricsMonitor.trackRenderTime(duration);

// Track memory usage
customMetricsMonitor.trackMemoryUsage();

// Track error rate
customMetricsMonitor.trackErrorRate(errors, total);

// Track cache hit ratio
customMetricsMonitor.trackCacheHitRatio(hits, total);
```

## Alerting System

### Implementation
The alerting system supports multiple channels and severity levels:

- **Severity Levels**
  - Info: General information
  - Warning: Potential issues
  - Error: Performance degradation
  - Critical: System-wide issues

- **Alert Channels**
  - Application Insights
  - Console
  - Slack
  - Email

### Usage
```typescript
import { alertManager } from '@/utils/alertManager';

// Create an alert
alertManager.createAlert('metricName', value);

// Acknowledge an alert
alertManager.acknowledgeAlert(alertId);

// Get active alerts
const activeAlerts = alertManager.getActiveAlerts();
```

## Environment Variables

Required environment variables:

```env
VITE_APP_INSIGHTS_INSTRUMENTATION_KEY=your-key
VITE_SLACK_WEBHOOK_URL=your-webhook-url
VITE_ALERT_EMAIL_ENDPOINT=your-email-endpoint
```

## Monitoring Commands

Available npm scripts:

```bash
# Monitor Core Web Vitals
npm run monitor:web-vitals

# Monitor custom metrics
npm run monitor:custom-metrics

# Monitor CDN health
npm run monitor:cdn

# Run all monitoring
npm run monitor:all
```

## Viewing Metrics

1. **Application Insights**
   - Log into Azure Portal
   - Navigate to Application Insights resource
   - View metrics in the "Metrics" section
   - Check alerts in the "Alerts" section

2. **Slack**
   - Alerts are sent to the configured channel
   - Format: Metric name, value, threshold, and timestamp

3. **Email**
   - Critical alerts are sent to configured email addresses
   - Includes detailed metrics and context

## Troubleshooting

1. **Missing Metrics**
   - Verify Application Insights instrumentation key
   - Check browser console for errors
   - Ensure monitoring is enabled in production

2. **Alert Issues**
   - Verify Slack webhook URL
   - Check email endpoint configuration
   - Review alert thresholds

3. **Performance Issues**
   - Check Core Web Vitals in Application Insights
   - Review custom metrics trends
   - Analyze alert history

## Maintenance

1. **Regular Tasks**
   - Review alert thresholds monthly
   - Update monitoring configuration as needed
   - Clean up acknowledged alerts

2. **Best Practices**
   - Keep alert thresholds up to date
   - Monitor alert frequency
   - Review and update documentation

## Support

For monitoring-related issues:
- Performance Team: [Contact Details]
- Slack Channel: #performance-monitoring
- Email: performance@proptii.co 