# Adversarial Red-Team Security Audit Report: Proptii Codebase

**Target Codebase**: Proptii Platform (`v2-backend`, `proptii-search`, `src` frontend, Firebase & Azure configurations)  
**Audit Conducted**: 2026-09-23  
**Auditor**: Senior Security Engineer & Red-Team Specialist (via `security-audit` skill)  
**Threat Model Baseline**: System deployed in a hostile public environment against motivated adversaries, rogue tenants/landlords, and automated scanners.

---

## 1. Vulnerability Summary

| Severity | Count | Primary Impact Areas |
| :--- | :---: | :--- |
| **Critical** | **6** | Public storage exposure & arbitrary overwrite, production auth mock backdoor, arbitrary user deletion & BOLA in admin API, unauthenticated bucket file deletion, open email/phishing relay, conversation account takeover. |
| **High** | **5** | Parameter tampering role escalation, unauthenticated tenant referencing form leak, unauthenticated waitlist PII dump, insecure wildcard CORS with credentials, unauthenticated AI extraction quota exhaustion. |
| **Medium** | **4** | Unrestricted 50MB payload DoS, BOLA/IDOR in conversations & viewing requests, cross-tenant referee data access in Firestore, Render domain regex CORS flaw. |
| **Low / Info** | **3** | Stored/Reflected XSS in search modal markdown renderer, missing HTTP security headers on Azure SWA, leftover test collection in Firestore rules. |
| **Total** | **18** | |

---

## 2. Detailed Findings

---

