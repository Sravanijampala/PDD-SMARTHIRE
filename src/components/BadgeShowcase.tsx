'use client';

import React from 'react';
import { Award, Lock, CheckCircle2 } from 'lucide-react';

export interface BadgeDisplayInfo {
  id: string;
  name: string;
  description: string;
  iconUrl: string; // Emoji or URL
  color: string;
  criteriaType: string;
  criteriaValue: number;
  earned: boolean;
  progress?: number; // 0-100 percent toward earning
}

interface BadgeShowcaseProps {
  badges: BadgeDisplayInfo[];
  title?: string;
}

export function BadgeShowcase({ badges, title = 'Badges' }: BadgeShowcaseProps) {
  const earned = badges.filter(b => b.earned);
  const unearned = badges.filter(b => !b.earned);

  return (
    <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award size={18} className="text-amber-400" />
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        <span className="text-xs text-slate-400">
          {earned.length}/{badges.length} earned
        </span>
      </div>

      {/* Next badge progress */}
      {unearned.length > 0 && (
        <div className="mb-4 p-3 bg-slate-800/50 rounded-xl border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Next badge</span>
            <span className="text-xs font-medium text-amber-400">{unearned[0].name}</span>
          </div>
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${unearned[0].progress || 0}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1">{unearned[0].description}</p>
        </div>
      )}

      {/* Badge grid */}
      <div className="grid grid-cols-5 gap-3">
        {badges.map(badge => (
          <div
            key={badge.id}
            className={`group relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all duration-200 ${
              badge.earned
                ? 'border-white/10 bg-slate-800/40 hover:border-amber-500/30 hover:bg-slate-800/60'
                : 'border-white/5 bg-slate-900/40 opacity-50 grayscale'
            }`}
            title={badge.description}
          >
            {/* Icon */}
            <div className="relative">
              <span className="text-2xl">{badge.iconUrl}</span>
              {badge.earned && (
                <CheckCircle2 size={12} className="absolute -bottom-1 -right-1 text-emerald-400 fill-emerald-400/20" />
              )}
              {!badge.earned && (
                <Lock size={10} className="absolute -bottom-1 -right-1 text-slate-500" />
              )}
            </div>
            
            {/* Name */}
            <span className={`text-[10px] font-medium text-center leading-tight ${
              badge.earned ? 'text-white' : 'text-slate-500'
            }`}>
              {badge.name}
            </span>

            {/* Tooltip on hover */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
              <div className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 whitespace-nowrap shadow-xl">
                {badge.description}
                {badge.progress !== undefined && !badge.earned && (
                  <div className="mt-1 text-[10px] text-amber-400">
                    {badge.progress}% complete
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
