import { ApplicationInsights } from '@microsoft/applicationinsights-web';

// Initialize Application Insights only if instrumentation key is available
const appInsights = new ApplicationInsights({
  config: {
    instrumentationKey: import.meta.env.VITE_APP_INSIGHTS_INSTRUMENTATION_KEY,
    enableAutoRouteTracking: true, // Automatically track route changes
    enableCorsCorrelation: true,
    distributedTracingMode: 2, // AI and W3C distributed tracing
  }
});

// Only load App Insights if we have an instrumentation key
if (import.meta.env.VITE_APP_INSIGHTS_INSTRUMENTATION_KEY) {
  appInsights.loadAppInsights();
} else {
  console.log('Application Insights disabled - no instrumentation key provided');
}

// Track a custom event
export const trackEvent = (name: string, properties?: { [key: string]: any }) => {
  if (import.meta.env.VITE_APP_INSIGHTS_INSTRUMENTATION_KEY) {
    appInsights.trackEvent({ name }, properties);
  }
};

// Track a custom metric
export const trackMetric = (name: string, average: number, properties?: { [key: string]: any }) => {
  if (import.meta.env.VITE_APP_INSIGHTS_INSTRUMENTATION_KEY) {
    appInsights.trackMetric({ name, average }, properties);
  }
};

// Track a page view
export const trackPageView = (name?: string) => {
  if (import.meta.env.VITE_APP_INSIGHTS_INSTRUMENTATION_KEY) {
    appInsights.trackPageView({ name });
  }
};

export default appInsights; 