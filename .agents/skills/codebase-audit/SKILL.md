---
name: codebase-audit
description: Audit a codebase for functionality correctness, security, and performance/architecture quality, producing numeric scores and a prioritized improvement plan. Use this whenever the user asks to "audit", "review", "assess", "grade", or "score" a codebase or repository — including requests like "does this code do what it's supposed to", "check this for security issues", "is this architecture solid", "review my repo before launch", or "rate this codebase". Also use it when the user wants a security review, a performance review, a code quality report, or a pre-launch/pre-investment technical due-diligence pass, even if they don't use the word "audit" explicitly. Trigger this for a whole repository/project, not for reviewing a single small snippet someone pastes inline.
---

# Codebase Audit

## What this skill does

Produces an evidence-based audit of a codebase across three dimensions:

1. **Functionality** — does each part of the codebase actually do what it claims to do, and does it fail safely when it doesn't?
2. **Security** — is the code and its architecture free of exploitable weaknesses?
3. **Performance & architecture** — are the design choices ones a competent senior engineer would call optimal or at least acceptable, given the system's actual scale and constraints?

The output is a written report with a **Security score** and a **Performance score** (0–100 each), a functionality summary, concrete findings with file:line evidence, and a prioritized improvement plan. Functionality issues aren't given their own headline score — a functionality bug is instead routed into the Security or Performance score depending on its consequence (a broken auth check is a security finding; a broken cache-invalidation path is a performance finding), and is also logged in the functionality summary so nothing is lost. See "Why no separate functionality score" below.

## Why this approach

A trustworthy audit is grounded in things actually observed in the code, not in a generic "here's what could go wrong in any app" list. The whole point of the exercise is that the user can act on it, and can trust that a "9/10 security" doesn't quietly mean "I skimmed the README." That means:

- Every finding needs a file path and, wherever possible, a line number or function name.
- Every score needs to trace back to specific findings, not a vibe.
- Coverage matters more than depth in the first pass — a shallow pass over the whole codebase beats a deep dive into one file while ten others go unread. Go deep only on the highest-risk areas (auth, payments, data access, anything internet-facing).
- If something can't be verified (e.g. no test suite exists, so "does it work" can't be confirmed dynamically), say so plainly rather than guessing.

## Workflow

### Phase 0 — Scope the audit

Before diving in, get a fast lay of the land so time is spent where it matters:

- Locate the codebase (path given, or ask if genuinely ambiguous — e.g. a monorepo with unrelated projects inside it).
- Identify language(s), framework(s), and the app's basic shape (web API, frontend SPA, CLI, data pipeline, mobile backend, etc.) from config/manifest files (`package.json`, `requirements.txt`/`pyproject.toml`, `go.mod`, `Cargo.toml`, `pom.xml`, etc.).
- Note the entry points: where does execution start, what's exposed to a network or a user (routes, RPC handlers, CLI commands)?
- Note size (rough file/line count) so you can calibrate how much you can realistically read closely versus sample.

If the user gave a specific focus ("just check security", "is this API fast enough"), narrow scope accordingly but still do a lightweight pass on the other dimension so the report doesn't silently omit something dangerous — flag it briefly rather than fully scoring it.

### Phase 1 — Map the codebase

Build a mental (or written, for a large codebase) map:

- Directory structure and what each major module/package is responsible for.
- Data flow: where does input enter, where does it get validated, where does it hit storage or external services, where does output leave.
- Dependencies: read the lockfile/manifest, note anything outdated, unmaintained, or with known CVEs. Don't try to hand-verify every package's CVE history from memory — if you have web search available and the count of dependencies is manageable, spot-check the ones that are internet-facing or handle sensitive data (auth libraries, parsers, crypto, serialization). Otherwise flag dependency-freshness as a general item.
- Existing tests: what's covered, what's the ratio of test code to app code, are there integration/e2e tests or only unit tests.
- Existing docs/comments that state intent — you need to know what the code is *supposed* to do before judging whether it does it.

### Phase 2 — Functionality audit

For each meaningful module/feature, check:

- **Does it do what it claims?** Compare implementation against docstrings, README claims, API contracts, or obvious naming intent. Read the actual logic — don't assume a function does what its name says.
- **Error handling** — what happens on bad input, a failed network call, a full disk, a timeout? Silent failures and swallowed exceptions are functionality bugs even when they don't crash anything.
- **Edge cases** — empty collections, null/None, boundary values, concurrent access, partial writes.
- **Test coverage and quality** — do tests exist, do they test behavior (not just that a function runs), and do they cover the failure paths, not only the happy path? If you can run the test suite, run it and record the actual pass/fail result rather than assuming.
- **Dead or unreachable code**, TODOs left unresolved, feature flags stuck in a half-migrated state — these are signals of things that only partially work.

Log every functionality issue found, tagged with which downstream score it feeds (security or performance) — see "Why no separate functionality score."

### Phase 3 — Security audit

