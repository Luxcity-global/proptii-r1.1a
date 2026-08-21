import landlordUserService from '../services/landlordUserService';
import {
  persistUserRole,
  type StoredUserRole,
} from '../landlord_agent/src/utils/landlordWorkspaceStorage';

export type AccountType = 'renter' | 'landlord' | 'agent';

export type PostAuthAction =
  | { action: 'landlord-dashboard'; role: StoredUserRole }
  | { action: 'show-picker' }
  | { action: 'renter' };

const ACCOUNT_TYPE_KEY = 'proptii_account_type';

function emailKey(email: string): string {
  return `${ACCOUNT_TYPE_KEY}_${email.trim().toLowerCase()}`;
}

function asAccountType(value: string | null): AccountType | null {
  if (value === 'renter' || value === 'landlord' || value === 'agent') {
    return value;
  }
  return null;
}

export function readStoredAccountType(email?: string | null): AccountType | null {
  try {
    if (email) {
      return asAccountType(localStorage.getItem(emailKey(email)));
    }
    return asAccountType(localStorage.getItem(ACCOUNT_TYPE_KEY));
  } catch {
    return null;
  }
}

export function persistAccountType(type: AccountType, email?: string | null): void {
  try {
    localStorage.setItem(ACCOUNT_TYPE_KEY, type);
    if (email) {
      localStorage.setItem(emailKey(email), type);
    }
  } catch {
    // ignore storage errors
  }
  if (type === 'landlord' || type === 'agent') {
    persistUserRole(type);
  }
}

export function landlordDashboardPath(role?: StoredUserRole): string {
  if (role === 'agent' || role === 'landlord') {
    return `/landlord?role=${role}`;
  }
  return '/landlord';
}

export const PENDING_POST_AUTH_KEY = 'proptii_pending_post_auth';

export function markPendingPostAuth(): void {
  try {
    sessionStorage.setItem(PENDING_POST_AUTH_KEY, '1');
  } catch {
    // ignore
  }
}

export function hasPendingPostAuth(): boolean {
  try {
    return sessionStorage.getItem(PENDING_POST_AUTH_KEY) === '1';
  } catch {
    return false;
  }
}

export function consumePendingPostAuth(): boolean {
  const pending = hasPendingPostAuth();
  try {
    sessionStorage.removeItem(PENDING_POST_AUTH_KEY);
  } catch {
    // ignore
  }
  return pending;
}

export const PENDING_ACCOUNT_PICKER_KEY = 'proptii_pending_account_picker';
export const PENDING_LANDLORD_NEXT_STEPS_KEY = 'proptii_pending_landlord_next_steps';

export function markAccountPickerNeeded(): void {
  try {
    sessionStorage.setItem(PENDING_ACCOUNT_PICKER_KEY, '1');
  } catch {
    // ignore
  }
}

export function needsAccountPicker(): boolean {
  try {
    return sessionStorage.getItem(PENDING_ACCOUNT_PICKER_KEY) === '1';
  } catch {
    return false;
  }
}

export function clearAccountPickerNeeded(): void {
  try {
    sessionStorage.removeItem(PENDING_ACCOUNT_PICKER_KEY);
  } catch {
    // ignore
  }
}

export function markLandlordNextStepsNeeded(): void {
  try {
    sessionStorage.setItem(PENDING_LANDLORD_NEXT_STEPS_KEY, '1');
  } catch {
    // ignore
  }
}

export function hasPendingLandlordNextSteps(): boolean {
  try {
    return sessionStorage.getItem(PENDING_LANDLORD_NEXT_STEPS_KEY) === '1';
  } catch {
    return false;
  }
}

export function clearLandlordNextSteps(): void {
  try {
    sessionStorage.removeItem(PENDING_LANDLORD_NEXT_STEPS_KEY);
  } catch {
    // ignore
  }
}

export function isGenericPostAuthPath(path: string | null | undefined): boolean {
  if (!path) return true;
  const pathname = path.split('?')[0];
  return pathname === '/' || pathname === '/login' || pathname === '/home' || pathname === '/register';
}

export async function resolvePostAuthAction(email?: string | null): Promise<PostAuthAction> {
  const storedAccount = readStoredAccountType(email);
  if (storedAccount === 'landlord' || storedAccount === 'agent') {
    return { action: 'landlord-dashboard', role: storedAccount };
  }

  if (email) {
    try {
      const result = await landlordUserService.isLandlordOrAgent(email);
      if (result.isLandlord && result.user) {
        const role: StoredUserRole = result.user.role === 'agent' ? 'agent' : 'landlord';
        persistAccountType(role, email);
        return { action: 'landlord-dashboard', role };
      }
    } catch {
      // keep local routing if lookup fails
    }
  }

  if (storedAccount === 'renter') {
    return { action: 'renter' };
  }

  return { action: 'show-picker' };
}
