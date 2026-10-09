'use client';

import React from 'react';

interface StreakCalendarProps {
  /** Map of 'YYYY-MM-DD' -> solve count for that day */
  solveHistory: Record<string, number>;
  currentStreak: number;
  longestStreak: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Mon', '', 'Wed', '', 'Fri', '', ''];

function getIntensityClass(count: number): string {
  if (count === 0) return 'bg-slate-800/60';
  if (count === 1) return 'bg-emerald-900/70';
  if (count <= 3) return 'bg-emerald-700/80';
  if (count <= 5) return 'bg-emerald-500';
  return 'bg-emerald-400';
}

export function StreakCalendar({ solveHistory, currentStreak, longestStreak }: StreakCalendarProps) {
  // Generate last 16 weeks (112 days) of data
  const today = new Date();
  const weeks: { date: string; count: number; day: number }[][] = [];
  
  for (let w = 15; w >= 0; w--) {
    const week: { date: string; count: number; day: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (w * 7 + (6 - d)));
      const dateStr = date.toISOString().split('T')[0];
      const isFuture = date > today;
      week.push({
        date: dateStr,
        count: isFuture ? -1 : (solveHistory[dateStr] || 0),
        day: date.getDay(),
      });
    }
    weeks.push(week);
  }

  // Get month labels for the visible weeks
  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, i) => {
    const firstDayOfWeek = new Date(week[0].date);
    const month = firstDayOfWeek.getMonth();
    if (month !== lastMonth) {
      monthLabels.push({ label: MONTHS[month], col: i });
      lastMonth = month;
    }
  });

  return (
    <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Coding Activity</h3>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>🔥 <span className="text-amber-400 font-bold">{currentStreak}</span> day streak</span>
          <span>Best: <span className="text-emerald-400 font-bold">{longestStreak}</span></span>
        </div>
      </div>

      {/* Month labels */}
      <div className="flex gap-[3px] ml-8 mb-1">
        {weeks.map((_, i) => {
          const label = monthLabels.find(m => m.col === i);
          return (
            <div key={i} className="w-[13px] text-[10px] text-slate-500 text-center">
              {label?.label || ''}
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] mr-1">
          {DAYS.map((d, i) => (
            <div key={i} className="h-[13px] text-[10px] text-slate-500 flex items-center justify-end pr-1 w-6">
              {d}
            </div>
          ))}
        </div>

        {/* Heatmap cells */}
        <div className="flex gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((cell, di) => (
                <div
                  key={di}
                  className={`w-[13px] h-[13px] rounded-sm transition-colors ${
                    cell.count < 0 ? 'bg-transparent' : getIntensityClass(cell.count)
                  }`}
                  title={cell.count >= 0 ? `${cell.date}: ${cell.count} solve${cell.count !== 1 ? 's' : ''}` : ''}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-3 text-[10px] text-slate-500">
        <span>Less</span>
        <div className="w-[11px] h-[11px] rounded-sm bg-slate-800/60" />
        <div className="w-[11px] h-[11px] rounded-sm bg-emerald-900/70" />
        <div className="w-[11px] h-[11px] rounded-sm bg-emerald-700/80" />
        <div className="w-[11px] h-[11px] rounded-sm bg-emerald-500" />
        <div className="w-[11px] h-[11px] rounded-sm bg-emerald-400" />
        <span>More</span>
      </div>
    </div>
  );
}
