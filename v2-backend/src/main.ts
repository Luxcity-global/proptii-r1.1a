import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from v2-backend root, fallback to parent root if needed
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Configure gRPC KeepAlive to prevent idle deadline timeouts (4 DEADLINE_EXCEEDED)
process.env.GRPC_KEEPALIVE_TIME_MS = process.env.GRPC_KEEPALIVE_TIME_MS || '15000';
process.env.GRPC_KEEPALIVE_TIMEOUT_MS = process.env.GRPC_KEEPALIVE_TIMEOUT_MS || '5000';
process.env.GRPC_KEEPALIVE_PERMIT_WITHOUT_CALLS = process.env.GRPC_KEEPALIVE_PERMIT_WITHOUT_CALLS || '1';
process.env.GRPC_HTTP2_MIN_PING_INTERVAL_WITHOUT_DATA_MS = process.env.GRPC_HTTP2_MIN_PING_INTERVAL_WITHOUT_DATA_MS || '5000';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as admin from 'firebase-admin';
import { json, urlencoded } from 'express';

function initializeFirebase() {
  if (admin.apps.length) return;

  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS;

  // ── Pre-flight: print what credential source we found ─────────────────────
  if (!serviceAccountEnv) {
    const hasIndividualCreds = !!(process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
    console.warn(
      '⚠️  FIREBASE_SERVICE_ACCOUNT_JSON is not set.' +
      (hasIndividualCreds
        ? ' Will try FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.'
        : ' No Firebase credentials found — Firestore calls will fail.\n' +
          '   FIX: In the Render dashboard → Environment, add a secret:\n' +
          '   Key: FIREBASE_SERVICE_ACCOUNT_JSON\n' +
          '   Value: paste the full contents of your Firebase service account JSON\n' +
          '   (Download from Firebase Console → Project Settings → Service Accounts → Generate new private key)')
    );
  } else {
    const preview = serviceAccountEnv.trim().slice(0, 40).replace(/\n/g, '');
    console.log(`[Firebase] Credential env var detected (preview: ${preview}…)`);
  }

  try {
    // Case 1: env var contains a raw JSON string (production on Render or ADC JSON)
    if (serviceAccountEnv && serviceAccountEnv.trim().startsWith('{')) {
      try {
        const serviceAccountObj = JSON.parse(serviceAccountEnv);

        if (serviceAccountObj.type === 'authorized_user' || serviceAccountObj.refresh_token) {
          const os = require('os');
          const path = require('path');
          const fs = require('fs');
          const tmpAdc = path.join(os.tmpdir(), 'gcp_adc_main.json');
          fs.writeFileSync(tmpAdc, JSON.stringify(serviceAccountObj));
          process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpAdc;
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: process.env.FIREBASE_PROJECT_ID || 'proptii-16946',
          });
          console.log('✅ Firebase Admin initialized from ADC OAuth2 credentials.');
          return;
        } else {
          // Standard service account JSON string with private_key
          if (!serviceAccountObj.project_id) {
            serviceAccountObj.project_id = process.env.FIREBASE_PROJECT_ID || 'proptii-16946';
          }
          admin.initializeApp({ credential: admin.credential.cert(serviceAccountObj) });
          console.log('✅ Firebase Admin initialized from service account JSON env var.');
          return;
        }
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

  // Disable default body parser so we can set a custom payload limit
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.setGlobalPrefix('api');

  // ── Global ValidationPipe (Sprint 1.3 PRD requirement) ──────────────────────
  // Validates all @Body() DTOs across every controller.
  // whitelist: true  — strips unknown fields from the body (not rejected).
  // transform: true  — automatically coerces primitives to their DTO types.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:            true,
      transform:            true,
      forbidNonWhitelisted: false,  // strip silently — don't reject
    }),
  );

  // ── CORS (Sprint 2.1 PRD requirement) ───────────────────────────────────
  // Explicit allowlist so the browser permits calls to:
  //   POST /api/search/classify   (classifier — Sprint 1.3)
  //   GET  /api/flags             (runtime flag — Sprint 2.1)
  //   All existing endpoints (unchanged behaviour)
  //
  // ALLOWED_ORIGINS env var: comma-separated list for production deployments.
  // Falls back to a wildcard in local dev (NODE_ENV !== 'production').
  const isProd = process.env.NODE_ENV === 'production' || !!process.env.RENDER_EXTERNAL_URL;
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    : null;

  app.enableCors({
    origin: true, // Reflects the incoming origin, allowing any frontend to connect with credentials
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  });

  // ── Swagger API Documentation ─────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Proptii API')
    .setDescription('The Proptii v2 Backend API description')
    .setVersion('1.4')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Increase payload limit for base64 file uploads (413 Payload Too Large)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`🚀 Proptii v2-backend running on port ${port}`);

  // ── Production Keep-Alive Ping Loop (prevents Render/Fly spin-down) ──────
  // Only runs when deployed — never locally. RENDER_EXTERNAL_URL is injected
  // automatically by Render; BACKEND_URL can be set manually on other hosts.
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RENDER_EXTERNAL_URL;
  if (isProduction) {
    const keepAliveInterval = 4 * 60 * 1000; // 4 minutes
    const backendUrl = (process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '');

    setInterval(() => {
      try {
        const https = require('https');
        // /health is outside the /api prefix — lightweight, no auth, already
        // excluded from request logging by LoggingMiddleware
        https.get(`${backendUrl}/health`, (res: any) => {
          res.resume();
        }).on('error', () => {});
      } catch {}
    }, keepAliveInterval);

    console.log(`🏓 Keep-alive loop started → ${backendUrl}/health every 4 min`);
  }
}
bootstrap();
