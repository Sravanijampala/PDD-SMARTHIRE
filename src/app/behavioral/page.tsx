'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Brain, Mic, ChevronRight, CheckCircle2, Volume2 } from 'lucide-react';
import { useInterviewTimer } from '../../hooks/useInterviewTimer';

const questions = [
  { q: 'Tell me about a time you led a team through a difficult project.', category: 'Leadership', tips: 'Use STAR: Situation, Task, Action, Result' },
  { q: 'Describe a situation where you had a conflict with a colleague. How did you resolve it?', category: 'Teamwork', tips: 'Focus on resolution and what you learned' },
  { q: 'Give an example of when you had to make a difficult decision with limited information.', category: 'Decision Making', tips: 'Emphasize your reasoning process' },
  { q: 'Tell me about a time you failed. What did you learn from it?', category: 'Growth Mindset', tips: 'Be honest, focus on lessons learned' },
  { q: 'Describe a time when you had to meet a tight deadline.', category: 'Time Management', tips: 'Show prioritization and execution skills' },
];

export default function BehavioralPage() {
  const [current, setCurrent] = useState(0);
  const [recording, setRecording] = useState(false);
  const [answered, setAnswered] = useState<boolean[]>(Array(questions.length).fill(false));
  const [done, setDone] = useState(false);
  const { formatted } = useInterviewTimer({ durationSeconds: 1200, sessionKey: 'behavioral_timer' });

  const speakQuestion = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9; u.pitch = 1.1;
      window.speechSynthesis.speak(u);
    }
  };

  const startRecording = () => {
    setRecording(true);
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SR = (window as any).webkitSpeechRecognition;
      const rec = new SR();
      rec.continuous = false;
      rec.onresult = () => {
        setRecording(false);
        const newAnswered = [...answered];
        newAnswered[current] = true;
        setAnswered(newAnswered);
      };
      rec.onerror = () => setRecording(false);
      rec.onend = () => setRecording(false);
      rec.start();
    } else {
      setTimeout(() => {
        setRecording(false);
        const newAnswered = [...answered];
        newAnswered[current] = true;
        setAnswered(newAnswered);
      }, 5000);
    }
  };

  const nextQ = () => {
    if (current < questions.length - 1) setCurrent(current + 1);
    else setDone(true);
  };

  if (done) {
    const score = Math.round((answered.filter(Boolean).length / questions.length) * 100);
    return (
      <div className="min-h-screen bg-[#0B1220] text-slate-100 flex flex-col items-center justify-center gap-8 px-4">
        <CheckCircle2 size={60} className="text-emerald-400" />
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white mb-2">Behavioral Assessment Done!</h2>
          <p className="text-slate-400">{answered.filter(Boolean).length}/{questions.length} questions answered</p>
        </div>
        <div className="text-6xl font-extrabold text-cyan-400">{score}%</div>
        <Link href="/dashboard" className="px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-2xl transition-all">Back to Dashboard</Link>
      </div>
    );
  }

  const q = questions[current];
  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-100 flex flex-col">
      <header className="bg-[#080D1A]/90 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"><ArrowLeft size={20} /></Link>
          <div>
            <h1 className="text-lg font-extrabold text-white">Behavioral Assessment</h1>
            <p className="text-xs text-slate-400">Q {current + 1}/{questions.length} · {q.category}</p>
          </div>
        </div>
        <div className="bg-slate-800 text-cyan-400 font-extrabold text-sm px-4 py-2 rounded-2xl">{formatted}</div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-2xl mx-auto w-full gap-6">
        {/* Progress */}
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>

        <div className="w-full bg-slate-900/70 border border-slate-800 rounded-3xl p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-600/20 rounded-2xl flex-shrink-0"><Brain size={28} className="text-purple-400" /></div>
            <div>
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">{q.category}</span>
              <p className="text-xl font-extrabold text-white mt-2 leading-relaxed">{q.q}</p>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <p className="text-xs font-bold text-amber-400 mb-1">💡 Tip</p>
            <p className="text-sm text-slate-300">{q.tips}</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => speakQuestion(q.q)} className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm rounded-2xl transition-all">
              <Volume2 size={18} /> Hear Question
            </button>
            <button onClick={startRecording} disabled={recording}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 font-bold text-sm rounded-2xl transition-all ${recording ? 'bg-red-600 text-white animate-pulse' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}>
              <Mic size={18} /> {recording ? 'Listening...' : answered[current] ? 'Re-Answer' : 'Answer Now'}
            </button>
          </div>

          <button onClick={nextQ} disabled={!answered[current]}
            className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-base rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
            {current === questions.length - 1 ? 'Finish Assessment' : 'Next Question'} <ChevronRight size={20} />
          </button>
        </div>
      </main>
    </div>
  );
}
