/**
 * Getting Started progress tracking.
 * Persists completion and hub state in localStorage for resumable onboarding.
 */

export type GettingStartedApp = 'home' | 'tenant' | 'landlord' | 'homeowner';

export interface ProgressStep {
  id: string;
  label: string;
  path: string;
  tourParam?: string;
  completed: boolean;
}

export interface ProgressResult {
  completedCount: number;
  total: number;
  percentage: number;
  steps: ProgressStep[];
}

const PREFIX = 'gettingStarted_';
const MINIMIZED_PREFIX = `${PREFIX}minimized_`;
const STEP_PREFIX = `${PREFIX}step_`;

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function isStepStored(app: GettingStartedApp, stepId: string): boolean {
  return getStorage()?.getItem(`${STEP_PREFIX}${app}_${stepId}`) === '1';
}

/** Steps for the home landing page – search, book viewing, referencing, etc. */
const HOME_STEPS: Omit<ProgressStep, 'completed'>[] = [
  { id: 'search', label: 'Search for properties', path: '/', tourParam: 'tour=search' },
  { id: 'book-viewing', label: 'Book a viewing', path: '/bookviewing', tourParam: 'tour=viewing' },
  { id: 'referencing', label: 'Complete referencing', path: '/referencing', tourParam: 'tour=referencing' },
  { id: 'contracts', label: 'Sign contracts', path: '/contracts', tourParam: 'tour=contracts' },
  { id: 'tools', label: 'Explore tools', path: '/tools', tourParam: 'tour=tools' },
  { id: 'profile', label: 'Complete your profile', path: '/profile', tourParam: 'tour=profile' },
  { id: 'register', label: 'Create an account', path: '/register', tourParam: 'tour=register' },
  { id: 'agent', label: 'Try landlord features', path: '/Agent', tourParam: 'tour=agent' },
  { id: 'faq', label: 'Read the FAQ', path: '/#faq', tourParam: 'tour=faq' },
];

/** Steps for tenant / landlord / homeowner dashboards – generic set. */
const DASHBOARD_STEPS: Omit<ProgressStep, 'completed'>[] = [
  { id: 'overview', label: 'View your dashboard overview', path: '/', tourParam: 'tour=overview' },
  { id: 'search', label: 'Search for properties', path: '/', tourParam: 'tour=search' },
  { id: 'book-viewing', label: 'Book a viewing', path: '/bookviewing', tourParam: 'tour=viewing' },
  { id: 'referencing', label: 'Complete referencing', path: '/referencing', tourParam: 'tour=referencing' },
  { id: 'contracts', label: 'Sign contracts', path: '/contracts', tourParam: 'tour=contracts' },
];

function getStepsForApp(app: GettingStartedApp): Omit<ProgressStep, 'completed'>[] {
  if (app === 'home') return HOME_STEPS;
  return DASHBOARD_STEPS;
}

export function getProgress(app: GettingStartedApp): ProgressResult {
  const baseSteps = getStepsForApp(app);
  const steps: ProgressStep[] = baseSteps.map((s) => ({
    ...s,
    completed: isStepStored(app, s.id),
  }));
  const completedCount = steps.filter((s) => s.completed).length;
  const total = steps.length;
  const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  return { completedCount, total, percentage, steps };
}

export function getHubMinimized(app: GettingStartedApp): boolean {
  const raw = getStorage()?.getItem(`${MINIMIZED_PREFIX}${app}`);
  return raw === '1';
}

export function setHubMinimized(app: GettingStartedApp, minimized: boolean): void {
  getStorage()?.setItem(`${MINIMIZED_PREFIX}${app}`, minimized ? '1' : '0');
}

export function isStepComplete(app: GettingStartedApp, stepId: string): boolean {
  return isStepStored(app, stepId);
}
