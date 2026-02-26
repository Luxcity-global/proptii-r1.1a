/**
 * Getting Started (Core Actions) progress per app.
 * Persisted in localStorage so it survives refresh. Used by GettingStartedHub and ContextualBanner.
 */

const KEY_PREFIX = 'gettingStarted_';
const MINIMIZED_KEY = 'gettingStarted_hubMinimized_';

export type GettingStartedApp = 'tenant' | 'homeowner' | 'landlord';

export interface GettingStartedStep {
  id: string;
  label: string;
  path: string; // route or path to open for "Resume" / contextual CTA
  tourParam?: string; // e.g. startSearchTour=1 for tenant search
}

/** Step definitions per app (max 5 high-impact tasks). */
export const GETTING_STARTED_STEPS: Record<GettingStartedApp, GettingStartedStep[]> = {
  tenant: [
    { id: 'search', label: 'Try property search', path: '/', tourParam: 'startSearchTour=1' },
    { id: 'contracts', label: 'Sign or view contracts', path: '/contracts', tourParam: 'startContractsTour=1' },
    { id: 'referencing', label: 'Complete referencing', path: '/referencing', tourParam: 'startReferencingTour=1' },
    { id: 'viewings', label: 'Book or manage viewings', path: '/dashboard/viewings' },
    { id: 'your-files', label: 'Organise your files', path: '/dashboard/your-files' },
  ],
  homeowner: [
    { id: 'scheduleMaintenance', label: 'Schedule maintenance', path: '/homeowner/dashboard', tourParam: 'startScheduleMaintenanceTour=1' },
    { id: 'createProject', label: 'Create a project', path: '/homeowner/dashboard', tourParam: 'startCreateProjectTour=1' },
    { id: 'findVendor', label: 'Find a vendor', path: '/homeowner/dashboard', tourParam: 'startFindVendorTour=1' },
    { id: 'documents', label: 'Upload documents', path: '/homeowner/dashboard' },
    { id: 'homeValue', label: 'Check your home value', path: '/homeowner/dashboard' },
  ],
  landlord: [
    { id: 'addTenant', label: 'Add a tenant', path: '/landlord-onboarding', tourParam: 'startAddTenantTour=1' },
    { id: 'sendContract', label: 'Send a contract', path: '/landlord-onboarding', tourParam: 'startSendContractTour=1' },
    { id: 'addProperty', label: 'Add a property', path: '/landlord-onboarding' },
    { id: 'manageDocuments', label: 'Manage documents', path: '/landlord-onboarding' },
    { id: 'viewings', label: 'Manage viewings', path: '/landlord-onboarding' },
  ],
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

export function getProgress(app: GettingStartedApp): {
  completedCount: number;
  total: number;
  percentage: number;
  steps: Array<GettingStartedStep & { completed: boolean }>;
} {
  const steps = GETTING_STARTED_STEPS[app];
  const withStatus = steps.map((s) => ({
    ...s,
    completed: isStepComplete(app, s.id),
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
