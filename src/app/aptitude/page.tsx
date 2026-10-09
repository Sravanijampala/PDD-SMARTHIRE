'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calculator, Clock, Award, ChevronRight, Brain } from 'lucide-react';
import { useInterviewTimer } from '../../hooks/useInterviewTimer';

const aptitudeQuestions = [
  { q: 'If a train travels 360 km in 4 hours, what is its speed in m/s?', opts: ['25 m/s', '90 m/s', '100 m/s', '36 m/s'], ans: 0, topic: 'Speed & Distance' },
  { q: 'What is 15% of 240?', opts: ['30', '36', '40', '48'], ans: 1, topic: 'Percentages' },
  { q: 'A can do a job in 12 days, B in 18 days. How many days working together?', opts: ['6.6', '7.2', '8', '9'], ans: 1, topic: 'Work & Time' },
  { q: 'Find the next number: 2, 6, 12, 20, 30, ?', opts: ['40', '42', '44', '48'], ans: 1, topic: 'Number Series' },
  { q: 'If APPLE = 50, then MANGO = ?', opts: ['45', '50', '55', '60'], ans: 3, topic: 'Coding' },
  { q: 'A 20% discount on ₹500 gives a price of?', opts: ['₹380', '₹390', '₹400', '₹420'], ans: 2, topic: 'Percentages' },
  { q: 'What is the LCM of 12 and 15?', opts: ['30', '45', '60', '90'], ans: 2, topic: 'LCM & HCF' },
  { q: 'If 5 items cost ₹75, how much do 8 items cost?', opts: ['₹100', '₹110', '₹120', '₹130'], ans: 2, topic: 'Ratio' },
];

export default function AptitudePage() {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(aptitudeQuestions.length).fill(null));
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { formatted, timeLeft } = useInterviewTimer({
    durationSeconds: 480,
    sessionKey: 'aptitude_timer',
    onExpire: () => setSubmitted(true),
  });

  const score = answers.filter((a, i) => a === aptitudeQuestions[i].ans).length;

  const handleNext = () => {
    if (selected !== null) {
      const newAnswers = [...answers];
      newAnswers[current] = selected;
      setAnswers(newAnswers);
    }
    setSelected(null);
    if (current < aptitudeQuestions.length - 1) setCurrent(current + 1);
    else setSubmitted(true);
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-[#0B1220] text-slate-100 flex flex-col items-center justify-center gap-8 px-4">
        <div className="fixed top-0 left-1/4 w-[400px] h-[400px] bg-amber-500/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="text-center">
          <Calculator size={56} className="text-amber-400 mx-auto mb-4" />
          <h1 className="text-4xl font-extrabold text-white mb-2">Aptitude Test</h1>
          <p className="text-slate-400">8 questions · 8 minutes · Math & Logic</p>
        </div>
        <div className="grid grid-cols-3 gap-4 w-full max-w-md text-center">
          {[['8', 'Questions'], ['8 min', 'Time Limit'], ['Instant', 'Results']].map(([v, l]) => (
            <div key={l} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <div className="text-2xl font-extrabold text-amber-400">{v}</div>
              <div className="text-xs text-slate-400">{l}</div>
            </div>
          ))}
        </div>
        <button onClick={() => setStarted(true)} className="px-12 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-lg rounded-2xl shadow-2xl flex items-center gap-3">
          <Brain size={22} /> Start Aptitude Test
        </button>
        <Link href="/dashboard" className="text-slate-500 text-sm hover:text-white transition-colors flex items-center gap-2">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  if (submitted) {
    const pct = Math.round((score / aptitudeQuestions.length) * 100);
    return (
      <div className="min-h-screen bg-[#0B1220] text-slate-100 flex flex-col items-center justify-center gap-8 px-4">
        <Award size={60} className="text-amber-400 mx-auto" />
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white mb-2">Test Complete!</h2>
          <p className="text-slate-400">{score}/{aptitudeQuestions.length} correct</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 w-full max-w-sm text-center">
          <div className="text-6xl font-extrabold text-amber-400 mb-2">{pct}%</div>
          <div className={`font-bold text-sm ${pct >= 75 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
            {pct >= 75 ? '🏆 Excellent!' : pct >= 50 ? '👍 Good job!' : '📚 Keep practicing!'}
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => { setStarted(false); setSubmitted(false); setAnswers(Array(8).fill(null)); setCurrent(0); setSelected(null); }}
            className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl">Retry</button>
          <Link href="/dashboard" className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl">Dashboard</Link>
        </div>
      </div>
    );
  }

  const q = aptitudeQuestions[current];
  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-100 flex flex-col">
      <header className="bg-[#080D1A]/90 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"><ArrowLeft size={20} /></Link>
          <div>
            <span className="text-sm font-bold text-white">Q {current + 1}/{aptitudeQuestions.length}</span>
            <span className="text-xs text-slate-400 ml-2">· {q.topic}</span>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-extrabold text-sm ${timeLeft < 60 ? 'bg-red-950/60 text-red-400' : 'bg-slate-800 text-amber-400'}`}>
          <Clock size={16} /> {formatted}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-2xl mx-auto w-full gap-8">
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: `${((current + 1) / aptitudeQuestions.length) * 100}%` }} />
        </div>
        <div className="w-full bg-slate-900/70 border border-slate-800 rounded-3xl p-8 space-y-6">
          <p className="text-xl font-extrabold text-white leading-relaxed">{q.q}</p>
          <div className="space-y-3">
            {q.opts.map((opt, idx) => (
              <button key={idx} onClick={() => setSelected(idx)}
                className={`w-full text-left p-4 rounded-2xl border text-sm font-semibold transition-all ${selected === idx ? 'bg-amber-950/60 border-amber-500 text-amber-300' : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-600'}`}>
                <span className="font-extrabold text-slate-500 mr-3">{String.fromCharCode(65 + idx)}.</span>{opt}
              </button>
            ))}
          </div>
          <button onClick={handleNext} disabled={selected === null}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-2xl transition-all disabled:opacity-40 flex items-center justify-center gap-2">
            {current === aptitudeQuestions.length - 1 ? 'Submit Test' : 'Next'} <ChevronRight size={18} />
          </button>
        </div>
      </main>
    </div>
  );
}
