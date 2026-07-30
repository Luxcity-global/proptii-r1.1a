/**
 * roleService.ts
 *
 * Single source of truth for resolving, writing, and reading a user's role.
 *
 * Resolution order (first match wins):
 *   1. users/{userId} Firestore document  ← canonical, fast
 *   2. landlordUsers collection by email  ← back-compat for existing landlords
 *   3. sessionStorage role intent          ← set during signup before B2C popup
 *   4. null                               ← triggers /select-role screen
 *
 * The public API surface intentionally mirrors what AuthContext needs:
 *   - resolveRole(userId, email)  → called once on login / page-load
 *   - setRole(userId, role)       → called by RoleSelect & ClaimAccount
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { getRoleIntent, clearRoleIntent } from '../utils/roleIntent';

export type UserRole = 'tenant' | 'landlord' | 'agent';

export interface UserRoleDoc {
  uid: string;
  email: string;
  role: UserRole;
  /** ISO timestamp of when the role was first assigned */
  roleAssignedAt?: string;
  /** 'firestore' | 'landlordUsers_migration' | 'signup_intent' | 'claim_token' | 'manual_select' */
  roleSource?: string;
}

// ─── internal helpers ────────────────────────────────────────────────────────

const USERS_COL = 'users';
const LANDLORD_USERS_COL = 'landlordUsers';

async function readUserDoc(uid: string): Promise<UserRoleDoc | null> {
  try {
    const snap = await getDoc(doc(db, USERS_COL, uid));
    if (snap.exists()) {
      return snap.data() as UserRoleDoc;
    }
  } catch (e) {
    console.warn('[RoleService] Could not read users doc:', e);
  }
  return null;
}

async function queryLandlordUsers(
  email: string,
): Promise<{ role: UserRole; name?: string } | null> {
  try {
    const q = query(
      collection(db, LANDLORD_USERS_COL),
      where('email', '==', email.toLowerCase()),
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const data = snap.docs[0].data();
      return {
        role: (data.role as UserRole) ?? 'landlord',
        name: data.name,
      };
    }
  } catch (e) {
    console.warn('[RoleService] Could not query landlordUsers:', e);
  }
  return null;
}

async function writeUserDoc(
  uid: string,
  email: string,
  role: UserRole,
  source: string,
): Promise<void> {
  try {
    const payload: Record<string, unknown> = {
      uid,
      email: email.toLowerCase(),
      role,
      roleAssignedAt: new Date().toISOString(),
      roleSource: source,
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, USERS_COL, uid), payload, { merge: true });
    console.log(`[RoleService] Wrote role "${role}" for uid=${uid} (source: ${source})`);
  } catch (e) {
    console.error('[RoleService] Failed to write users doc:', e);
    // Non-fatal — role is still returned from memory
  }
}

// ─── public API ──────────────────────────────────────────────────────────────

/**
 * Resolve the canonical role for an authenticated user.
 *
 * Returns null when no role can be determined → caller should route to
 * /select-role so the user can pick one explicitly.
 */
export async function resolveRole(
  uid: string,
  email: string,
): Promise<UserRole | null> {
  // 1. Check users/{uid} — fastest, canonical
  const userDoc = await readUserDoc(uid);
  if (userDoc?.role) {
    console.log(`[RoleService] Role from Firestore users/${uid}:`, userDoc.role);
    return userDoc.role;
  }

  // 2. Back-compat: check landlordUsers collection
  const landlordCheck = await queryLandlordUsers(email);
  if (landlordCheck) {
    const role = landlordCheck.role;
    console.log('[RoleService] Role from landlordUsers collection:', role);
    // Migrate: write into users/{uid} so future lookups are fast
    await writeUserDoc(uid, email, role, 'landlordUsers_migration');
    return role;
  }

  // 3. Check sessionStorage intent set during signup
  const intent = getRoleIntent();
  if (intent) {
    console.log('[RoleService] Role from signup intent:', intent);
    clearRoleIntent();
    await writeUserDoc(uid, email, intent, 'signup_intent');
    return intent;
  }
  
  // 3.5. Fallback check for localStorage (used if Firestore write fails/hangs)
  const localFallback = localStorage.getItem(`proptii_role_${uid}`);
  if (localFallback === 'tenant' || localFallback === 'landlord' || localFallback === 'agent') {
    console.log('[RoleService] Role from localStorage fallback:', localFallback);
    return localFallback as UserRole;
  }

  // 4. No role found
  console.log('[RoleService] No role found for uid:', uid);
  return null;
}

/**
 * Explicitly set a user's role (from /select-role or claim flow).
 * Overwrites any existing role in Firestore.
 */
export async function setRole(
  uid: string,
  email: string,
  role: UserRole,
  source: 'manual_select' | 'claim_token' = 'manual_select',
): Promise<void> {
  await writeUserDoc(uid, email, role, source);
}

/**
 * Read the stored role without attempting resolution.
 * Returns null if the document doesn't exist or has no role.
 */
export async function getStoredRole(uid: string): Promise<UserRole | null> {
  const doc = await readUserDoc(uid);
  return doc?.role ?? null;
}
