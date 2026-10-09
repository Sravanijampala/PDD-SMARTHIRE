'use client';

import React from 'react';
import { Trophy, Medal } from 'lucide-react';

export interface PodiumEntry {
  userId: string;
  displayName: string;
  photoUrl?: string;
  totalPoints: number;
  currentStreak: number;
  rank: number;
}

interface PodiumProps {
  entries: PodiumEntry[];
  currentUserId?: string;
}

const MEDAL_STYLES = [
  { bg: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/40', ring: 'ring-amber-400/30', text: 'text-amber-400', icon: '🥇', height: 'h-28' },
  { bg: 'from-slate-300/15 to-slate-400/10', border: 'border-slate-400/30', ring: 'ring-slate-400/20', text: 'text-slate-300', icon: '🥈', height: 'h-24' },
  { bg: 'from-orange-600/15 to-orange-700/10', border: 'border-orange-500/30', ring: 'ring-orange-400/20', text: 'text-orange-400', icon: '🥉', height: 'h-20' },
];

// Display order: 2nd, 1st, 3rd (traditional podium layout)
const PODIUM_ORDER = [1, 0, 2];

export function Podium({ entries, currentUserId }: PodiumProps) {
  const top3 = entries.slice(0, 3);
  if (top3.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500 text-sm">
        <Trophy size={20} className="mr-2 opacity-50" />
        No leaderboard data yet
      </div>
    );
  }

  // Pad to 3 if fewer entries
  while (top3.length < 3) {
    top3.push({ userId: `empty-${top3.length}`, displayName: '—', totalPoints: 0, currentStreak: 0, rank: top3.length + 1 });
  }

  return (
    <div className="flex items-end justify-center gap-3 py-6">
      {PODIUM_ORDER.map(idx => {
        const entry = top3[idx];
        const style = MEDAL_STYLES[idx];
        const isCurrentUser = entry.userId === currentUserId;
        const isEmpty = entry.displayName === '—';

        return (
          <div
            key={entry.userId}
            className={`flex flex-col items-center ${idx === 0 ? 'order-2' : idx === 1 ? 'order-1' : 'order-3'}`}
          >
            {/* Avatar */}
            <div className={`relative mb-2 ${idx === 0 ? 'scale-110' : ''}`}>
              <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${style.bg} border-2 ${style.border} flex items-center justify-center ring-2 ${style.ring} ${isCurrentUser ? 'ring-cyan-400/50' : ''}`}>
                {entry.photoUrl ? (
                  <img src={entry.photoUrl} alt={entry.displayName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-white/60">
                    {isEmpty ? '?' : entry.displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="absolute -top-1 -right-1 text-lg">{style.icon}</span>
            </div>

            {/* Name */}
            <span className={`text-xs font-semibold truncate max-w-[80px] text-center ${
              isCurrentUser ? 'text-cyan-400' : 'text-white'
            }`}>
              {isCurrentUser ? 'You' : entry.displayName}
            </span>

            {/* Points */}
            <span className={`text-[10px] font-bold ${style.text}`}>
              {entry.totalPoints.toLocaleString()} pts
            </span>

            {/* Pedestal */}
            <div className={`${style.height} w-20 mt-2 rounded-t-xl bg-gradient-to-t ${style.bg} border ${style.border} border-b-0 flex items-start justify-center pt-2`}>
              <span className={`text-xl font-black ${style.text} opacity-30`}>#{idx + 1}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
