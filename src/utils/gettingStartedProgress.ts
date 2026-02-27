/**
 * Getting Started (Core Actions) progress per app.
 * Persisted in localStorage so it survives refresh. Used by GettingStartedHub and ContextualBanner.
 */

const KEY_PREFIX = 'gettingStarted_';
const MINIMIZED_KEY = 'gettingStarted_hubMinimized_';

export type GettingStartedApp = 'tenant' | 'homeowner' | 'landlord' | 'home';

export interface GettingStartedStep {
  id: string;
  label: string;
  path: string; // route or path to open for "Resume" / contextual CTA
  tourParam?: string; // e.g. startSearchTour=1 for tenant search
}

/** Step definitions per app. Tenant, landlord, homeowner: 3 options each (from onboarding). Home: combined. */
export const GETTING_STARTED_STEPS: Record<GettingStartedApp, GettingStartedStep[]> = {
  /** 3 options from TenantOnboardingOptions */
  tenant: [
    { id: 'search', label: 'Find a place and save a property', path: '/', tourParam: 'startSearchTour=1' },
    { id: 'contracts', label: 'Review and sign a contract', path: '/contracts', tourParam: 'startContractsTour=1' },
    { id: 'referencing', label: 'Begin your referencing', path: '/referencing', tourParam: 'startReferencingTour=1' },
  ],
  /** 3 options from HomeownerOnboardingOptions */
  homeowner: [
    { id: 'scheduleMaintenance', label: 'Schedule maintenance', path: '/homeowner/dashboard', tourParam: 'startScheduleMaintenanceTour=1' },
    { id: 'createProject', label: 'Create a project', path: '/homeowner/dashboard', tourParam: 'startCreateProjectTour=1' },
    { id: 'findVendor', label: 'Find a vendor', path: '/homeowner/dashboard', tourParam: 'startFindVendorTour=1' },
  ],
  /** 3 options from LandlordOnboardingOptions (used for home hub; landlord app has its own) */
  landlord: [
    { id: 'addProperty', label: 'Add a property', path: '/landlord', tourParam: 'startAddPropertyTour=1&start=property-setup-step1' },
    { id: 'addTenant', label: 'Add a tenant', path: '/landlord', tourParam: 'startAddTenantTour=1' },
    { id: 'sendContract', label: 'Send a contract', path: '/landlord', tourParam: 'startSendContractTour=1' },
  ],
  /** Combined: all 9 options from tenant + landlord + homeowner onboarding */
  home: [
    { id: 'search', label: 'Find a place and save a property', path: '/', tourParam: 'startSearchTour=1' },
    { id: 'contracts', label: 'Review and sign a contract', path: '/contracts', tourParam: 'startContractsTour=1' },
    { id: 'referencing', label: 'Begin your referencing', path: '/referencing', tourParam: 'startReferencingTour=1' },
    { id: 'addProperty', label: 'Add a property', path: '/landlord', tourParam: 'startAddPropertyTour=1&start=property-setup-step1' },
    { id: 'addTenant', label: 'Add a tenant', path: '/landlord', tourParam: 'startAddTenantTour=1' },
    { id: 'sendContract', label: 'Send a contract', path: '/landlord', tourParam: 'startSendContractTour=1' },
    { id: 'scheduleMaintenance', label: 'Schedule maintenance', path: '/homeowner/dashboard', tourParam: 'startScheduleMaintenanceTour=1' },
    { id: 'createProject', label: 'Create a project', path: '/homeowner/dashboard', tourParam: 'startCreateProjectTour=1' },
    { id: 'findVendor', label: 'Find a vendor', path: '/homeowner/dashboard', tourParam: 'startFindVendorTour=1' },
  ],
};

/** For home hub: inherit completion from tenant/homeowner/landlord steps */
const HOME_STEP_SOURCE: Partial<Record<string, { app: Exclude<GettingStartedApp, 'home'>; stepId: string }>> = {
  search: { app: 'tenant', stepId: 'search' },
  contracts: { app: 'tenant', stepId: 'contracts' },
  referencing: { app: 'tenant', stepId: 'referencing' },
  addProperty: { app: 'landlord', stepId: 'addProperty' },
  addTenant: { app: 'landlord', stepId: 'addTenant' },
  sendContract: { app: 'landlord', stepId: 'sendContract' },
  scheduleMaintenance: { app: 'homeowner', stepId: 'scheduleMaintenance' },
  createProject: { app: 'homeowner', stepId: 'createProject' },
  findVendor: { app: 'homeowner', stepId: 'findVendor' },
};

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function stepKey(app: GettingStartedApp, stepId: string): string {
  return `${KEY_PREFIX}${app}_${stepId}`;
}

export function isStepComplete(app: GettingStartedApp, stepId: string): boolean {
  return storage()?.getItem(stepKey(app, stepId)) === '1';
}

export function markStepComplete(app: GettingStartedApp, stepId: string): void {
  storage()?.setItem(stepKey(app, stepId), '1');
}

function isHomeStepComplete(stepId: string): boolean {
  const direct = isStepComplete('home', stepId);
  if (direct) return true;
  const src = HOME_STEP_SOURCE[stepId];
  return src ? isStepComplete(src.app, src.stepId) : false;
}

export function getProgress(app: GettingStartedApp): {
  completedCount: number;
  total: number;
  percentage: number;
  steps: Array<GettingStartedStep & { completed: boolean }>;
} {
  const steps = GETTING_STARTED_STEPS[app];
  const withStatus = steps.map((s) => ({
    ...s,
    completed: app === 'home' ? isHomeStepComplete(s.id) : isStepComplete(app, s.id),
  }));
  const completedCount = withStatus.filter((s) => s.completed).length;
  const total = steps.length;
  const percentage = total === 0 ? 100 : Math.round((completedCount / total) * 100);
  return { completedCount, total, percentage, steps: withStatus };
}

export function isAllComplete(app: GettingStartedApp): boolean {
  const { completedCount, total } = getProgress(app);
  return total > 0 && completedCount >= total;
}

export function getHubMinimized(app: GettingStartedApp): boolean {
  return storage()?.getItem(MINIMIZED_KEY + app) === '1';
}

export function setHubMinimized(app: GettingStartedApp, minimized: boolean): void {
  if (minimized) {
    storage()?.setItem(MINIMIZED_KEY + app, '1');
  } else {
    storage()?.removeItem(MINIMIZED_KEY + app);
  }
}

/** First incomplete step for "Resume" / "Pick up where you left off". */
export function getFirstIncompleteStep(app: GettingStartedApp): GettingStartedStep | null {
  const { steps } = getProgress(app);
  return steps.find((s) => !s.completed) ?? null;
}
