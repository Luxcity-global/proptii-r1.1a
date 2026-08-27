/**
 * lens-rules.seed.ts
 *
 * Seeds the `lensRules` Firestore collection with the default R1.4 rules.
 * Run once per environment (staging, production) after first deploy.
 *
 * Usage:
 *   ts-node src/gov-data/seeds/lens-rules.seed.ts
 *   — or via package.json script:
 *   npm run seed:lens-rules
 *
 * What it does:
 *   - Reads DEFAULT_RULES from lens-engine.service.ts (single source of truth)
 *   - Writes each rule as a Firestore document in `lensRules/{flagId}__{audience}`
 *   - Uses set({ merge: false }) so existing rules are fully replaced on re-run
 *   - Safe to re-run — idempotent
 *
 * After running, restart the backend so LensEngineService.onModuleInit()
 * reloads the cache from Firestore (or call GET /api/admin/lens-rules/reload).
 */

import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import { DEFAULT_RULES } from '../services/lens-engine.service';

// ── Firebase initialisation ────────────────────────────────────────────────────

function initFirebase(): admin.firestore.Firestore {
  if (admin.apps.length) return admin.firestore();

  // Try service account JSON from env var first (production)
  const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonEnv) {
    try {
      const sa = JSON.parse(jsonEnv);
      admin.initializeApp({ credential: admin.credential.cert(sa) });
      return admin.firestore();
    } catch (err: any) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', err.message);
      process.exit(1);
    }
  }

  // Fall back to a local service account key file
  const keyPaths = [
    path.resolve(__dirname, '../../../../firebase-adminsdk-key.json'),
    path.resolve(__dirname, '../../../../proptii-dev-firebase-adminsdk-fbsvc-5fcecc59cd.json'),
  ];

  for (const keyPath of keyPaths) {
    if (fs.existsSync(keyPath)) {
      admin.initializeApp({ credential: admin.credential.cert(keyPath) });
      console.log(`Using service account: ${keyPath}`);
      return admin.firestore();
    }
  }

  console.error(
    'No Firebase credentials found. Set FIREBASE_SERVICE_ACCOUNT_JSON env var ' +
    'or place a service account JSON file in the project root.',
  );
  process.exit(1);
}

// ── Seed ──────────────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  const db = initFirebase();
  const col = db.collection('lensRules');

  console.log(`\nSeeding ${DEFAULT_RULES.length} lens rules into Firestore...\n`);

  let written = 0;
  let errors  = 0;

  for (const rule of DEFAULT_RULES) {
    // Document key: flagId__audience — human-readable, unique per rule
    const docId = `${rule.flagId}__${rule.audience}`;
    try {
      await col.doc(docId).set(rule, { merge: false });
      console.log(`  ✅  ${docId}`);
      written++;
    } catch (err: any) {
      console.error(`  ❌  ${docId}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\nDone. ${written} rules written, ${errors} errors.`);

  if (errors > 0) {
    console.error('\nSome rules failed to write. Check Firestore permissions.');
    process.exit(1);
  }

  // Verify by reading back
  const snap = await col.get();
  console.log(`\nVerification: ${snap.size} documents now in lensRules collection.`);

  process.exit(0);
}

seed().catch(err => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
