require('dotenv').config({ path: __dirname + '/../.env' });
const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });

const API = process.env.E2E_API || 'https://proptii-v2-backend-vault.onrender.com';
const API_KEY = 'AIzaSyC0UZxzkhsebn-gSuo7HDRGVid30URQVvA';
const UID = '3EKbhObAE5dw0RZ7lP3cK4rYeSp1';
const PROP_ID = 'G89SK2yhZU4o9GMX5z3o'; // "utako abuja"

async function idToken() {
  const custom = await admin.auth().createCustomToken(UID);
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: custom, returnSecureToken: true }),
  });
  const j = await r.json();
  return j.idToken;
}

(async () => {
  const token = await idToken();
  const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  
  let r = await fetch(`${API}/api/native-properties/${PROP_ID}`, { method: 'DELETE', headers: H });
  console.log(`DELETE response: ${r.status} ${await r.text()}`);
  
  const snap = await admin.firestore().collection('properties').doc(PROP_ID).get();
  console.log(`Still in DB? ${snap.exists}`);
  process.exit(0);
})();
