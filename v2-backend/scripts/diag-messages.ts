import * as admin from 'firebase-admin';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON!);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

async function diag() {
  console.log('Querying conversations...');
  const convs = await db.collection('conversations').orderBy('updatedAt', 'desc').limit(5).get();
  
  for (const doc of convs.docs) {
    const data = doc.data();
    console.log(`\nConversation: ${doc.id}`);
    console.log(`  Tenant: ${data.tenantName} (${data.tenantId})`);
    console.log(`  Landlord: ${data.landlordId}`);
    console.log(`  Last Preview: ${data.lastMessagePreview}`);
    
    // Query messages
    const msgs = await db.collection('messages').where('conversationId', '==', doc.id).get();
    console.log(`  Message Count: ${msgs.docs.length}`);
    for (const mDoc of msgs.docs) {
      console.log(`    -> [${mDoc.id}] ${mDoc.data().senderRole}: ${mDoc.data().body} (sentAt: ${mDoc.data().sentAt})`);
    }
  }
}

diag().catch(console.error).finally(() => process.exit(0));