Read `references/security-checklist.md` before scoring security — it has the full checklist organized by category (input handling, auth/authz, data protection, dependency/supply chain, infra/config, and web-specific issues) with what to look for and how to grade severity. Work through it against the actual code; don't paste the checklist into the report.

Key mindset: think like an attacker with access to the same interfaces a real user or API client has. For every entry point mapped in Phase 1, ask "what's the worst input I could send here, and what does the code do with it?"

### Phase 4 — Performance & architecture audit

Read `references/performance-checklist.md` before scoring performance — it covers algorithmic complexity, data access patterns, caching, concurrency, resource management, and scalability-vs-actual-need.

Key mindset: "optimal or acceptable" is relative to the system's actual scale and requirements, not to some abstract ideal. A single-tenant internal tool doing an O(n²) loop over 200 items is fine; the same loop over a user-facing table that will hit a million rows is a real finding. Note the intended scale when you can infer it, and judge architecture choices against that, not against what a hyperscale system would need.

### Phase 5 — Score

Read `references/scoring-rubric.md` for the full weighted rubric. Summary of the approach:

- Security and Performance are each scored 0–100 from their respective sub-category scores (weighted average — see rubric for weights).
- Start from 100 and deduct per finding based on severity (Critical/High/Medium/Low), not from a subjective top-down guess. This keeps the score traceable: someone should be able to add up the deductions and get your number.
- A single Critical finding (e.g. unauthenticated access to sensitive data, remote code execution, SQL injection on a real endpoint) should cap the relevant score well below "passing," regardless of how clean everything else is — severity, not just count, drives the score.
- State the score alongside a one-line justification ("72/100 — solid input validation and auth, but two medium-severity N+1 query patterns and one unpatched high-severity dependency").

### Phase 6 — Write the report

Use the structure in "Report structure" below. This is a document the user will keep and act on — check `file-creation-advice`/artifact conventions in your system prompt for whether it should be a markdown file, a Word doc, or an inline reply; when in doubt for a report of this length, a file is appropriate since it's a deliverable to keep, share, or hand to a team.

Don't pad the report to look thorough. If a section has few or no findings, say so briefly and move on — a short "no significant issues found in dependency management" is more useful than invented filler.

## Why no separate functionality score

Functionality problems matter because of their *consequences*, and those consequences are already captured by security or performance: a broken permission check is a security hole; an off-by-one that corrupts data under load is a performance/reliability issue; a feature that silently no-ops is a functionality bug with no security or performance angle, and belongs only in the functionality summary with a severity note. Giving functionality its own 0–100 score alongside the other two would double-count the same issues and invite gaming (e.g. "100% functional" for code that runs but leaks data). If the user specifically wants a numeric functionality/reliability score too, that's a reasonable ask — just say so and add it following the same deduction-based method as the other two.

## Report structure

Use this structure for the written report:

```markdown
# Codebase Audit: [project name]

## Executive summary
[3-6 sentences: what the codebase is, overall verdict, the two scores, the single most
important thing to fix]

## Scores
| Dimension | Score | One-line justification |
|---|---|---|
| Security | XX/100 | ... |
| Performance & Architecture | XX/100 | ... |

## Scope & method
[What was reviewed, what was out of scope or couldn't be verified (e.g. "no staging
environment to load-test against, so performance assessment is static-analysis only"),
and roughly how much of the codebase was read closely vs. sampled]

## Functionality summary
[What works as intended, what doesn't, test coverage assessment. Table of notable
functionality issues with severity, routed to security/performance below where applicable]

## Security findings
[Table: Severity | Finding | Location (file:line) | Impact | Fix]
Ordered Critical → High → Medium → Low.

## Performance & architecture findings
[Same table structure]

## Improvement plan
[Prioritized, actionable, ordered by risk-reduction-per-effort — not just severity order.
Group into "Do now" (critical/high, low effort or high risk), "Next" (medium priority),
and "Later / nice-to-have". Each item should be concrete enough to hand to an engineer
as a ticket, not "improve security".]
```

## Practical notes

- **Large codebases**: don't try to read every line. Prioritize by attack surface and blast radius — auth, payment, data access, anything parsing untrusted input, anything internet-facing — then sample the rest. Say explicitly what was sampled vs. fully reviewed.
- **No test suite / can't run the code**: this is itself a finding (functionality and often a process/reliability risk), not a blocker to the rest of the audit. Note it and proceed with static review.
- **Don't fabricate CVEs or version numbers.** If you're not certain a dependency version has a known vulnerability, say "should be checked against a CVE database" rather than asserting a specific CVE from memory. If web search is available, use it to verify rather than guess.
- **Secrets in code**: if you find what looks like a live credential/API key/private key committed in the codebase, flag it as Critical immediately and tell the user directly and clearly at the top of your conversational reply (not just buried in the report) — this is time-sensitive and they may need to rotate it right away.
- **Tone**: be direct about severity, but this is a diagnostic tool for improvement, not a report card to feel bad about. Frame findings around what to do next, not just what's wrong.
