export const envConfig = {
  // Firebase Configuration
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AlzaSyDGuJ_fBrYD0u1nl5rZ4PzbYcQsnkYu1sM',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'proptii-2ae8d.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'proptii-2ae8d',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'proptii-2ae8d.appspot.com',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '605901845421',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:605901845421:web:your-app-id',
  },

  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  },

  // App Configuration
  app: {
    environment: import.meta.env.MODE || 'development',
  },
}; 