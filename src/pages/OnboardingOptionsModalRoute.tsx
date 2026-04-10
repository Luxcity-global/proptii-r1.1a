import React from 'react';
import { useNavigate } from 'react-router-dom';
import HomeVariant from './HomeVariant';
import TenantOnboardingOptions from './TenantOnboardingOptions';
import LandlordOnboardingOptions from './LandlordOnboardingOptions';
import HomeownerOnboardingOptions from './HomeownerOnboardingOptions';

interface OnboardingOptionsModalRouteProps {
  type: 'tenant' | 'landlord' | 'homeowner';
}

/** Renders HomeVariant with the appropriate onboarding options as a modal overlay. */
export function OnboardingOptionsModalRoute({ type }: OnboardingOptionsModalRouteProps) {
  const navigate = useNavigate();

  const handleDismiss = () => {
    navigate('/', { replace: true });
  };

  return (
    <>
      <HomeVariant hideOnboardingModal />
      {type === 'tenant' && <TenantOnboardingOptions asModal onDismiss={handleDismiss} />}
      {type === 'landlord' && <LandlordOnboardingOptions asModal onDismiss={handleDismiss} />}
      {type === 'homeowner' && <HomeownerOnboardingOptions asModal onDismiss={handleDismiss} />}
    </>
  );
}