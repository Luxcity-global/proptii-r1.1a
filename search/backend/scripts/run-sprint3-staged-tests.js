#!/usr/bin/env node
/**
 * Sprint 3 Staged Tests (A → B [→ C]) — Automation
 *
 * Stage A: Sprint 2 full, Sprint 3 flags off (baseline).
 * Stage B: Phase 4 only (warm browser on).
 * Stage C: Phase 4 + Phase 5 (optional; only when Phase 5 is implemented).
 *
 * Usage (from search/backend):
 *   npm run test:s3:staged       # all stages (a, b, c)
 *   npm run test:s3:staged:a    # Stage A only
 *   npm run test:s3:staged:b    # Stage B only
 *   npm run test:s3:staged:c    # Stage C only
 *
 * Options: --stage=a|b|c|all, --runs=N, --no-report, --backend-running, --log-file=path
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

// Sprint 3 Stage A: Sprint 2 full (all S2 flags on), Sprint 3 off
const STAGE_A_ENV = {
  SEARCH_OPT_REQUEST_BLOCKING: 'false',
  SEARCH_OPT_SELECTOR_WAIT_MS: '60000',
  SEARCH_OPT_NAV_RETRY_DELAY_MS: '5000',
  SEARCH_OPT_POST_CLICK_WAIT_MS: '1000',
  SEARCH_OPT_DISABLE_SCROLLING: 'true',
  SEARCH_OPT_DISABLE_CAROUSEL_TRIGGERS: 'true',
  SEARCH_OPT_PARALLEL_EMAIL_LOOKUP: 'true',
  SEARCH_OPT_AGENT_CAP: '10',
  SEARCH_OPT_EMAIL_QUERIES_PER_AGENT: '1',
  SEARCH_OPT_EMAIL_CACHE_TTL_SEC: '3600',
  SEARCH_OPT_WARM_BROWSER: 'false',
};

// Stage B: Phase 4 only (warm browser on)
const STAGE_B_ENV = {
  ...STAGE_A_ENV,
  SEARCH_OPT_WARM_BROWSER: 'true',
};

// Stage C: Phase 4 + Phase 5 (when Phase 5 is implemented)
const STAGE_C_ENV = {
  ...STAGE_B_ENV,
  SEARCH_OPT_BACKGROUND_EMAIL_ENRICHMENT: 'true',
  SEARCH_OPT_FRONTEND_FAST_RENDER: 'true',
};

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { stage: 'all', runs: 12, noReport: false, backendRunning: false, logFile: null };
  for (const a of args) {
    if (a === '--no-report') out.noReport = true;
    else if (a === '--backend-running') out.backendRunning = true;
    else if (a.startsWith('--stage=')) out.stage = a.slice(8).toLowerCase();
    else if (a.startsWith('--runs=')) out.runs = Math.max(1, parseInt(a.slice(7), 10) || 12);
    else if (a.startsWith('--log-file=')) out.logFile = a.slice(11).trim() || null;
  }
  return out;
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

async function runStage(stage, opts) {
  const env =
    stage === 'a' ? STAGE_A_ENV : stage === 'b' ? STAGE_B_ENV : STAGE_C_ENV;
  const logPath = opts.logFile || path.join(__dirname, `sprint3-stage-${stage}-${Date.now()}.log`);
  let backendProc = null;
  let logFd = null;
  let logPathToRead = logPath;

  if (!opts.backendRunning) {
    const label = stage === 'a' ? 'Sprint 3 baseline' : stage === 'b' ? 'Phase 4 only' : 'Phase 4+5';
    console.log(`[Stage ${stage.toUpperCase()}] Starting backend (${label})…`);
    const { child, out } = startBackend(env, logPath);
    backendProc = child;
    logFd = out;
    await waitForBackend();
    console.log(`[Stage ${stage.toUpperCase()}] Backend ready.`);
  } else if (!opts.logFile) {
    console.warn('--backend-running set but no --log-file; timings will be empty.');
  }

  const urls = [];
  for (let i = 0; i < opts.runs; i++) urls.push(OTM_URLS[i % OTM_URLS.length]);
  const correlationIds = urls.map((_, i) => `s3-${stage}-${Date.now()}-${i}`);
  const responses = [];
  console.log(`[Stage ${stage.toUpperCase()}] Running ${opts.runs} OTM searches...`);
  for (let i = 0; i < urls.length; i++) {
    const res = await postScrape(urls[i], correlationIds[i]);
    responses.push(res);
  }

  if (backendProc) {
    backendProc.kill('SIGTERM');
    await new Promise((r) => setTimeout(r, 2000)).catch(() => {});
    if (backendProc.killed === false) backendProc.kill('SIGKILL');
    if (logFd != null) fs.closeSync(logFd);
    logPathToRead = logPath;
  } else if (opts.logFile) logPathToRead = opts.logFile;

  let logContent = '';
  if (logPathToRead && fs.existsSync(logPathToRead)) logContent = fs.readFileSync(logPathToRead, 'utf8');
  const timings = parseScrapeTimings(logContent);
  const metrics = computeMetrics(timings, responses);

  const dateStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const envSummary =
    stage === 'a'
      ? 'S2 full, S3 off'
      : stage === 'b'
        ? 'Phase 4 only (warm browser)'
        : 'Phase 4+5 (warm + background enrich)';
  return { stage, dateStr, envSummary, ...metrics, logPath: opts.logFile ? null : logPath };
}

function formatReportSection(result) {
  const s = result;
  let out = `| Field | Value |\n|-------|--------|\n`;
  out += `| Date/time | ${s.dateStr} |\n`;
  out += `| Env summary | ${s.envSummary} |\n`;
  out += `| Number of runs | ${s.runs} |\n`;
  out += `| Success count | ${s.successCount} |\n`;
  out += `| P50 total (ms) | ${s.p50} |\n`;
  out += `| P95 total (ms) | ${s.p95} |\n`;
  out += `| Min total (ms) | ${s.min} |\n`;
  out += `| Max total (ms) | ${s.max} |\n`;
  out += `| Timeouts/errors | ${s.errors} |\n`;
  out += `\n**Sample \`[SCRAPE_TIMINGS]\` lines:**\n\n\`\`\`\n`;
  s.sampleLines.forEach((l) => { out += JSON.stringify(l) + '\n'; });
  out += `\`\`\`\n`;
  return out;
}

const REPORT_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'docs',
  'r1.1-improvement',
  'V203-search-and-results-improvements',
  '07-sprint3-staged-test-results.md'
);

const SECTION_MARKERS = {
  a: '## Stage A: Sprint 3 baseline',
  b: '## Stage B: Phase 4 only',
  c: '## Stage C: Phase 4 + Phase 5',
};

function updateReportFile(resultsByStage) {
  if (!fs.existsSync(REPORT_PATH)) {
    console.warn('Report file not found:', REPORT_PATH);
    return;
  }
  let content = fs.readFileSync(REPORT_PATH, 'utf8');

  for (const [stage, result] of Object.entries(resultsByStage)) {
    if (!result) continue;
    const marker = SECTION_MARKERS[stage];
    const start = content.indexOf(marker);
    if (start === -1) continue;
    const tableStart = content.indexOf('| Field | Value |', start);
    if (tableStart === -1) continue;
    const firstCode = content.indexOf('```', tableStart);
    const secondCode = firstCode >= 0 ? content.indexOf('```', firstCode + 3) : -1;
    const tableEnd = secondCode >= 0 ? secondCode + 3 : content.indexOf('\n---', tableStart);
    if (tableEnd < tableStart) continue;
    content = content.slice(0, tableStart) + formatReportSection(result) + content.slice(tableEnd);
  }

  // Update summary table when we have at least A and B (and optionally C)
  const a = resultsByStage.a;
  const b = resultsByStage.b;
  const c = resultsByStage.c;
  if (a && b) {
    const rows = [
      `| Stage A (Sprint 3 baseline) | ${a.dateStr} | S2 full, S3 off | ${a.runs} | ${a.successCount} | ${(a.p50 / 1000).toFixed(1)} | ${(a.p95 / 1000).toFixed(1)} | ${(a.min / 1000).toFixed(1)} | ${(a.max / 1000).toFixed(1)} | cold |`,
      `| Stage B (Phase 4 only) | ${b.dateStr} | + warm browser | ${b.runs} | ${b.successCount} | ${(b.p50 / 1000).toFixed(1)} | ${(b.p95 / 1000).toFixed(1)} | ${(b.min / 1000).toFixed(1)} | ${(b.max / 1000).toFixed(1)} | pool |`,
    ];
    if (c) {
      rows.push(`| Stage C (Phase 4+5) | ${c.dateStr} | + background enrich | ${c.runs} | ${c.successCount} | ${(c.p50 / 1000).toFixed(1)} | ${(c.p95 / 1000).toFixed(1)} | ${(c.min / 1000).toFixed(1)} | ${(c.max / 1000).toFixed(1)} | (fill) |`);
    } else {
      rows.push(`| Stage C (Phase 4+5) | (fill) | + background enrich | 12 | (fill) | (fill) | (fill) | (fill) | (fill) | (fill) |`);
    }
    const summary = `| Run | Date | Env | Runs | Success | P50 (s) | P95 (s) | Min (s) | Max (s) | browserLaunch note |\n|-----|------|-----|------|---------|---------|---------|---------|---------|--------------------|\n` + rows.join('\n') + '\n';
    const summaryStart = content.indexOf('## Test results summary');
    if (summaryStart !== -1) {
      const tableStart = content.indexOf('| Run |', summaryStart);
      const tableEnd = content.indexOf('\n\n---', tableStart);
      if (tableStart !== -1 && tableEnd > tableStart) {
        content = content.slice(0, tableStart) + summary.trim() + content.slice(tableEnd);
      }
    }
  }

  fs.writeFileSync(REPORT_PATH, content, 'utf8');
  console.log('Updated report:', REPORT_PATH);
}

async function main() {
  const opts = parseArgs();
  const stages = opts.stage === 'all' ? ['a', 'b', 'c'] : [opts.stage];
  const resultsByStage = {};

  for (const stage of stages) {
    const result = await runStage(stage, opts);
    resultsByStage[stage] = result;
    console.log(`[Stage ${stage.toUpperCase()}] runs=${result.runs} success=${result.successCount} P50=${result.p50}ms P95=${result.p95}ms`);
  }

  if (!opts.noReport && (resultsByStage.a || resultsByStage.b || resultsByStage.c)) {
    updateReportFile(resultsByStage);
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
