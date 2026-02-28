/**
 * Temporarily store homeowner form data when a guest is prompted to sign in.
 * Restored after sign-in so the user doesn't lose their input.
 */

const PENDING_MAINTENANCE_KEY = 'homeowner_pendingMaintenanceTask';
const PENDING_PROJECT_KEY = 'homeowner_pendingProject';

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}

export function savePendingMaintenanceTask(data: Record<string, unknown>): void {
  try {
    getStorage()?.setItem(PENDING_MAINTENANCE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save pending maintenance task', e);
  }
}

export function consumePendingMaintenanceTask(): Record<string, unknown> | null {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(PENDING_MAINTENANCE_KEY);
  storage.removeItem(PENDING_MAINTENANCE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function savePendingProject(data: Record<string, unknown>): void {
  try {
    getStorage()?.setItem(PENDING_PROJECT_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save pending project', e);
  }
}

export function consumePendingProject(): Record<string, unknown> | null {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(PENDING_PROJECT_KEY);
  storage.removeItem(PENDING_PROJECT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}
