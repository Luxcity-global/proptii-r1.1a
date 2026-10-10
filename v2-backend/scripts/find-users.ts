import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!serviceAccountStr) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountStr);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

async function run() {
  console.log('Querying users collection...');
  const usersRef = db.collection('users');
  
  const landlordsSnap = await usersRef.where('role', '==', 'landlord').limit(5).get();
  const tenantsSnap = await usersRef.where('role', '==', 'tenant').limit(5).get();
  
  console.log('Landlords found:');
  landlordsSnap.forEach(doc => {
    const data = doc.data();
    console.log(`- ID: ${doc.id}, Email: ${data.email}, Name: ${data.firstName} ${data.lastName}`);
  });
  
  console.log('\nTenants found:');
  tenantsSnap.forEach(doc => {
    const data = doc.data();
    console.log(`- ID: ${doc.id}, Email: ${data.email}, Name: ${data.firstName} ${data.lastName}`);
  });

  // If no 'role', just get latest users
  if (landlordsSnap.empty && tenantsSnap.empty) {
    console.log('\nNo users found with specific roles. Fetching recent users...');
    const allSnap = await usersRef.limit(10).get();
    allSnap.forEach(doc => {
      const data = doc.data();
      console.log(`- ID: ${doc.id}, Email: ${data.email}, Role: ${data.role}`);
    });
  }
}

run().catch(console.error).finally(() => process.exit(0));
