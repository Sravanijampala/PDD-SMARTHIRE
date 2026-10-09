'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Clock, CheckCircle2, RefreshCw, Bookmark } from 'lucide-react';

const dailyQuestions = [
  {
    id: 1, topic: 'System Design',
    q: 'How would you design a URL shortener like bit.ly?',
    hint: 'Think about: hash function, database schema, redirect flow, scaling',
    level: 'Medium',
  },
  {
    id: 2, topic: 'DSA',
    q: 'Explain the difference between BFS and DFS. When would you use each?',
    hint: 'BFS = level-order, shortest path. DFS = topological sort, cycle detection',
    level: 'Easy',
  },
  {
    id: 3, topic: 'Behavioral',
    q: 'Describe a time when you had to quickly learn a new technology to complete a project.',
    hint: 'Use STAR: focus on speed of learning and outcome delivered',
    level: 'Easy',
  },
];

const todayDate = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

export default function DailyPracticePage() {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [bookmarked, setBookmarked] = useState<Record<number, boolean>>({});
  const [showHint, setShowHint] = useState<Record<number, boolean>>({});

  const toggleBookmark = (id: number) => setBookmarked(b => ({ ...b, [id]: !b[id] }));
  const toggleHint = (id: number) => setShowHint(h => ({ ...h, [id]: !h[id] }));

  const submit = (id: number) => {
    if (answers[id]?.trim()) setSubmitted(s => ({ ...s, [id]: true }));
  };

  const allDone = dailyQuestions.every(q => submitted[q.id]);

  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-100">
      <div className="fixed top-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/6 rounded-full blur-[120px] pointer-events-none" />

      <header className="sticky top-0 z-30 bg-[#0B1220]/90 backdrop-blur-xl border-b border-slate-800/80 px-6 lg:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"><ArrowLeft size={20} /></Link>
          <div>
            <h1 className="text-xl font-extrabold text-white">Daily Practice</h1>
            <p className="text-xs text-slate-400">{todayDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-500/30">
            {Object.values(submitted).filter(Boolean).length}/{dailyQuestions.length} Done
          </span>
        </div>
      </header>

      <div className="w-full px-6 lg:px-16 py-8 max-w-3xl mx-auto space-y-6">
        {/* Streak Banner */}
        <div className="bg-gradient-to-r from-amber-950/60 to-orange-950/40 border border-amber-500/30 rounded-3xl p-5 flex items-center gap-4">
          <span className="text-4xl">🔥</span>
          <div>
            <p className="text-base font-extrabold text-amber-300">3-Day Streak!</p>
            <p className="text-xs text-slate-400">Keep going — consistent daily practice is the key to success.</p>
          </div>
        </div>

        {allDone && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-3xl p-6 text-center">
            <CheckCircle2 size={36} className="text-emerald-400 mx-auto mb-2" />
            <p className="text-lg font-extrabold text-white mb-1">All Done for Today! 🎉</p>
            <p className="text-sm text-slate-400">Come back tomorrow for new questions. Great work!</p>
          </div>
        )}

        {dailyQuestions.map((dq) => (
          <div key={dq.id} className={`bg-slate-900/70 border rounded-3xl p-6 space-y-4 transition-all ${submitted[dq.id] ? 'border-emerald-500/30' : 'border-slate-800'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-full">{dq.topic}</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${dq.level === 'Easy' ? 'text-emerald-400 bg-emerald-950/60' : 'text-amber-400 bg-amber-950/60'}`}>{dq.level}</span>
                  {submitted[dq.id] && <CheckCircle2 size={16} className="text-emerald-400" />}
                </div>
                <p className="text-base font-extrabold text-white leading-relaxed">{dq.q}</p>
              </div>
              <button onClick={() => toggleBookmark(dq.id)} className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${bookmarked[dq.id] ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500 hover:text-amber-400'}`}>
                <Bookmark size={18} fill={bookmarked[dq.id] ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Hint */}
            <button onClick={() => toggleHint(dq.id)} className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1.5 transition-colors">
              {showHint[dq.id] ? '▲' : '▼'} {showHint[dq.id] ? 'Hide Hint' : 'Show Hint'}
            </button>
            {showHint[dq.id] && (
              <div className="bg-purple-950/30 border border-purple-500/20 rounded-2xl p-4">
                <p className="text-xs text-purple-300 leading-relaxed">💡 {dq.hint}</p>
              </div>
            )}

            {/* Answer Box */}
            {!submitted[dq.id] ? (
              <div className="space-y-3">
                <textarea
                  value={answers[dq.id] || ''}
                  onChange={e => setAnswers(a => ({ ...a, [dq.id]: e.target.value }))}
                  placeholder="Write your answer here..."
                  rows={4}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none transition-colors"
                />
                <button onClick={() => submit(dq.id)} disabled={!answers[dq.id]?.trim()}
                  className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  Submit Answer
                </button>
              </div>
            ) : (
              <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-4">
                <p className="text-xs font-bold text-emerald-400 mb-1">✓ Submitted</p>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{answers[dq.id]}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
