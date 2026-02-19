# 03 Search Speed Improvement Plan

## Purpose

This document defines a comprehensive, low-risk plan to reduce end-to-end search time from browser launch through backend response and frontend rendering.

Primary goals:

- Cut typical search latency from ~30s to ~5-10s.
- Preserve current behavior as much as possible.
- Make rollback simple and fast.
- Avoid destructive changes in early phases.

---

## Three-Sprint Staging (Context Boundaries)

The plan is split into **3 sprints** so each can be implemented sequentially without bleeding context. Implement one sprint fully (including validation and rollback checks) before starting the next. Do not combine sprints in a single implementation run.

| Sprint | Focus | Phases | Approx. duration | Context boundary |
|--------|--------|--------|-------------------|------------------|
| **Sprint 1** | Foundation + low-risk wins | 0 + 1 | 2–3 days | Observability and request-blocking/waits only. Stop before any scroll/carousel or email-enrichment changes. |
| **Sprint 2** | Critical-path trim + email fast path | 2 + 3 | 3–4 days | Scroll/carousel removal and parallel email lookup + cache. Stop before warm browser or async enrichment. |
| **Sprint 3** | Infrastructure + optional advanced mode | 4 + 5 | 4–6 days | Warm browser pool, then (optionally) decoupled enrichment and progressive frontend hydration. |

**How to use when implementing:** For a given sprint, use only (1) the **Mandatory Guardrails** and **Rollback Triggers** sections, (2) the **single sprint section** for that sprint (Sprint 1, 2, or 3), and (3) the **Shared: Validation**, **Shared: Deployment Pattern**, and **Sprint Execution Order** sections. Do not load or implement another sprint’s phases in the same run. Complete all deliverables and validation for the current sprint before starting the next.

## Brutal Truth About Rollback

Rollback can be very easy for code-level changes if we use feature flags and keep old paths intact. It is not always "one prompt easy" once stateful systems are involved.

What can be rolled back quickly:

- Request interception toggle.
- Scrolling and carousel behavior toggle.
- Timeout and retry value changes.
- Parallel vs sequential email enrichment toggle.
- Background email enrichment toggle.
- Frontend skeleton and rendering behavior toggle.

What cannot be guaranteed as instant rollback:

- Any data model/schema changes (none are planned in this document).
- Any external cache backend introduction (Redis) if infrastructure changes are needed.
- Any operational changes that are deployed without preserving old behavior path.

Conclusion:

- If we strictly follow this plan (flags-first, no schema migrations, additive changes), rollback is realistically easy and can be executed quickly.
- If we skip flags or remove old logic too early, rollback will not be easy.

## Rollback-First Delivery Strategy

## 1) Mandatory Guardrails

Before touching behavior:

- Create one dedicated branch for this workstream.
- Every major optimization must be behind an explicit feature flag.
- Keep the old path callable until at least one production-like bake period is complete.
- Do not delete existing logic during Phases 1-4.
- Use small, isolated commits per phase.

Recommended runtime flags:

- `SEARCH_OPT_REQUEST_BLOCKING=true|false`
- `SEARCH_OPT_DISABLE_SCROLLING=true|false`
- `SEARCH_OPT_DISABLE_CAROUSEL_TRIGGERS=true|false`
- `SEARCH_OPT_PARALLEL_EMAIL_LOOKUP=true|false`
- `SEARCH_OPT_AGENT_CAP=10` (or 5)
- `SEARCH_OPT_EMAIL_QUERIES_PER_AGENT=1` (or 3)
- `SEARCH_OPT_WARM_BROWSER=true|false`
- `SEARCH_OPT_BACKGROUND_EMAIL_ENRICHMENT=true|false`
- `SEARCH_OPT_FRONTEND_FAST_RENDER=true|false`

Rollback operation model:

- "Soft rollback": flip one or more flags to restore previous behavior instantly.
- "Hard rollback": revert the last commit(s) in reverse order if needed.

## 2) Observability Before Optimization

Add baseline telemetry first so performance claims are measurable and reversible:

- Stage timings:
  - Browser launch/create page
  - Navigation
  - Selector wait
  - Scroll/carousel phase
  - Parse phase
  - Email enrichment phase
  - Response serialization
