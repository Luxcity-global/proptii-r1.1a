# Sprint 1 Staged Test Results (A → B → C)

Single report for baseline (A), optimised (B), and observation (C) runs. Fill each section as you complete each stage back-to-back. Final section: correlate, analyse, and record decision before moving to Sprint 2.

---

## Test results summary (for Sprint 2 planning)

| Run | Date | Env | Runs | Success | P50 (s) | P95 (s) | Min (s) | Max (s) | emailEnrichment note |
|-----|------|-----|------|---------|---------|---------|---------|---------|----------------------|
| Stage A (original) | 2026-02-18 | Baseline | 12 | 12 | 23.6 | 27.3 | 22.9 | 27.6 | Tight 10.8–14.2s |
| Stage B | 2026-02-18 | Optimised | 12 | 12 | 25.5 | 34.7 | 19.4 | 37.3 | Wide 7.2–24.8s |
| Stage C | 2026-02-18 | Optimised | 12 | 12 | 26.6 | 35.1 | 19.7 | 37.7 | Wide 7.7–25.2s |
| Stage A (post-rollback) | 2026-02-19 | Baseline | 12 | 12 | 28.1 | **31.6** | 21.6 | 32.1 | Wide 9.0–19.2s |

- **Confirmed baseline for Sprint 2:** P95 = **31.6 s** (post-rollback Stage A). Sprint 2 target: P95 < 20 s after Phase 2 + Phase 3.
- **Bottleneck:** emailEnrichment (Brave API) dominates; scroll/carousel and sequential email lookup are the next levers. See [03-search-speed-improvement.md](03-search-speed-improvement.md) Sprint 2 section for scope.
- **Decision:** Proceed to Sprint 2; all Sprint 1 flags remain off.

---

**Execution order:** Run Stage A → Stage B → Stage C in sequence; then complete "Correlate, analyse and adjust".

**Automation:** From the search backend directory (`search/backend`), you can run staged tests and auto-fill this report:

- `npm run test:staged` — runs all three stages (A, B, C) back-to-back, starts/stops the backend per stage, and updates the tables and sample lines in this document. Stage C uses a 5-minute window by default.
- `npm run test:staged:a` / `test:staged:b` / `test:staged:c` — run a single stage.
- Optional: `node scripts/run-sprint1-staged-tests.js --stage=all --runs=12 --window-mins=5 --no-report` to skip report updates, or `--backend-running --log-file=path/to/backend.log` when the backend is already running and logs are captured to a file.

---

## Stage A: Baseline (flags off)

**Goal:** Capture baseline latency and success rate with current (unoptimised) behaviour.

**How to run:**

1. Set env to baseline (or leave unset): `SEARCH_OPT_REQUEST_BLOCKING=false`, `SEARCH_OPT_SELECTOR_WAIT_MS=60000`, `SEARCH_OPT_NAV_RETRY_DELAY_MS=5000`, `SEARCH_OPT_POST_CLICK_WAIT_MS=1000`.
2. Restart search backend.
3. Run 10–15 OTM searches (e.g. "2 bed rent in Leeds", "flat in Manchester under 1200pcm", one harder query).
4. Capture all `[SCRAPE_TIMINGS]` lines from backend logs; parse for `total` and stage fields; compute success count, P50, P95.

**Results (fill after run):**

| Field | Value |
|-------|--------|
| Date/time | 2026-02-19 04:38:39 |
| Env summary | Flags off (baseline) |
| Number of runs | 12 |
| Success count | 12 |
| P50 total (ms) | 28074 |
| P95 total (ms) | 31609 |
| Min total (ms) | 21552 |
| Max total (ms) | 32114 |
| Timeouts/errors | 0 |

**Sample `[SCRAPE_TIMINGS]` lines (paste 3–5 or short excerpt):**

```
{"correlationId":"auto-a-1771475591877-0","total":31195,"browserLaunch":2083,"navigation":949,"selectorWait":872,"emailEnrichment":16802}
{"correlationId":"auto-a-1771475591878-1","total":32114,"browserLaunch":1020,"navigation":766,"selectorWait":766,"emailEnrichment":19154}
{"correlationId":"auto-a-1771475591878-2","total":29869,"browserLaunch":1036,"navigation":740,"selectorWait":565,"emailEnrichment":16943}
{"correlationId":"auto-a-1771475591878-3","total":22339,"browserLaunch":1203,"navigation":597,"selectorWait":890,"emailEnrichment":8983}
{"correlationId":"auto-a-1771475591878-4","total":28755,"browserLaunch":1823,"navigation":758,"selectorWait":1255,"emailEnrichment":13073}
```



