import { ApplicationInsights } from '@microsoft/applicationinsights-web';

// Initialize Application Insights
const appInsights = new ApplicationInsights({
  config: {
    instrumentationKey: process.env.VITE_APP_INSIGHTS_INSTRUMENTATION_KEY,
    enableAutoRouteTracking: true, // Automatically track route changes
    enableCorsCorrelation: true,
    distributedTracingMode: 2, // AI and W3C distributed tracing
  }
});

appInsights.loadAppInsights();

// Track a custom event
export const trackEvent = (name: string, properties?: { [key: string]: any }) => {
  appInsights.trackEvent({ name }, properties);
};

// Track a custom metric
export const trackMetric = (name: string, average: number, properties?: { [key: string]: any }) => {
  appInsights.trackMetric({ name, average }, properties);
};

// Track a page view
export const trackPageView = (name?: string) => {
  appInsights.trackPageView({ name });
};

export default appInsights; 