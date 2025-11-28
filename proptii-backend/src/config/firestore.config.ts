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

    // Try to initialize with available credentials
    if (!admin.apps.length) {
      let credential = null;
      let initializedWith = '';

      // Option 1: Full service account credentials (projectId + clientEmail + privateKey)
      if (projectId && clientEmail && privateKey) {
        try {
          // Handle private key formatting - replace escaped newlines and ensure proper format
          let formattedPrivateKey = privateKey.trim();
          
          // Remove surrounding quotes if present (both single and double quotes)
          while (
            (formattedPrivateKey.startsWith('"') && formattedPrivateKey.endsWith('"')) ||
            (formattedPrivateKey.startsWith("'") && formattedPrivateKey.endsWith("'"))
          ) {
            formattedPrivateKey = formattedPrivateKey.slice(1, -1).trim();
          }
          
          // Replace escaped newlines with actual newlines (handle both \\n and \n)
          formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');
          
          // If the key doesn't have newlines but should, try to add them
          // Private keys typically have newlines every 64 characters
          if (!formattedPrivateKey.includes('\n') && formattedPrivateKey.length > 100) {
            // Try to detect if it's a base64-like string without newlines
            // This shouldn't happen with proper keys, but handle it gracefully
            logger.warn('⚠️ Private key appears to be missing newlines - attempting to format');
          }
          
          // Ensure the key has proper BEGIN/END markers
          if (!formattedPrivateKey.includes('BEGIN')) {
            // If missing BEGIN marker, try to add it
            if (!formattedPrivateKey.startsWith('-----BEGIN')) {
              formattedPrivateKey = '-----BEGIN PRIVATE KEY-----\n' + formattedPrivateKey;
            }
          }
          
          if (!formattedPrivateKey.includes('END')) {
            // If missing END marker, try to add it
            if (!formattedPrivateKey.endsWith('-----END PRIVATE KEY-----')) {
              formattedPrivateKey = formattedPrivateKey + '\n-----END PRIVATE KEY-----';
            }
          }
          
          // Validate the key format before using it
          if (!formattedPrivateKey.includes('BEGIN PRIVATE KEY') || !formattedPrivateKey.includes('END PRIVATE KEY')) {
            throw new Error('Private key is missing BEGIN or END markers. Expected format: -----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----');
          }
          
          logger.log(`ℹ️ Attempting to initialize Firebase with project: ${projectId}, client: ${clientEmail.substring(0, 30)}...`);
          
          credential = admin.credential.cert({
            projectId: projectId.trim(),
            clientEmail: clientEmail.trim(),
            privateKey: formattedPrivateKey,
          });
          initializedWith = 'service account credentials';
        } catch (error) {
          logger.error(`❌ Failed to create credential from service account: ${error.message}`);
          logger.error(`   Project ID: ${projectId ? 'set' : 'missing'}`);
          logger.error(`   Client Email: ${clientEmail ? clientEmail.substring(0, 30) + '...' : 'missing'}`);
          logger.error(`   Private Key: ${privateKey ? `set (${privateKey.length} chars, starts with: ${privateKey.substring(0, 50)}...)` : 'missing'}`);
          logger.warn('   Please check that FIREBASE_PRIVATE_KEY is correctly formatted with proper newlines (\\n)');
        }
      }
      
      // Note: We cannot derive client email reliably as it contains a random string
      // Format: firebase-adminsdk-XXXXX@project-id.iam.gserviceaccount.com
      // The user must provide FIREBASE_CLIENT_EMAIL from their service account JSON file
      
      // Option 3: Try application default credentials (for GCP environments)
      if (!credential) {
        try {
          credential = admin.credential.applicationDefault();
          initializedWith = 'application default credentials';
          logger.log('ℹ️ Using application default credentials');
        } catch (error) {
          logger.warn(`⚠️ Application default credentials not available: ${error.message}`);
        }
      }

      // If we have a credential, initialize the app
      if (credential) {
        const initOptions: any = { credential };
        if (projectId) {
          initOptions.projectId = projectId.trim();
        }
        
        admin.initializeApp(initOptions);
        logger.log(`✅ Firebase Admin initialized with ${initializedWith}${projectId ? ` for project: ${projectId}` : ''}`);
      } else {
        // No credentials available
        const missingVars: string[] = [];
        if (!projectId || projectId.trim() === '') {
          missingVars.push('FIREBASE_PROJECT_ID');
        }
        if (!privateKey || privateKey.trim() === '') {
          missingVars.push('FIREBASE_PRIVATE_KEY');
        }
        // clientEmail is optional if we can derive it
        
        logger.warn(`⚠️ Firestore not configured - Missing: ${missingVars.join(', ')}`);
        logger.warn('   The application will work without Firestore persistence');
        logger.warn('   To enable Firestore, set FIREBASE_PROJECT_ID and FIREBASE_PRIVATE_KEY (FIREBASE_CLIENT_EMAIL is optional)');
        
        // Log which variables are present
        const presentVars: string[] = [];
        if (projectId && projectId.trim() !== '') presentVars.push(`FIREBASE_PROJECT_ID`);
        if (clientEmail && clientEmail.trim() !== '') presentVars.push(`FIREBASE_CLIENT_EMAIL`);
        if (privateKey && privateKey.trim() !== '') presentVars.push(`FIREBASE_PRIVATE_KEY`);
        if (presentVars.length > 0) {
          logger.warn(`   Present variables: ${presentVars.join(', ')}`);
        }
        
        return null;
      }
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