### [CRITICAL-01] Public Read & Unauthenticated Write Across All Firebase Storage Buckets
- **Severity**: Critical
- **Affected Component**: [`storage.rules`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/storage.rules#L5-L33)
- **Description**:
  The Firebase Storage security rules grant public read access (`allow read: if true;`) to all files under `/referencing_documents/`, `/contracts/`, `/documents/`, and the global fallback `/{allPaths=**}`. Furthermore, write permissions are allowed without authentication if the file size is under 15MB:
  ```javascript
  match /{allPaths=**} {
    allow read: if true;
    allow write: if request.auth != null || request.resource.size < 15 * 1024 * 1024;
  }
  ```
  Because `|| request.resource.size < 15MB` evaluates to `true` for any file smaller than 15MB, **no authentication is required to write, overwrite, or corrupt files**.
- **Exploitation Scenario**:
  1. An attacker browses directly to Firebase Storage or uses the Firebase JS SDK without signing in.
  2. The attacker enumerates or downloads tenant referencing documents (passports, proof of address, bank statements, payslips) and signed tenancy agreements.
  3. The attacker uploads malicious files (malware, phishing HTML, defacement) or overwrites existing contracts with forged documents.
- **Impact**: Mass PII and identity document breach (GDPR/Data Protection Act violation), data tampering, and storage abuse.
- **Recommended Fix**:
  Enforce strict authentication and user-scoped path ownership:
  ```javascript
  rules_version = '2';
  service firebase.storage {
    match /b/{bucket}/o {
      match /referencing_documents/{userId}/{fileName} {
        allow read, write: if request.auth != null && (request.auth.uid == userId || request.auth.token.admin == true);
      }
      match /contracts/{contractId}/{fileName} {
        allow read, write: if request.auth != null; // Restrict to contract participants
      }
      match /{allPaths=**} {
        allow read, write: if false; // Deny all other access
      }
    }
  }
  ```

---

### [CRITICAL-02] Active Development Mock Token Backdoor in Production Authentication Guard
- **Severity**: Critical
- **Affected Component**: [`v2-backend/src/guards/firebase-auth.guard.ts`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/v2-backend/src/guards/firebase-auth.guard.ts#L77-L88)
- **Description**:
  `FirebaseAuthGuard` intercepts tokens starting with `mock-` or `mock_` and automatically synthesizes a valid authenticated user object without verifying any credentials against Firebase:
  ```typescript
  if (token.startsWith('mock-') || token.startsWith('mock_')) {
    const mockId = token.replace('mock-token-', '').replace('mock-', '');
    const mockRole = mockId.includes('landlord') ? 'landlord' : 'tenant';
    request.user = {
      uid: mockId || 'dev-user-id',
      sub: mockId || 'dev-user-id',
      email: `${mockRole}@test.proptii.co`,
      role: mockRole,
    };
    return true;
  }
  ```
  There is **no check** verifying `process.env.NODE_ENV !== 'production'`.
- **Exploitation Scenario**:
  1. An attacker sends an HTTP request to any protected API endpoint:
     `curl -H "Authorization: Bearer mock-landlord-admin" https://api.proptii.co/api/users`
  2. The guard validates the request as authenticated, assigns the role `landlord`, and sets `uid = "landlord-admin"`.
  3. The attacker accesses all protected routes without ever creating an account or providing credentials.
- **Impact**: Complete authentication bypass across the entire backend.
- **Recommended Fix**:
  Remove mock token handling entirely or restrict strictly to automated unit tests:
  ```typescript
  if (process.env.NODE_ENV === 'test' && process.env.ALLOW_MOCK_TOKENS === 'true') {
    // only in test suite
  }
  ```

---

### [CRITICAL-03] Broken Object-Level Authorization (BOLA/IDOR) & Unrestricted User Deletion in Admin API
- **Severity**: Critical
- **Affected Component**: [`v2-backend/src/controllers/user-profile.controller.ts`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/v2-backend/src/controllers/user-profile.controller.ts#L29-L56)
- **Description**:
  The endpoints `GET /api/users`, `PUT /api/users/:id`, and `DELETE /api/users/:id` only use `@UseGuards(FirebaseAuthGuard)` with **no administrative role check** (`RolesGuard` or `assertAdminUser`) and **no ownership check**:
  - `GET /api/users`: Returns all user records (up to 500) including emails, names, phone numbers, and roles.
  - `PUT /api/users/:id`: Allows any authenticated user to update any other user's document in Firestore (`admin.firestore().collection('users').doc(id).set(payload, { merge: true })`).
  - `DELETE /api/users/:id`: Allows any authenticated user to delete any user account in Firestore.
- **Exploitation Scenario**:
  1. Attacker signs up or uses a mock token.
  2. Attacker calls `GET /api/users` to harvest all user IDs and emails.
  3. Attacker calls `PUT /api/users/<victim_uid>` with `{ "role": "admin" }` to elevate privileges, or calls `DELETE /api/users/<victim_uid>` to delete admin or landlord accounts.
- **Impact**: Full database user compromise, unauthorized account takeover, horizontal/vertical privilege escalation, and permanent data destruction.
- **Recommended Fix**:
  1. Restrict `GET /api/users` and `DELETE /api/users/:id` to verified administrators.
  2. For `PUT /api/users/:id`, ensure `req.user.uid === id || req.user.role === 'admin'`.

---

### [CRITICAL-04] Unauthenticated Storage File Deletion and Upload via Admin SDK
- **Severity**: Critical
- **Affected Component**: [`v2-backend/src/controllers/storage.controller.ts`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/v2-backend/src/controllers/storage.controller.ts#L31-L60)
- **Description**:
  Neither `POST /api/storage/upload` nor `DELETE /api/storage/file` has an authentication guard (`@UseGuards(FirebaseAuthGuard)`). Both endpoints call `StorageService`, which uses the Firebase Admin SDK (`admin.storage().bucket()`), bypassing all storage bucket security rules.
  `DELETE /api/storage/file` accepts any `path` from query or body and calls `fileRef.delete()`.
- **Exploitation Scenario**:
  1. An attacker sends an unauthenticated request:
     `DELETE /api/storage/file?path=contracts/signed_lease_agreement.pdf`
  2. The backend deletes the file from Cloud Storage immediately.
  3. The attacker repeats this for all known or guessed paths, wiping out platform documents.
- **Impact**: Total data loss of user contracts, uploaded identity files, and property images; unauthenticated remote file manipulation.
- **Recommended Fix**:
  1. Add `@UseGuards(FirebaseAuthGuard)` to `StorageController`.
  2. Verify that the requesting user owns the file before deletion.
  3. Sanitize `path` against path traversal (`..`).

---

### [CRITICAL-05] Arbitrary Open Email Relay & Phishing Vector via Signed Contract Endpoint
- **Severity**: Critical
- **Affected Component**: [`v2-backend/src/controllers/contract.controller.ts`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/v2-backend/src/controllers/contract.controller.ts#L140-L145) & [`contract.service.ts`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/v2-backend/src/services/contract.service.ts#L191-L235)
- **Description**:
  The endpoint `POST /api/contracts/send-signed-contract` accepts unvalidated `to`, `contractName`, `htmlContent`, and `attachmentBase64` payloads. It immediately transmits the email via Resend from Proptii's verified domain without verifying that the recipient or contract is associated with the authenticated user.
- **Exploitation Scenario**:
  1. Attacker sends a request with arbitrary recipient emails (`to`), phishing HTML (`htmlContent`), and an invoice/malware PDF (`attachmentBase64`).
  2. Resend dispatches the email authenticated with Proptii's SPF/DKIM/DMARC records.
  3. Recipients receive a legitimate-looking email from Proptii containing phishing or malware.
- **Impact**: Verified-domain phishing relay, severe reputational damage, domain blacklisting by email providers.
- **Recommended Fix**:
  Do not allow clients to supply raw `htmlContent` or arbitrary `to` addresses. Generate signed contract emails strictly on the server using predefined templates and database-verified recipient emails.

---

### [CRITICAL-06] Insecure Ghost Tenant Auto-Merge Allows Conversation Hijacking
- **Severity**: Critical
- **Affected Component**: [`v2-backend/src/controllers/guest-enquiry.controller.ts`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/v2-backend/src/controllers/guest-enquiry.controller.ts#L26-L32) & [`guest-enquiry.service.ts`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/v2-backend/src/services/guest-enquiry.service.ts#L197-L220)
- **Description**:
  `POST /api/guest/claim/auto-merge` takes an optional `email` in the request body:
  ```typescript
  const email = body.email || req.user.email;
  return await this.guestEnquiryService.autoMerge(email, userId);
  ```
  `autoMerge` updates all conversations matching `guestEmail == email` to set `tenantId = userId` without checking if `req.user.email === email` or requiring email confirmation/verification tokens.
- **Exploitation Scenario**:
  1. Attacker registers an account with any email.
  2. Attacker invokes `autoMerge` with `body: { "email": "target_tenant@example.com" }`.
  3. All guest enquiries and conversations belonging to `target_tenant@example.com` are transferred to the attacker's `tenantId`.
  4. Attacker reads all past messages, negotiations, and personal details via `GET /api/communication/conversations`.
- **Impact**: Unauthorized access to private communications and identity impersonation.
- **Recommended Fix**:
  Only allow claiming via a cryptographically validated, one-time claim token sent to the guest's verified email address (already implemented in `claim/confirm`). Remove `body.email` parameter tampering from `autoMerge`.

---

### [HIGH-01] Parameter Tampering Privilege Escalation to Landlord / Agent
- **Severity**: High
- **Affected Component**: [`v2-backend/src/controllers/auth.controller.ts`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/v2-backend/src/controllers/auth.controller.ts#L22-L36)
- **Description**:
  The rule preventing tenants from upgrading to landlords contains a conditional flaw:
  ```typescript
  const currentRole = req.user?.role;
  if (currentRole === 'tenant' && (role === 'landlord' || role === 'agent') && source === 'manual_select') {
    throw new ForbiddenException('Tenants cannot switch to a Landlord profile.');
  }
  ```
  If a tenant submits `{ "role": "landlord", "source": "api" }` or any `source` other than `'manual_select'`, the restriction evaluates to `false` and the user's role is updated to `landlord` in Firestore.
- **Exploitation Scenario**:
  A tenant user makes a `POST /api/auth/role` call with `{"role": "landlord", "source": "external"}`. The backend upgrades their account. In Firestore, this grants permissions to create properties and access referee responses.
- **Impact**: Unauthorized role elevation from tenant to landlord/agent.
- **Recommended Fix**:
  Check `currentRole === 'tenant'` unconditionally without checking `source`:
  ```typescript
  if (currentRole === 'tenant' && (role === 'landlord' || role === 'agent')) {
    throw new ForbiddenException('Tenants cannot switch to a Landlord profile.');
  }
  ```

---

### [HIGH-02] Unauthenticated Full Tenant Referencing Form Exposure
- **Severity**: High
- **Affected Component**: [`v2-backend/src/controllers/referencing.controller.ts`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/v2-backend/src/controllers/referencing.controller.ts#L80-L88)
- **Description**:
  `GET /api/referencing/forms/:formId` is completely unauthenticated (missing `@UseGuards(FirebaseAuthGuard)`). Because `formId` typically corresponds to user IDs or predictable identifiers, anyone can fetch the complete referencing form data.
- **Exploitation Scenario**:
  An unauthenticated attacker sends `GET /api/referencing/forms/<userId>` and receives the tenant's employment history, salary, bank details, home address, and guarantor contact details.
- **Impact**: Severe personal and financial data leakage.
- **Recommended Fix**:
  Add `@UseGuards(FirebaseAuthGuard)` and ensure that the caller is either the form owner (`req.user.uid === formId`) or the assigned landlord.

---

### [HIGH-03] Unauthenticated Waitlist & Lead PII Dump
- **Severity**: High
- **Affected Component**: [`v2-backend/src/controllers/sheets.controller.ts`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/v2-backend/src/controllers/sheets.controller.ts#L8-L24) & [`sheets.service.ts`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/v2-backend/src/services/sheets.service.ts#L33-L50)
- **Description**:
  `GET /api/sheets` and `GET /api/sheets/:sheetId` have no authentication requirements and return up to 200 records from `sheets_data`, exposing leads, prospective tenant emails, phone numbers, and waitlist notes.
- **Exploitation Scenario**:
  An attacker queries `GET /api/sheets?sheetId=waitlist` and extracts the complete prospective customer list.
- **Impact**: Lead scraping, privacy breach, competitor intelligence exposure.
- **Recommended Fix**:
  Protect all read endpoints on `SheetsController` with `@UseGuards(FirebaseAuthGuard)` and admin authorization checks.

---

### [HIGH-04] Overly Permissive Wildcard CORS with Credentials
- **Severity**: High
- **Affected Component**: [`v2-backend/src/main.ts`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/v2-backend/src/main.ts#L147-L162)
- **Description**:
  In `v2-backend/src/main.ts`, the backend configures:
  ```typescript
  app.enableCors({
    origin: true, // Dynamically reflects incoming Origin header!
    credentials: true,
    ...
  });
  ```
  Although `allowedOrigins` was parsed on lines 143-145, it was ignored in favor of `origin: true`. Setting `origin: true` alongside `credentials: true` allows any website on the internet to make authenticated cross-origin requests and read response data if cookies or ambient sessions are present.
- **Exploitation Scenario**:
  An attacker hosts a malicious website (`evil-landlord.com`) that executes `fetch('https://api.proptii.co/api/users/profile', { credentials: 'include' })` when a logged-in Proptii user visits, extracting their profile data.
- **Impact**: Cross-origin data theft and unauthorized API invocation.
- **Recommended Fix**:
  Replace `origin: true` with the explicit allowlist array:
  ```typescript
  app.enableCors({
    origin: allowedOrigins || ['https://proptii.co', 'https://www.proptii.co'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  });
  ```

---

### [HIGH-05] Unauthenticated AI Document Extraction (Resource & Quota Exhaustion)
- **Severity**: High
- **Affected Component**: [`v2-backend/src/controllers/referencing.controller.ts`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/v2-backend/src/controllers/referencing.controller.ts#L108-L119)
- **Description**:
  `POST /api/referencing/ai-extract` accepts file uploads and performs AI extraction via Google Cloud Document AI / Gemini without requiring authentication or rate limiting.
- **Exploitation Scenario**:
  An attacker scripts thousands of concurrent requests uploading PDFs to `/api/referencing/ai-extract`. The server forwards each file to Google Cloud AI APIs, exhausting rate limits and generating thousands of dollars in cloud billing charges.
- **Impact**: Denial of Service (DoS) and financial/billing exploitation.
- **Recommended Fix**:
  Require authentication (`@UseGuards(FirebaseAuthGuard)`) and apply strict per-user rate limiting via `@Throttle()`.

---

### [HIGH-06] Unverified Staff Email Domain Allows Admin Dashboard Privilege Escalation
- **Severity**: High
- **Affected Component**: [`v2-backend/src/guards/admin.guard.ts`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/v2-backend/src/guards/admin.guard.ts#L42-L52)
- **Description**:
  The new `AdminGuard` validates staff privileges simply by testing if the authenticated user's email domain matches `@proptii.com` or `@proptii.co`:
  ```typescript
  if (!isStaffEmail(email)) {
    throw new ForbiddenException('Staff access only');
  }
  ```
  Firebase Authentication permits self-registration with any email address using email/password provider without requiring verification upfront unless strictly checked. Without checking `req.user.email_verified === true`, an attacker can register `security@proptii.co` or `admin@proptii.com` with their own password and immediately gain administrative privileges across `/api/admin/*`.
- **Exploitation Scenario**:
  1. Attacker calls Firebase Auth `createUserWithEmailAndPassword("ceo@proptii.com", "P@ssword123")`.
  2. Attacker retrieves Firebase ID token (which has `email: "ceo@proptii.com"`, `email_verified: false`).
  3. Attacker calls `GET /api/admin/metrics` or other admin endpoints. The guard passes because the domain matches.
- **Impact**: Complete platform administrative takeover and full access to user profiles, KYC records, and billing data.
- **Recommended Fix**:
  Enforce `email_verified === true` for staff accounts in production environments:
  ```typescript
  if (isProd && request.user?.email_verified !== true) {
    throw new ForbiddenException('Staff email address must be verified');
  }
  ```

---

### [MEDIUM-01] 50MB Unauthenticated Request Body Limit Enabling Denial of Service
- **Severity**: Medium
- **Affected Component**: [`v2-backend/src/main.ts`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/v2-backend/src/main.ts#L175-L176)
- **Description**:
  The global Express body parser is configured with a 50MB limit:
  ```typescript
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  ```
  Combined with the absence of a global `ThrottlerGuard`, unauthenticated callers can stream multiple 50MB payloads concurrently to consume Node.js V8 heap memory.
- **Impact**: Node.js process out-of-memory crash (Denial of Service).
- **Recommended Fix**:
  Keep global body limits small (e.g., 2MB) and apply larger limits only on specific multipart upload routes via Multer. Register `ThrottlerGuard` globally in `AppModule`.

---

### [MEDIUM-02] BOLA/IDOR in Private Communications & Viewing Requests
- **Severity**: Medium
- **Affected Component**: [`v2-backend/src/services/communication.service.ts`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/v2-backend/src/services/communication.service.ts#L132-L150) & [`viewing-request.controller.ts`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/v2-backend/src/controllers/viewing-request.controller.ts#L74-L85)
- **Description**:
  - `GET /api/communication/conversations/:id/messages`: Does not verify if `req.user.uid` is either the `tenantId` or `landlordId` of conversation `:id`.
  - `GET /api/viewing-requests/:id`: Returns any viewing request document without checking whether the requester is the associated tenant, landlord, or agent.
  - `DELETE /api/contracts/templates/:id`: Deletes contract templates without verifying creator ownership.
- **Impact**: Unauthorized viewing and tampering of private messages, viewing schedules, and templates between unrelated users.
- **Recommended Fix**:
  Validate that `req.user.uid` is a participant or owner in the queried document before returning or mutating data.

---

### [MEDIUM-03] Cross-Tenant Referee & Guarantor Exposure in Firestore Rules
- **Severity**: Medium
- **Affected Component**: [`firestore.rules`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/firestore.rules#L136-L141)
- **Description**:
  In `firestore.rules`:
  ```javascript
  match /referee_guarantor_responses/{docId} {
    allow read, update, delete: if isAuthenticated() && 
      (resource.data.tenantEmail == request.auth.token.email || 
       request.auth.token.role == 'landlord' || 
       request.auth.token.role == 'agent' || 
       request.auth.token.admin == true);
  }
  ```
  Any user who holds or assumes the role `landlord` or `agent` can read, modify, or delete ALL referee and guarantor responses across the entire system, regardless of whether they manage the property or tenant.
- **Impact**: Unrestricted horizontal access to references and guarantor financials by any registered landlord.
- **Recommended Fix**:
  Verify that the landlord's UID or email matches the `landlordEmail` stored on the associated referencing record.

---

### [MEDIUM-04] Overly Broad Regex in Search Microservice CORS
- **Severity**: Medium
- **Affected Component**: [`proptii-search/src/app.ts`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/proptii-search/src/app.ts#L29-L33)
- **Description**:
  The search service validates CORS using `/\.onrender\.com$/.test(origin)`. Any third party with an account on Render can create a free service (e.g., `evil-app.onrender.com`), and requests originating from that domain will be trusted with credentials enabled.
- **Impact**: Cross-origin exploitation from any hosted Render app.
- **Recommended Fix**:
  Match only your explicit project subdomains (e.g., `/^https:\/\/proptii(-[a-z0-9]+)?\.onrender\.com$/`).

---

### [LOW-01] Cross-Site Scripting (XSS) via Unsanitized Markdown in Search Modal
- **Severity**: Low
- **Affected Component**: [`src/components/SearchResultsModal.tsx`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/src/components/SearchResultsModal.tsx#L56-L88)
- **Description**:
  `SearchResultsModal` implements a naive markdown-to-HTML parser using regex replacement and renders it directly via `dangerouslySetInnerHTML`:
  ```typescript
  const formatContent = (text: string) => {
    return text
      .replace(/#### (.*)/g, '<h4 class="text-lg font-bold mt-4 mb-2">$1</h4>')
      ...
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:underline">$1</a>')
      ...
  };
  ```
  No HTML entity encoding is performed, nor is DOMPurify used. If search content or scraped listing titles contain `<img src=x onerror=...>` or markdown links with `javascript:` schemes, JavaScript executes in the user's browser.
- **Impact**: Stored or reflected XSS leading to session hijacking.
- **Recommended Fix**:
  Use `DOMPurify.sanitize()` or a battle-tested markdown library (`react-markdown`).

---

### [LOW-02] Missing Security Headers on Azure Static Web Apps
- **Severity**: Low
- **Affected Component**: [`public/staticwebapp.config.json`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/public/staticwebapp.config.json#L1-L45)
- **Description**:
  `staticwebapp.config.json` configures client routing and fallbacks, but defines no `globalHeaders`. The application is missing `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, and `Strict-Transport-Security`.
- **Impact**: Susceptibility to clickjacking and MIME sniffing.
- **Recommended Fix**:
  Add `globalHeaders` to `staticwebapp.config.json`:
  ```json
  "globalHeaders": {
    "Content-Security-Policy": "default-src 'self'; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.onrender.com;",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  }
  ```

---

### [LOW-03] Leftover Test Collection Open in Firestore Rules
- **Severity**: Low
- **Affected Component**: [`firestore.rules`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/firestore.rules#L46-L49)
- **Description**:
  ```javascript
  match /test/{docId} {
    allow read, write: if isAuthenticated();
  }
  ```
  Any authenticated user can read and write arbitrary documents to `/test/`.
- **Impact**: Clutter and potential use as a C2/exfiltration dead drop.
- **Recommended Fix**:
  Remove the `/test/` rule in production environments.

---

## 3. Attack Chains

### Attack Chain A: Zero-Auth Full Cloud Storage Wiping & Malicious File Injection
1. Attacker calls `DELETE /api/storage/file?path=contracts/master_lease.pdf` on `v2-backend`.
2. Because `StorageController` lacks `@UseGuards(FirebaseAuthGuard)` and uses the Admin SDK, the contract is permanently deleted from Google Cloud Storage.
3. Attacker uses the public Firebase Storage rule `allow write: if request.resource.size < 15MB` on `storage.rules` to upload a fake contract under the exact same path.
4. When tenants or landlords download their contract, they receive the attacker's tampered document.

### Attack Chain B: Mock Auth -> Role Escalation -> Complete Tenant Database Exfiltration
1. Attacker crafts a request with `Authorization: Bearer mock-landlord-hacker`.
2. `FirebaseAuthGuard` accepts this token, bypasses Firebase Auth, and assigns role `landlord`.
3. Attacker invokes `GET /api/users` to harvest all registered users and their emails.
4. Attacker invokes `GET /api/tenants` and `GET /api/referencing/forms/:formId` to retrieve full tenant files, including income and IDs.
5. Attacker invokes `DELETE /api/users/:id` to wipe out the genuine platform administrators.

### Attack Chain C: Conversation Account Takeover -> Landlord Impersonation & Phishing Relay
1. Attacker registers an account and calls `POST /api/guest/claim/auto-merge` specifying `{"email": "victim_landlord@domain.com"}`.
2. All guest enquiries and messages directed to the victim landlord are transferred to the attacker's UID.
3. Attacker reads private messages with prospective tenants and identifies pending deposits.
4. Attacker calls `POST /api/contracts/send-signed-contract` providing the tenant's email address and custom HTML containing attacker-controlled payment instructions.
5. The email is delivered via Resend from `proptii.co`, tricking the tenant into transferring deposits to the attacker's bank account.

---

## 4. Secure Design & Remediation Roadmap

1. **Immediate Hardening (Day 1)**:
   - Patch [`v2-backend/src/guards/firebase-auth.guard.ts`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/v2-backend/src/guards/firebase-auth.guard.ts): Strip the mock token backdoor.
   - Patch [`storage.rules`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/storage.rules): Remove `allow read: if true;` and unauthenticated `allow write`.
   - Protect [`StorageController`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/v2-backend/src/controllers/storage.controller.ts): Add `@UseGuards(FirebaseAuthGuard)` and validate folder ownership.
2. **Access Control & BOLA Defense (Week 1)**:
   - Add admin role guard to `GET /api/users`, `DELETE /api/users/:id`, and `GET /api/sheets`.
   - Fix role switching logic in [`AuthController.updateRole`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/v2-backend/src/controllers/auth.controller.ts).
   - In [`guest-enquiry.controller.ts`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/v2-backend/src/controllers/guest-enquiry.controller.ts), remove `body.email` parameter tampering from `autoMerge`.
   - Restrict [`contract.controller.ts sendSignedContract`](file:///home/angelidev/Desktop/luxcity/proptii-r1.1a/v2-backend/src/controllers/contract.controller.ts) to fixed server-side templates.
3. **Defense-in-Depth & CI/CD Guardrails (Week 2)**:
   - Bind `ThrottlerGuard` globally in `AppModule`.
   - Replace dynamic CORS reflection (`origin: true`) with the static `allowedOrigins` array in `main.ts`.
   - Sanitize all markdown in `SearchResultsModal.tsx` using `DOMPurify`.
   - Inject standard security headers into `public/staticwebapp.config.json`.
