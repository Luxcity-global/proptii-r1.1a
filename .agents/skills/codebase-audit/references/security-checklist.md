# Security Checklist

Work through the categories that apply to this codebase (skip categories that genuinely don't apply — e.g. a CLI tool with no network exposure doesn't need the "web-specific" section, but say so explicitly rather than silently omitting it). For each item, look for actual evidence in the code, not just the absence of an obvious red flag.

## 1. Input handling & injection

- Is every point where external input enters (HTTP params/body/headers, CLI args, file uploads, message queue payloads, env vars from untrusted sources) validated — type, length, format, allowed range — before use?
- SQL: parameterized queries / ORM usage throughout, or string concatenation into queries anywhere?
- Command execution: any shell-out (`exec`, `system`, `subprocess`, backticks) built from user input without strict allowlisting?
- Deserialization: any use of unsafe deserializers (e.g. Python `pickle`, Java native serialization, PHP `unserialize`) on untrusted input?
- Path traversal: any file path built from user input without normalization/allowlist checks?
- Template injection / XSS: is output encoding applied appropriately for the sink (HTML, JS context, URL, SQL, shell)? Any raw/`dangerouslySetInnerHTML`-style rendering of user content?
- SSRF: does the app fetch URLs supplied or influenced by users? Is there an allowlist or network-level restriction?

## 2. Authentication & authorization

- Are passwords hashed with a modern algorithm (bcrypt/scrypt/argon2), never plaintext or fast general-purpose hashes (MD5/SHA1/SHA256 alone)?
- Session/token handling: are tokens generated with a CSPRNG, given reasonable expiry, invalidated on logout/password change?
- Is authorization checked on every sensitive action server-side — not just hidden in the UI? Look specifically for **IDOR**: does fetching/modifying a resource by ID check that the current user actually owns/can access it, or does it trust the ID alone?
- Are admin/privileged routes protected by the same rigor as the rest, not just "not linked in the UI"?
- Multi-tenant data isolation: if there's a tenant/org concept, is every query scoped to the caller's tenant?

## 3. Data protection

- Is sensitive data (PII, credentials, tokens, payment info) encrypted at rest where appropriate, and always in transit (TLS)?
- **Secrets management**: any hardcoded API keys, passwords, private keys, or connection strings committed in the repo (including in git history if visible, config files, or test fixtures)? This is a Critical finding — flag immediately, see main SKILL.md.
- Logging: is sensitive data (passwords, tokens, full card numbers, PII) ever written to logs?
- Are `.env`/secrets files properly gitignored, and is there a `.env.example` instead of a real one committed?

## 4. Dependency & supply chain

- Lockfile present and committed (not just a manifest with loose version ranges)?
- Any dependencies that are clearly abandoned (no updates in years) in security-sensitive roles (auth, crypto, parsing)?
- If web search is available and the dependency list is short enough to check meaningfully, spot-check the most sensitive/internet-facing packages against known CVEs rather than the whole tree.
- Any use of `eval`-equivalent dynamic code loading from a remote or user-controlled source?

## 5. Infra & configuration

- Debug mode / verbose error pages: is stack-trace/debug info potentially exposed in production config?
- CORS: is it configured narrowly, or wide open (`*`) on routes that handle authenticated requests?
- Security headers (for web apps): CSP, X-Frame-Options/frame-ancestors, HSTS — present or absent?
- Rate limiting / brute-force protection on auth endpoints and any expensive operations?
- Default credentials or sample config left in a state that would work if deployed as-is?

## 6. Web/API-specific (skip if not applicable)

- CSRF protection on state-changing requests that rely on cookies for auth.
- File upload handling: type/size validation, storage outside the web root or with execution disabled, filename sanitization.
- Mass assignment: do update endpoints allow arbitrary fields to be set from the request body (e.g. a user setting their own `is_admin` field)?
- API versioning/deprecation: any old, unmaintained API versions still reachable with weaker checks than the current one?

## Severity guide

- **Critical**: directly exploitable for unauthorized data access, auth bypass, RCE, or exposes live secrets. Assume an attacker with no special access can reach it.
- **High**: exploitable but requires some precondition (e.g. an authenticated-but-low-privilege account, or a specific misconfiguration state), or affects a large blast radius (e.g. one tenant's data leaking to another).
- **Medium**: a real weakness that raises risk or would be part of a chained attack, but not directly exploitable alone (e.g. missing rate limiting, verbose error messages, weak-but-not-broken crypto choice).
- **Low**: best-practice deviation, defense-in-depth gap, or something that matters more as the app scales/matures (e.g. missing security headers on a low-value internal tool).
