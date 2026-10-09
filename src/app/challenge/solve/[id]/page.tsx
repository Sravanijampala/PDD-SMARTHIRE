'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowLeft, Play, Send, ChevronDown, Clock, MemoryStick,
  CheckCircle2, XCircle, AlertTriangle, Loader2, RotateCcw,
  BookOpen, History, Zap, Copy, Check
} from 'lucide-react';
import { useAuth } from '../../../../lib/authContext';
import {
  getProblem, saveSubmission, updateSubmission, getUserSubmissionsForProblem,
  getUserSkillProfile, getAllBadges, getUserBadges, Problem, Submission,
  upsertUserSkillProfile
} from '../../../../lib/careerprepDb';
import { processAcceptedSubmission, processFailedSubmission } from '../../../../lib/gamificationEngine';
import { ConfettiOverlay } from '../../../../components/ConfettiOverlay';

import { injectDriver } from '../../../../lib/driverInjector';

// Monaco Editor loaded dynamically (SSR-safe)
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

// ─── Language Config (config-driven — add languages here without code changes) ───
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

export default function SolverPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLang, setSelectedLang] = useState(LANGUAGE_CONFIG[0]);
  const [code, setCode] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [output, setOutput] = useState('');
  const [outputState, setOutputState] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [activeResultTab, setActiveResultTab] = useState<'output' | 'history'>('output');
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [runtimeMs, setRuntimeMs] = useState<number | null>(null);
  const [submissionHistory, setSubmissionHistory] = useState<Submission[]>([]);
  const [newBadgeAlert, setNewBadgeAlert] = useState<string | null>(null);
  const [pointsAlert, setPointsAlert] = useState<number | null>(null);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeProblemTab, setActiveProblemTab] = useState<'description' | 'examples'>('description');
  const lastSubmitTime = useRef<number>(0);

  useEffect(() => {
    if (id) loadData();
  }, [id, selectedLang]);

  const loadData = async () => {
    setLoading(true);
    try {
      const p = await getProblem(id);
      setProblem(p);
      // Load starter code for selected language
      if (p?.starterCode?.[selectedLang.id]) {
        setCode(p.starterCode[selectedLang.id]);
      } else {
        setCode(`// Write your ${selectedLang.label} solution here\n`);
      }
      if (user?.id) {
        const history = await getUserSubmissionsForProblem(user.id, id);
        setSubmissionHistory(history);
      }
    } finally {
      setLoading(false);
    }
  };

  const executeCode = async (isSubmit: boolean) => {
    if (!code.trim()) return;
    
    // Rate limit: 1 per 3 seconds
    const now = Date.now();
    if (now - lastSubmitTime.current < 3000) {
      setOutput('⚠️ Please wait 3 seconds between submissions.');
      setOutputState('error');
      return;
    }
    lastSubmitTime.current = now;

    isSubmit ? setSubmitting(true) : setRunning(true);
    setVerdict(isSubmit ? 'pending' : null);
    setOutput('');
    setOutputState('running');
    setRuntimeMs(null);

    let subId: string | undefined;

    try {
      // Save pending submission to Firestore for history
      if (isSubmit && user?.id) {
        subId = await saveSubmission({
          userId: user.id,
          problemId: id as string,
          language: selectedLang.id,
          code,
          verdict: 'pending',
          submittedAt: new Date(),
        });
      }

      const runnableCode = injectDriver(code, problem?.title || '', selectedLang.id);
      
      const testCasesToRun = isSubmit
        ? (problem?.testCases || [])
        : [{ input: customInput || (problem?.testCases?.[0]?.input || ''), expectedOutput: '', isHidden: false }];

      let finalVerdict: Verdict = 'accepted';
      let maxRuntime = 0;
      let lastStdout = '';
      let lastStderr = '';

      for (let i = 0; i < testCasesToRun.length; i++) {
        const tc = testCasesToRun[i];
        const res = await fetch('/api/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: selectedLang.pistonLang,
            version: selectedLang.pistonVersion,
            code: runnableCode,
            stdin: tc.input,
          }),
        });

        const data = await res.json();
        const stdout = data.run?.stdout || '';
        const stderr = data.run?.stderr || data.compile?.stderr || '';
        const runtime = data.run?.time ? Math.round(data.run.time * 1000) : 0;
        
        lastStdout = stdout;
        lastStderr = stderr;
        maxRuntime = Math.max(maxRuntime, runtime);

        if (stderr && !stdout) {
           finalVerdict = data.compile?.stderr ? 'compilation_error' : 'runtime_error';
           break;
        }
        
        if (isSubmit) {
           const normalize = (s: string) => s.trim().replace(/\r\n/g, '\n');
           if (normalize(stdout) !== normalize(tc.expectedOutput)) {
             finalVerdict = 'wrong_answer';
             break;
           }
        }
      }

      setRuntimeMs(maxRuntime);
      const combinedOutput = lastStdout || lastStderr || 'No output';
      setOutput(combinedOutput);
      setOutputState(lastStderr && !lastStdout ? 'error' : 'success');

      if (isSubmit && problem) {
        setVerdict(finalVerdict);

        if (subId && user?.id) {
          await updateSubmission(subId, { verdict: finalVerdict, runtimeMs: maxRuntime });
        }

        // Gamification if accepted
        if (finalVerdict === 'accepted' && user?.id) {
          const [profile, badges, userBadges] = await Promise.all([
            getUserSkillProfile(user.id),
            getAllBadges(),
            getUserBadges(user.id),
          ]);

          if (profile) {
            const result = await processAcceptedSubmission(
              user.id, profile, { userId: user.id, problemId: id as string, language: selectedLang.id, code, verdict: 'accepted', submittedAt: new Date() },
              problem.difficulty, problem.topicTags, badges, userBadges.map(b => b.badgeId),
              new Date().toISOString().split('T')[0],
            );
            setPointsAlert(result.pointsAwarded);
            if (result.newBadges.length > 0) {
              setNewBadgeAlert(`🏅 New Badge: ${result.newBadges[0].name}!`);
            }
            setTimeout(() => { setPointsAlert(null); setNewBadgeAlert(null); }, 4000);
          }
        }

        // Reload history
        if (user?.id) {
          const history = await getUserSubmissionsForProblem(user.id, id as string);
          setSubmissionHistory(history);
          setActiveResultTab('output');
        }
      } else {
        setVerdict(null);
      }
    } catch (e: any) {
      setOutput(`Error: ${e.message}`);
      setOutputState('error');
    } finally {
      setSubmitting(false);
      setRunning(false);
    }
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060E1E] flex items-center justify-center">
        <Loader2 size={32} className="text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-[#060E1E] flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Problem not found.</p>
          <Link href="/challenge" className="text-cyan-400 hover:underline">← Back to Challenges</Link>
        </div>
      </div>
    );
  }

  const diffCfg = { easy: 'text-emerald-400', medium: 'text-amber-400', hard: 'text-rose-400' };
  const verdictCfg = verdict ? VERDICT_CONFIG[verdict] : null;
  const VerdictIcon = verdictCfg?.icon;

  return (
    <div className="h-screen bg-[#060E1E] text-white flex flex-col overflow-hidden">
      <ConfettiOverlay trigger={verdict === 'accepted'} duration={4000} />
      {/* Top Nav */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-white/5 flex-shrink-0">
        <Link href="/challenge" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Daily Challenges
        </Link>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold capitalize ${diffCfg[problem.difficulty]}`}>{problem.difficulty}</span>
          <span className="flex items-center gap-1 text-amber-400 text-sm"><Zap size={14} />{problem.points} pts</span>
        </div>
      </div>

      {/* Floating alerts */}
      {pointsAlert && (
        <div className="fixed top-16 right-4 z-50 bg-amber-500/90 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-xl animate-bounce">
          +{pointsAlert} Points! 🎉
        </div>
      )}
      {newBadgeAlert && (
        <div className="fixed top-28 right-4 z-50 bg-cyan-500/90 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-xl">
          {newBadgeAlert}
        </div>
      )}

      {/* Main Split Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel — Problem Statement */}
        <div className="w-[42%] flex flex-col border-r border-white/5 overflow-hidden">
          <div className="flex border-b border-white/5">
            {(['description', 'examples'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveProblemTab(tab)}
                className={`px-4 py-2 text-sm capitalize transition-colors ${activeProblemTab === tab ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}>
                {tab}
              </button>
            ))}
          </div>
          
          <div className="flex-1 overflow-y-auto p-5">
            <h1 className="text-xl font-bold text-white mb-3">{problem.title}</h1>
            
            {activeProblemTab === 'description' && (
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  {problem.topicTags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300">{tag}</span>
                  ))}
                </div>
                <div className="prose prose-invert prose-sm max-w-none">
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{problem.statement}</p>
                </div>
                {problem.constraints.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-slate-300 mb-2">Constraints:</h3>
                    <ul className="space-y-1">
                      {problem.constraints.map((c, i) => (
                        <li key={i} className="text-xs text-slate-400 font-mono bg-slate-800 px-3 py-1.5 rounded-lg">{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {activeProblemTab === 'examples' && (
              <div className="space-y-4">
                {problem.examples.map((ex, i) => (
                  <div key={i} className="bg-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-400 font-semibold mb-2">Example {i + 1}:</p>
                    <div className="space-y-2 font-mono text-sm">
                      <div><span className="text-slate-500">Input: </span><span className="text-white">{ex.input}</span></div>
                      <div><span className="text-slate-500">Output: </span><span className="text-emerald-400">{ex.output}</span></div>
                      {ex.explanation && <div className="text-xs text-slate-400 pt-1 border-t border-white/5">{ex.explanation}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel — Editor + Output */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900/50 border-b border-white/5 flex-shrink-0">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-sm hover:border-white/20 transition-colors"
              >
                <span>{selectedLang.icon}</span>
                <span className="text-white">{selectedLang.label}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              {showLangDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-white/10 rounded-xl overflow-hidden z-30 min-w-[180px] shadow-xl">
                  {LANGUAGE_CONFIG.map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => { setSelectedLang(lang); setShowLangDropdown(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors text-left ${lang.id === selectedLang.id ? 'text-cyan-400' : 'text-white'}`}
                    >
                      <span>{lang.icon}</span> {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button onClick={copyCode} className="p-1.5 text-slate-400 hover:text-white transition-colors">
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </button>
              <button onClick={() => loadData()} className="p-1.5 text-slate-400 hover:text-white transition-colors">
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => executeCode(false)}
                disabled={running || submitting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} className="text-emerald-400" />}
                Run
              </button>
              <button
                onClick={() => executeCode(true)}
                disabled={running || submitting}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Submit
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
            <MonacoEditor
              height="100%"
              language={selectedLang.monacoLang}
              value={code}
              onChange={v => setCode(v || '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                wordWrap: 'on',
                padding: { top: 16 },
                automaticLayout: true,
                tabSize: 4,
                suggest: { showClasses: true, showFunctions: true },
              }}
            />
          </div>

          {/* Bottom Panel — Custom Input + Output */}
          <div className="h-64 border-t border-white/5 flex flex-col flex-shrink-0">
            <div className="flex border-b border-white/5">
              <button
                onClick={() => setActiveResultTab('output')}
                className={`px-4 py-2 text-xs transition-colors ${activeResultTab === 'output' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'}`}
              >
                Output
              </button>
              <button
                onClick={() => setActiveResultTab('history')}
                className={`px-4 py-2 text-xs transition-colors ${activeResultTab === 'history' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'}`}
              >
                <History size={12} className="inline mr-1" />History ({submissionHistory.length})
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 border-r border-white/5">
                {activeResultTab === 'output' ? (
                  <>
                    {verdictCfg && (
                      <div className={`flex items-center gap-2 p-2 rounded-lg border mb-3 text-sm font-semibold verdict-animate ${verdictCfg.bg}`}>
                        {VerdictIcon && <VerdictIcon size={16} className={`${verdictCfg.color} ${verdict === 'pending' ? 'animate-spin' : ''}`} />}
                        <span className={verdictCfg.color}>{verdictCfg.label}</span>
                        {runtimeMs != null && <span className="text-slate-400 text-xs ml-auto">{runtimeMs}ms</span>}
                      </div>
                    )}
                    <pre className={`text-xs font-mono whitespace-pre-wrap ${outputState === 'error' ? 'text-red-400' : 'text-slate-300'}`}>
                      {outputState === 'idle' ? 'Run your code to see output...' : output}
                    </pre>
                  </>
                ) : (
                  <div className="space-y-2">
                    {submissionHistory.length === 0 ? (
                      <p className="text-slate-500 text-xs">No submissions yet.</p>
                    ) : submissionHistory.map((sub, i) => {
                      const vcfg = VERDICT_CONFIG[sub.verdict];
                      return (
                        <details key={i} className="group bg-slate-800 rounded-lg">
                          <summary className="flex items-center gap-3 text-xs px-3 py-2 cursor-pointer outline-none">
                            <span className={`font-semibold ${vcfg.color}`}>{vcfg.label}</span>
                            <span className="text-slate-400 capitalize">{sub.language}</span>
                            {sub.runtimeMs && <span className="text-slate-500">{sub.runtimeMs}ms</span>}
                            <span className="text-slate-600 ml-auto">{new Date(sub.submittedAt?.seconds ? sub.submittedAt.seconds * 1000 : sub.submittedAt).toLocaleString()}</span>
                            <ChevronDown size={14} className="text-slate-500 transition-transform group-open:rotate-180" />
                          </summary>
                          <div className="px-3 pb-3 pt-1 border-t border-white/5">
                            <pre className="text-[10px] text-slate-400 font-mono bg-slate-900 p-2 rounded overflow-x-auto">{sub.code}</pre>
                          </div>
                        </details>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Custom Testcase Panel */}
              <div className="w-64 flex flex-col p-3 bg-slate-900/50">
                <span className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
                  <MemoryStick size={12} /> Custom Input
                </span>
                <textarea
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  placeholder="Paste testcase stdin here..."
                  className="flex-1 bg-slate-800 border border-white/10 rounded-lg p-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500/50 resize-none transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
