import * as admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';
import { Logger } from '@nestjs/common';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

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

      // Option 0: Single JSON string environment variable (FIREBASE_SERVICE_ACCOUNT_JSON / FIREBASE_SERVICE_ACCOUNT_KEY)
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
              serviceAccountObj.project_id = serviceAccountObj.quota_project_id || projectId || 'proptii-16946';
            }
            credential = admin.credential.cert(serviceAccountObj);
            initializedWith = 'service account JSON variable';
          }
          logger.log(`ℹ️ Initializing Firebase Admin using ${initializedWith}`);
        } catch (jsonErr) {
          logger.error(`❌ Failed to parse service account JSON variable: ${jsonErr.message}`);
        }
      }

      // Option 1: Full service account credentials (projectId + clientEmail + privateKey)
      if (!credential && projectId && clientEmail && privateKey) {
        try {
          // Handle private key formatting - replace escaped newlines and ensure proper format
          let formattedPrivateKey = privateKey.trim();
          
          // CRITICAL: Detect if this is actually a Firebase API key, not a private key
          // API keys start with "AIza" and are ~39 characters long
          // Private keys start with "-----BEGIN PRIVATE KEY-----" and are much longer
          if (formattedPrivateKey.startsWith('AIza') && formattedPrivateKey.length < 100) {
            throw new Error(
              'FIREBASE_PRIVATE_KEY appears to be a Firebase API key, not a private key. ' +
              'You need the private key from your Firebase service account JSON file. ' +
              'Get it from: Firebase Console → Project Settings → Service Accounts → Generate new private key'
            );
          }
          
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
            throw new Error(
              'Private key is missing BEGIN or END markers. ' +
              'Expected format: -----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n' +
              'Get the correct private key from: Firebase Console → Project Settings → Service Accounts → Generate new private key'
            );
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
      
      // Option 2: Try application default credentials (for GCP or local gcloud auth application-default login)
      if (!credential) {
        const homedir = os.homedir();
        const gcloudAdcExists = 
          fs.existsSync(path.join(homedir, '.config', 'gcloud', 'application_default_credentials.json')) ||
          fs.existsSync(path.join(homedir, 'AppData', 'Roaming', 'gcloud', 'application_default_credentials.json'));

        const hasAdcOrGcp = 
          !!process.env.GOOGLE_APPLICATION_CREDENTIALS || 
          !!process.env.GAE_ENV || 
          !!process.env.K_SERVICE || 
          !!process.env.GCLOUD_PROJECT ||
          gcloudAdcExists;

        if (hasAdcOrGcp && projectId && projectId.trim() !== '') {
          try {
            credential = admin.credential.applicationDefault();
            initializedWith = gcloudAdcExists 
              ? 'gcloud user Application Default Credentials' 
              : 'application default credentials';
            logger.log(`ℹ️ Using ${initializedWith}`);
          } catch (error) {
            logger.warn(`⚠️ Application default credentials not available: ${error.message}`);
          }
        }
      }

      // If we have a credential, initialize the app
      if (credential) {
        const initOptions: any = { credential };
        
        if (projectId && projectId.trim() !== '') {
          initOptions.projectId = projectId.trim();
        } else {
          logger.error('❌ FIREBASE_PROJECT_ID is required when using application default credentials');
          logger.warn('   Firestore cannot be initialized without a project ID');
          return null;
        }

        // To generate custom tokens when using application default credentials or refresh tokens,
        // we must provide a service account ID explicitly.
        let serviceAccountId = clientEmail;
        if (!serviceAccountId && process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
          try {
            const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
            serviceAccountId = parsed.client_email;
          } catch (e) {}
        }
        if (serviceAccountId) {
          initOptions.serviceAccountId = serviceAccountId;
        }
        
        admin.initializeApp(initOptions);
        logger.log(`✅ Firebase Admin initialized with ${initializedWith}${projectId ? ` for project: ${projectId}` : ''}`);
      } else {
        // No valid credentials available
        const missingVars: string[] = [];
        if (!projectId || projectId.trim() === '') missingVars.push('FIREBASE_PROJECT_ID');
        if (!clientEmail || clientEmail.trim() === '') missingVars.push('FIREBASE_CLIENT_EMAIL');
        if (!privateKey || privateKey.trim() === '') missingVars.push('FIREBASE_PRIVATE_KEY');
        
        logger.warn(`⚠️ Firestore not configured - Missing: ${missingVars.join(', ')}`);
        logger.warn('   The application will work without Firestore persistence');
        logger.warn('   To enable Firestore, set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env');
        
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