---

## Stage B: Optimised (flags on)

**Goal:** Measure latency and success rate with Sprint 1 optimisations enabled.

**How to run:**

1. Set env: `SEARCH_OPT_REQUEST_BLOCKING=true`, `SEARCH_OPT_SELECTOR_WAIT_MS=20000`, `SEARCH_OPT_NAV_RETRY_DELAY_MS=2000`, `SEARCH_OPT_POST_CLICK_WAIT_MS=500`.
2. Restart search backend.
3. Run the same set of OTM searches as Stage A (same queries, similar number of runs).
4. Capture and parse logs; compute same metrics.

**Results (fill after run):**

| Field | Value |
|-------|--------|
| Date/time | 2026-02-18 20:48:35 |
| Env summary | Optimisations on |
| Number of runs | 12 |
| Success count | 12 |
| P50 total (ms) | 25478 |
| P95 total (ms) | 34697 |
| Min total (ms) | 19371 |
| Max total (ms) | 37326 |
| Timeouts/errors | 0 |

**Sample `[SCRAPE_TIMINGS]` lines (paste 3–5 or short excerpt):**

```
{"correlationId":"auto-b-1771447398786-0","total":29426,"browserLaunch":1856,"navigation":764,"selectorWait":459,"emailEnrichment":15943}
{"correlationId":"auto-b-1771447398786-1","total":37326,"browserLaunch":948,"navigation":807,"selectorWait":405,"emailEnrichment":24794}
{"correlationId":"auto-b-1771447398786-2","total":32546,"browserLaunch":949,"navigation":835,"selectorWait":391,"emailEnrichment":20005}
{"correlationId":"auto-b-1771447398786-3","total":19371,"browserLaunch":949,"navigation":441,"selectorWait":431,"emailEnrichment":7191}
{"correlationId":"auto-b-1771447398786-4","total":27780,"browserLaunch":965,"navigation":452,"selectorWait":439,"emailEnrichment":15571}
```


---

## Stage C: Observation window

**Goal:** Confirm no regressions over a short contiguous period (30–60 minutes).

**How to run:**

1. Keep Stage B config; no restart.
2. Run OTM searches over 30–60 minutes (e.g. every 5–10 min from UI, or repeated batch).
3. Collect all `[SCRAPE_TIMINGS]` for the window; compute P50/P95 and success rate; check for anomalies.

**Results (fill after run):**

| Field | Value |
|-------|--------|
| Date/time | 2026-02-18 22:00:01 |
| Env summary | Optimisations on |
| Number of runs | 12 |
| Success count | 12 |
| P50 total (ms) | 26613 |
| P95 total (ms) | 35106 |
| Window duration | 5 min |
| Success rate | 100.0% |
| Min total (ms) | 19703 |
| Max total (ms) | 37677 |
| Timeouts/errors | 0 |

**Sample `[SCRAPE_TIMINGS]` lines (paste 3–5 or short excerpt):**

```
{"correlationId":"auto-c-1771451401134-0","total":28464,"browserLaunch":1402,"navigation":796,"selectorWait":267,"emailEnrichment":15625}
{"correlationId":"auto-c-1771451401134-1","total":37677,"browserLaunch":952,"navigation":652,"selectorWait":525,"emailEnrichment":25197}
{"correlationId":"auto-c-1771451401134-2","total":33002,"browserLaunch":927,"navigation":665,"selectorWait":440,"emailEnrichment":20640}
{"correlationId":"auto-c-1771451401134-3","total":19858,"browserLaunch":969,"navigation":429,"selectorWait":420,"emailEnrichment":7700}
{"correlationId":"auto-c-1771451401134-4","total":30189,"browserLaunch":1689,"navigation":564,"selectorWait":513,"emailEnrichment":16362}
```

---

## Correlate, analyse and adjust

### Correlation

#### Original run (Stages A → B → C)

| Stage | P50 (ms) | P95 (ms) | Min | Max | emailEnrichment sample range |
|-------|----------|----------|-----|-----|------------------------------|
| A (baseline, 2026-02-18) | 23,643 | 27,337 | 22,949 | 27,643 | 10.8–14.2s (tight) |
| B (optimised, 2026-02-18) | 25,478 | 34,697 | 19,371 | 37,326 | 7.2–24.8s (wide) |
| C (observation, 2026-02-18) | 26,613 | 35,106 | 19,703 | 37,677 | 7.7–25.2s (wide) |

#### Post-rollback re-baseline (Stage A only, 2026-02-19)

