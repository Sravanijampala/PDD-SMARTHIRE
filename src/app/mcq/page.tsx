'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, CheckCircle2, XCircle, Clock, Award } from 'lucide-react';
import { useInterviewTimer } from '../../hooks/useInterviewTimer';

const questions = [
  { id: 1, q: 'What is the time complexity of Binary Search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correct: 1, topic: 'Algorithms' },
  { id: 2, q: 'Which data structure uses LIFO?', options: ['Queue', 'Heap', 'Stack', 'Tree'], correct: 2, topic: 'Data Structures' },
  { id: 3, q: 'What does HTTP stand for?', options: ['HyperText Transfer Protocol', 'High Transfer Text Protocol', 'HyperText Transport Process', 'None'], correct: 0, topic: 'Networking' },
  { id: 4, q: 'Which sorting algorithm has O(n log n) average case?', options: ['Bubble Sort', 'Merge Sort', 'Insertion Sort', 'Selection Sort'], correct: 1, topic: 'Algorithms' },
  { id: 5, q: 'What is a primary key in a database?', options: ['A key that can be null', 'A unique identifier for a record', 'A foreign key', 'An index key'], correct: 1, topic: 'Databases' },
  { id: 6, q: 'What does OOP stand for?', options: ['Object Oriented Programming', 'Operational Object Protocol', 'Open Object Processing', 'Ordered Output Process'], correct: 0, topic: 'Programming' },
  { id: 7, q: 'Which of these is NOT a JavaScript framework?', options: ['React', 'Django', 'Vue', 'Angular'], correct: 1, topic: 'Web Dev' },
  { id: 8, q: 'What is a deadlock?', options: ['A memory leak', 'A circular wait between processes', 'An infinite loop', 'A null pointer'], correct: 1, topic: 'OS' },
  { id: 9, q: 'What is the default HTTP port?', options: ['443', '21', '80', '8080'], correct: 2, topic: 'Networking' },
  { id: 10, q: 'Which keyword is used for inheritance in Java?', options: ['implements', 'inherits', 'extends', 'super'], correct: 2, topic: 'Java' },
];

export default function MCQPage() {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  const { formatted, timeLeft } = useInterviewTimer({
    durationSeconds: 600,
    sessionKey: 'mcq_timer',
    onExpire: () => setSubmitted(true),
  });

  const score = answers.filter((a, i) => a === questions[i].correct).length;

  const handleAnswer = (idx: number) => {
    if (submitted) return;
    setSelected(idx);
  };

  const handleNext = () => {
    if (selected !== null) {
      const newAnswers = [...answers];
      newAnswers[current] = selected;
      setAnswers(newAnswers);
    }
    setSelected(null);
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      setSubmitted(true);
    }
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-[#0B1220] text-slate-100 flex flex-col items-center justify-center gap-8 px-4">
        <div className="fixed top-0 left-1/4 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-white mb-2">MCQ Assessment</h1>
          <p className="text-slate-400">10 questions · 10 minutes · Multiple choice</p>
        </div>
        <div className="grid grid-cols-3 gap-4 w-full max-w-md text-center">
          {[['10', 'Questions'], ['10 min', 'Timer'], ['Instant', 'Results']].map(([v, l]) => (
            <div key={l} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <div className="text-2xl font-extrabold text-cyan-400">{v}</div>
              <div className="text-xs text-slate-400">{l}</div>
            </div>
          ))}
        </div>
        <button onClick={() => setStarted(true)} className="px-12 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-lg rounded-2xl shadow-2xl flex items-center gap-3">
          <Play size={22} fill="white" /> Start Assessment
        </button>
        <Link href="/dashboard" className="text-slate-500 text-sm hover:text-white transition-colors flex items-center gap-2">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  if (submitted) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen bg-[#0B1220] text-slate-100 flex flex-col items-center justify-center gap-8 px-4">
        <div className="text-center">
          <Award size={60} className="text-amber-400 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-white mb-2">Assessment Complete!</h2>
          <p className="text-slate-400">Here are your results</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 w-full max-w-md text-center space-y-4">
          <div className="text-6xl font-extrabold text-cyan-400">{pct}%</div>
          <div className="text-slate-300 text-lg">{score} / {questions.length} correct</div>
          <div className={`text-sm font-bold ${pct >= 70 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
            {pct >= 70 ? '🎉 Excellent!' : pct >= 50 ? '👍 Good job!' : '📚 Needs improvement'}
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => { setStarted(false); setSubmitted(false); setAnswers(Array(10).fill(null)); setCurrent(0); }}
            className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl">Retry</button>
          <Link href="/dashboard" className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-2xl">Dashboard</Link>
        </div>
      </div>
    );
  }

  const q = questions[current];
  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-100 flex flex-col">
      <header className="bg-[#080D1A]/90 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all"><ArrowLeft size={20} /></Link>
          <span className="font-bold text-white">Q {current + 1} / {questions.length}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full">{q.topic}</span>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-extrabold text-sm ${timeLeft < 60 ? 'bg-red-950/60 text-red-400' : 'bg-slate-800 text-cyan-400'}`}>
            <Clock size={16} /> {formatted}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-2xl mx-auto w-full gap-8">
        {/* Progress */}
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>

        <div className="w-full bg-slate-900/70 border border-slate-800 rounded-3xl p-8 space-y-6">
          <p className="text-xl font-extrabold text-white leading-relaxed">{q.q}</p>

          <div className="space-y-3">
            {q.options.map((opt, idx) => (
              <button key={idx} onClick={() => handleAnswer(idx)}
                className={`w-full text-left p-4 rounded-2xl border text-sm font-semibold transition-all ${
                  selected === idx ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300' : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-600'
                }`}>
                <span className="mr-3 font-extrabold text-slate-500">{String.fromCharCode(65 + idx)}.</span>{opt}
              </button>
            ))}
          </div>

          <button onClick={handleNext} disabled={selected === null}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-base rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {current === questions.length - 1 ? 'Submit Assessment' : 'Next Question →'}
          </button>
        </div>
      </main>
    </div>
  );
}
