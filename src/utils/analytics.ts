declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

export const ANALYTICS_CONSENT_KEY = 'proptii_consent_analytics';

let gtagLoadPromise: Promise<boolean> | null = null;

const hasMeasurementId = (): boolean =>
  typeof GA_MEASUREMENT_ID === 'string' && GA_MEASUREMENT_ID.trim().length > 0;

export const hasAnalyticsConsent = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(ANALYTICS_CONSENT_KEY) === 'granted';
  } catch {
    return false;
  }
};

export const isAnalyticsEnabled = (): boolean =>
  typeof window !== 'undefined' && hasMeasurementId() && hasAnalyticsConsent();

const ensureGtagStub = () => {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
  }
};

/** Loads gtag.js once after analytics consent is granted. */
export const loadGoogleAnalytics = (): Promise<boolean> => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (!hasMeasurementId() || !hasAnalyticsConsent()) return Promise.resolve(false);

  if (typeof window.gtag === 'function' && document.getElementById('proptii-ga4-script')) {
    return Promise.resolve(true);
  }

  if (gtagLoadPromise) return gtagLoadPromise;

  gtagLoadPromise = new Promise((resolve) => {
    ensureGtagStub();
    window.gtag?.('js', new Date());
    window.gtag?.('config', GA_MEASUREMENT_ID, { send_page_view: false });

    if (document.getElementById('proptii-ga4-script')) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'proptii-ga4-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID!)}`;
    script.onload = () => resolve(true);
    script.onerror = () => {
      gtagLoadPromise = null;
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return gtagLoadPromise;
};

/** Call once on app boot — resumes GA if the user already consented. */
export const initAnalytics = (): Promise<boolean> => {
  if (!isAnalyticsEnabled()) return Promise.resolve(false);
  return loadGoogleAnalytics();
};

export const grantAnalyticsConsent = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, 'granted');
  } catch {
    /* ignore */
  }
  await loadGoogleAnalytics();
};

export const denyAnalyticsConsent = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, 'denied');
  } catch {
    /* ignore */
  }
};

const safeGtag = (...args: unknown[]) => {
  if (!isAnalyticsEnabled()) return;
  if (typeof window.gtag !== 'function') return;
  window.gtag(...args);
};

export const trackPageView = (path: string, title?: string) => {
  if (!isAnalyticsEnabled()) return;

  const pageTitle = title || (typeof document !== 'undefined' ? document.title : undefined);
  const locationHref = typeof window !== 'undefined' ? window.location.href : undefined;

  safeGtag('event', 'page_view', {
    page_path: path,
    page_title: pageTitle,
    page_location: locationHref,
  });
};

export const trackEvent = (eventName: string, params?: Record<string, unknown>) => {
  if (!isAnalyticsEnabled()) return;
  safeGtag('event', eventName, params || {});
};

export const setUserIdentity = (userId: string | null | undefined, anonymousId: string | null | undefined) => {
  if (!isAnalyticsEnabled() || !hasMeasurementId()) return;

  const cleanUserId = userId || undefined;
  const cleanAnonId = anonymousId || undefined;

  if (cleanUserId) {
    safeGtag('config', GA_MEASUREMENT_ID, {
      user_id: cleanUserId,
    });
  }

  safeGtag('set', 'user_properties', {
    proptii_anonymous_id: cleanAnonId,
    auth_state: cleanUserId ? 'authenticated' : 'anonymous',
  });
};
