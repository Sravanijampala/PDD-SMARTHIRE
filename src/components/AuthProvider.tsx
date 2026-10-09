'use client';

import React, { useEffect, useState, useRef, ReactNode } from 'react';
import { AuthContext, AuthUser } from '../lib/authContext';
import { createUserProfile, getUserProfile, subscribeToUserProfile, saveLoginActivity } from '../lib/firestore';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // ── RESTORE FROM STORAGE ──────────────────────────────────────────────────
  useEffect(() => {
    const stored =
      localStorage.getItem('smarthire_user') ||
      sessionStorage.getItem('smarthire_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); }
      catch {
        localStorage.removeItem('smarthire_user');
        sessionStorage.removeItem('smarthire_user');
      }
    }
    setLoading(false);
  }, []);

  // ── REAL-TIME PROFILE SYNC ────────────────────────────────────────────────
  // Keeps the auth context up-to-date whenever any device saves a profile
  // change. Also re-syncs when the Android app returns to foreground or when
  // the browser tab regains focus (handles the case where the Firestore
  // WebSocket was killed by the OS while the app was in the background).
  const userIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const applyFirestoreProfile = (firestoreData: any) => {
      if (!firestoreData) return;
      setUser((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          name: firestoreData.fullName || prev.name,
          role: firestoreData.rolePreference || prev.role,
          photoUrl: firestoreData.profileImage || prev.photoUrl,
        };
        // Persist to storage so the next app launch has the latest data.
        const isLocal = !!localStorage.getItem('smarthire_user');
        if (isLocal) localStorage.setItem('smarthire_user', JSON.stringify(updated));
        else if (sessionStorage.getItem('smarthire_user')) sessionStorage.setItem('smarthire_user', JSON.stringify(updated));
        return updated;
      });
    };

    // Live Firestore listener — covers real-time cross-device sync while both
    // devices are online and the app/tab is in the foreground.
    const unsubscribe = subscribeToUserProfile(user.id, applyFirestoreProfile);

    // ── RE-SYNC ON RESUME / TAB FOCUS ─────────────────────────────────────
    // The Firestore WebSocket can be terminated by the OS when the app is
    // backgrounded. We do a one-shot fetch when the app/tab becomes active
    // again. Firestore's own reconnect logic re-establishes the live listener
    // automatically, but this fetch guarantees we catch changes immediately.
    const resyncFromFirestore = async () => {
      const uid = userIdRef.current;
      if (!uid) return;
      try {
        const data = await getUserProfile(uid);
        if (data) applyFirestoreProfile(data);
      } catch {
        // Network unavailable — live listener will catch up when back online.
      }
    };

    // Web: browser tab regains visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') resyncFromFirestore();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Native: Capacitor App moves from background → foreground (Android/iOS)
    let capacitorListener: any = null;
    const setupCapacitorResume = async () => {
      try {
        const { App } = await import('@capacitor/app');
        capacitorListener = await App.addListener('appStateChange', ({ isActive }: { isActive: boolean }) => {
          if (isActive) resyncFromFirestore();
        });
      } catch {
        // Not running inside Capacitor (e.g. web browser) — ignore.
      }
    };
    setupCapacitorResume();

    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (capacitorListener?.remove) capacitorListener.remove();
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveUser = (u: AuthUser, remember: boolean) => {
    const str = JSON.stringify(u);
    if (remember) localStorage.setItem('smarthire_user', str);
    else sessionStorage.setItem('smarthire_user', str);
    setUser(u);
  };

  const syncUserWithFirestore = async (fbUser: any, name: string, remember: boolean) => {
    await createUserProfile(fbUser.uid, {
      name: name || fbUser.displayName || fbUser.email?.split('@')[0],
      email: fbUser.email,
      photoUrl: fbUser.photoURL
    });

    const token = await fbUser.getIdToken();
    const firestoreData = await getUserProfile(fbUser.uid);

    // Record this login event for history tracking
    try { await saveLoginActivity(fbUser.uid); } catch { /* non-critical */ }

    saveUser({
      id: fbUser.uid,
      name: firestoreData?.fullName || name || fbUser.displayName || fbUser.email?.split('@')[0],
      email: fbUser.email || '',
      role: firestoreData?.rolePreference || 'Candidate',
      photoUrl: firestoreData?.profileImage || fbUser.photoURL || undefined,
      token: token,
    }, remember);
  };

  // ── EMAIL LOGIN ────────────────────────────────────────────────────────────
  const login = async (email: string, password: string, remember = false) => {
    try {
      const { auth } = await import('../lib/firebase');
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const result = await signInWithEmailAndPassword(auth, email, password);
      await syncUserWithFirestore(result.user, '', remember);
    } catch (fbErr: any) {
      const msg = fbErr.message || '';
      if (msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        throw new Error('Incorrect password. Please try again.');
      }
      if (msg.includes('user-not-found')) {
        throw new Error('No account found with this email.');
      }
      throw new Error(msg);
    }
  };

  // ── GOOGLE LOGIN ───────────────────────────────────────────────────────────
  const loginWithGoogle = async () => {
    const isNative = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform();

    if (isNative) {
      // Native Capacitor: use @capacitor-firebase/authentication
      try {
        const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
        const result = await FirebaseAuthentication.signInWithGoogle();

        const { auth: firebaseAuth } = await import('../lib/firebase');
        const { GoogleAuthProvider, signInWithCredential } = await import('firebase/auth');
        const credential = GoogleAuthProvider.credential(result.credential?.idToken);
        const fbResult = await signInWithCredential(firebaseAuth, credential);

        await syncUserWithFirestore(fbResult.user, '', true);
      } catch (error: any) {
        console.error("Native Google Login Error", error);
        // Fallback to web popup if native fails
        try {
          const { auth, googleProvider } = await import('../lib/firebase');
          const { signInWithPopup } = await import('firebase/auth');
          const result = await signInWithPopup(auth, googleProvider);
          await syncUserWithFirestore(result.user, '', true);
        } catch (fallbackError) {
          console.error("Fallback Google Login Error", fallbackError);
          throw new Error('Google sign-in failed. Please try email/password login.');
        }
      }
    } else {
      // Web: use signInWithPopup — routes through authDomain, no origin issues
      try {
        const { auth, googleProvider } = await import('../lib/firebase');
        const { signInWithPopup } = await import('firebase/auth');
        const result = await signInWithPopup(auth, googleProvider);
        await syncUserWithFirestore(result.user, '', true);
      } catch (error) {
        console.error("Google Login Error", error);
        throw error;
      }
    }
  };

  // ── EMAIL SIGNUP ───────────────────────────────────────────────────────────
  const signup = async (name: string, email: string, password: string) => {
    try {
      const { auth } = await import('../lib/firebase');
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      
      await syncUserWithFirestore(result.user, name, false);
    } catch (fbErr: any) {
      const msg = fbErr.message || '';
      if (msg.includes('email-already-in-use')) {
        throw new Error('An account with this email already exists. Please sign in.');
      }
      if (msg.includes('weak-password')) {
        throw new Error('Password must be at least 6 characters.');
      }
      throw new Error(msg);
    }
  };

  // ── LOGOUT ─────────────────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('smarthire_user');
    sessionStorage.removeItem('smarthire_user');
    setUser(null);
    import('../lib/firebase')
      .then(({ auth }) => import('firebase/auth').then(({ signOut }) => signOut(auth)))
      .catch(() => {});
  };

  // ── UPDATE USER ────────────────────────────────────────────────────────────
  const updateUser = (updates: Partial<AuthUser>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    const stored = localStorage.getItem('smarthire_user');
    if (stored) localStorage.setItem('smarthire_user', JSON.stringify(updated));
    else sessionStorage.setItem('smarthire_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, loginWithGoogle, signup, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