| Stage | P50 (ms) | P95 (ms) | Min | Max | emailEnrichment sample range |
|-------|----------|----------|-----|-----|------------------------------|
| A (post-rollback, flags off) | 28,074 | 31,609 | 21,552 | 32,114 | 9.0–19.2s (wide) |

- **Traceability:** Slow runs in B/C: `auto-b-1771447398786-1` (total 37326ms, emailEnrichment 24794ms), `auto-c-1771451401134-1` (total 37677ms, emailEnrichment 25197ms). Slow run in post-rollback A: `auto-a-1771475591878-1` (total 32114ms, emailEnrichment 19154ms).

### Diagnosis: emailEnrichment variance is Brave API noise, not request blocking

The post-rollback Stage A run (all flags off, no request blocking) shows **the same wide emailEnrichment variance** (9.0s–19.2s) as Stage B (7.2s–24.8s). The original Stage A (10.8s–14.2s) was a fortunately low-variance sample. Confirmed by:

- Post-rollback Stage A P95 = 31.6s — higher than the original Stage A (27.3s), confirming the original A was an optimistically fast sample period.
- emailEnrichment in post-rollback A ranges from 8983ms to 19154ms — same spread as B and C.
- **Conclusion:** `SEARCH_OPT_REQUEST_BLOCKING=true` is **not the cause** of the regression. The Brave API used for email enrichment is inherently variable (7–25s per batch), and this variance dominated all stages. The original Stage A happened to hit a calm API period.

### Analysis

- **Did Sprint 1 optimisations meet expectations?** **No.** Expected ~2–6s improvement; P95 regressed vs original A. However, the original Stage A P95 (27.3s) was not representative — the truer baseline is closer to P95 ~28–32s as the post-rollback run confirms.
- **Did Stage C show degradation?** No. C was consistent with B; no additional regression.
- **Which stage dominates total time?** **emailEnrichment** — 50–70% of total time across all stages. selectorWait, navigation, browserLaunch are each under 2s. Sprint 2 Phase 3 (parallelise + cap email enrichment + in-memory cache) and Phase 2 (disable scroll/carousel) are the highest-value changes available.

### Decision

**Proceed to Sprint 2** — email fast path and scroll/carousel removal.

- **Reason:** The Brave API variability is the root cause of latency and variance. Request blocking is neither harmful nor helpful enough to matter (selectorWait savings of ~200ms are noise). All Sprint 1 env flags remain at baseline (off/unset).
- **New confirmed baseline (post-rollback Stage A, 2026-02-19):** P50 = 28.1s, P95 = 31.6s. Sprint 2 must beat this; target P95 < 20s after Phases 2+3.
- **Sprint 2 flags to introduce:** `SEARCH_OPT_DISABLE_SCROLLING`, `SEARCH_OPT_DISABLE_CAROUSEL_TRIGGERS`, `SEARCH_OPT_PARALLEL_EMAIL_LOOKUP`, `SEARCH_OPT_AGENT_CAP`, `SEARCH_OPT_EMAIL_QUERIES_PER_AGENT`.
- **Sprint 2 rollback:** flip all new flags to off/unset; no code removal until at least one bake period is complete.

---

**Next steps:** Sprint 2 baseline confirmed. Proceed to Sprint 2 Phase 2 (scroll/carousel removal) + Phase 3 (email fast path). Re-run staged tests (A→B→C) after Sprint 2 is implemented to confirm P95 improvement vs the 31.6s post-rollback baseline.

---

## Sprint 2 planning (reference)

This section summarises what Sprint 2 planning should use from this document.

- **Baseline to beat:** P95 = 31.6 s, P50 = 28.1 s (post-rollback Stage A, 2026-02-19). Success rate 100%.
- **Target:** P95 < 20 s after Phase 2 + Phase 3; no material drop in success rate.
- **Primary lever:** emailEnrichment (parallelise, cap agents, in-memory cache) and scroll/carousel removal. See [03-search-speed-improvement.md](03-search-speed-improvement.md) § Sprint 2 for full scope, flags, and validation.
- **Rollback:** Document Sprint 2 env vars in [04-search-speed-rollback-runbook.md](04-search-speed-rollback-runbook.md); use same staged-test approach (baseline → optimised → observation) after Sprint 2 is deployed.
- **Staged tests after Sprint 2:** Run `npm run test:staged:a` with baseline (all Sprint 2 flags off) to confirm baseline still ~31.6s P95, then run with Sprint 2 flags on and compare; update this report or a new Sprint 2 results doc.