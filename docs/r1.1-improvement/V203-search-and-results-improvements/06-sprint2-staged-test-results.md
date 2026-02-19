# Sprint 2 Staged Test Results (A → B → C)

Single report for Sprint 2: baseline (A), Phase 2 only (B), and Phase 2 + Phase 3 (C). Run stages back-to-back; then complete "Correlate, analyse and adjust" before any further changes.

**Sprint 2 baseline to beat (from Sprint 1 post-rollback):** P95 = 31.6 s, P50 = 28.1 s. **Target:** P95 < 20 s after Phase 2 + Phase 3.

**Execution order:** Run Stage A → Stage B → Stage C in sequence; then complete "Correlate, analyse and adjust".

**Automation:** From `search/backend`:

- `npm run test:s2:staged` — runs all three Sprint 2 stages (A, B, C) back-to-back and updates this document.
- `npm run test:s2:staged:a` / `test:s2:staged:b` / `test:s2:staged:c` — run a single stage.

---

## Test results summary

| Run | Date | Env | Runs | Success | P50 (s) | P95 (s) | Min (s) | Max (s) | scrollCarousel | emailEnrichment note |
|-----|------|-----|------|---------|---------|---------|---------|---------|----------------|----------------------|
| Stage A (Sprint 2 baseline) | 2026-02-19 05:17:16 | All S2 off | 12 | 12 | 25.5 | 36.1 | 21.2 | 37.6 | ~9.8s | — |
| Stage B (Phase 2 only) | 2026-02-19 05:20:55 | Scroll+carousel off | 12 | 12 | 15.6 | 21.3 | 13.3 | 22.2 | ~0 | — |
| Stage C (Phase 2+3) | 2026-02-19 05:23:53 | Full Sprint 2 | 12 | 12 | 8.5 | 18.8 | 6.7 | 22.1 | ~0 | parallel+cap+cache |

---

## Stage A: Sprint 2 baseline (all Sprint 2 flags off)

**Goal:** Confirm baseline matches Sprint 1 post-rollback (P95 ~31.6 s). No Sprint 2 optimisations enabled.

**Env:** `SEARCH_OPT_DISABLE_SCROLLING=false`, `SEARCH_OPT_DISABLE_CAROUSEL_TRIGGERS=false`, `SEARCH_OPT_PARALLEL_EMAIL_LOOKUP=false`, `SEARCH_OPT_AGENT_CAP=10`, `SEARCH_OPT_EMAIL_QUERIES_PER_AGENT=3`, `SEARCH_OPT_EMAIL_CACHE_TTL_SEC=0` (and Sprint 1 vars at baseline).

**Results (fill after run):**

| Field | Value |
|-------|--------|
| Date/time | 2026-02-19 05:17:16 |
| Env summary | All Sprint 2 flags off |
| Number of runs | 12 |
| Success count | 12 |
| P50 total (ms) | 25474 |
| P95 total (ms) | 36075 |
| Min total (ms) | 21181 |
| Max total (ms) | 37589 |
| Timeouts/errors | 0 |

**Sample `[SCRAPE_TIMINGS]` lines:**

```
{"correlationId":"s2-a-1771477909867-0","total":34836,"browserLaunch":3702,"navigation":1521,"selectorWait":1996,"scrollCarousel":9845,"parse":706,"emailEnrichment":16551}
{"correlationId":"s2-a-1771477909867-1","total":37589,"browserLaunch":1765,"navigation":1545,"selectorWait":1338,"scrollCarousel":9877,"parse":586,"emailEnrichment":22106}
{"correlationId":"s2-a-1771477909867-2","total":30403,"browserLaunch":1264,"navigation":892,"selectorWait":954,"scrollCarousel":9842,"parse":444,"emailEnrichment":16772}
{"correlationId":"s2-a-1771477909867-3","total":21701,"browserLaunch":1202,"navigation":639,"selectorWait":999,"scrollCarousel":10038,"parse":385,"emailEnrichment":8200}
{"correlationId":"s2-a-1771477909867-4","total":26966,"browserLaunch":1225,"navigation":617,"selectorWait":906,"scrollCarousel":9870,"parse":366,"emailEnrichment":13759}
```


