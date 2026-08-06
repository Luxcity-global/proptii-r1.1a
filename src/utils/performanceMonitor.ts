/**
 * performanceMonitor — lazy Application Insights wrapper.
 *
 * The SDK is only imported when VITE_APP_INSIGHTS_INSTRUMENTATION_KEY is set
 * and VITE_ENABLE_PERFORMANCE_MONITORING is "true".  In development (where
 * neither is set) the module resolves instantly with no network activity and
 * no SDK bundle added to the dep graph.
 */

type TrackEventFn  = (name: string, properties?: Record<string, unknown>) => void;
type TrackMetricFn = (name: string, average: number, properties?: Record<string, unknown>) => void;
type TrackPageViewFn = (name?: string) => void;

interface AppInsightsShim {
  core: { isInitialized: () => boolean };
  loadAppInsights: () => void;
  trackEvent:    TrackEventFn;
  trackMetric:   TrackMetricFn;
  trackPageView: TrackPageViewFn;
}

const noop = () => {};

/** No-op shim used when App Insights is disabled or not yet loaded. */
const shimInstance: AppInsightsShim = {
  core: { isInitialized: () => false },
  loadAppInsights: noop,
  trackEvent:    noop,
  trackMetric:   noop,
  trackPageView: noop,
};

let _instance: AppInsightsShim = shimInstance;
let _loaded = false;

async function loadSdk(): Promise<AppInsightsShim> {
  const key = import.meta.env.VITE_APP_INSIGHTS_INSTRUMENTATION_KEY;
  if (!key) return shimInstance;

  const { ApplicationInsights } = await import('@microsoft/applicationinsights-web');
  const ai = new ApplicationInsights({
    config: {
      instrumentationKey: key,
      enableAutoRouteTracking: true,
      enableCorsCorrelation: true,
      distributedTracingMode: 2,
    },
  });
  ai.loadAppInsights();
  return ai as unknown as AppInsightsShim;
}

/**
 * Call once at startup (from main.tsx) when monitoring is enabled.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export async function initPerformanceMonitoring(): Promise<void> {
  if (_loaded) return;
  _loaded = true;
  _instance = await loadSdk();
}

export const trackEvent: TrackEventFn = (name, properties) =>
  _instance.trackEvent(name, properties);

export const trackMetric: TrackMetricFn = (name, average, properties) =>
  _instance.trackMetric(name, average, properties);

export const trackPageView: TrackPageViewFn = (name) =>
  _instance.trackPageView(name);

/** Backward-compatible default export. core.isInitialized() returns false until initPerformanceMonitoring() resolves. */
export default _instance;
