/**
 * roleService.ts
 *
 * Single source of truth for resolving, writing, and reading a user's role.
 *
 * Resolution order (first match wins):
 *   1. localStorage cache       ← instant, avoids Firestore cold-start delay
 *   2. users/{uid} Firestore    ← canonical document
 *   3. landlordUsers collection ← back-compat for existing landlords
 *   4. sessionStorage intent    ← set during signup before B2C redirect
 *   5. null                     ← routes user to /select-role
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
  roleAssignedAt?: string;
  roleSource?: string;
}

const USERS_COL = 'users';
const LANDLORD_USERS_COL = 'landlordUsers';

async function readUserDoc(uid: string): Promise<UserRoleDoc | null> {
  try {
    const snap = await getDoc(doc(db, USERS_COL, uid));
    if (snap.exists()) return snap.data() as UserRoleDoc;
  } catch (e) {
    console.warn('[Auth] Could not read users Firestore doc:', e);
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
      return { role: (data.role as UserRole) ?? 'landlord', name: data.name };
    }
  } catch (e) {
    console.warn('[Auth] Could not query landlordUsers:', e);
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
    await setDoc(doc(db, USERS_COL, uid), {
      uid,
      email: email.toLowerCase(),
      role,
      roleAssignedAt: new Date().toISOString(),
      roleSource: source,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.error('[Auth] Failed to write users Firestore doc:', e);
  }
}

// ─── public API ──────────────────────────────────────────────────────────────

export async function resolveRole(
  uid: string,
  email: string,
): Promise<UserRole | null> {
  // 1. localStorage cache — instant, survives Firestore cold-starts
  const cached = localStorage.getItem(`proptii_role_${uid}`);
  if (cached === 'tenant' || cached === 'landlord' || cached === 'agent') {
    return cached as UserRole;
  }

  // 2. Firestore users/{uid}
  const userDoc = await readUserDoc(uid);
  if (userDoc?.role) {
    localStorage.setItem(`proptii_role_${uid}`, userDoc.role);
    return userDoc.role;
  }

  // 3. landlordUsers collection (back-compat)
  const landlordCheck = await queryLandlordUsers(email);
  if (landlordCheck) {
    const role = landlordCheck.role;
    localStorage.setItem(`proptii_role_${uid}`, role);
    await writeUserDoc(uid, email, role, 'landlordUsers_migration');
    return role;
  }

  // 4. sessionStorage signup intent
  const intent = getRoleIntent();
  if (intent) {
    clearRoleIntent();
    localStorage.setItem(`proptii_role_${uid}`, intent);
    await writeUserDoc(uid, email, intent, 'signup_intent');
    return intent;
  }

  // 5. No role found
  console.warn('[Auth] No role found for uid:', uid, '— routing to /select-role');
  return null;
}

export async function setRole(
  uid: string,
  email: string,
  role: UserRole,
  source: 'manual_select' | 'claim_token' = 'manual_select',
): Promise<void> {
  localStorage.setItem(`proptii_role_${uid}`, role);

  try {
    const { getAccessTokenForApiRequest } = await import('./msalAccessToken');
    const token = await getAccessTokenForApiRequest().catch(() => null);
    if (token) {
      const apiBase = (import.meta.env.VITE_NEST_API_ENDPOINT || 'http://localhost:3000').replace(/\/$/, '');
      const res = await fetch(`${apiBase}/api/auth/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error(`Backend role update failed: ${res.status}`);
    }
  } catch (err) {
    console.warn('[Auth] Backend role update failed, writing directly to Firestore:', err);
  }

  await writeUserDoc(uid, email, role, source);
}

export async function getStoredRole(uid: string): Promise<UserRole | null> {
  const userDoc = await readUserDoc(uid);
  return userDoc?.role ?? null;
}
