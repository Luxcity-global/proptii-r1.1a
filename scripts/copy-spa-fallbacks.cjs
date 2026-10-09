/**
 * Copy index.html to deep client-route paths so Stripe return URLs, passport
 * links, and hard refreshes work on static hosts that only serve real files.
 *
 * Render serves public/404.html for any path that is not a file, and it does
 * not apply _redirects. Do not replace dist/landlord/index.html — that file is
 * the standalone landlord app.
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
  'admin',
  'admin/leads',
  'ProptiiAdmin',
  'view-passport',
  'claim-referencing',
  'referencing',
  'referencing/invite',
  'landlord/dashboard',
  'landlord/properties',
  'landlord/documents',
  'landlord/contracts',
  'landlord/clients',
  'landlord/viewings',
  'landlord/insights',
  'landlord/inbox',
  'landlord/messages',
  'landlord/settings',
  'landlord/referencing',
  'agent',
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

  // Also write 200.html fallback for hosts supporting standard SPA rewrites
  fs.writeFileSync(path.join(DIST, '200.html'), indexHtml);
  // Unknown paths, including /referencing/view/<token> from emails already sent,
  // must boot the app. Render serves this file with a 404 status; the document
  // is still the SPA, so client routes render instead of the static 404 page.
  fs.writeFileSync(path.join(DIST, '404.html'), indexHtml);

  console.log(
    `copy-spa-fallbacks: ensured ${SPA_ROUTE_DIRS.length} SPA shell paths (${created} written)`,
  );
}

main();
