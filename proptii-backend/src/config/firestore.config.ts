import * as admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';
import { Logger } from '@nestjs/common';

let firestoreInstance: Firestore | null = null;
const logger = new Logger('FirestoreConfig');

export async function initializeFirestore(): Promise<Firestore | null> {
  if (firestoreInstance) {
    return firestoreInstance;
  }

  try {
    // Check if Firebase credentials are provided
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId) {
      logger.warn('⚠️ Firestore not configured - FIREBASE_PROJECT_ID not set');
      logger.warn('   The application will work without Firestore persistence');
      return null;
    }

    // Initialize Firebase Admin with credentials
    if (!admin.apps.length) {
      const credential = clientEmail && privateKey
        ? admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
          })
        : admin.credential.applicationDefault(); // Use default credentials if available

      admin.initializeApp({
        credential,
        projectId,
      });

      logger.log(`✅ Firebase Admin initialized for project: ${projectId}`);
    }

    // Get Firestore instance
    firestoreInstance = admin.firestore();

    // Configure Firestore settings
    firestoreInstance.settings({
      ignoreUndefinedProperties: true,
    });

    logger.log('✅ Firestore initialized successfully');
    return firestoreInstance;
  } catch (error) {
    logger.error('❌ Failed to initialize Firestore:', error.message);
    logger.warn('   The application will work without Firestore persistence');
    return null;
  }
}

export function getFirestore(): Firestore | null {
  return firestoreInstance;
}



