export const envConfig = {
  // Firebase Configuration
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || 'proptii-2ae8d',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@proptii-2ae8d.iam.gserviceaccount.com',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'proptii-2ae8d.appspot.com',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'proptii-2ae8d.firebaseapp.com',
  },

  // MSAL Configuration
  msal: {
    clientId: process.env.MSAL_CLIENT_ID || 'your-msal-client-id',
    authority: process.env.MSAL_AUTHORITY || 'https://login.microsoftonline.com/your-tenant-id',
    redirectUri: process.env.MSAL_REDIRECT_URI || 'http://localhost:3000/auth/callback',
  },

  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development',
  },
}; 