import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from v2-backend root, fallback to parent root if needed
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as admin from 'firebase-admin';

function initializeFirebase() {
  if (admin.apps.length) return;

  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS;

  try {
    // Case 1: env var contains a raw JSON string (production on Render)
    if (serviceAccountEnv && serviceAccountEnv.trim().startsWith('{')) {
      try {
        const serviceAccountObj = JSON.parse(serviceAccountEnv);
        // Handle refresh-token / authorized_user JSON (write to tmp ADC file)
        if (serviceAccountObj.type === 'authorized_user' || serviceAccountObj.refresh_token) {
          const os = require('os');
          const path = require('path');
          const fs = require('fs');
          const tempPath = path.join(os.tmpdir(), 'gcp_adc.json');
          fs.writeFileSync(tempPath, JSON.stringify(serviceAccountObj));
          process.env.GOOGLE_APPLICATION_CREDENTIALS = tempPath;
          admin.initializeApp({ credential: admin.credential.applicationDefault() });
          console.log('✅ Firebase Admin initialized from authorized_user JSON env var.');
        } else {
          // Standard service account JSON string
          if (!serviceAccountObj.project_id) {
            serviceAccountObj.project_id = process.env.FIREBASE_PROJECT_ID || 'proptii-16946';
          }
          admin.initializeApp({ credential: admin.credential.cert(serviceAccountObj) });
          console.log('✅ Firebase Admin initialized from service account JSON env var.');
        }
        return;
      } catch (parseErr: any) {
        console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON as JSON:', parseErr?.message);
      }
    }

    // Case 2: env var is a file path (local dev with a downloaded service account file)
    if (serviceAccountEnv && require('fs').existsSync(serviceAccountEnv)) {
      const serviceAccount = require(serviceAccountEnv);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      console.log('✅ Firebase Admin initialized from service account file:', serviceAccountEnv);
      return;
    }

    // Case 3: Individual credential env vars (FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY)
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const projectId = process.env.FIREBASE_PROJECT_ID || 'proptii-16946';
    if (clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      console.log('✅ Firebase Admin initialized from individual credential env vars.');
      return;
    }

    // Case 4: Project-ID only — read-only / emulator mode (no writes will work in prod without credentials)
    if (projectId) {
      admin.initializeApp({ projectId });
      console.log(`⚠️  Firebase Admin initialized with project ID only (${projectId}). Set FIREBASE_SERVICE_ACCOUNT_JSON in Render for full access.`);
    } else {
      admin.initializeApp({ projectId: 'proptii-16946' });
      console.log('⚠️  Firebase Admin initialized with hardcoded default project ID.');
    }
  } catch (e: any) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', e?.message || e);
  }
}

async function bootstrap() {
  initializeFirebase();

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: '*',
    credentials: true,
  });
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Proptii v2-backend running on port ${port}`);

  // ── Production Keep-Alive Ping Loop (prevents Render/Fly spin-down) ──
  const keepAliveInterval = 4 * 60 * 1000; // 4 minutes
  const backendUrl = process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL || `http://127.0.0.1:${port}`;

  setInterval(() => {
    try {
      const http = require('http');
      const https = require('https');
      const client = backendUrl.startsWith('https') ? https : http;
      client.get(`${backendUrl}/api/health`, (res: any) => {
        res.resume();
      }).on('error', () => {});
    } catch {}
  }, keepAliveInterval);
}
bootstrap();
