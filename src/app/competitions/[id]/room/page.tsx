'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowLeft, Play, Send, ChevronDown, Clock, 
  CheckCircle2, XCircle, AlertTriangle, Loader2, RotateCcw,
  BookOpen, History, Zap, Copy, Check, Trophy, List
} from 'lucide-react';
import { useAuth } from '../../../../lib/authContext';
import {
  getCompetition, checkRegistration, Competition
} from '../../../../lib/competitionDb';
import {
  getProblem, saveSubmission, updateSubmission, getUserSubmissionsForProblem,
  Problem, Submission
} from '../../../../lib/careerprepDb';

import { injectDriver } from '../../../../lib/driverInjector';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const LANGUAGE_CONFIG = [
  { id: 'python', label: 'Python 3', monacoLang: 'python', pistonLang: 'python', pistonVersion: '3.10.0', icon: '🐍' },
  { id: 'javascript', label: 'JavaScript (Node)', monacoLang: 'javascript', pistonLang: 'js', pistonVersion: '18.15.0', icon: '⚡' },
  { id: 'java', label: 'Java', monacoLang: 'java', pistonLang: 'java', pistonVersion: '15.0.2', icon: '☕' },
  { id: 'cpp', label: 'C++', monacoLang: 'cpp', pistonLang: 'cpp', pistonVersion: '10.2.0', icon: '⚙️' },
  { id: 'c', label: 'C', monacoLang: 'c', pistonLang: 'c', pistonVersion: '10.2.0', icon: '🔧' },
];

