/**
 * Copy index.html to deep client-route paths so Stripe return URLs and hard
 * refreshes work on static hosts without SPA rewrite rules (e.g. Render staging
 * previews that serve public/404.html for unknown paths).
 *
 * See: https://render.com/docs/redirects-rewrites
 */
const fs = require('fs');
const path = require('path');

const DIST = path.resolve(__dirname, '..', 'dist');
const INDEX = path.join(DIST, 'index.html');

/** Paths that must load the SPA shell (no leading/trailing slashes). */
const SPA_ROUTE_DIRS = [
  'billing/confirmed',
  'billing/activate',
  'signup',
  'signup/pay-now',
  'signup/welcome',
  'signup/create-account',
  'pricing',
  'pricing/confirmed',
  'login',
  'dashboard',
];

function main() {
  if (!fs.existsSync(INDEX)) {
    console.error('copy-spa-fallbacks: dist/index.html not found — run vite build first');
    process.exit(1);
  }

  const indexHtml = fs.readFileSync(INDEX, 'utf8');
  let created = 0;

  for (const routeDir of SPA_ROUTE_DIRS) {
    const dir = path.join(DIST, routeDir);
    fs.mkdirSync(dir, { recursive: true });
    const target = path.join(dir, 'index.html');
    fs.writeFileSync(target, indexHtml);
    created += 1;
  }

  console.log(
    `copy-spa-fallbacks: ensured ${SPA_ROUTE_DIRS.length} SPA shell paths (${created} written)`,
  );
}

main();
