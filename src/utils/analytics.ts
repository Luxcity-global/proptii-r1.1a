declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

const isGAEnabled = typeof window !== 'undefined' && typeof GA_MEASUREMENT_ID === 'string' && GA_MEASUREMENT_ID.length > 0;

const safeGtag = (...args: unknown[]) => {
  if (typeof window === 'undefined') return;
  if (!isGAEnabled) return;
  if (typeof window.gtag !== 'function') return;

  window.gtag(...args);
};

export const trackPageView = (path: string, title?: string) => {
  if (!isGAEnabled) return;

  const pageTitle = title || (typeof document !== 'undefined' ? document.title : undefined);
  const locationHref = typeof window !== 'undefined' ? window.location.href : undefined;

  safeGtag('event', 'page_view', {
    page_path: path,
    page_title: pageTitle,
    page_location: locationHref,
  });
};

export const trackEvent = (eventName: string, params?: Record<string, unknown>) => {
  if (!isGAEnabled) return;

  safeGtag('event', eventName, params || {});
};

export const setUserIdentity = (userId: string | null | undefined, anonymousId: string | null | undefined) => {
  if (!isGAEnabled) return;

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

export const isAnalyticsEnabled = () => isGAEnabled;

