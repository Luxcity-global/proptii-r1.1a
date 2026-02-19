#!/usr/bin/env node
/**
 * Sprint 1 Staged Tests (A → B → C) — Automation
 *
 * Runs OTM searches against the local search backend, captures [SCRAPE_TIMINGS]
 * from backend stdout, computes P50/P95 and success rate, and optionally
 * updates the results report.
 *
 * Usage:
 *   node scripts/run-sprint1-staged-tests.js --stage=a [--runs=12] [--no-report] [--backend-running]
 *   node scripts/run-sprint1-staged-tests.js --stage=b [--runs=12] [--no-report] [--backend-running]
 *   node scripts/run-sprint1-staged-tests.js --stage=c [--window-mins=5] [--no-report] [--backend-running]
 *   node scripts/run-sprint1-staged-tests.js --stage=all [--runs=12] [--window-mins=5]
 *
 * Options:
 *   --stage=a|b|c|all   Stage to run (default: all)
 *   --runs=N            Number of searches per stage A/B (default: 12)
 *   --window-mins=N    Stage C observation window in minutes (default: 5 for automation)
 *   --no-report        Do not update the markdown report file
 *   --backend-running  Do not start/stop backend; assume it is already running (logs must be captured separately)
 *
 * When --backend-running is used, you must pipe backend stdout to a file and pass it via --log-file=path.
 * When we start the backend ourselves, we capture stdout to a temp file and parse it.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const BACKEND_PORT = 3001;
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;

// Fixed OTM URLs (same set as plan: Leeds, Manchester, Nottingham)
const OTM_URLS = [
  'https://www.onthemarket.com/to-rent/property/leeds/?min-bedrooms=2&max-bedrooms=2&view=grid',
  'https://www.onthemarket.com/to-rent/property/manchester/?max-price=1200&view=grid',
  'https://www.onthemarket.com/to-rent/property/nottingham/?min-bedrooms=3&max-bedrooms=3&view=grid',
];

const STAGE_A_ENV = {
  SEARCH_OPT_REQUEST_BLOCKING: 'false',
  SEARCH_OPT_SELECTOR_WAIT_MS: '60000',
  SEARCH_OPT_NAV_RETRY_DELAY_MS: '5000',
  SEARCH_OPT_POST_CLICK_WAIT_MS: '1000',
};

const STAGE_B_ENV = {
  SEARCH_OPT_REQUEST_BLOCKING: 'true',
  SEARCH_OPT_SELECTOR_WAIT_MS: '20000',
  SEARCH_OPT_NAV_RETRY_DELAY_MS: '2000',
  SEARCH_OPT_POST_CLICK_WAIT_MS: '500',
};

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {
    stage: 'all',
    runs: 12,
    windowMins: 5,
    noReport: false,
    backendRunning: false,
    logFile: null,
  };
  for (const a of args) {
    if (a === '--no-report') out.noReport = true;
    else if (a === '--backend-running') out.backendRunning = true;
    else if (a.startsWith('--stage=')) out.stage = a.slice(8).toLowerCase();
    else if (a.startsWith('--runs=')) out.runs = Math.max(1, parseInt(a.slice(7), 10) || 12);
    else if (a.startsWith('--window-mins=')) out.windowMins = Math.max(1, parseInt(a.slice(14), 10) || 5);
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
        (res) => { resolve(); }
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
          const data = Buffer.concat(chunks).toString();
          let parsed = null;
          try {
            parsed = JSON.parse(data);
          } catch (_) {}
          resolve({
            status: res.statusCode,
            success: res.statusCode === 200 && Array.isArray(parsed) && parsed.length >= 0,
            count: Array.isArray(parsed) ? parsed.length : 0,
            correlationId,
          });
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    req.setTimeout(120000);
    req.write(body);
    req.end();
  });
}

function runSearches(count) {
  const urls = [];
  for (let i = 0; i < count; i++) urls.push(OTM_URLS[i % OTM_URLS.length]);
  return urls;
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
  const lines = logContent.split(/\n/);
  const results = [];
  for (const line of lines) {
    const idx = line.indexOf('[SCRAPE_TIMINGS]');
    if (idx === -1) continue;
    const jsonStr = line.slice(idx + '[SCRAPE_TIMINGS]'.length).trim();
    try {
      const obj = JSON.parse(jsonStr);
      if (obj != null && typeof obj.total === 'number') results.push(obj);
    } catch (_) {}
  }
  return results;
}

function computeMetrics(timings, responses) {
  const byCorrelationId = new Map();
  for (const t of timings) byCorrelationId.set(t.correlationId, t);
  const matched = [];
  let successCount = 0;
  for (const r of responses) {
    const t = byCorrelationId.get(r.correlationId);
    if (t) matched.push({ ...t, success: r.success });
    if (r.success) successCount++;
  }
  const totals = matched.filter((m) => !m.error).map((m) => m.total);
  totals.sort((a, b) => a - b);
  const p50 = percentile(totals, 50);
  const p95 = percentile(totals, 95);
  const sampleLines = matched.slice(0, 5).map((m) => ({
    correlationId: m.correlationId,
    total: m.total,
    browserLaunch: m.browserLaunch,
    navigation: m.navigation,
    selectorWait: m.selectorWait,
    emailEnrichment: m.emailEnrichment,
  }));
  return {
    runs: responses.length,
    successCount,
    successRate: responses.length ? (100 * successCount / responses.length).toFixed(1) + '%' : '0%',
    p50: Math.round(p50),
    p95: Math.round(p95),
    min: totals.length ? Math.round(totals[0]) : 0,
    max: totals.length ? Math.round(totals[totals.length - 1]) : 0,
    errors: responses.length - successCount,
    sampleLines,
    rawTimings: matched,
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
  const isA = stage === 'a';
  const isB = stage === 'b';
  const isC = stage === 'c';
  const env = isA ? STAGE_A_ENV : { ...STAGE_B_ENV };
  const logPath = opts.logFile || path.join(__dirname, `sprint1-stage-${stage}-${Date.now()}.log`);
  let backendProc = null;
  let logFd = null;
  let logPathToRead = logPath;

  if (!opts.backendRunning) {
    console.log(`[Stage ${stage.toUpperCase()}] Starting backend with ${isA ? 'baseline' : 'optimised'} env…`);
    const { child, out } = startBackend(env, logPath);
    backendProc = child;
    logFd = out;
    await waitForBackend();
    console.log(`[Stage ${stage.toUpperCase()}] Backend ready.`);
  } else if (!opts.logFile) {
    console.warn('--backend-running set but no --log-file; timings will be empty. Pipe backend stdout to a file and pass --log-file=path.');
  }

  const urls = runSearches(opts.runs);
  const correlationIds = urls.map((_, i) => `auto-${stage}-${Date.now()}-${i}`);
  const responses = [];

  if (isC) {
    const intervalMs = Math.max(10000, (opts.windowMins * 60 * 1000) / Math.max(1, opts.runs));
    console.log(`[Stage C] Running ${opts.runs} searches over ~${opts.windowMins} min (interval ${intervalMs / 1000}s)...`);
    for (let i = 0; i < opts.runs; i++) {
      const res = await postScrape(urls[i], correlationIds[i]);
      responses.push(res);
      if (i < opts.runs - 1) await new Promise((r) => setTimeout(r, intervalMs));
    }
  } else {
    console.log(`[Stage ${stage.toUpperCase()}] Running ${opts.runs} OTM searches...`);
    for (let i = 0; i < urls.length; i++) {
      const res = await postScrape(urls[i], correlationIds[i]);
      responses.push(res);
    }
  }

  if (backendProc) {
    backendProc.kill('SIGTERM');
    await new Promise((r) => setTimeout(r, 2000)).catch(() => {});
    if (backendProc.killed === false) backendProc.kill('SIGKILL');
    if (logFd != null) fs.closeSync(logFd);
    logPathToRead = logPath;
  } else if (opts.logFile) {
    logPathToRead = opts.logFile;
  }

  let logContent = '';
  if (logPathToRead && fs.existsSync(logPathToRead)) logContent = fs.readFileSync(logPathToRead, 'utf8');
  const timings = parseScrapeTimings(logContent);
  const metrics = computeMetrics(timings, responses);

  const dateStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
  return {
    stage,
    dateStr,
    envSummary: isA ? 'Flags off (baseline)' : 'Optimisations on',
    ...metrics,
    windowMins: isC ? opts.windowMins : null,
    logPath: opts.logFile ? null : logPath,
  };
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
  if (s.stage === 'c') {
    out += `| Window duration | ${s.windowMins} min |\n`;
    out += `| Success rate | ${s.successRate} |\n`;
  }
  out += `| Min total (ms) | ${s.min} |\n`;
  out += `| Max total (ms) | ${s.max} |\n`;
  out += `| Timeouts/errors | ${s.errors} |\n`;
  out += `\n**Sample \`[SCRAPE_TIMINGS]\` lines (paste 3–5 or short excerpt):**\n\n\`\`\`\n`;
  s.sampleLines.forEach((l) => { out += JSON.stringify(l) + '\n'; });
  out += `\`\`\`\n`;
  return out;
}

function updateReportFile(resultsByStage) {
  const reportPath = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'docs',
    'r1.1-improvement',
    'V203-search-and-results-improvements',
    '05-sprint1-staged-test-results.md'
  );
  if (!fs.existsSync(reportPath)) {
    console.warn('Report file not found:', reportPath);
    return;
  }
  let content = fs.readFileSync(reportPath, 'utf8');

  const replaceTable = (sectionMarker, newTable) => {
    const start = content.indexOf(sectionMarker);
    if (start === -1) return;
    const tableStart = content.indexOf('| Field | Value |', start);
    if (tableStart === -1) return;
    const firstCode = content.indexOf('```', tableStart);
    const secondCode = firstCode >= 0 ? content.indexOf('```', firstCode + 3) : -1;
    const tableEnd = secondCode >= 0 ? secondCode + 3 : content.indexOf('\n---', tableStart);
    if (tableEnd < tableStart) return;
    content = content.slice(0, tableStart) + newTable + content.slice(tableEnd);
  };

  if (resultsByStage.a) {
    replaceTable('## Stage A: Baseline', formatReportSection(resultsByStage.a));
  }
  if (resultsByStage.b) {
    replaceTable('## Stage B: Optimised', formatReportSection(resultsByStage.b));
    if (resultsByStage.a) {
      const a = resultsByStage.a;
      const b = resultsByStage.b;
      const quickCompare = `
| Metric | Stage A | Stage B | Delta |
|--------|---------|---------|--------|
| P50 total (ms) | ${a.p50} | ${b.p50} | ${b.p50 - a.p50} |
| P95 total (ms) | ${a.p95} | ${b.p95} | ${b.p95 - a.p95} |
| Success rate | ${a.successRate} | ${b.successRate} | ${b.successCount === a.successCount ? 'unchanged' : 'see above'} |
`;
      const quickStart = content.indexOf('**Quick comparison vs Stage A:**');
      if (quickStart !== -1) {
        const quickEnd = content.indexOf('**Sample', quickStart);
        content = content.slice(0, quickStart) + '**Quick comparison vs Stage A:**\n\n' + quickCompare + '\n' + content.slice(quickEnd);
      }
    }
  }
  if (resultsByStage.c) {
    replaceTable('## Stage C: Observation window', formatReportSection(resultsByStage.c));
  }

  fs.writeFileSync(reportPath, content, 'utf8');
  console.log('Updated report:', reportPath);
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
