import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

// Parse .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
});

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('📡 Connected to Firebase! Listening for new interviews...');

const q = query(collection(db, 'interviews'), orderBy('createdAt', 'desc'), limit(5));

onSnapshot(q, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added' || change.type === 'modified') {
      const data = change.doc.data();
      console.log('\n--- NEW INTERVIEW RESULT [' + change.type.toUpperCase() + '] ---');
      console.log('ID:', change.doc.id);
      console.log('Candidate:', data.candidateName);
      console.log('Role:', data.role, 'at', data.company);
      console.log('Overall Score:', data.result?.scores?.overall + '%');
      console.log('-------------------------------------------');
    }
  });
});
