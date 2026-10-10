// LIVE E2E: create a throwaway property via API, delete via API, verify Firestore.
// Only touches a property this script creates itself.
require('dotenv').config({ path: __dirname + '/../.env' });
const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
const db = admin.firestore();

const API = process.env.E2E_API || 'https://proptii-v2-backend-vault.onrender.com';
const API_KEY = 'AIzaSyC0UZxzkhsebn-gSuo7HDRGVid30URQVvA';
const UID = process.argv[2] || '3EKbhObAE5dw0RZ7lP3cK4rYeSp1';

async function idToken() {
  const custom = await admin.auth().createCustomToken(UID);
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: custom, returnSecureToken: true }),
  });
  const j = await r.json();
  if (!j.idToken) throw new Error('token exchange failed ' + JSON.stringify(j));
  return j.idToken;
}

(async () => {
  const token = await idToken();
  const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const log = (k, v) => console.log(k.padEnd(34), v);

  // 1. Create
  let r = await fetch(`${API}/api/native-properties`, { method: 'POST', headers: H,
    body: JSON.stringify({ address: 'E2E DELETE TEST', title: 'E2E DELETE TEST', rent: 1, bedrooms: 1, type: 'flat', documents: [] }) });
  const created = await r.json();
  log('POST create', `${r.status} id=${created.id}`);
  const id = created.id;

  // 2. Attach a vault doc to it (assigned) to test cascade
  r = await fetch(`${API}/api/documents`, { method: 'POST', headers: H,
    body: JSON.stringify({ name: 'E2E doc', type: 'other', url: 'https://example.com/e2e.pdf', issueDate: new Date().toISOString(), propertyId: null }) });
  const vdoc = await r.json();
  log('POST vault doc', `${r.status} id=${vdoc.id}`);
  r = await fetch(`${API}/api/documents/${vdoc.id}/assign`, { method: 'PATCH', headers: H, body: JSON.stringify({ propertyId: id }) });
  log('PATCH assign doc→property', r.status);

  // 3. Delete via API (exactly what the frontend calls)
  r = await fetch(`${API}/api/native-properties/${encodeURIComponent(id)}`, { method: 'DELETE', headers: H });
  log('DELETE property', `${r.status} ${await r.text()}`);

  // 4. Verify in Firestore
  const snap = await db.collection('properties').doc(id).get();
  log('Firestore property exists?', snap.exists);
  const d = await db.collection('landlord_documents').doc(vdoc.id).get();
  log('Vault doc propertyId after', d.exists ? d.data().propertyId : '(missing)');

  // 5. Verify list endpoint no longer returns it (what hard-refresh does)
  r = await fetch(`${API}/api/native-properties?userId=${UID}`);
  const list = await r.json();
  log('List still contains property?', list.some(p => p.id === id));

  // cleanup vault doc
  r = await fetch(`${API}/api/documents/${vdoc.id}`, { method: 'DELETE', headers: H });
  log('cleanup vault doc', r.status);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
