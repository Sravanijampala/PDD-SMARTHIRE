import { db, storage } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ── USERS ──────────────────────────────────────────────────────────────────
export const createUserProfile = async (uid: string, data: any) => {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  
  if (!snap.exists()) {
    const defaultData = {
      uid,
      fullName: data.name || '',
      email: data.email || '',
      phone: '',
      profileImage: data.photoUrl || '',
      resumeURL: '',
      college: '',
      department: '',
      year: '',
      skills: [],
      rolePreference: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(userRef, defaultData);
  }
};

export const updateUserProfile = async (uid: string, data: any) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
};

export const getUserProfile = async (uid: string) => {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
};

export const subscribeToUserProfile = (uid: string, callback: (data: any) => void) => {
  const userRef = doc(db, 'users', uid);
  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      callback(null);
    }
  });
};

// ── STORAGE ────────────────────────────────────────────────────────────────
export const uploadFileToStorage = async (userId: string, path: string, file: File) => {
  const storageRef = ref(storage, `users/${userId}/${path}/${file.name}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

// ── REAL-TIME HOOKS (Dashboard Example) ────────────────────────────────────
export const subscribeToDashboard = (userId: string, callback: (data: any) => void) => {
  const docRef = doc(db, 'dashboard', userId);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      callback(null);
    }
  });
};

// ── INTERVIEWS ─────────────────────────────────────────────────────────────
export const saveInterview = async (interviewId: string, data: any) => {
  const ref = doc(db, 'interviews', interviewId);
  await setDoc(ref, {
    ...data,
    updatedAt: serverTimestamp()
  }, { merge: true }); // Merge ensures we don't overwrite if saving partially

  // Update AI preparation level in dashboard
  if (data.userId && data.result?.scores?.overall) {
    const dashboardRef = doc(db, 'dashboard', data.userId);
    await setDoc(dashboardRef, {
      aiScore: data.result.scores.overall,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }
};

// ── LOGIN HISTORY ─────────────────────────────────────────────────────────
export const saveLoginActivity = async (userId: string) => {
  const loginRef = doc(collection(db, 'users', userId, 'loginHistory'));
  const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown';
  const platform = typeof window !== 'undefined' ? window.navigator.platform : 'Unknown';

  // Simple browser detection
  let browser = 'Unknown Browser';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';

  let device = 'Desktop';
  if (/Android|iPhone|iPad|iPod/i.test(userAgent)) device = 'Mobile';
  else if (/Tablet|iPad/i.test(userAgent)) device = 'Tablet';

  await setDoc(loginRef, {
    loginAt: serverTimestamp(),
    browser,
    device,
    platform,
    userAgent,
  });
};

export const getLoginHistory = async (userId: string) => {
  // No orderBy to avoid composite index requirement - sort client-side
  const snap = await getDocs(collection(db, 'users', userId, 'loginHistory'));
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return results
    .sort((a: any, b: any) => {
      const aTime = a.loginAt?.toMillis?.() ?? 0;
      const bTime = b.loginAt?.toMillis?.() ?? 0;
      return bTime - aTime;
    })
    .slice(0, 20);
};

export const getInterviewsByUser = async (userId: string) => {
  // Note: No orderBy here to avoid requiring a composite Firestore index.
  // We sort client-side instead.
  const q = query(collection(db, 'interviews'), where('userId', '==', userId));
  const snap = await getDocs(q);
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  // Sort by createdAt descending on the client
  return results.sort((a: any, b: any) => {
    const aTime = a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
};
