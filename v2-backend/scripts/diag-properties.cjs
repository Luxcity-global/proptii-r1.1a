// READ-ONLY diagnostic: lists properties visible to a user and their ownership fields.
require('dotenv').config({ path: __dirname + '/../.env' });
const admin = require('firebase-admin');
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const uid = process.argv[2] || '3EKbhObAE5dw0RZ7lP3cK4rYeSp1';
const email = (process.argv[3] || 'miracleohuka43@gmail.com').toLowerCase();

(async () => {
  const col = db.collection('properties');
  const qs = [
    ['userId', uid], ['landlordId', uid],
    ['ownerEmail', email], ['landlordEmail', email], ['email', email],
    ['userId', email], ['landlordId', email],
  ];
  const map = new Map();
  for (const [f, v] of qs) {
    const s = await col.where(f, '==', v).get();
    s.docs.forEach(d => { const e = map.get(d.id) || { matchedBy: [] }; e.matchedBy.push(f); e.data = d.data(); map.set(d.id, e); });
  }
  console.log(`Found ${map.size} properties for uid=${uid} email=${email}`);
  for (const [id, { matchedBy, data }] of map) {
    console.log(JSON.stringify({
      id, address: data.address, matchedBy,
      userId: data.userId, landlordId: data.landlordId, ownerId: data.ownerId,
      ownerEmail: data.ownerEmail, landlordEmail: data.landlordEmail, email: data.email,
      docs: (data.documents || []).length,
    }));
  }
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
