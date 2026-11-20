# N2 — Firestore Discovery & Lock Plan

**Date**: 4 September 2026  
**Status**: Discovery Only — Production Rules Deploy Forbidden  
**Target Release**: Now (Overview Ticket X8 / Next for lock deployment)

---

## 1. Firebase Project Identity

- **Configured Production Fallback**: `proptii-16946`
  - Referenced in: `src/config/firebaseConfig.ts`, `.firebaserc`, and `v2-backend/src/config/firestore.config.ts`.
- **Environment Variable**: `VITE_FIREBASE_PROJECT_ID` (frontend) / `FIREBASE_PROJECT_ID` (backend).
- **Rule Verification**: The live console rules must not be overwritten with the commented `request.auth != null` rules from `firestore.rules`.

---

## 2. The Trap: Why `request.auth != null` Must NOT Be Deployed Now

Proptii authenticates users via **Azure AD B2C (MSAL)**, not Firebase Authentication:
- In Azure AD B2C sessions, Firebase client requests carry **no Firebase Auth token** (`request.auth == null`).
- Enabling standard Firebase Auth rules (`allow read, write: if request.auth != null;`) causes immediate `permission-denied` failures across critical user journeys:
  - Submitting viewing requests
  - Submitting referencing packets
  - Accessing landlord tenant records
  - Signing tenancy contracts
- **Mandate**: `firebase deploy --only firestore:rules` is strictly forbidden in this release.

---

## 3. Collections & Writers Inventory

| Collection | Client Direct Write? | Client Direct Listen/Read? | Contains PII? | Now Action | Next Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `referencingForms` | No (proxied via `apiService` / `/api/referencing/forms`) | No (proxied via `/api/referencing/forms`) | Yes | Leave rules as-is | B2C JWT validated in Nest backend; client rules locked |
| `bookViewingRequests` | No (proxied via `apiService.post('/viewing-requests')`) | No (polled via `viewingPollingCoordinator`) | Yes | Leave rules as-is | Gated writes in backend; client rules locked |
| `viewingBookings` | No (proxied via backend) | No | Yes | Leave rules as-is | Client rules locked |
| `signedContracts` | No (handled via backend contract service) | No | Yes | Leave rules as-is | Client rules locked |
| `userFiles` | No (proxied via `/api/referencing/files`) | No (proxied via `/api/referencing/files`) | Yes | Leave rules as-is | Client rules locked |
| `tenants` | No (proxied via `apiService.post('/tenants')`) | No (proxied via `apiService.get('/tenants')`) | Yes | Leave rules as-is | Client rules locked |
| `properties` | No | Yes (public search & property cards) | Maybe (landlord email) | Leave rules as-is | Keep public read, lock write |
| `alerts` | No | No (proxied via backend) | Maybe | Leave rules as-is | Client rules locked |
| `contractTemplates` | No | No | Low | Leave rules as-is | Client rules locked |
| `contracts` | No | No | Yes | Leave rules as-is | Client rules locked |
| `users` | No | Yes (`roleService.ts` direct read fallback) | Yes | Leave rules as-is | Transition role check to `/api/auth/me` then lock |

---

## 4. The Lock Path (Deferred to "Next")

The secure lock plan for the Next milestone:
1. Ensure all read/write paths for user and landlord data exclusively flow through NestJS (`v2-backend`) using B2C JWT validation (`@UseGuards(FirebaseAuthGuard)` or B2C JWT guard).
2. Backend performs all database operations using the Firebase Admin SDK (`admin.firestore()`).
3. Once all direct client reads (`roleService.ts`, etc.) are removed, deploy restrictive rules that close client writes entirely:
   ```firestore
   match /{document=**} {
     allow read, write: if false;
   }
   ```
4. Only public read collections (e.g. verified published `properties` if accessed directly) remain open.
