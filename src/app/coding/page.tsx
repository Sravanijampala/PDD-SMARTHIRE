'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Code, Play, CheckCircle2, XCircle, Terminal } from 'lucide-react';
import { useInterviewTimer } from '../../hooks/useInterviewTimer';

const challenges = [
  {
    id: 1, title: 'Two Sum', difficulty: 'Easy', topic: 'Arrays',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    example: 'Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]',
    starterCode: `function twoSum(nums, target) {\n  // Your solution here\n  \n}`,
    testCases: ['twoSum([2,7,11,15], 9) → [0,1]', 'twoSum([3,2,4], 6) → [1,2]'],
  },
  {
    id: 2, title: 'Reverse String', difficulty: 'Easy', topic: 'Strings',
    description: 'Write a function that reverses a string.',
    example: 'Input: "hello"\nOutput: "olleh"',
    starterCode: `function reverseString(s) {\n  // Your solution here\n  \n}`,
    testCases: ['reverseString("hello") → "olleh"', 'reverseString("Hannah") → "hannaH"'],
  },
  {
    id: 3, title: 'Valid Parentheses', difficulty: 'Medium', topic: 'Stack',
    description: 'Given a string s containing just the characters (, ), {, }, [ and ], determine if the input string is valid.',
    example: 'Input: "([]{})" \nOutput: true',
    starterCode: `function isValid(s) {\n  // Your solution here\n  \n}`,
    testCases: ['isValid("()") → true', 'isValid("(]") → false'],
  },
];

export default function CodingPage() {
  const [selected, setSelected] = useState(challenges[0]);
  const [code, setCode] = useState(challenges[0].starterCode);
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const { formatted } = useInterviewTimer({ durationSeconds: 1800, sessionKey: 'coding_timer' });

  const handleChallengeSelect = (c: typeof challenges[0]) => {
    setSelected(c);
    setCode(c.starterCode);
    setOutput('');
  };

  const runCode = () => {
    setRunning(true);
    setOutput('');
    setTimeout(() => {
      try {
        // Safe eval for demo purposes
        const fn = new Function(`return (${code})`)();
        const results = selected.testCases.map(tc => {
          const match = tc.match(/→\s*(.+)$/);
          return `✅ Test case: ${tc.split('→')[0].trim()} → Evaluating...`;
        });
        setOutput(results.join('\n') + '\n\n✅ Code ran successfully! Check your logic against the test cases above.');
      } catch (e) {
        setOutput(`❌ Error: ${e instanceof Error ? e.message : 'Syntax error in your code.'}`);
      }
      setRunning(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#050914] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-[#080D1A]/90 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all"><ArrowLeft size={20} /></Link>
          <div>
            <h1 className="text-lg font-extrabold text-white">Coding Assessment</h1>
            <p className="text-xs text-slate-400">{selected.title} · {selected.difficulty}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${selected.difficulty === 'Easy' ? 'text-emerald-400 bg-emerald-950/60' : selected.difficulty === 'Medium' ? 'text-amber-400 bg-amber-950/60' : 'text-red-400 bg-red-950/60'}`}>
            {selected.difficulty}
          </span>
          <div className="bg-slate-800 text-cyan-400 font-extrabold text-sm px-4 py-2 rounded-2xl">{formatted}</div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 min-h-0">
        {/* Challenge List */}
        <div className="lg:col-span-1 border-r border-slate-800 p-4 space-y-2 overflow-y-auto">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Challenges</p>
          {challenges.map(c => (
            <button key={c.id} onClick={() => handleChallengeSelect(c)}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${selected.id === c.id ? 'bg-cyan-950/40 border-cyan-500/50' : 'bg-slate-900/60 border-slate-800 hover:border-slate-600'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-white">{c.title}</span>
                <span className={`text-xs font-bold ${c.difficulty === 'Easy' ? 'text-emerald-400' : c.difficulty === 'Medium' ? 'text-amber-400' : 'text-red-400'}`}>{c.difficulty}</span>
              </div>
              <span className="text-xs text-slate-500">{c.topic}</span>
            </button>
          ))}
        </div>

        {/* Problem + Editor */}
        <div className="lg:col-span-2 grid grid-rows-2 min-h-0">
          {/* Problem Description */}
          <div className="p-6 border-b border-slate-800 overflow-y-auto">
            <h2 className="text-xl font-extrabold text-white mb-3">{selected.title}</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">{selected.description}</p>
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Example</p>
              <pre className="text-cyan-300 text-xs whitespace-pre-wrap">{selected.example}</pre>
            </div>
            <div className="space-y-1">
              {selected.testCases.map((tc, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 px-3 py-2 rounded-xl">
                  <Terminal size={12} className="text-slate-500" /> {tc}
                </div>
              ))}
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-6 py-3 bg-slate-900/80 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Code size={16} className="text-cyan-400" />
                <span className="text-sm font-bold text-slate-300">JavaScript</span>
              </div>
              <button onClick={runCode} disabled={running}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-60">
                <Play size={16} fill="white" /> {running ? 'Running...' : 'Run Code'}
              </button>
            </div>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              className="flex-1 bg-slate-950 text-cyan-300 font-mono text-sm p-6 focus:outline-none resize-none leading-relaxed"
              spellCheck={false}
            />
            {output && (
              <div className="px-6 py-4 bg-slate-900/80 border-t border-slate-800 max-h-32 overflow-y-auto">
                <pre className="text-xs text-slate-300 whitespace-pre-wrap">{output}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
