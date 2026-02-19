#!/usr/bin/env node
/**
 * Final search tests across board — Sprint 2 (A→B→C) then Sprint 3 (A→B [→C]).
 * Updates 06-sprint2-staged-test-results.md and 07-sprint3-staged-test-results.md,
 * and fills "Correlate, analyse and adjust" in 07 for final decision on tuning.
 *
 * Usage (from search/backend):
 *   npm run test:final:staged          # S2 all + S3 A,B (recommended)
 *   npm run test:final:staged -- --s3-c # include S3 Stage C if Phase 5 implemented
 *   npm run test:final:staged -- --skip-s2   # run S3 only (use when S2 already validated)
 *
 * Options: --skip-s2, --s3-c, --runs=N, --no-report, --log-dir=path
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

// --- Sprint 2 stage envs (same as run-sprint2-staged-tests.js) ---
const S2_STAGE_A_ENV = {
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
const S2_STAGE_B_ENV = {
  ...S2_STAGE_A_ENV,
  SEARCH_OPT_DISABLE_SCROLLING: 'true',
  SEARCH_OPT_DISABLE_CAROUSEL_TRIGGERS: 'true',
};
const S2_STAGE_C_ENV = {
  ...S2_STAGE_B_ENV,
  SEARCH_OPT_PARALLEL_EMAIL_LOOKUP: 'true',
  SEARCH_OPT_AGENT_CAP: '10',
  SEARCH_OPT_EMAIL_QUERIES_PER_AGENT: '1',
  SEARCH_OPT_EMAIL_CACHE_TTL_SEC: '3600',
};

// --- Sprint 3 stage envs (same as run-sprint3-staged-tests.js) ---
const S3_STAGE_A_ENV = {
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
const S3_STAGE_B_ENV = { ...S3_STAGE_A_ENV, SEARCH_OPT_WARM_BROWSER: 'true' };
const S3_STAGE_C_ENV = {
  ...S3_STAGE_B_ENV,
  SEARCH_OPT_BACKGROUND_EMAIL_ENRICHMENT: 'true',
  SEARCH_OPT_FRONTEND_FAST_RENDER: 'true',
};

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { skipS2: false, s3C: false, runs: 12, noReport: false, logDir: null };
  for (const a of args) {
    if (a === '--skip-s2') out.skipS2 = true;
    else if (a === '--s3-c') out.s3C = true;
    else if (a === '--no-report') out.noReport = true;
    else if (a.startsWith('--runs=')) out.runs = Math.max(1, parseInt(a.slice(7), 10) || 12);
    else if (a.startsWith('--log-dir=')) out.logDir = a.slice(10).trim() || null;
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

async function runStage(stageId, env, opts) {
  const logDir = opts.logDir || __dirname;
  const logPath = path.join(logDir, `final-${stageId}-${Date.now()}.log`);
  console.log(`[${stageId}] Starting backend…`);
  const { child, out } = startBackend(env, logPath);
  await waitForBackend();
  console.log(`[${stageId}] Backend ready. Running ${opts.runs} OTM searches...`);

  const urls = [];
  for (let i = 0; i < opts.runs; i++) urls.push(OTM_URLS[i % OTM_URLS.length]);
  const correlationIds = urls.map((_, i) => `${stageId}-${Date.now()}-${i}`);
  const responses = [];
  for (let i = 0; i < urls.length; i++) {
    const res = await postScrape(urls[i], correlationIds[i]);
    responses.push(res);
  }

  child.kill('SIGTERM');
  await new Promise((r) => setTimeout(r, 2000)).catch(() => {});
  if (child.killed === false) child.kill('SIGKILL');
  fs.closeSync(out);

  let logContent = '';
  if (fs.existsSync(logPath)) logContent = fs.readFileSync(logPath, 'utf8');
  const timings = parseScrapeTimings(logContent);
  const metrics = computeMetrics(timings, responses);
  const dateStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
  return { stageId, dateStr, ...metrics };
}

const DOCS_BASE = path.resolve(__dirname, '..', '..', '..', 'docs', 'r1.1-improvement', 'V203-search-and-results-improvements');
const REPORT_S2 = path.join(DOCS_BASE, '06-sprint2-staged-test-results.md');
const REPORT_S3 = path.join(DOCS_BASE, '07-sprint3-staged-test-results.md');

function formatS2ReportSection(result, stage) {
  const s = result;
  const envSummary =
    stage === 'a' ? 'All Sprint 2 flags off' : stage === 'b' ? 'Phase 2 only (scroll+carousel off)' : 'Full Sprint 2 (Phase 2+3)';
  let out = `| Field | Value |\n|-------|--------|\n`;
  out += `| Date/time | ${s.dateStr} |\n`;
  out += `| Env summary | ${envSummary} |\n`;
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

function formatS3ReportSection(result, stage) {
  const s = result;
  const envSummary =
    stage === 'a' ? 'S2 full, S3 off' : stage === 'b' ? 'Phase 4 only (warm browser)' : 'Phase 4+5 (warm + background enrich)';
  let out = `| Field | Value |\n|-------|--------|\n`;
  out += `| Date/time | ${s.dateStr} |\n`;
  out += `| Env summary | ${envSummary} |\n`;
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

const S2_SECTION_MARKERS = {
  a: '## Stage A: Sprint 2 baseline',
  b: '## Stage B: Phase 2 only',
  c: '## Stage C: Phase 2 + Phase 3',
};

const S3_SECTION_MARKERS = {
  a: '## Stage A: Sprint 3 baseline',
  b: '## Stage B: Phase 4 only',
  c: '## Stage C: Phase 4 + Phase 5',
};

function replaceSectionTable(content, sectionMarker, newTableAndCode) {
  const start = content.indexOf(sectionMarker);
  if (start === -1) return content;
  const tableStart = content.indexOf('| Field | Value |', start);
  if (tableStart === -1) return content;
  const firstCode = content.indexOf('```', tableStart);
  const secondCode = firstCode >= 0 ? content.indexOf('```', firstCode + 3) : -1;
  const tableEnd = secondCode >= 0 ? secondCode + 3 : content.indexOf('\n---', tableStart);
  if (tableEnd < tableStart) return content;
  return content.slice(0, tableStart) + newTableAndCode + content.slice(tableEnd);
}

function updateS2Report(s2Results) {
  if (!fs.existsSync(REPORT_S2)) { console.warn('Report not found:', REPORT_S2); return; }
  let content = fs.readFileSync(REPORT_S2, 'utf8');
  for (const [stage, result] of Object.entries(s2Results)) {
    if (!result) continue;
    const marker = S2_SECTION_MARKERS[stage];
    content = replaceSectionTable(content, marker, formatS2ReportSection(result, stage));
  }
  const a = s2Results.a;
  const b = s2Results.b;
  const c = s2Results.c;
  if (a && b && c) {
    const summary = `| Run | Date | Env | Runs | Success | P50 (s) | P95 (s) | Min (s) | Max (s) | scrollCarousel | emailEnrichment note |\n|-----|------|-----|------|---------|---------|---------|---------|---------|----------------|----------------------|\n| Stage A (Sprint 2 baseline) | ${a.dateStr} | All S2 off | ${a.runs} | ${a.successCount} | ${(a.p50 / 1000).toFixed(1)} | ${(a.p95 / 1000).toFixed(1)} | ${(a.min / 1000).toFixed(1)} | ${(a.max / 1000).toFixed(1)} | ~9.8s | — |\n| Stage B (Phase 2 only) | ${b.dateStr} | Scroll+carousel off | ${b.runs} | ${b.successCount} | ${(b.p50 / 1000).toFixed(1)} | ${(b.p95 / 1000).toFixed(1)} | ${(b.min / 1000).toFixed(1)} | ${(b.max / 1000).toFixed(1)} | ~0 | — |\n| Stage C (Phase 2+3) | ${c.dateStr} | Full Sprint 2 | ${c.runs} | ${c.successCount} | ${(c.p50 / 1000).toFixed(1)} | ${(c.p95 / 1000).toFixed(1)} | ${(c.min / 1000).toFixed(1)} | ${(c.max / 1000).toFixed(1)} | ~0 | parallel+cap+cache |\n`;
    const summaryStart = content.indexOf('## Test results summary');
    if (summaryStart !== -1) {
      const tableStart = content.indexOf('| Run |', summaryStart);
      const tableEnd = content.indexOf('\n\n---', tableStart);
      if (tableStart !== -1 && tableEnd > tableStart) {
        content = content.slice(0, tableStart) + summary.trim() + content.slice(tableEnd);
      }
    }
  }
  fs.writeFileSync(REPORT_S2, content, 'utf8');
  console.log('Updated:', REPORT_S2);
}

function updateS3Report(s3Results, opts) {
  if (!fs.existsSync(REPORT_S3)) { console.warn('Report not found:', REPORT_S3); return; }
  let content = fs.readFileSync(REPORT_S3, 'utf8');

  for (const [stage, result] of Object.entries(s3Results)) {
    if (!result) continue;
    const marker = S3_SECTION_MARKERS[stage];
    content = replaceSectionTable(content, marker, formatS3ReportSection(result, stage));
  }

  const a = s3Results.a;
  const b = s3Results.b;
  const c = s3Results.c;
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

  // --- Correlate, analyse and adjust ---
  if (a && b) {
    const p50A = a.p50; const p95A = a.p95; const minA = a.min; const maxA = a.max;
    const p50B = b.p50; const p95B = b.p95; const minB = b.min; const maxB = b.max;
    const gainMs = p95A - p95B;
    const gainSec = (gainMs / 1000).toFixed(1);
    const p95BSec = (p95B / 1000).toFixed(1);
    const successStable = a.successCount === a.runs && b.successCount === b.runs;
    const regression = p95B > p95A;

    let correlationRows = [
      `| A (Sprint 3 baseline) | ${p50A} | ${p95A} | ${minA} | ${maxA} | cold |`,
      `| B (Phase 4 only) | ${p50B} | ${p95B} | ${minB} | ${maxB} | pool |`,
    ];
    if (c) {
      correlationRows.push(`| C (Phase 4+5) | ${c.p50} | ${c.p95} | ${c.min} | ${c.max} | (fill) |`);
    } else {
      correlationRows.push(`| C (Phase 4+5) | (fill) | (fill) | (fill) | (fill) | (fill) |`);
    }
    const correlationTable = `| Stage | P50 (ms) | P95 (ms) | Min | Max | browserLaunch note |\n|-------|----------|----------|-----|-----|--------------------|\n` + correlationRows.join('\n') + '\n';

    const analysisBullets = [
      `- **Phase 4 (warm browser)** vs Stage A: P95 change **${gainMs >= 0 ? '-' : '+'}${Math.abs(gainMs / 1000).toFixed(1)} s** (target ~2–4 s faster). ${gainMs >= 2000 ? 'Target range met.' : gainMs >= 0 ? 'Some improvement.' : 'No improvement.'}`,
      `- **Success rate:** ${successStable ? 'Unchanged across stages (100%).' : `Stage A ${a.successCount}/${a.runs}, Stage B ${b.successCount}/${b.runs}.`}`,
      `- **Stage B P95 = ${p95BSec} s.** ${p95B < 10000 ? 'P95 < 10 s: document "Pause before Phase 5" and optionally skip Phase 5.' : 'P95 ≥ 10 s: consider Phase 5, then run Stage C.'}`,
    ].join('\n');

    let decisionText;
    if (regression) {
      decisionText = '- **Rollback** — Stage B regressed vs A; document in runbook and revert warm browser.';
    } else if (p95B < 10000 && successStable) {
      decisionText = '- **Pause before Phase 5** — P95 < 10 s and success rate stable. Optional: skip Phase 5 or run Stage C later for comparison.';
    } else if (p95B >= 10000) {
      decisionText = '- **Proceed to Phase 5** — P95 still > 10 s after Stage B; implement background enrichment + frontend fast render, then run Stage C.';
    } else {
      decisionText = '- **Review** — Check success rate and P95; then choose Proceed to Phase 5 or Pause before Phase 5.';
    }

    const nextSteps = regression
      ? 'Rollback warm browser per runbook; re-run Stage A to confirm baseline.'
      : p95B < 10000
        ? 'Optional: implement Phase 5 and run Stage C for full Sprint 3 comparison; or lock current config as final.'
        : 'Implement Phase 5; run Stage C with `npm run test:s3:staged:c` or `npm run test:final:staged -- --s3-c`; then update decision.';

    // Replace Correlation table
    const corrStart = content.indexOf('### Correlation');
    if (corrStart !== -1) {
      const corrTableStart = content.indexOf('| Stage |', corrStart);
      const corrTableEnd = content.indexOf('\n\n### Analysis', corrTableStart);
      if (corrTableStart !== -1 && corrTableEnd > corrTableStart) {
        content = content.slice(0, corrTableStart) + correlationTable.trim() + content.slice(corrTableEnd);
      }
    }
    // Replace Analysis
    const analysisStart = content.indexOf('### Analysis');
    if (analysisStart !== -1) {
      const analysisEnd = content.indexOf('\n\n### Decision', analysisStart);
      if (analysisEnd > analysisStart) {
        content = content.slice(0, analysisStart) + '### Analysis\n\n' + analysisBullets + '\n\n' + content.slice(analysisEnd);
      }
    }
    // Replace Decision
    const decisionStart = content.indexOf('### Decision');
    if (decisionStart !== -1) {
      const decisionEnd = content.indexOf('\n\n---', decisionStart);
      const end = decisionEnd > decisionStart ? decisionEnd : content.indexOf('\n\n**Next steps:**', decisionStart);
      if (end > decisionStart) {
        content = content.slice(0, decisionStart) + '### Decision\n\n' + decisionText + '\n\n' + content.slice(end);
      }
    }
    // Replace Next steps
    const nextStart = content.indexOf('**Next steps:**');
    if (nextStart !== -1) {
      const nextLineEnd = content.indexOf('\n', nextStart);
      const afterNext = content.indexOf('\n\nTo populate', nextStart);
      const replaceEnd = afterNext > nextStart ? afterNext : content.length;
      content = content.slice(0, nextStart) + '**Next steps:** ' + nextSteps + content.slice(replaceEnd);
    }
  }

  fs.writeFileSync(REPORT_S3, content, 'utf8');
  console.log('Updated:', REPORT_S3);
}

async function main() {
  const opts = parseArgs();
  const s2Results = {};
  const s3Results = {};

  if (!opts.skipS2) {
    console.log('\n--- Sprint 2: Stage A (baseline) ---');
    s2Results.a = await runStage('s2-a', S2_STAGE_A_ENV, opts);
    console.log(`[S2-A] runs=${s2Results.a.runs} success=${s2Results.a.successCount} P50=${s2Results.a.p50}ms P95=${s2Results.a.p95}ms`);
    console.log('\n--- Sprint 2: Stage B (Phase 2 only) ---');
    s2Results.b = await runStage('s2-b', S2_STAGE_B_ENV, opts);
    console.log(`[S2-B] runs=${s2Results.b.runs} success=${s2Results.b.successCount} P50=${s2Results.b.p50}ms P95=${s2Results.b.p95}ms`);
    console.log('\n--- Sprint 2: Stage C (Phase 2+3) ---');
    s2Results.c = await runStage('s2-c', S2_STAGE_C_ENV, opts);
    console.log(`[S2-C] runs=${s2Results.c.runs} success=${s2Results.c.successCount} P50=${s2Results.c.p50}ms P95=${s2Results.c.p95}ms`);
  }

  console.log('\n--- Sprint 3: Stage A (S2 full, S3 off) ---');
  s3Results.a = await runStage('s3-a', S3_STAGE_A_ENV, opts);
  console.log(`[S3-A] runs=${s3Results.a.runs} success=${s3Results.a.successCount} P50=${s3Results.a.p50}ms P95=${s3Results.a.p95}ms`);
  console.log('\n--- Sprint 3: Stage B (Phase 4 only) ---');
  s3Results.b = await runStage('s3-b', S3_STAGE_B_ENV, opts);
  console.log(`[S3-B] runs=${s3Results.b.runs} success=${s3Results.b.successCount} P50=${s3Results.b.p50}ms P95=${s3Results.b.p95}ms`);

  if (opts.s3C) {
    console.log('\n--- Sprint 3: Stage C (Phase 4+5) ---');
    s3Results.c = await runStage('s3-c', S3_STAGE_C_ENV, opts);
    console.log(`[S3-C] runs=${s3Results.c.runs} success=${s3Results.c.successCount} P50=${s3Results.c.p50}ms P95=${s3Results.c.p95}ms`);
  }

  if (!opts.noReport) {
    if (!opts.skipS2 && (s2Results.a && s2Results.b && s2Results.c)) updateS2Report(s2Results);
    if (s3Results.a && s3Results.b) updateS3Report(s3Results, opts);
  }

  console.log('\nDone. Review 06 and 07 docs for full results and final decision.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
