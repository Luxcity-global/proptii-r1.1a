import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import HomeVariant from './HomeVariant';
import TenantOnboardingOptions from './TenantOnboardingOptions';
import LandlordOnboardingOptions from './LandlordOnboardingOptions';
import HomeownerOnboardingOptions from './HomeownerOnboardingOptions';
const TenantInvitePage = React.lazy(() => import('./TenantInvitePage'));

interface OnboardingOptionsModalRouteProps {
  type: 'tenant' | 'landlord' | 'homeowner';
}

/** Renders HomeVariant with the appropriate onboarding options as a modal overlay, or TenantInvitePage if an invitation token/flag is present. */
export function OnboardingOptionsModalRoute({ type }: OnboardingOptionsModalRouteProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isInvite =
    Boolean(searchParams.get('token')) ||
    searchParams.get('invite') === 'true' ||
    Boolean(searchParams.get('propertyId'));

  const handleDismiss = () => {
    navigate('/', { replace: true });
  };

  // If this is an invited tenant, show the dedicated TenantInvitePage
  if (type === 'tenant' && isInvite) {
    return (
      <React.Suspense fallback={null}>
        <TenantInvitePage />
      </React.Suspense>
    );
  }

  return (
    <>
      <HomeVariant hideOnboardingModal />
      {type === 'tenant' && <TenantOnboardingOptions asModal onDismiss={handleDismiss} />}
      {type === 'landlord' && <LandlordOnboardingOptions asModal onDismiss={handleDismiss} />}
      {type === 'homeowner' && <HomeownerOnboardingOptions asModal onDismiss={handleDismiss} />}
    </>
  );
}