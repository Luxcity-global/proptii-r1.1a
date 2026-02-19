import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;

