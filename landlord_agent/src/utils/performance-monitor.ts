/**
 * Performance Monitoring Utility
 * 
 * Tracks core web vitals and other performance metrics using the PerformanceObserver API.
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

const getRating = (name: string, value: number): PerformanceMetric['rating'] => {
  switch (name) {
    case 'LCP':
      return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
    case 'FID':
      return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
    case 'CLS':
      return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
    case 'TTFB':
      return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
    default:
      return 'good';
  }
};

const reportMetric = (metric: PerformanceMetric) => {
  // In a real app, this would send to an analytics endpoint
  console.log(`[Performance Monitor] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
  
  // Example: Persist to local storage for debugging
  const logs = JSON.parse(localStorage.getItem('perf_logs') || '[]');
  logs.push(metric);
  localStorage.setItem('perf_logs', JSON.stringify(logs.slice(-50))); // Keep last 50
};

export const initPerformanceMonitoring = () => {
  if (typeof window === 'undefined') return;

  // Largest Contentful Paint
  try {
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      reportMetric({
        name: 'LCP',
        value: lastEntry.startTime,
        rating: getRating('LCP', lastEntry.startTime),
        timestamp: Date.now()
      });
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    console.warn('LCP observation not supported');
  }

  // Cumulative Layout Shift
  try {
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      reportMetric({
        name: 'CLS',
        value: clsValue,
        rating: getRating('CLS', clsValue),
        timestamp: Date.now()
      });
    }).observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    console.warn('CLS observation not supported');
  }

  // First Input Delay
  try {
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const delay = (entry as any).processingStart - entry.startTime;
        reportMetric({
          name: 'FID',
          value: delay,
          rating: getRating('FID', delay),
          timestamp: Date.now()
        });
      }
    }).observe({ type: 'first-input', buffered: true });
  } catch (e) {
    console.warn('FID observation not supported');
  }

  // Time to First Byte (Navigation Timing)
  window.addEventListener('load', () => {
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navEntry) {
      const ttfb = navEntry.responseStart - navEntry.requestStart;
      reportMetric({
        name: 'TTFB',
        value: ttfb,
        rating: getRating('TTFB', ttfb),
        timestamp: Date.now()
      });
    }
  });
};
