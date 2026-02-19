# 04 Search Speed Rollback Runbook

## Purpose

This runbook provides a practical rollback procedure for search-speed improvements with a one-command-first approach.

It is designed for:

- Fast production safety response.
- Non-destructive rollback.
- Clear escalation when one-command rollback is insufficient.

## Brutally Honest Scope

What this runbook can make "one command":

- Runtime behavior rollback where optimizations are guarded by feature flags.
- Reverting to pre-optimization request flow without redeploying code (if config is dynamic).
- Rapid rollback to known-stable mode after detection of latency/error regressions.

What this runbook cannot truly make "one command":

- Rolling back architecture changes that removed old code paths.
- Rolling back infrastructure changes (for example, external cache systems) if they were deployed without backward compatibility.
- Recovering from data shape changes if contracts were broken.

Bottom line:

- One-command rollback is realistic only if rollout discipline is followed (flags-first, additive changes, old path preserved).

## Preconditions (Must Exist Before Release)

1. A stable legacy search path is still present and selectable.
2. All search optimizations are behind explicit feature flags.
3. Runtime config can be updated without code edits.
4. Monitoring alerts are live with agreed rollback thresholds.
5. At least one "known good" baseline config snapshot is stored.

## Rollback Levels

## Level 1: Soft Rollback (Preferred)

Use when:

- Latency degrades.
- Error rates increase.
- Functional quality regresses but service is still running.

Action:

- Flip all optimization flags OFF and restore baseline limits in a single config operation.

Impact:

- Immediate behavior rollback, minimal disruption.

## Level 2: Hard Rollback (If Soft Rollback Fails)

Use when:

- Soft rollback does not stabilize service.
- Regression is caused by non-flagged code path.

Action:

- Revert release artifact to last known stable version.

Impact:

- Higher operational impact; usually slower than Level 1.

## Level 3: Emergency Safe Mode

Use when:

- Search reliability is degraded and rollback is incomplete.

Action:

- Route traffic to the most stable reduced-capability mode (for example, reduced providers, strict caps, or fallback endpoint).

Impact:

- Preserves availability over completeness.

## One-Command Rollback Contract

The team should maintain one executable operational command that restores search behavior to baseline configuration.

Expected command behavior:

- Disables optimization flags.
- Restores default timeout/retry values.
- Disables warm browser pool.
- Restores synchronous legacy-safe enrichment path (if used as baseline).
- Applies values atomically to avoid mixed-state behavior.
- Emits a confirmation with config version and timestamp.

Recommended command alias:

- `rollback:search:speed`

Note:

- Exact implementation command is environment-specific (CLI, pipeline, config service, or deployment tool).
- This runbook intentionally avoids hardcoding platform-specific command syntax.

## Pre-push thresholds

The pre-push search check (`npm run pre-push:search` from `search/backend`) validates release readiness using:

- **sprint2_full:** P95 ≤ 20 s, success rate 100%.
- **baseline:** P95 in 25–35 s, success rate 100%.

Mode is read from `release-mode.txt` in this folder or from `PRE_PUSH_SEARCH_MODE`. See `search/backend/scripts/run-pre-push-search-check.js` for the exact thresholds and behaviour.

## Baseline Rollback Configuration (Reference)

This is the expected target state after one-command rollback.

### Sprint 1 (Foundation + low-risk wins)

- `SEARCH_OPT_REQUEST_BLOCKING=false`
- `SEARCH_OPT_SELECTOR_WAIT_MS=60000`
- `SEARCH_OPT_NAV_RETRY_DELAY_MS=5000`
- `SEARCH_OPT_POST_CLICK_WAIT_MS=1000`

(If any Sprint 1 env var is unset, the backend uses these defaults.)

### Sprint 2 (Critical-path trim + email fast path)

- `SEARCH_OPT_DISABLE_SCROLLING=false`
- `SEARCH_OPT_DISABLE_CAROUSEL_TRIGGERS=false`
- `SEARCH_OPT_PARALLEL_EMAIL_LOOKUP=false`
- `SEARCH_OPT_AGENT_CAP=10`
- `SEARCH_OPT_EMAIL_QUERIES_PER_AGENT=3`
- `SEARCH_OPT_EMAIL_CACHE_TTL_SEC=0` (or unset)

(If any Sprint 2 env var is unset, the backend uses these defaults. One-command rollback for Sprint 2: set all of the above to baseline values.)

