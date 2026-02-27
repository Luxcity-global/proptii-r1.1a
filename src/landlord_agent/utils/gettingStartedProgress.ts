/**
 * Getting Started (Core Actions) progress for landlord app.
 * Same keys as main app so progress is shared. Used by GettingStartedHub.
 */

const KEY_PREFIX = 'gettingStarted_';
const MINIMIZED_KEY = 'gettingStarted_hubMinimized_';

export type GettingStartedApp = 'landlord';

export interface GettingStartedStep {
  id: string;
  label: string;
  path: string;
  tourParam?: string;
}

/** Only the three steps with existing guides: Add property, Add tenant, Send contract. */
export const GETTING_STARTED_STEPS: Record<GettingStartedApp, GettingStartedStep[]> = {
  landlord: [
    { id: 'addProperty', label: 'Add a property', path: '/landlord/', tourParam: 'startAddPropertyTour=1' },
    { id: 'addTenant', label: 'Add a tenant', path: '/landlord/', tourParam: 'startAddTenantTour=1' },
    { id: 'sendContract', label: 'Send a contract', path: '/landlord/', tourParam: 'startSendContractTour=1' },
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
