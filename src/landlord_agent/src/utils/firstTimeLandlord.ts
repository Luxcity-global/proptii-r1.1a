/**
 * H3 — first-time landlord detection helpers.
 * Stable rule: an authenticated landlord with zero portfolio properties is first-time.
 */
import type { Property } from '../types';

export const LANDLORD_VISITED_KEY = 'proptii_landlord_dashboard_visited';

export function isFirstTimeLandlord(properties: Property[] | null | undefined): boolean {
  return !Array.isArray(properties) || properties.length === 0;
}

/** First dashboard visit → Welcome; later visits → Welcome back. */
export function resolveLandlordGreeting(isFirstVisit: boolean, userName: string): {
  heading: string;
  subtitle: string;
} {
  if (isFirstVisit) {
    return {
      heading: `Welcome, ${userName}`,
      subtitle: 'Add your first property to start managing your portfolio on Proptii.',
    };
  }
  return {
    heading: `Welcome back, ${userName}`,
    subtitle: "Here's the latest update on your portfolio today.",
  };
}

export function readLandlordFirstVisit(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(LANDLORD_VISITED_KEY) !== '1';
  } catch {
    return true;
  }
}

export function markLandlordVisited(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LANDLORD_VISITED_KEY, '1');
  } catch {
    /* ignore */
  }
}

export type OnboardingChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

/**
 * Checklist mirrors real C1 (account verification) + C2 (publish visibility) states.
 * Property-level compliance ticks only after a property exists.
 */
export function buildOnboardingChecklist(opts: {
  accountVerified: boolean;
  hasProperty: boolean;
  propertyComplianceComplete: boolean;
  hasPublishedListing: boolean;
}): OnboardingChecklistItem[] {
  return [
    {
      id: 'account_verification',
      label: 'Verify your account (Photo ID + proof of address)',
      done: opts.accountVerified,
    },
    {
      id: 'add_property',
      label: 'Add your first property',
      done: opts.hasProperty,
    },
    {
      id: 'compliance',
      label: 'Upload compliance documents (Gas, EICR, EPC, deposit)',
      done: opts.hasProperty && opts.propertyComplianceComplete,
    },
    {
      id: 'publish',
      label: 'Publish a listing to property search',
      done: opts.hasPublishedListing,
    },
  ];
}
