import React, { createContext, useContext, useEffect, useMemo, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { setOnboardingUserGroup, type OnboardingUserGroup } from '../utils/onboardingSession';

interface OnboardingSessionContextType {
  /** Current user group if in demo (tenant, landlord, agent, homeowner). */
  userGroup: OnboardingUserGroup | null;
  /** True when user is in an onboarding demo flow. */
  isDemoMode: boolean;
}

const OnboardingSessionContext = createContext<OnboardingSessionContextType | undefined>(undefined);

export function useOnboardingSession(): OnboardingSessionContextType {
  const context = useContext(OnboardingSessionContext);
  if (context === undefined) {
    throw new Error('useOnboardingSession must be used within an OnboardingSessionProvider');
  }
  return context;
}

interface OnboardingSessionProviderProps {
  children: ReactNode;
}

const VALID_GROUPS: OnboardingUserGroup[] = ['tenant', 'landlord', 'agent', 'homeowner'];

/**
 * Provider that sets onboarding session from URL (e.g. ?onboarding=tenant)
 * and exposes isDemoMode / userGroup for demo UI (guide bubble, sign-up intercept).
 */
export function OnboardingSessionProvider({ children }: OnboardingSessionProviderProps) {
  const [searchParams] = useSearchParams();

  const userGroup = useMemo(() => {
    const onboarding = searchParams.get('onboarding');
    if (onboarding && VALID_GROUPS.includes(onboarding as OnboardingUserGroup)) {
      return onboarding as OnboardingUserGroup;
    }
    return null;
  }, [searchParams]);

  useEffect(() => {
    if (userGroup) {
      setOnboardingUserGroup(userGroup);
    }
  }, [userGroup]);

  const value = useMemo(
    () => ({
      userGroup,
      isDemoMode: userGroup !== null
    }),
    [userGroup]
  );

  return (
    <OnboardingSessionContext.Provider value={value}>
      {children}
    </OnboardingSessionContext.Provider>
  );
}
