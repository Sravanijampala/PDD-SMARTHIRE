'use client';

import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  velocityX: number;
  velocityY: number;
  opacity: number;
}

const COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE'];

export function ConfettiOverlay({ trigger, duration = 3000 }: { trigger: boolean; duration?: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    setActive(true);

    const newParticles: Particle[] = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 30,
      y: 30,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
      velocityX: (Math.random() - 0.5) * 8,
      velocityY: -(2 + Math.random() * 6),
      opacity: 1,
    }));
    setParticles(newParticles);

    const timer = setTimeout(() => {
      setActive(false);
      setParticles([]);
    }, duration);

    return () => clearTimeout(timer);
  }, [trigger, duration]);

  if (!active || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute confetti-particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            backgroundColor: p.color,
            borderRadius: '2px',
            transform: `rotate(${p.rotation}deg)`,
            '--vx': `${p.velocityX * 40}px`,
            '--vy': `${p.velocityY * 80}px`,
            animationDuration: `${duration}ms`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
