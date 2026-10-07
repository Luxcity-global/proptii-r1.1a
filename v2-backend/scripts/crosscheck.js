const fs = require('fs');
const path = require('path');

// Extract endpoints from YAML
const yamlContent = fs.readFileSync('./docs/api-reference.yaml', 'utf8');
const lines = yamlContent.split('\n');
let inPaths = false;
let currentPath = '';
const yamlEndpoints = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith('paths:')) {
    inPaths = true;
    continue;
  }
  if (inPaths && !line.startsWith(' ') && line.trim() !== '') break;
  if (inPaths) {
    const pathMatch = line.match(/^  (\/[^:]+):/);
    if (pathMatch) currentPath = pathMatch[1];
    const methodMatch = line.match(/^    (get|post|put|patch|delete|options|head):/);
    if (methodMatch && currentPath) {
      const method = methodMatch[1].toUpperCase();
      let summary = '';
      let tags = [];
      let operationId = '';
      for (let j = i + 1; j < Math.min(i + 30, lines.length); j++) {
        const sumMatch = lines[j].match(/^\s+summary:\s*['"]?(.*?)['"]?$/);
        if (sumMatch && !summary) summary = sumMatch[1];
        const opMatch = lines[j].match(/^\s+operationId:\s*['"]?(.*?)['"]?$/);
        if (opMatch && !operationId) operationId = opMatch[1];
        const tagMatch = lines[j].match(/^\s+-\s+['"]?(.*?)['"]?$/);
        if (tagMatch && lines[j-1] && lines[j-1].includes('tags:')) {
          tags.push(tagMatch[1]);
        }
        if (lines[j].match(/^    \w+:/) || lines[j].match(/^  \//)) break;
      }
      yamlEndpoints.push({ path: currentPath, method, summary, operationId, tags });
    }
  }
}

// Controllers
const controllers = [
  './src/controllers/admin-dashboard.controller.ts',
  './src/controllers/alerts.controller.ts',
  './src/controllers/auth.controller.ts',
  './src/controllers/billing.controller.ts',
  './src/controllers/communication.controller.ts',
  './src/controllers/contract.controller.ts',
  './src/controllers/email.controller.ts',
  './src/controllers/flags.controller.ts',
  './src/controllers/guest-enquiry.controller.ts',
  './src/controllers/health.controller.ts',
  './src/controllers/homeowner.controller.ts',
  './src/controllers/insights.controller.ts',
  './src/controllers/landlords.controller.ts',
  './src/controllers/native-properties.controller.ts',
  './src/controllers/payments.controller.ts',
  './src/controllers/property-facts.controller.ts',
  './src/controllers/property-selections.controller.ts',
  './src/controllers/referee-guarantor.controller.ts',
  './src/controllers/referencing.controller.ts',
  './src/controllers/report.controller.ts',
  './src/controllers/saved-properties.controller.ts',
  './src/controllers/sheets.controller.ts',
  './src/controllers/storage.controller.ts',
  './src/controllers/tenant-dashboard.controller.ts',
  './src/controllers/tenant-invitations.controller.ts',
  './src/controllers/tenants.controller.ts',
  './src/controllers/user-profile.controller.ts',
  './src/controllers/viewing-request.controller.ts',
  './src/leads/leads.controller.ts',
  './src/search/classifier.controller.ts'
];

const controllerRoutes = [];

for (const cPath of controllers) {
  if (!fs.existsSync(cPath)) continue;
  const content = fs.readFileSync(cPath, 'utf8');
  const controllerMatch = content.match(/@Controller\((?:\[([^\]]+)\]|['"]([^'"]*)['"])\)/);
  let prefixes = [''];
  if (controllerMatch) {
    if (controllerMatch[1]) {
      prefixes = controllerMatch[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
    } else if (controllerMatch[2] !== undefined) {
      prefixes = [controllerMatch[2]];
    }
  }

  const linesC = content.split('\n');
  for (let idx = 0; idx < linesC.length; idx++) {
    const l = linesC[idx];
    const match = l.match(/@(Get|Post|Put|Patch|Delete|Sse)\((.*)\)/);
    if (match) {
      let httpMethod = match[1].toUpperCase();
      if (httpMethod === 'SSE') httpMethod = 'GET';
      const rawArg = match[2].trim();
      let subRoutes = [''];
      if (rawArg.startsWith('[') && rawArg.endsWith(']')) {
        subRoutes = rawArg.slice(1, -1).split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean);
      } else if (rawArg.startsWith("'") || rawArg.startsWith('"')) {
        subRoutes = [rawArg.replace(/['"]/g, '')];
      }

      let handlerMethod = '';
      for (let k = idx + 1; k < Math.min(idx + 10, linesC.length); k++) {
        const m = linesC[k].match(/(?:async\s+)?([a-zA-Z0-9_]+)\s*\(/);
        if (m && !linesC[k].includes('@')) {
          handlerMethod = m[1];
          break;
        }
      }

      for (const prefix of prefixes) {
        for (const subRoute of subRoutes) {
          let full = '/' + [prefix, subRoute].filter(Boolean).join('/').replace(/\/+/g, '/');
          if (full !== '/' && full.endsWith('/')) full = full.slice(0, -1);
          controllerRoutes.push({
            file: path.basename(cPath),
            cPath,
            method: httpMethod,
            route: full,
            handler: handlerMethod,
            prefix,
            subRoute
          });
        }
      }
    }
  }
}

function normalizePath(p) {
  return p.replace(/\{([^}]+)\}/g, ':$1');
}

const report = [];
let matchedCount = 0;

for (const ep of yamlEndpoints) {
  const normYaml = normalizePath(ep.path);
  const candidates = controllerRoutes.filter(cr => {
    if (cr.method !== ep.method) return false;
    const crClean = cr.route.replace(/\(\*\)/g, '');
    const crParts = crClean.split('/').filter(Boolean);
    const yamlParts = normYaml.split('/').filter(Boolean);
    if (crParts.length !== yamlParts.length) return false;
    for (let i = 0; i < crParts.length; i++) {
      if (crParts[i].startsWith(':') && yamlParts[i].startsWith(':')) continue;
      if (crParts[i] !== yamlParts[i]) return false;
    }
    return true;
  });

  if (candidates.length > 0) {
    matchedCount++;
    report.push({
      status: 'MATCHED',
      yamlMethod: ep.method,
      yamlPath: ep.path,
      summary: ep.summary,
      controller: candidates[0].file,
      handler: candidates[0].handler,
      controllerRoute: candidates[0].route
    });
  } else {
    report.push({
      status: 'UNMATCHED',
      yamlMethod: ep.method,
      yamlPath: ep.path,
      summary: ep.summary,
      controller: null,
      handler: null
    });
  }
}

console.log(`Total YAML Endpoints: ${yamlEndpoints.length}`);
console.log(`Matched: ${matchedCount}`);
console.log(`Unmatched: ${yamlEndpoints.length - matchedCount}`);

const unmatched = report.filter(r => r.status === 'UNMATCHED');
if (unmatched.length > 0) {
  console.log('\nUnmatched Endpoints:');
  unmatched.forEach(u => console.log(`- [${u.yamlMethod}] ${u.yamlPath} (${u.summary})`));
}
