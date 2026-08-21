export type StoredUserRole = 'landlord' | 'agent';

export interface StoredCompanyProfile {
  companyName: string;
  companyDescription?: string;
  website?: string;
  officeAddress?: string;
  officePhone?: string;
  officeEmail?: string;
  logo?: string;
  brandColor?: string;
  vatNumber?: string;
  registrationNumber?: string;
}

const USER_ROLE_KEY = 'proptii_user_role';
const LEGACY_USER_ROLE_KEY = 'userRole';
const ONBOARDING_OPTIONS_DISMISSED_KEY = 'proptii_onboarding_options_dismissed';

function companyProfileKey(email: string): string {
  return `proptii_company_profile_${email.trim().toLowerCase()}`;
}

export function readStoredUserRole(): StoredUserRole | null {
  try {
    const stored = localStorage.getItem(USER_ROLE_KEY) || localStorage.getItem(LEGACY_USER_ROLE_KEY);
    if (stored === 'landlord' || stored === 'agent') {
      return stored;
    }
    const accountType = localStorage.getItem('proptii_account_type');
    if (accountType === 'landlord' || accountType === 'agent') {
      return accountType;
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

export function persistUserRole(role: StoredUserRole): void {
  try {
    localStorage.setItem(USER_ROLE_KEY, role);
    localStorage.setItem(LEGACY_USER_ROLE_KEY, role);
  } catch {
    // ignore storage errors
  }
}

export function loadStoredCompanyProfile(email?: string | null): StoredCompanyProfile | null {
  if (!email) return null;
  try {
    const raw = localStorage.getItem(companyProfileKey(email));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredCompanyProfile;
    if (!parsed?.companyName) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredCompanyProfile(email: string, profile: StoredCompanyProfile): void {
  try {
    localStorage.setItem(companyProfileKey(email), JSON.stringify(profile));
  } catch {
    // ignore storage errors
  }
}

export function isOnboardingOptionsDismissed(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_OPTIONS_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissOnboardingOptions(): void {
  try {
    localStorage.setItem(ONBOARDING_OPTIONS_DISMISSED_KEY, '1');
  } catch {
    // ignore storage errors
  }
}
