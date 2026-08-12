/**
 * roleService.ts
 *
 * Single source of truth for resolving, writing, and reading a user's role.
 *
 * Resolution order (first match wins):
 *   1. localStorage cache       ← instant, avoids cold-start delay
 *   2. Backend /auth/me or /users/{uid} endpoint ← canonical role
 *   3. sessionStorage intent    ← set during signup before B2C redirect
 *   4. null                     ← routes user to /select-role
 */

import apiService from './api';
import { getRoleIntent, clearRoleIntent } from '../utils/roleIntent';

export type UserRole = 'tenant' | 'landlord' | 'agent';

export interface UserRoleDoc {
  uid: string;
  email: string;
  role: UserRole;
  roleAssignedAt?: string;
  roleSource?: string;
}

async function fetchBackendRole(uid: string, email: string): Promise<UserRole | null> {
  try {
    const res = await apiService.get('/auth/me');
    const role = res.data?.role || (res as any).role;
    if (role) return role as UserRole;
  } catch (e) {
    console.warn('[Auth] Could not fetch role from backend:', e);
  }
  return null;
}

// ─── public API ──────────────────────────────────────────────────────────────

export async function resolveRole(
  uid: string,
  email: string,
): Promise<UserRole | null> {
  // 1. localStorage cache — instant
  const cached = localStorage.getItem(`proptii_role_${uid}`);
  if (cached === 'tenant' || cached === 'landlord' || cached === 'agent') {
    return cached as UserRole;
  }

  // 2. Backend role resolution
  const backendRole = await fetchBackendRole(uid, email);
  if (backendRole) {
    localStorage.setItem(`proptii_role_${uid}`, backendRole);
    return backendRole;
  }

  // 3. sessionStorage signup intent
  const intent = getRoleIntent();
  if (intent) {
    clearRoleIntent();
    localStorage.setItem(`proptii_role_${uid}`, intent);
    await setRole(uid, email, intent as UserRole, 'signup_intent' as any);
    return intent as UserRole;
  }

  // 4. Default fallback to tenant if no role specified yet
  return 'tenant';
}

export async function setRole(
  uid: string,
  email: string,
  role: UserRole,
  source: 'manual_select' | 'claim_token' = 'manual_select',
): Promise<void> {
  localStorage.setItem(`proptii_role_${uid}`, role);

  try {
    await apiService.post('/auth/role', { role, source });
  } catch (err) {
    console.warn('[Auth] Backend role update failed:', err);
  }
}

export async function getStoredRole(uid: string): Promise<UserRole | null> {
  try {
    const res = await apiService.get('/auth/me');
    return res.data?.role || (res as any).role || null;
  } catch {
    return null;
  }
}
