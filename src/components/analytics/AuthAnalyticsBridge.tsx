import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getOrCreateAnonymousId } from '../../utils/onboardingSession';
import { isAnalyticsEnabled, setUserIdentity } from '../../utils/analytics';

export const AuthAnalyticsBridge = () => {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAnalyticsEnabled()) return;

    const anonymousId = getOrCreateAnonymousId();
    const userId = isAuthenticated ? user?.id ?? null : null;

    setUserIdentity(userId, anonymousId);
  }, [isAuthenticated, user?.id]);

  return null;
};

