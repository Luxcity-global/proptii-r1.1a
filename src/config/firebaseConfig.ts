import { initializeApp } from 'firebase/app';
import { initializeFirestore, getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC0UZxzkhsebn-gSuo7HDRGVid30URQVvA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "proptii-16946.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "proptii-16946",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "proptii-16946.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "423487822587",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:423487822587:web:9fd069dd01ec5e8267ae5e",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-88HC0TG6JJ"
};

// Debug: Check if environment variables are loaded (remove in production)
if (import.meta.env.DEV) {
  console.log('Firebase Config:', {
    apiKey: firebaseConfig.apiKey.substring(0, 10) + '...',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId
  });
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with long-polling fallback to avoid intermittent Listen disconnects on some networks/browsers
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  useFetchStreams: false
});

// Enable offline persistence and better error handling
if (typeof window !== 'undefined') {
  // Handle network status changes
  const handleOnline = () => {
    enableNetwork(db).catch(console.error);
  };
  
  const handleOffline = () => {
    disableNetwork(db).catch(console.error);
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
}

// Initialize Auth (for future use if needed)
export const auth = getAuth(app);

// Initialize Firebase Storage
import { getStorage } from 'firebase/storage';
export const storage = getStorage(app);

export default app;

