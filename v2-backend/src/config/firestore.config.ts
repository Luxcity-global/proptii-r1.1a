import * as admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';
import { Logger } from '@nestjs/common';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

process.env.GRPC_KEEPALIVE_TIME_MS = process.env.GRPC_KEEPALIVE_TIME_MS || '15000';
process.env.GRPC_KEEPALIVE_TIMEOUT_MS = process.env.GRPC_KEEPALIVE_TIMEOUT_MS || '5000';
process.env.GRPC_KEEPALIVE_PERMIT_WITHOUT_CALLS = process.env.GRPC_KEEPALIVE_PERMIT_WITHOUT_CALLS || '1';

let firestoreInstance: Firestore | null = null;
const logger = new Logger('FirestoreConfig');

export async function initializeFirestore(): Promise<Firestore | null> {
  if (firestoreInstance) {
    return firestoreInstance;
  }

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'proptii-16946';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!admin.apps.length) {
      let credential = null;
      let initializedWith = '';

      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (serviceAccountJson) {
        try {
          const serviceAccountObj = JSON.parse(serviceAccountJson);
          if (serviceAccountObj.type === 'authorized_user' || serviceAccountObj.refresh_token) {
            const tempAdcPath = path.join(os.tmpdir(), 'gcp_adc_render.json');
            fs.writeFileSync(tempAdcPath, JSON.stringify(serviceAccountObj));
            process.env.GOOGLE_APPLICATION_CREDENTIALS = tempAdcPath;
            credential = admin.credential.applicationDefault();
            initializedWith = 'user refresh token JSON variable';
          } else {
            if (!serviceAccountObj.project_id) {
              serviceAccountObj.project_id = serviceAccountObj.quota_project_id || projectId;
            }
            credential = admin.credential.cert(serviceAccountObj);
            initializedWith = 'service account JSON variable';
          }
          logger.log(`ℹ️ Initializing Firebase Admin using ${initializedWith}`);
        } catch (jsonErr: any) {
          logger.error(`❌ Failed to parse service account JSON variable: ${jsonErr.message}`);
        }
      }

      if (!credential && projectId && clientEmail && privateKey) {
        try {
          let formattedPrivateKey = privateKey.trim().replace(/\\n/g, '\n');
          credential = admin.credential.cert({
            projectId: projectId.trim(),
            clientEmail: clientEmail.trim(),
            privateKey: formattedPrivateKey,
          });
          initializedWith = 'service account credentials';
        } catch (error: any) {
          logger.error(`❌ Failed to create credential from service account: ${error.message}`);
        }
      }

      if (!credential) {
        admin.initializeApp({ projectId });
        initializedWith = 'default project ID';
      } else {
        admin.initializeApp({ credential, projectId });
      }

      logger.log(`✅ Firebase Admin initialized with ${initializedWith} for project: ${projectId}`);
    }

    firestoreInstance = admin.firestore();
    firestoreInstance.settings({ ignoreUndefinedProperties: true });
    return firestoreInstance;
  } catch (error: any) {
    logger.error('❌ Failed to initialize Firestore:', error.message);
    return null;
  }
}

export function getFirestore(): Firestore | null {
  return firestoreInstance;
}
