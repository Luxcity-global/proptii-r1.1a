import type { NavigateFunction } from 'react-router-dom';

export type ComingSoonFeature = 'analytics' | 'verify-tenants';

export function navigateToComingSoon(navigate: NavigateFunction, feature: ComingSoonFeature): void {
  navigate(`/coming-soon?feature=${encodeURIComponent(feature)}`);
}

export const COMING_SOON_COPY: Record<
  ComingSoonFeature,
  { title: string; description: string }
> = {
  analytics: {
    title: 'Analytics',
    description:
      'Listing performance, enquiries, and portfolio insights will be available here soon. We are building dashboards tailored for landlords and agents.',
  },
  'verify-tenants': {
    title: 'Verify Tenants',
    description:
      'Secure background and credit checks for your applicants are on the way. You will be able to run verifications without leaving Proptii.',
  },
};

export function parseComingSoonFeature(raw: string | null): ComingSoonFeature | null {
  if (raw === 'analytics' || raw === 'verify-tenants') return raw;
  return null;
}
