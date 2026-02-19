# Sprint 3 Staged Test Results (A → B [→ C])

Single report for Sprint 3: baseline (A), Phase 4 only (B), and optionally Phase 4 + Phase 5 (C). Run stages back-to-back; then complete "Correlate, analyse and adjust" before any further changes.

**Sprint 3 baseline to beat (from Sprint 2 full):** P95 = 18.8 s, P50 = 8.5 s. **Target (Phase 4):** ~2–4 s faster (P95 toward ~14–16 s). **Decision gate:** If after Stage B P95 < 10 s and success rate stable, team may pause before Phase 5.

**Execution order:** Run Stage A → Stage B in sequence; run Stage C only if Phase 5 is implemented. Then complete "Correlate, analyse and adjust".

**Automation:** From `search/backend`:

- `npm run test:s3:staged` — runs Sprint 3 stages (A, B [and C if script updated]) back-to-back and updates this document.
- `npm run test:s3:staged:a` / `test:s3:staged:b` / `test:s3:staged:c` — run a single stage.
- **Final testing across board:** `npm run test:final:staged` — runs Sprint 2 (A→B→C) then Sprint 3 (A→B [→C with `--s3-c`]), updates both [06-sprint2-staged-test-results.md](06-sprint2-staged-test-results.md) and this document, and fills **Correlate, analyse and adjust** (correlation table, analysis, decision, next steps) for the final tuning decision. Use `--skip-s2` to run S3 only when S2 is already validated.

---

## Test results summary

| Run | Date | Env | Runs | Success | P50 (s) | P95 (s) | Min (s) | Max (s) | browserLaunch note |
|-----|------|-----|------|---------|---------|---------|---------|---------|--------------------|
| Stage A (Sprint 3 baseline) | (fill) | S2 full, S3 off | 12 | (fill) | (fill) | (fill) | (fill) | (fill) | cold |
| Stage B (Phase 4 only) | (fill) | + warm browser | 12 | (fill) | (fill) | (fill) | (fill) | (fill) | pool |
| Stage C (Phase 4+5) | (fill) | + background enrich | 12 | (fill) | (fill) | (fill) | (fill) | (fill) | (fill) |

---

## Stage A: Sprint 3 baseline

**Goal:** Confirm baseline matches Sprint 2 full (P95 ~18.8 s). All Sprint 2 flags on; all Sprint 3 flags off.

**Env:** Sprint 2 full: `SEARCH_OPT_DISABLE_SCROLLING=true`, `SEARCH_OPT_DISABLE_CAROUSEL_TRIGGERS=true`, `SEARCH_OPT_PARALLEL_EMAIL_LOOKUP=true`, `SEARCH_OPT_AGENT_CAP=10`, `SEARCH_OPT_EMAIL_QUERIES_PER_AGENT=1`, `SEARCH_OPT_EMAIL_CACHE_TTL_SEC=3600`. Sprint 3: `SEARCH_OPT_WARM_BROWSER=false`.

**Results (fill after run):**

| Field | Value |
|-------|--------|
| Date/time | (fill) |
| Env summary | S2 full, S3 off |
| Number of runs | 12 |
| Success count | (fill) |
| P50 total (ms) | (fill) |
| P95 total (ms) | (fill) |
| Min total (ms) | (fill) |
| Max total (ms) | (fill) |
| Timeouts/errors | (fill) |

**Sample `[SCRAPE_TIMINGS]` lines:** (run script to populate)

---

## Stage B: Phase 4 only

**Goal:** Measure impact of warm browser pool only (no Phase 5).

**Env:** Stage A plus `SEARCH_OPT_WARM_BROWSER=true`.

**Results (fill after run):**

| Field | Value |
|-------|--------|
| Date/time | (fill) |
| Env summary | Phase 4 only (warm browser) |
| Number of runs | 12 |
| Success count | (fill) |
| P50 total (ms) | (fill) |
| P95 total (ms) | (fill) |
| Min total (ms) | (fill) |
| Max total (ms) | (fill) |
| Timeouts/errors | (fill) |

**Sample `[SCRAPE_TIMINGS]` lines:** (run script to populate)

---

## Stage C: Phase 4 + Phase 5 (optional)

**Goal:** Full Sprint 3 — warm browser + background email enrichment + frontend fast render. Only applicable if Phase 5 is implemented.

**Env:** Stage B plus `SEARCH_OPT_BACKGROUND_EMAIL_ENRICHMENT=true`, `SEARCH_OPT_FRONTEND_FAST_RENDER=true` (frontend flag may be derived from API response).

**Results (fill after run):** (fill when Phase 5 is implemented and Stage C is run)

---

## Correlate, analyse and adjust

### Correlation

| Stage | P50 (ms) | P95 (ms) | Min | Max | browserLaunch note |
|-------|----------|----------|-----|-----|--------------------|
| A (Sprint 3 baseline) | (fill) | (fill) | (fill) | (fill) | cold |
| B (Phase 4 only) | (fill) | (fill) | (fill) | (fill) | pool |
| C (Phase 4+5) | (fill) | (fill) | (fill) | (fill) | (fill) |

### Analysis

- Did Phase 4 (warm browser) reduce total time by ~2–4 s vs Stage A?
- Success rate unchanged across stages?
- If Stage B P95 < 10 s: document "Pause before Phase 5" and optionally skip Phase 5. Else: proceed to Phase 5, then run Stage C.

### Decision

- **Proceed to Phase 5** if P95 still > 10 s after Stage B and user-perceived delay is too high.
- **Pause before Phase 5** if P95 < 10 s and success rate stable.
- **Rollback** if regression; document in runbook.

---

**Next steps:** (fill after runs and analysis)

To populate results: from `search/backend` run `npm run test:s3:staged` (or `test:s3:staged:a` / `test:s3:staged:b`). For **final decision on tuning**, run `npm run test:final:staged` to execute S2 + S3 stages, update both 06 and 07, and auto-fill the correlation table, analysis, and decision. Ensure the backend can start (Chrome/Chromium available, port 3001 free) and OTM is reachable.
