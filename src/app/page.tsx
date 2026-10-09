'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/authContext';
import { SplashView } from '../components/SplashView';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090F1E] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (showSplash) {
    return (
      <SplashView
        onDismiss={() => {
          setShowSplash(false);
          if (user) {
            router.push('/dashboard');
          } else {
            router.push('/login');
          }
        }}
      />
    );
  }

  return null;
}
