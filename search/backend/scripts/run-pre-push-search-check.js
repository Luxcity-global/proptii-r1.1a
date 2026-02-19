#!/usr/bin/env node
/**
 * Pre-push search verification — single command for V203 search release readiness.
 *
 * Resolves intended release mode (sprint2_full | baseline), runs one validation stage,
 * enforces P95 and success-rate thresholds, and writes release-state.md.
 * Exit 0 = ready to push; 1 = validation failed or misconfiguration.
 *
 * Pre-push thresholds (aligned with 05-sprint1 and 06-sprint2 staged test results):
 *   sprint2_full: P95 <= 20 s (20000 ms), success rate 100%
 *   baseline:     P95 in 25–35 s (25000–35000 ms), success rate 100%
 *
 * Usage (from search/backend):
 *   npm run pre-push:search
 *   node scripts/run-pre-push-search-check.js [--mode=sprint2_full|baseline] [--runs=N] [--no-report]
 *
 * Mode resolution: --mode= > PRE_PUSH_SEARCH_MODE env > release-mode.txt in V203 folder.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const BACKEND_PORT = 3001;

const OTM_URLS = [
  'https://www.onthemarket.com/to-rent/property/leeds/?min-bedrooms=2&max-bedrooms=2&view=grid',
  'https://www.onthemarket.com/to-rent/property/manchester/?max-price=1200&view=grid',
  'https://www.onthemarket.com/to-rent/property/nottingham/?min-bedrooms=3&max-bedrooms=3&view=grid',
];

// Same as run-sprint2-staged-tests.js
const STAGE_A_ENV = {
  SEARCH_OPT_REQUEST_BLOCKING: 'false',
  SEARCH_OPT_SELECTOR_WAIT_MS: '60000',
  SEARCH_OPT_NAV_RETRY_DELAY_MS: '5000',
  SEARCH_OPT_POST_CLICK_WAIT_MS: '1000',
  SEARCH_OPT_DISABLE_SCROLLING: 'false',
  SEARCH_OPT_DISABLE_CAROUSEL_TRIGGERS: 'false',
  SEARCH_OPT_PARALLEL_EMAIL_LOOKUP: 'false',
  SEARCH_OPT_AGENT_CAP: '10',
  SEARCH_OPT_EMAIL_QUERIES_PER_AGENT: '3',
  SEARCH_OPT_EMAIL_CACHE_TTL_SEC: '0',
};

const STAGE_C_ENV = {
  ...STAGE_A_ENV,
  SEARCH_OPT_DISABLE_SCROLLING: 'true',
  SEARCH_OPT_DISABLE_CAROUSEL_TRIGGERS: 'true',
  SEARCH_OPT_PARALLEL_EMAIL_LOOKUP: 'true',
  SEARCH_OPT_AGENT_CAP: '10',
  SEARCH_OPT_EMAIL_QUERIES_PER_AGENT: '1',
  SEARCH_OPT_EMAIL_CACHE_TTL_SEC: '3600',
};

const V203_DIR = path.resolve(__dirname, '..', '..', '..', 'docs', 'r1.1-improvement', 'V203-search-and-results-improvements');
const RELEASE_MODE_FILE = path.join(V203_DIR, 'release-mode.txt');
const RELEASE_STATE_FILE = path.join(V203_DIR, 'release-state.md');

// Pre-push thresholds (ms). Baseline: 25–35 s per 05/06 docs; sprint2_full: <= 20 s.
const THRESHOLDS = {
  sprint2_full: { p95MaxMs: 20000, successRatePercent: 100 },
  baseline:     { p95MinMs: 25000, p95MaxMs: 35000, successRatePercent: 100 },
};

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { mode: null, runs: 12, noReport: true };
  for (const a of args) {
    if (a.startsWith('--mode=')) out.mode = a.slice(7).toLowerCase().trim();
    else if (a.startsWith('--runs=')) out.runs = Math.max(1, parseInt(a.slice(7), 10) || 12);
    else if (a === '--no-report') out.noReport = true;
    else if (a === '--report') out.noReport = false;
  }
  return out;
}

function resolveMode(opts) {
  if (opts.mode && (opts.mode === 'sprint2_full' || opts.mode === 'baseline')) return opts.mode;
  const env = process.env.PRE_PUSH_SEARCH_MODE && process.env.PRE_PUSH_SEARCH_MODE.trim().toLowerCase();
  if (env === 'sprint2_full' || env === 'baseline') return env;
  if (fs.existsSync(RELEASE_MODE_FILE)) {
    const line = fs.readFileSync(RELEASE_MODE_FILE, 'utf8').split('\n')[0].trim().toLowerCase();
    if (line === 'sprint2_full' || line === 'baseline') return line;
  }
  return null;
}

function waitForBackend(timeoutMs = 120000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const req = http.request(
        { hostname: 'localhost', port: BACKEND_PORT, path: '/', method: 'GET', timeout: 2000 },
        () => resolve()
      );
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) return reject(new Error('Backend did not become ready'));
        setTimeout(tryConnect, 1500);
      });
      req.on('timeout', () => { req.destroy(); setTimeout(tryConnect, 1500); });
      req.end();
    };
    tryConnect();
  });
}

function postScrape(url, correlationId) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ url, correlationId });
    const req = http.request(
      {
        hostname: 'localhost',
        port: BACKEND_PORT,
        path: '/scrape',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          let parsed = null;
          try { parsed = JSON.parse(Buffer.concat(chunks).toString()); } catch (_) {}
          resolve({
            status: res.statusCode,
            success: res.statusCode === 200 && Array.isArray(parsed),
            correlationId,
          });
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(120000);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    req.write(body);
    req.end();
  });
}

function percentile(sortedArr, p) {
  if (!sortedArr.length) return 0;
  const k = (sortedArr.length - 1) * (p / 100);
  const f = Math.floor(k);
  const c = Math.ceil(k);
  if (f === c) return sortedArr[f];
  return sortedArr[f] + (k - f) * (sortedArr[c] - sortedArr[f]);
}

function parseScrapeTimings(logContent) {
  const results = [];
  for (const line of logContent.split(/\n/)) {
    const idx = line.indexOf('[SCRAPE_TIMINGS]');
    if (idx === -1) continue;
    try {
      const obj = JSON.parse(line.slice(idx + '[SCRAPE_TIMINGS]'.length).trim());
      if (obj != null && typeof obj.total === 'number') results.push(obj);
    } catch (_) {}
  }
  return results;
}

function computeMetrics(timings, responses) {
  const byId = new Map(timings.map((t) => [t.correlationId, t]));
  const matched = [];
  let successCount = 0;
  for (const r of responses) {
    const t = byId.get(r.correlationId);
    if (t) matched.push({ ...t, success: r.success });
    if (r.success) successCount++;
  }
  const totals = matched.filter((m) => !m.error).map((m) => m.total);
  totals.sort((a, b) => a - b);
  const sampleLines = matched.slice(0, 5).map((m) => ({
    correlationId: m.correlationId,
    total: m.total,
    browserLaunch: m.browserLaunch,
    navigation: m.navigation,
    selectorWait: m.selectorWait,
    scrollCarousel: m.scrollCarousel,
    parse: m.parse,
    emailEnrichment: m.emailEnrichment,
  }));
  return {
    runs: responses.length,
    successCount,
    successRate: responses.length ? (100 * successCount / responses.length).toFixed(1) + '%' : '0%',
    successRatePercent: responses.length ? Math.round(100 * successCount / responses.length) : 0,
    p50: Math.round(percentile(totals, 50)),
    p95: Math.round(percentile(totals, 95)),
    min: totals.length ? Math.round(totals[0]) : 0,
    max: totals.length ? Math.round(totals[totals.length - 1]) : 0,
    errors: responses.length - successCount,
    sampleLines,
  };
}

function startBackend(env, logPath) {
  const backendDir = path.resolve(__dirname, '..');
  const fullEnv = {
    ...process.env,
    PORT: String(BACKEND_PORT),
    PUPPETEER_CACHE_DIR: path.join(backendDir, '.cache', 'puppeteer'),
    PLAYWRIGHT_BROWSERS_PATH: path.join(backendDir, '.cache', 'ms-playwright'),
    ...env,
  };
  const out = fs.openSync(logPath, 'w');
  const child = spawn('npx', ['ts-node-dev', 'src/index.ts'], {
    cwd: backendDir,
    env: fullEnv,
    stdio: ['ignore', out, out],
  });
  return { child, out };
}

async function runStage(stage, runs) {
  const env = stage === 'a' ? STAGE_A_ENV : STAGE_C_ENV;
  const logPath = path.join(__dirname, `pre-push-${stage}-${Date.now()}.log`);

  console.log(`[Pre-push] Starting backend (${stage === 'a' ? 'baseline' : 'Sprint 2 full'})…`);
  const { child: backendProc, out: logFd } = startBackend(env, logPath);
  await waitForBackend();
  console.log('[Pre-push] Backend ready. Running ' + runs + ' OTM searches...');

  const urls = [];
  for (let i = 0; i < runs; i++) urls.push(OTM_URLS[i % OTM_URLS.length]);
  const correlationIds = urls.map((_, i) => `prepush-${stage}-${Date.now()}-${i}`);
  const responses = [];
  for (let i = 0; i < urls.length; i++) {
    const res = await postScrape(urls[i], correlationIds[i]);
    responses.push(res);
  }

  backendProc.kill('SIGTERM');
  await new Promise((r) => setTimeout(r, 2000)).catch(() => {});
  if (backendProc.killed === false) backendProc.kill('SIGKILL');
  fs.closeSync(logFd);

  let logContent = '';
  if (fs.existsSync(logPath)) logContent = fs.readFileSync(logPath, 'utf8');
  const timings = parseScrapeTimings(logContent);
  const metrics = computeMetrics(timings, responses);

  const dateStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
  return { stage, dateStr, ...metrics };
}

function checkThresholds(mode, metrics) {
  const t = THRESHOLDS[mode];
  if (!t) return { pass: false, reason: 'Unknown mode' };
  if (metrics.successRatePercent < t.successRatePercent) {
    return { pass: false, reason: `Success rate ${metrics.successRatePercent}% < ${t.successRatePercent}%` };
  }
  if (mode === 'sprint2_full') {
    if (metrics.p95 > t.p95MaxMs) {
      return { pass: false, reason: `P95 ${metrics.p95}ms > ${t.p95MaxMs}ms (max 20s)` };
    }
  } else {
    if (metrics.p95 < t.p95MinMs || metrics.p95 > t.p95MaxMs) {
      return { pass: false, reason: `P95 ${metrics.p95}ms outside 25–35s range` };
    }
  }
  return { pass: true };
}

function writeReleaseState(mode, metrics, passed) {
  const iso = new Date().toISOString();
  const p95s = (metrics.p95 / 1000).toFixed(1);
  const body = `# Search release state (pre-push)

**Last validated:** ${iso}
**Release mode:** ${mode}
**P95 (ms):** ${metrics.p95} | **P95 (s):** ${p95s}
**Success rate:** ${metrics.successRate} (runs: ${metrics.runs})
**Thresholds passed:** ${passed ? 'yes' : 'no'}

**Rollback:** See [04-search-speed-rollback-runbook.md](04-search-speed-rollback-runbook.md).
`;
  fs.writeFileSync(RELEASE_STATE_FILE, body, 'utf8');
  console.log('Wrote release-state:', RELEASE_STATE_FILE);
}

function printUsage() {
  console.error(`
Usage: node scripts/run-pre-push-search-check.js [--mode=sprint2_full|baseline] [--runs=N] [--no-report]
  --mode=sprint2_full|baseline   Override release mode (default: from PRE_PUSH_SEARCH_MODE or release-mode.txt)
  --runs=N                      Number of OTM searches (default: 12)
  --no-report                   Do not update 06-sprint2-staged-test-results.md (default)
  --report                      Update 06 with this run's stage section

Set intended mode once: create docs/.../V203-search-and-results-improvements/release-mode.txt
with one line: sprint2_full  OR  baseline
Or set env: PRE_PUSH_SEARCH_MODE=sprint2_full|baseline
`);
}

async function main() {
  const opts = parseArgs();
  const mode = resolveMode(opts);

  if (!mode) {
    printUsage();
    console.error('Error: Release mode not set. Set --mode=, PRE_PUSH_SEARCH_MODE, or release-mode.txt.');
    process.exit(1);
  }

  const stage = mode === 'sprint2_full' ? 'c' : 'a';
  const envUsed = stage === 'a' ? STAGE_A_ENV : STAGE_C_ENV;
  console.log('[Pre-push] Resolved mode:', mode, '| Stage:', stage.toUpperCase());
  console.log('[Pre-push] SEARCH_OPT_* in use:', JSON.stringify(envUsed, null, 0));

  const result = await runStage(stage, opts.runs);
  console.log(`[Pre-push] runs=${result.runs} success=${result.successCount} P50=${result.p50}ms P95=${result.p95}ms`);

  const { pass, reason } = checkThresholds(mode, result);
  writeReleaseState(mode, result, pass);

  if (!pass) {
    console.error('[Pre-push] FAILED:', reason);
    process.exit(1);
  }

  console.log('[Pre-push] Passed. Safe to push.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
