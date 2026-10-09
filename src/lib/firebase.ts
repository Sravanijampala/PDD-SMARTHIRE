import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'placeholder-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'placeholder.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'placeholder-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'placeholder.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:000000000000:web:placeholder',
};

// Initialize the Firebase app exactly once.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth — safe to call repeatedly (returns the same instance).
const auth = getAuth(app);

// Firestore — initializeFirestore can only be called once per app.
// We use memoryLocalCache() to avoid the IndexedDB "Database is closing/hidden"
// error that fires in Next.js HMR and Capacitor WebView restarts.
// experimentalAutoDetectLongPolling lets Firestore switch between WebSocket
// and HTTP long-polling automatically, which is critical for the Android
// WebView where native WebSocket support can be unreliable.
let db: ReturnType<typeof getFirestore>;
try {
  db = initializeFirestore(app, {
    localCache: memoryLocalCache(),
    experimentalAutoDetectLongPolling: true,
    ignoreUndefinedProperties: true,
  });
} catch {
  // Already initialized on a hot-reload — fall back to the existing instance.
  db = getFirestore(app);
}

const storage = getStorage(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { app, auth, db, storage, googleProvider };