- Request-level correlation ID from frontend to backend.
- P50, P90, P95, timeout, and error-rate dashboards.

Why this matters:

- We need hard proof of improvement and safe rollback trigger thresholds.

## 3) Rollback Triggers (Predefined)

Any phase is automatically rolled back if one or more of these occurs:

- P95 latency worsens by >15% over baseline for 30+ minutes.
- Search success rate drops by >2% absolute.
- Frontend rendering errors increase materially.
- Upstream block/anti-bot incidents spike.

These thresholds should be agreed before deployment and encoded in monitoring alerts.

---

## Sprint 1: Foundation + Low-Risk Wins

**Objective:** Establish observability and capture the first latency gains without changing search flow or output contract.

**Context boundary:** Implement only Phase 0 and Phase 1. Do not modify scroll/carousel logic or email enrichment. When this sprint is done, you have baseline metrics and request-blocking/waits optimizations live behind flags.

### Phase 0: Baseline and Staging Readiness

Scope:

- Instrument current path without changing behavior (stage timings, correlation ID, dashboards as in **2) Observability Before Optimization**).
- Capture 2–3 days of baseline (or minimum statistically meaningful sample).

Deliverables:

- Reliable baseline for P50/P95 and error rates by search type.
- Rollback risk: near zero.

### Phase 1: Low-Risk Quick Wins (Feature-Flagged, No Flow Changes)

Scope:

1. Enable OTM request blocking (images/fonts/media/analytics) similar to Rightmove path.
2. Reduce conservative waits: shorter selector wait ceiling, lower retry backoff delays.
3. Reduce post-click cookie/modal waits.

Flags introduced in this sprint:

- `SEARCH_OPT_REQUEST_BLOCKING` (and any timeout/retry config used for Phase 1).

Why stable:

- Same search logic, same output contract; only less wasted waiting.

Expected impact:

- ~2–6s faster.

Sprint 1 validation:

- Use **Performance Test Matrix** and **Functional Regression Checks** (below) for current provider set.
- Confirm P50/P95 improved vs baseline and success rate unchanged.

Sprint 1 rollback:

- Flip `SEARCH_OPT_REQUEST_BLOCKING` and restore previous timeout/retry values (see **04-search-speed-rollback-runbook.md**).

---

## Sprint 2: Critical-Path Trim + Email Fast Path

**Objective:** Remove non-essential work from the critical path and speed up agent email enrichment while keeping the response synchronous and the output shape unchanged.

**Context boundary:** Implement only Phase 2 and Phase 3. Do not introduce warm browser pool or async enrichment. When this sprint is done, scroll/carousel are disabled and email lookup is parallelized and capped with in-memory cache.

### Phase 2: Remove Non-Essential Work in Critical Path

Scope:

1. Disable deep scrolling loops used for lazy image loading.
2. Disable carousel trigger simulation in search flow.

Flags introduced:

- `SEARCH_OPT_DISABLE_SCROLLING`
- `SEARCH_OPT_DISABLE_CAROUSEL_TRIGGERS`

Why stable:

- Search results do not require preloading multiple carousel images; property list viability depends on metadata.

Expected impact:

- ~9–12s faster.

### Phase 3: Email Enrichment Fast Path (Still Synchronous Response)

Scope:

1. Parallelize agent email lookup for selected agents (with concurrency guard / pool limit).
2. Cap agents processed (e.g., start at 10, then test 5).
3. Reduce per-agent Brave query count (e.g., from 3 to 1) under flag.
4. Add durable in-memory cache with TTL for agent email results.

Flags introduced:

- `SEARCH_OPT_PARALLEL_EMAIL_LOOKUP`
- `SEARCH_OPT_AGENT_CAP`
- `SEARCH_OPT_EMAIL_QUERIES_PER_AGENT`
- (Cache on/off if exposed as a separate flag)

Why stable:

- Output shape unchanged; only execution order and workload optimized.

Expected impact:

- ~8–20s faster depending on agent count and cache hit rate.

Honest caution:

- Parallel lookup can amplify upstream rate-limit risk; use a concurrency guard, not unbounded `Promise.all`.

Sprint 2 validation:

