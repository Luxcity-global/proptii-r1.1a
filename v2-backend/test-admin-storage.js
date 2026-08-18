require('dotenv').config({ path: '.env' });
const admin = require('firebase-admin');
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.refreshToken(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID
});

async function run() {
  try {
    const bucket = admin.storage().bucket("proptii-16946.firebasestorage.app");
    const file = bucket.file("test-file-backend.txt");
    await file.save("Hello world from backend admin", { contentType: "text/plain" });
    const [url] = await file.getSignedUrl({ action: 'read', expires: '03-09-2491' });
    console.log("URL:", url);
    console.log("Success admin storage with refreshToken!");
  } catch (e) {
    console.error("Error admin storage:", e);
  }
}
run();
