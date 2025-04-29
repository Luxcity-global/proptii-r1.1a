import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import { envConfig } from './env.config';

console.log('Initializing Firebase Admin...');
console.log('Project ID:', envConfig.firebase.projectId);

let credential;
try {
  console.log('Attempting to use service account credentials...');
  const serviceAccount = {
    projectId: envConfig.firebase.projectId,
    privateKey: envConfig.firebase.privateKey,
    clientEmail: envConfig.firebase.clientEmail,
  } as ServiceAccount;
  
  if (!serviceAccount.privateKey || !serviceAccount.clientEmail) {
    console.log('Service account credentials not found, falling back to ADC...');
    credential = admin.credential.applicationDefault();
  } else {
    console.log('Using service account credentials');
    credential = admin.credential.cert(serviceAccount);
  }
} catch (error) {
  console.log('Error with service account, falling back to ADC:', error.message);
  credential = admin.credential.applicationDefault();
}

console.log('Initializing Firebase app...');
admin.initializeApp({
  credential,
  projectId: envConfig.firebase.projectId,
  storageBucket: envConfig.firebase.storageBucket,
});
console.log('Firebase app initialized successfully');

export const db = admin.firestore();
export const storage = admin.storage();
export const auth = admin.auth();

// Test the Firestore connection immediately
db.collection('test').doc('init').set({ timestamp: new Date() })
  .then(() => console.log('Initial Firestore write test successful'))
  .catch(error => console.error('Initial Firestore write test failed:', error)); 