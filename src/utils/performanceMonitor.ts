import { ApplicationInsights } from '@microsoft/applicationinsights-web';

// Initialize Application Insights only if instrumentation key is available
const appInsightsKey = import.meta.env.VITE_APP_INSIGHTS_INSTRUMENTATION_KEY;
let appInsights: ApplicationInsights | null = null;

if (appInsightsKey && appInsightsKey !== '[DEVELOPMENT_APP_INSIGHTS_KEY]' && appInsightsKey !== '[PRODUCTION_APP_INSIGHTS_KEY]') {
  appInsights = new ApplicationInsights({
    config: {
      instrumentationKey: appInsightsKey,
      enableAutoRouteTracking: true, // Automatically track route changes
      enableCorsCorrelation: true,
      distributedTracingMode: 2, // AI and W3C distributed tracing
    }
  });
  appInsights.loadAppInsights();
} else {
  console.log('Application Insights disabled - no valid instrumentation key provided');
}

// Track a custom event
export const trackEvent = (name: string, properties?: { [key: string]: any }) => {
  if (appInsights) {
    appInsights.trackEvent({ name }, properties);
  }
};

// Track a custom metric
export const trackMetric = (name: string, average: number, properties?: { [key: string]: any }) => {
  if (appInsights) {
    appInsights.trackMetric({ name, average }, properties);
  }
};

// Track a page view
export const trackPageView = (name?: string) => {
  if (appInsights) {
    appInsights.trackPageView({ name });
  }
};

export default appInsights; 