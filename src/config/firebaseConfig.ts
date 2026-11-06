import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  browserSessionPersistence,
  browserPopupRedirectResolver,
  type Auth,
} from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

import { getFirestore } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);

// localStorage first: Firebase's IndexedDB persistence refuses writes while the page is
// hidden ("Database is closing/hidden"). On iOS and macOS full-screen the Google popup
// opens as a separate tab/space, hiding this page exactly when the session is saved.
// Sessions already stored in IndexedDB are migrated to localStorage automatically.
const createAuth = (): Auth => {
  try {
    return initializeAuth(app, {
      persistence: [browserLocalPersistence, indexedDBLocalPersistence, browserSessionPersistence],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    return getAuth(app);
  }
};

export const auth = createAuth();
export const storage = getStorage(app);
export const db = getFirestore(app);

export default app;
