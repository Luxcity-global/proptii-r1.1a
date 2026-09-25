---
name: security-audit
description: >-
  Perform a comprehensive, adversarial red-team security audit of a codebase, system design, or application architecture to identify vulnerabilities, logic flaws, chained attack paths, and defensive remediations.
---

# Adversarial Red-Team Security Audit

Adversarial security audit runbook and methodology for codebases, system designs, and application architectures.

## Purpose & Mindset

Perform a comprehensive, adversarial security audit from the perspective of a senior security engineer and red-team specialist. Assume the system will be deployed in a hostile environment against motivated attackers.

- **Think like an adversary**: Break assumptions, bypass validations, manipulate edge cases, and test how components interact under stress.
- **Deep logic analysis**: Prioritize business logic flaws and multi-step attack chains over superficial pattern matching.
- **Do not assume safety**: Infer risks when context is partial, flag potential vulnerabilities with reasoning, and be exhaustive.
- **Defensive focus**: Detail theoretical exploitation mechanics and impact to prioritize risk, accompanied by concrete architectural fixes and remediations.

---

## Audit Workflow

### 1. Scope & Reconnaissance
Map all system surfaces and boundaries:
- **Frontend / Client**: UI, client-side validation, browser storage (`localStorage`, `sessionStorage`, IndexedDB, cookies).
- **Backend / APIs**: REST/GraphQL/gRPC endpoints, routing, middleware, controllers, business services.
- **Auth & Identity**: Authentication schemes, session management, token handling (JWT, OAuth, API keys), RBAC/ABAC models.
- **Data & Persistence**: Database schemas, ORMs, raw query builders, caching layers (Redis, Memcached), file stores.
- **Infrastructure & Config**: Environment variables, deployment manifests, Docker/K8s configs, cloud IAM, security headers.
- **Dependencies & Supply Chain**: Third-party packages, webhooks, external integrations.

### 2. Threat Modeling
1. **Attacker Profiles**:
   - Anonymous external visitor / unauthenticated user
   - Authenticated low-privilege user (tenant, buyer, customer)
   - Authenticated high-privilege user (admin, operator, internal staff)
   - Malicious insider / compromised API consumer
2. **Entry Points & Trust Boundaries**:
   - Public endpoints, webhook listeners, user upload handlers, WebSocket channels.
3. **Sensitive Assets**:
   - PII, financial data, auth tokens, database credentials, encryption keys, admin capabilities.

### 3. Vulnerability Investigation Checklist

#### A. Authentication & Authorization
- Broken authentication, weak session lifecycle, missing invalidation on logout/password change.
- Privilege escalation:
  - Vertical: Standard user elevating to admin/staff.
  - Horizontal: Insecure Direct Object Reference (IDOR/BOLA) allowing access to other tenants/users.
- Insecure password reset, MFA bypass, or predictable token generation.
- Token handling issues: weak signing algorithms, hardcoded secrets, lack of signature verification, token leakage via URLs/referrers.

#### B. Input Handling & Data Validation
- Injection vectors: SQL, NoSQL, OS command, LDAP, Server-Side Template Injection (SSTI).
- Cross-Site Scripting (XSS): Stored, Reflected, DOM-based.
- Cross-Site Request Forgery (CSRF) and missing origin/referrer validation on state-changing actions.
- File upload vulnerabilities: Unrestricted file types, path traversal, lack of virus/content scanning, direct execution of uploaded media.
- SSRF (Server-Side Request Forgery) in URL fetchers, webhook deliveries, or image proxying.

#### C. Data Security & Cryptography
- Sensitive data exposure in logs, error traces, client responses, or version control.
- Hardcoded secrets, API keys, credentials, or development certificates.
- Insecure storage: Sensitive tokens in unencrypted `localStorage`, cookies lacking `Secure`, `HttpOnly`, or `SameSite` flags.
- Cryptographic misuse: Weak hashing (MD5/SHA1 for passwords), predictable IVs/salts, ECB mode, broken PRNGs.

#### D. API & Business Logic Security
- Broken Object Property Level Authorization (Mass Assignment / Over-posting).
- Lack of rate limiting or anti-brute-force controls on authentication, OTPs, or expensive endpoints.
- Business logic abuse: Race conditions (TOCTOU), double-spending, state desynchronization, workflow/step skipping.
- Unhandled edge cases: Negative numbers, floating point inaccuracies, integer overflows, unexpected nulls/undefined payloads.

#### E. Infrastructure & Configuration
- Missing or misconfigured security headers: `Content-Security-Policy` (CSP), `Strict-Transport-Security` (HSTS), `X-Frame-Options`, `X-Content-Type-Options`.
- Permissive CORS policies (e.g., `Access-Control-Allow-Origin: *` with credentials enabled).
- Exposed debug/metrics endpoints, internal swagger/OpenAPI docs in production, default credentials.
- Insecure cloud storage configurations (public S3/blob containers).

#### F. Dependencies & Supply Chain
- Known CVEs in dependencies.
- Risky libraries with remote code execution (RCE) patterns or unsafe deserialization (`eval()`, `pickle`, `unserialize`).
- Unpinned or vulnerable package versions.

#### G. Advanced / Novel Threat Vectors
- Cache poisoning & cache deception.
- HTTP request smuggling / desynchronization.
- Replay attacks or missing nonce/timestamp verification.
- Multi-step exploit chains combining low-severity items into high-impact breaches.

---

## Reporting Format

Structure all audit reports using the following sections:

### 1. Executive & Vulnerability Summary
- **Risk Posture Overview**: High-level summary of security state.
- **Findings Count by Severity**:
  - **Critical**: Immediate system compromise, RCE, auth bypass, mass data breach.
  - **High**: Significant data leak, IDOR on sensitive assets, privilege escalation.
  - **Medium**: CSRF, stored XSS in restricted contexts, missing rate limiting.
  - **Low / Informational**: Best-practice deviations, verbose headers, defense-in-depth suggestions.

### 2. Detailed Findings
For each discovered vulnerability:
- **Title**: Clear, descriptive name (e.g., `[CRITICAL] IDOR in Lead Management API allows Tenant Data Access`)
- **Severity**: `Critical` | `High` | `Medium` | `Low`
- **Affected Component**: File path, API route, or architectural module.
- **Description**: Technical explanation of the flaw and underlying mechanism.
- **Exploitation Scenario**: Step-by-step theoretical attack flow demonstrating how an attacker targets the flaw.
- **Impact**: Concrete business, data, and system consequences if exploited.
- **Recommended Remediation**: Actionable code snippet, configuration adjustment, or architectural fix.

### 3. Attack Chains
Map combinations of minor vulnerabilities that form a high-impact exploit path:
> *Example: Weak CORS policy (Low) + Verbose API error (Low) + IDOR in profile endpoint (Medium) -> Full account takeover chain (Critical).*

### 4. Secure Design & Defense-in-Depth Recommendations
- Architectural mitigations (e.g., zero-trust network policies, database row-level security, centralized auth middleware).
- Automated CI/CD guardrails (SAST, secret scanning, dependency scanning).
