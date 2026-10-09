import React from 'react';

interface SmartHireLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export function SmartHireLogo({ size = 'md', showText = true, className = '' }: SmartHireLogoProps) {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const fontSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      {/* 3 Sparkles Icon matching exact layout from photos */}
      <div className={`relative ${iconSizes[size]} flex items-center justify-center`}>
        {/* Main Center/Left Sparkle */}
        <svg
          className="w-full h-full text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]"
          viewBox="0 0 100 100"
          fill="currentColor"
        >
          {/* Main 4-point star */}
          <path d="M 40 10 Q 40 45 10 45 Q 40 45 40 80 Q 40 45 70 45 Q 40 45 40 10 Z" />
          {/* Top Right Small Sparkle */}
          <path d="M 75 12 Q 75 27 60 27 Q 75 27 75 42 Q 75 27 90 27 Q 75 27 75 12 Z" />
          {/* Bottom Right Medium Sparkle */}
          <path d="M 72 55 Q 72 68 59 68 Q 72 68 72 81 Q 72 68 85 68 Q 72 68 72 55 Z" />
        </svg>
      </div>

      {showText && (
        <span className={`font-bold tracking-tight text-cyan-400 ${fontSizes[size]} drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]`}>
          SmartHire
        </span>
      )}
    </div>
  );
}
