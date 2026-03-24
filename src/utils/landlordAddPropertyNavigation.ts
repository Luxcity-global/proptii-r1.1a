import type { NavigateFunction } from 'react-router-dom';

/**
 * Deep-link into the landlord app at property setup step 1, with the add-property tour flag.
 * Matches LandlordOnboardingOptions "Add property".
 */
export function navigateToAddPropertyOnboarding(navigate: NavigateFunction): void {
  localStorage.setItem('startScreen', 'property-setup-step1');
  localStorage.setItem('startAddPropertyTour', '1');
  navigate('/landlord?start=property-setup-step1&startAddPropertyTour=1');
}

/** Open landlord dashboard on the Clients screen (tenant / client management). */
export function navigateToLandlordClients(navigate: NavigateFunction): void {
  navigate('/landlord?start=clients');
}