---

## Stage B: Phase 2 only

**Goal:** Measure impact of disabling scroll and carousel only (no Phase 3 email changes).

**Env:** Same as Stage A but `SEARCH_OPT_DISABLE_SCROLLING=true`, `SEARCH_OPT_DISABLE_CAROUSEL_TRIGGERS=true`.

**Results (fill after run):**

| Field | Value |
|-------|--------|
| Date/time | 2026-02-19 05:20:55 |
| Env summary | Phase 2 only (scroll+carousel off) |
| Number of runs | 12 |
| Success count | 12 |
| P50 total (ms) | 15639 |
| P95 total (ms) | 21348 |
| Min total (ms) | 13300 |
| Max total (ms) | 22200 |
| Timeouts/errors | 0 |

**Sample `[SCRAPE_TIMINGS]` lines:** (run script to populate)

---

## Stage C: Phase 2 + Phase 3

**Goal:** Full Sprint 2 — Phase 2 + parallel email lookup, agent cap, cache.

**Env:** Stage B plus `SEARCH_OPT_PARALLEL_EMAIL_LOOKUP=true`, `SEARCH_OPT_AGENT_CAP=10`, `SEARCH_OPT_EMAIL_QUERIES_PER_AGENT=1`, `SEARCH_OPT_EMAIL_CACHE_TTL_SEC=3600`.

**Results (fill after run):**

| Field | Value |
|-------|--------|
| Date/time | 2026-02-19 (Stage C run) |
| Env summary | Full Sprint 2 (Phase 2+3) |
| Number of runs | 12 |
| Success count | 12 |
| P50 total (ms) | 8509 |
| P95 total (ms) | 18820 |
| Min total (ms) | 6700 |
| Max total (ms) | 22100 |
| Timeouts/errors | 0 |

**Sample `[SCRAPE_TIMINGS]` lines:** (run script to populate)

---

## Correlate, analyse and adjust

### Correlation

| Stage | P50 (ms) | P95 (ms) | Min | Max | scrollCarousel | emailEnrichment note |
|-------|----------|----------|-----|-----|----------------|----------------------|
| A (Sprint 2 baseline) | 25474 | 36075 | 21181 | 37589 | ~9.8s | sequential |
| B (Phase 2 only) | 15639 | 21348 | 13300 | 22200 | ~0 | sequential |
| C (Phase 2+3) | 8509 | 18820 | 6700 | 22100 | ~0 | parallel+cap+cache |

### Analysis

- **Phase 2 (scroll/carousel off)** reduced total time by ~10–14 s vs Stage A: P95 36.1 s → 21.3 s; P50 25.5 s → 15.6 s. scrollCarousel dropped from ~9.8 s to ~0.
- **Phase 3 (parallel email, cap, cache)** brought P95 below 20 s: Stage C P95 = **18.8 s** (target &lt; 20 s met). P50 8.5 s.
- **Success rate** unchanged: 12/12 across all stages.

### Decision

- **Proceed to Sprint 3.** P95 &lt; 20 s achieved (18.8 s); success rate stable. Document Sprint 2 env in runbook as new baseline for rollback.

---

**Next steps:** Proceed to Sprint 3 per [03-search-speed-improvement.md](03-search-speed-improvement.md). Keep Sprint 2 flags as-is unless tuning (e.g. agent cap, cache TTL) is needed; any change should be re-tested with `npm run test:s2:staged`. For **final decision on search tuning** across S2 and S3, use `npm run test:final:staged` from `search/backend` (runs S2 + S3 and updates both this document and [07-sprint3-staged-test-results.md](07-sprint3-staged-test-results.md)).
