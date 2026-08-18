const admin = require('firebase-admin');
const t = admin.firestore.FieldValue.serverTimestamp();
console.log('typeof:', typeof t);
console.log('constructor name:', t.constructor.name);
console.log('is plain object:', t.constructor === Object);