const VERDICT_CONFIG = {
  accepted: { label: 'Accepted ✓', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle2 },
  wrong_answer: { label: 'Wrong Answer', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30', icon: XCircle },
  tle: { label: 'Time Limit Exceeded', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', icon: Clock },
  runtime_error: { label: 'Runtime Error', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', icon: AlertTriangle },
  compilation_error: { label: 'Compilation Error', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: XCircle },
  pending: { label: 'Running...', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/30', icon: Loader2 },
};

type Verdict = keyof typeof VERDICT_CONFIG;

export default function CompetitionRoomPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [activeProblemId, setActiveProblemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Editor State
  const [selectedLang, setSelectedLang] = useState(LANGUAGE_CONFIG[0]);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const lastSubmitTime = useRef<number>(0);

  useEffect(() => {
    if (id && user) loadData();
    else if (user === null) router.push('/login');
  }, [id, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (!user) return;
      const comp = await getCompetition(id as string);
      if (!comp) return;
      setCompetition(comp);

      const isRegistered = await checkRegistration(comp.id, user.id);
      if (!isRegistered) {
        alert("You are not registered for this competition.");
        router.push(`/competitions/${comp.id}`);
        return;
      }

      // Load problems (mock fetching by ID since we seeded dummy IDs)
      // In a real scenario we'd do a Promise.all(comp.problemIds.map(getProblem))
      // But since we seeded dummy 'comp_prob_1' which don't exist in Firestore,
      // we'll mock the problem data for the demo room.
      const mockProblems: Problem[] = comp.problemIds.map((pid, idx) => ({
        id: pid,
        challengeDayId: 'comp',
        title: `Contest Problem ${idx + 1}`,
        statement: `Solve this algorithmic challenge as quickly as possible.\n\nInput format: ...\nOutput format: ...`,
        difficulty: 'medium',
        points: 250 * (idx + 1),
        topicTags: ['Algorithms'],
        examples: [{ input: '1 2', output: '3' }],
        constraints: ['N <= 10^5'],
        starterCode: {
          python: 'def solve():\n    pass',
          javascript: 'function solve() {\n}',
        },
        testCases: [{ input: '1 2', expectedOutput: '3', isHidden: false }]
      }));
      
      setProblems(mockProblems);
      if (mockProblems.length > 0) {
        setActiveProblemId(mockProblems[0].id);
        setCode(mockProblems[0].starterCode[selectedLang.id] || '');
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const activeProblem = problems.find(p => p.id === activeProblemId);

  const executeCode = async (isSubmit: boolean) => {
    if (!code.trim() || !activeProblem) return;
    
    const now = Date.now();
    if (now - lastSubmitTime.current < 3000) {
      setOutput('⚠️ Rate limit: wait 3 seconds.');
      return;
    }
    lastSubmitTime.current = now;

    isSubmit ? setSubmitting(true) : setRunning(true);
    setVerdict(null);
    setOutput('');

    try {
      const testInput = activeProblem.testCases?.[0]?.input || '';
      const runnableCode = injectDriver(code, activeProblem.title, selectedLang.id);
      
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedLang.pistonLang,
          version: selectedLang.pistonVersion,
          code: runnableCode,
          stdin: testInput,
        }),
      });

      const data = await res.json();
      const stdout = data.run?.stdout || '';
      const stderr = data.run?.stderr || data.compile?.stderr || '';
      setOutput(stdout || stderr || 'No output');

      if (isSubmit) {
        const expected = activeProblem.testCases?.[0]?.expectedOutput?.trim() || '';
        let finalVerdict: Verdict;
        
        if (stderr && !stdout) {
          finalVerdict = data.compile?.stderr ? 'compilation_error' : 'runtime_error';
        } else if (stdout.trim() === expected) {
          finalVerdict = 'accepted';
        } else {
          finalVerdict = 'wrong_answer';
        }
        setVerdict(finalVerdict);
      }
    } catch (e: any) {
      setOutput(`Error: ${e.message}`);
    } finally {
      setSubmitting(false);
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#060E1E] flex items-center justify-center">
        <Loader2 size={32} className="text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!competition) return <div className="h-screen bg-[#060E1E] text-white">Competition not found.</div>;

  return (
    <div className="h-screen bg-[#060E1E] text-white flex flex-col overflow-hidden">
      {/* Top Nav */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href={`/competitions/${competition.id}`} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-indigo-400" />
            <h1 className="font-bold">{competition.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-rose-400 font-mono font-bold flex items-center gap-1.5 bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/20 animate-pulse">
            <Clock size={14} /> LIVE
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Problem List */}
        <div className="w-64 bg-slate-900/50 border-r border-white/5 flex flex-col">
          <div className="p-4 border-b border-white/5 text-sm font-bold text-slate-300 flex items-center gap-2">
            <List size={16} /> Problems
          </div>
          <div className="flex-1 overflow-y-auto">
            {problems.map((prob, idx) => (
              <button
                key={prob.id}
                onClick={() => {
                  setActiveProblemId(prob.id);
                  setCode(prob.starterCode[selectedLang.id] || '');
                  setVerdict(null);
                  setOutput('');
                }}
                className={`w-full text-left p-4 border-b border-white/5 transition-colors ${
                  activeProblemId === prob.id ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500' : 'hover:bg-white/5'
                }`}
              >
                <div className="text-sm font-semibold text-white mb-1">
                  {idx + 1}. {prob.title}
                </div>
                <div className="text-xs text-amber-400 font-medium">
                  {prob.points} pts
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Middle: Problem Statement */}
        <div className="w-1/3 flex flex-col border-r border-white/5 bg-[#060E1E] overflow-y-auto p-6">
          {activeProblem ? (
            <>
              <h2 className="text-2xl font-bold text-white mb-4">{activeProblem.title}</h2>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-2 py-1 text-xs rounded bg-slate-800 text-slate-300">
                  Time Limit: 2.0s
                </span>
                <span className="px-2 py-1 text-xs rounded bg-slate-800 text-slate-300">
                  Memory Limit: 256 MB
                </span>
              </div>
              <div className="prose prose-invert prose-sm max-w-none mb-8 text-slate-300 whitespace-pre-wrap">
                {activeProblem.statement}
              </div>
              {activeProblem.examples.map((ex, i) => (
                <div key={i} className="mb-4 bg-slate-800/50 p-4 rounded-xl border border-white/5">
                  <p className="text-xs text-slate-400 font-bold mb-2 uppercase tracking-wider">Example {i + 1}</p>
                  <div className="font-mono text-sm space-y-1">
                    <div><span className="text-slate-500">Input:</span> {ex.input}</div>
                    <div><span className="text-slate-500">Output:</span> <span className="text-emerald-400">{ex.output}</span></div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-slate-500">Select a problem to begin.</div>
          )}
        </div>

        {/* Right: Monaco Editor */}
        <div className="flex-1 flex flex-col bg-[#060E1E]">
          {/* Editor Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-white/5 flex-shrink-0">
            <div className="relative">
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg text-sm transition-colors"
              >
                <span>{selectedLang.icon}</span> <span className="text-white">{selectedLang.label}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              {showLangDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-white/10 rounded-xl overflow-hidden z-30 shadow-xl min-w-[160px]">
                  {LANGUAGE_CONFIG.map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => { setSelectedLang(lang); setCode(activeProblem?.starterCode[lang.id] || ''); setShowLangDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 text-white"
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={() => executeCode(false)} disabled={running || submitting} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium flex items-center gap-1.5">
                {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} className="text-emerald-400" />} Run Code
              </button>
              <button onClick={() => executeCode(true)} disabled={running || submitting} className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold flex items-center gap-1.5">
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Submit
              </button>
            </div>
          </div>

          <div className="flex-1" style={{ minHeight: 0 }}>
            <MonacoEditor
              height="100%"
              language={selectedLang.monacoLang}
              value={code}
              onChange={v => setCode(v || '')}
              theme="vs-dark"
              options={{ fontSize: 14, minimap: { enabled: false }, padding: { top: 16 } }}
            />
          </div>

          {/* Output Panel */}
          <div className="h-48 border-t border-white/5 bg-slate-900 flex flex-col flex-shrink-0">
            <div className="px-4 py-2 border-b border-white/5 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Execution Output
            </div>
            <div className="flex-1 overflow-auto p-4">
              {verdict && (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border mb-3 text-sm font-bold ${VERDICT_CONFIG[verdict].bg}`}>
                  <span className={VERDICT_CONFIG[verdict].color}>{VERDICT_CONFIG[verdict].label}</span>
                </div>
              )}
              <pre className="text-sm font-mono text-slate-300">{output || 'No output'}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
