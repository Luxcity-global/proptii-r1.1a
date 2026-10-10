require('dotenv').config({ path: __dirname + '/../.env' });
const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
const db = admin.firestore();

const UID = '3EKbhObAE5dw0RZ7lP3cK4rYeSp1';

(async () => {
  const col = db.collection('properties');
  const snap = await col.where('userId', '==', UID).get();
  
  const byAddress = {};
  snap.docs.forEach(d => {
    const data = d.data();
    if (!byAddress[data.address]) byAddress[data.address] = [];
    byAddress[data.address].push(d.id);
  });

  let deleted = 0;
  for (const address in byAddress) {
    const ids = byAddress[address];
    if (ids.length > 1) {
      console.log(`Address "${address}" has ${ids.length} copies. Keeping ${ids[0]}, deleting others...`);
      for (let i = 1; i < ids.length; i++) {
        await col.doc(ids[i]).delete();
        deleted++;
      }
    }
  }
  
  console.log(`Cleanup done. Deleted ${deleted} duplicate properties.`);
  process.exit(0);
})();
