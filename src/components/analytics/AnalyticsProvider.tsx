import { PropsWithChildren, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, isAnalyticsEnabled } from '../../utils/analytics';

export const AnalyticsProvider = ({ children }: PropsWithChildren) => {
  const location = useLocation();

  useEffect(() => {
    if (!isAnalyticsEnabled()) return;

    const path = `${location.pathname}${location.search}`;
    trackPageView(path);
  }, [location]);

  return children;
};

