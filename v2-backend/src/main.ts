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

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS;

  try {
    if (serviceAccountPath && require('fs').existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Admin initialized with service account JSON.');
    } else if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
      console.log(`✅ Firebase Admin initialized with project ID: ${process.env.FIREBASE_PROJECT_ID}`);
    } else {
      admin.initializeApp({
        projectId: 'proptii-16946',
      });
      console.log('✅ Firebase Admin initialized with default project ID (proptii-16946).');
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
  console.log(`🚀 Consolidated v2 Backend running on http://localhost:${port}/api`);
}
bootstrap();
