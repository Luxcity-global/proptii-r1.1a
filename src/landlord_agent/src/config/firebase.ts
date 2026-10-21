// Re-export from the shared Firebase config to avoid duplicate app initialization.
// Two calls to initializeApp() with the same name cause auth state race conditions
// (directlySetCurrentUser / pollUserCancellation conflicts).
export { auth, storage, db } from '../../../config/firebaseConfig';
export { default } from '../../../config/firebaseConfig';
