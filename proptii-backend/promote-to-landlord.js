require('dotenv').config();
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Handle escaped newlines in private key
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('✅ Firebase initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

async function promoteToLandlord(email) {
  if (!email) {
    console.error('Please provide an email address. Usage: node promote-to-landlord.js user@example.com');
    process.exit(1);
  }

  const emailLower = email.toLowerCase().trim();
  console.log(`Promoting ${emailLower} to landlord...`);

  try {
    // Check if user already exists
    const snapshot = await db.collection('landlordUsers')
      .where('email', '==', emailLower)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      console.log(`User ${emailLower} already exists in landlordUsers. Updating role...`);
      const doc = snapshot.docs[0];
      await doc.ref.update({
        role: 'landlord',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Role updated successfully');
    } else {
      console.log(`User ${emailLower} not found. Creating new landlord record...`);
      await db.collection('landlordUsers').add({
        email: emailLower,
        role: 'landlord',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Landlord record created successfully');
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Error promoting to landlord:', error);
    process.exit(1);
  }
}

const email = process.argv[2];
promoteToLandlord(email);