- Run **Performance Test Matrix** and **Functional Regression Checks**; confirm contact info still correct and cache TTL/stale behavior acceptable.

Sprint 2 rollback:

- Set parallel/cap/query flags back to legacy values; re-enable scroll/carousel flags if needed (see runbook).

---

## Sprint 3: Infrastructure + Optional Advanced Mode

**Objective:** Reduce browser launch overhead and, optionally, decouple email enrichment from the initial response for best perceived speed.

**Context boundary:** Implement Phase 4, then Phase 5 only if the decision gate (below) says to proceed. When this sprint is done, warm browser pool is in place and, if chosen, async enrichment and progressive frontend hydration are available behind flags.

### Phase 4: Warm Browser Pool

Scope:

1. Keep one or more warm browser instances alive.
2. Use page-per-request rather than browser-per-request.
3. Cache executable path at startup.

Flags introduced:

- `SEARCH_OPT_WARM_BROWSER`

Why stable:

- Core scrape logic unchanged; only process lifecycle changes.

Expected impact:

- ~2–4s faster per request and better consistency.

Honest caution:

- Operational stability depends on memory limits and orphan-page cleanup; implement watchdog health checks and recycle policy.

### Phase 5: Advanced Mode – Decouple Email Enrichment from Initial Results (Optional)

Scope:

1. Return property list quickly without blocking on full email enrichment.
2. Run enrichment in background.
3. Frontend renders immediate results and progressively hydrates contact info.

Flags introduced:

- `SEARCH_OPT_BACKGROUND_EMAIL_ENRICHMENT`
- `SEARCH_OPT_FRONTEND_FAST_RENDER`

Why high impact:

- Removes longest task from user-visible critical path.

Expected impact:

- Perceived latency can drop to ~3–5s.

Brutal truth:

- Phase 5 is the least "trivial rollback" stage; keep synchronous endpoint and rendering path intact until confidence is high.

Sprint 3 validation:

- Full **Performance Test Matrix** including time-to-first-render and time-to-full-contact-hydration; **Functional Regression Checks** for progressive UI and contact states.

Sprint 3 rollback:

- Disable warm browser and background-enrichment/fast-render flags; fall back to synchronous path (see runbook).

---

## Shared: Validation and Test Strategy

Use the following in every sprint; each sprint section above specifies which parts apply.

### Performance Test Matrix

- Query types: narrow location + high inventory; sparse location + low inventory; mixed natural-language filters.
- Providers: OnTheMarket, Rightmove; OpenRent/Rentola if enabled.
- Load conditions: single-user; small burst concurrency.

Metrics: backend stage timings; end-to-end time to first render; time to full contact hydration (if background mode enabled); error/timeout rates.

### Functional Regression Checks

- Result relevance unchanged or acceptable.
- Core card fields render correctly.
- Contact info behavior clear (present/loading/unavailable).
- Cache validity and stale handling verified where cache is used.

---

## Shared: Deployment Pattern

Apply to every sprint release:

1. Ship code dark (flags off).
2. Enable by environment: Dev → staging → limited production cohort.
3. Increase traffic percentage in controlled steps.
4. If a **Rollback Trigger** is breached, instant soft rollback via flags.
5. Hard rollback only if flag rollback is insufficient (see **04-search-speed-rollback-runbook.md**).

---

## Sprint Execution Order and Decision Gate

**Order:** Execute **Sprint 1 → Sprint 2 → Sprint 3** in sequence. Do not start Sprint 2 until Sprint 1 is validated and stable; do not start Sprint 3 until Sprint 2 is validated and stable.

**Decision gate before Sprint 3 Phase 5:** If after Sprints 1–2 (and optionally Phase 4) P95 is &lt; 10s and success rate is stable, the team may **pause before implementing Phase 5**. That keeps architecture simpler and rollback easiest. If user-perceived delay is still too high, proceed with Phase 5 inside Sprint 3.

---

## Final Recommendation

1. Run **Sprint 1** first (foundation + quick wins).
2. Run **Sprint 2** next (critical-path trim + email fast path).
3. Run **Sprint 3** (warm browser; then Phase 5 only if the decision gate says so).

This three-sprint sequence keeps each implementation run bounded, avoids context bleed, and preserves practical rollback at every step.
