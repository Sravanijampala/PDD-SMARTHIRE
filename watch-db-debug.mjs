import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, query, orderBy, limit, getDocs } from 'firebase/firestore';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) {
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    env[key] = val;
  }
});

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

console.log('Project ID:', firebaseConfig.projectId);
console.log('Testing Firestore read...');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

getDocs(collection(db, 'interviews')).then(snap => {
  console.log('Read OK - documents found:', snap.size);
  snap.forEach(d => console.log(' -', d.id, JSON.stringify(d.data()).slice(0, 120)));
}).catch(err => {
  console.error('Read FAILED:', err.message);
  console.error('Code:', err.code);
});