### Sprint 3 (Infrastructure + optional advanced mode)

- `SEARCH_OPT_WARM_BROWSER=false`
- `SEARCH_OPT_BACKGROUND_EMAIL_ENRICHMENT=false`
- `SEARCH_OPT_FRONTEND_FAST_RENDER=false`

(One-command rollback for Sprint 3 only: set the above to baseline; leave Sprint 2 flags as-is. Full rollback uses "All sprints" below.)

### All sprints (full rollback)

- `SEARCH_OPT_REQUEST_BLOCKING=false`
- `SEARCH_OPT_DISABLE_SCROLLING=false`
- `SEARCH_OPT_DISABLE_CAROUSEL_TRIGGERS=false`
- `SEARCH_OPT_PARALLEL_EMAIL_LOOKUP=false`
- `SEARCH_OPT_WARM_BROWSER=false`
- `SEARCH_OPT_BACKGROUND_EMAIL_ENRICHMENT=false`
- `SEARCH_OPT_FRONTEND_FAST_RENDER=false`
- `SEARCH_OPT_AGENT_CAP=10`
- `SEARCH_OPT_EMAIL_QUERIES_PER_AGENT=3`
- `SEARCH_OPT_EMAIL_CACHE_TTL_SEC=0` (or unset)

If your agreed baseline differs, update this section and keep it versioned.

## Trigger Conditions for Immediate Rollback

Rollback should be executed without debate if any trigger is met:

- P95 latency worsens by >15% vs baseline for 30+ minutes.
- Search success rate drops by >2% absolute.
- Timeout rate spikes above agreed SLO threshold.
- Critical frontend rendering regressions tied to new fast-render path.
- Upstream anti-bot/rate-limit response increases materially after optimization rollout.

## Operational Procedure

## Step 1: Confirm Alert Validity (2-5 minutes max)

- Verify alert source and timeframe.
- Confirm regression aligns with rollout window.
- Check whether issue is localized (single provider) or global.

Do not spend long in diagnosis during active impact; rollback first.

## Step 2: Execute One-Command Soft Rollback

- Run `rollback:search:speed`.
- Confirm command success output (config revision and timestamp).

## Step 3: Validate Recovery

Within 10-15 minutes:

- Confirm P95 trend is returning toward baseline.
- Confirm success rate recovers.
- Confirm error and timeout rates decline.
- Run representative smoke searches in UI.

## Step 4: Escalate If Recovery Fails

- Trigger Level 2 hard rollback to prior stable release artifact.
- If still unstable, enter Level 3 emergency safe mode.

## Step 5: Communicate

Notify stakeholders with:

- Incident start time.
- Rollback level used.
- Current status and expected stabilization window.
- User-visible impact summary.

## Post-Rollback Forensics Checklist

Complete within 24 hours:

- Identify exact failing flag/phase.
- Compare stage timing deltas before and after rollback.
- Confirm whether issue was logic, load, dependency, or anti-bot behavior.
- Create corrective patch and test plan.
- Re-release progressively (dark -> canary -> staged ramp).

## Release Design Rules That Keep Rollback Easy

Non-negotiable rules:

1. Do not delete old logic until new path passes a bake period.
2. Keep optimization flags independent (avoid one giant switch only).
3. Ensure config changes are atomic and auditable.
4. Never bundle infrastructure migration with critical path optimization in the same release.
5. Maintain a tested hard-rollback path even if soft rollback is expected to work.

## Failure Modes Where One-Command Rollback Breaks Down

Be explicit with leadership about these cases:

- Old path removed during refactor.
- New dependency is mandatory and fails.
- Contracts changed between backend and frontend without compatibility layer.
- Operational command updates only some services, causing mixed behavior.

If any of these are true, rollback is no longer truly one-command.

## Ownership and Response SLA

Define and maintain:

- Primary on-call owner for search reliability.
- Secondary owner for frontend rendering regressions.
- Max 10-minute decision SLA from alert to rollback decision for critical incidents.

## Quarterly Rollback Drill

Run a scheduled drill to ensure the runbook remains real:

- Simulate a staged regression.
- Execute `rollback:search:speed`.
- Validate recovery KPIs.
- Record rollback duration and gaps.
- Update this runbook with lessons learned.

## Final Recommendation

Treat one-command rollback as an engineering capability, not a promise.

If release discipline is followed, rollback can be fast and practical.
If discipline is skipped, rollback becomes a multi-step incident response regardless of documentation quality.
