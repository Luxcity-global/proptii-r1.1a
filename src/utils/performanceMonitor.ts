import { ApplicationInsights } from '@microsoft/applicationinsights-web';

// Initialize Application Insights only if instrumentation key is available
let appInsights: ApplicationInsights | null = null;

// Only create and load App Insights if we have an instrumentation key
if (import.meta.env.VITE_APP_INSIGHTS_INSTRUMENTATION_KEY) {
  appInsights = new ApplicationInsights({
    config: {
      instrumentationKey: import.meta.env.VITE_APP_INSIGHTS_INSTRUMENTATION_KEY,
      enableAutoRouteTracking: true, // Automatically track route changes
      enableCorsCorrelation: true,
      distributedTracingMode: 2, // AI and W3C distributed tracing
    }
  });
  appInsights.loadAppInsights();
  console.log('Application Insights enabled');
} else {
  console.log('Application Insights disabled - no instrumentation key provided');
  // Create a mock instance to prevent errors
  appInsights = {
    core: { isInitialized: () => false },
    loadAppInsights: () => {},
    trackEvent: () => {},
    trackMetric: () => {},
    trackPageView: () => {},
  } as any;
}

// Track a custom event
export const trackEvent = (name: string, properties?: { [key: string]: any }) => {
  if (appInsights && import.meta.env.VITE_APP_INSIGHTS_INSTRUMENTATION_KEY) {
    appInsights.trackEvent({ name }, properties);
  }
};

// Track a custom metric
export const trackMetric = (name: string, average: number, properties?: { [key: string]: any }) => {
  if (appInsights && import.meta.env.VITE_APP_INSIGHTS_INSTRUMENTATION_KEY) {
    appInsights.trackMetric({ name, average }, properties);
  }
};

// Track a page view
export const trackPageView = (name?: string) => {
  if (appInsights && import.meta.env.VITE_APP_INSIGHTS_INSTRUMENTATION_KEY) {
    appInsights.trackPageView({ name });
  }
};

export default appInsights!; 