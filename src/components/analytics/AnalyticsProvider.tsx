import { PropsWithChildren, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, isAnalyticsEnabled, initAnalytics } from '../../utils/analytics';

export const AnalyticsProvider = ({ children }: PropsWithChildren) => {
  const location = useLocation();

  useEffect(() => {
    void initAnalytics();
  }, []);

  useEffect(() => {
    if (!isAnalyticsEnabled()) return;

    const path = `${location.pathname}${location.search}`;
    trackPageView(path);
  }, [location]);

  return children;
};

