import React, { useEffect, useState } from 'react';
import { SmartHireLogo } from './SmartHireLogo';

interface SplashViewProps {
  onDismiss: () => void;
}

export function SplashView({ onDismiss }: SplashViewProps) {
  const [fadingOut, setFadingOut] = useState(false);

  const handleStart = () => {
    setFadingOut(true);
    setTimeout(() => {
      onDismiss();
    }, 600);
  };

  useEffect(() => {
    // Auto proceed after 2.5 seconds if user doesn't click
    const timer = setTimeout(() => {
      setFadingOut(true);
      setTimeout(onDismiss, 600);
    }, 2800);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      onClick={handleStart}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#090F1E] cursor-pointer transition-opacity duration-600 ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="animate-pulse flex flex-col items-center gap-6">
        <SmartHireLogo size="xl" showText={true} />
        
        <p className="text-xs uppercase tracking-[3px] text-cyan-400/60 font-semibold mt-4">
          AI Interview Performance Analyzer
        </p>

        <div className="mt-8 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs text-slate-400 font-medium">Click anywhere to launch</span>
        </div>
      </div>
    </div>
  );
}
