'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Code, Maximize2, Minimize2, AlertTriangle, CheckCircle2,
  ChevronLeft, ChevronRight, Loader2, Save, StopCircle
} from 'lucide-react';
import { useAuth } from '../../../../lib/authContext';
import {
  getMockInterview, submitMockInterviewSession, logProctoringEvent,
  MockInterviewSession, TheoryQuestion, CodingQuestion, ProctoringEvent
} from '../../../../lib/mockInterviewDb';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [session, setSession] = useState<MockInterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Flow State
  const [currentIndex, setCurrentIndex] = useState(0); // 0-6 for theory
  const [theoryAnswers, setTheoryAnswers] = useState<Record<string, string>>({});
  const [codingCode, setCodingCode] = useState<string>('');
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);

  // Proctoring State
  const [blurCount, setBlurCount] = useState(0);
  const [pasteCount, setPasteCount] = useState(0);
  const [isFlagged, setIsFlagged] = useState(false);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const data = await getMockInterview(id as string);
      if (data && data.status === 'in_progress') {
        setSession(data);
        const cq = data.questions.find(q => q.id.startsWith('cq_')) as CodingQuestion;
        if (cq) {
          setCodingCode(cq.starterCode[data.language] || '// start coding');
        }
      } else {
        router.push('/mock-interview');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ─── PROCTORING LOGIC ────────────────────────────────────────────────────────
  useEffect(() => {
    const handleBlur = () => {
      setBlurCount(prev => prev + 1);
      logProctoringEvent({
        sessionId: id as string,
        type: 'tab_switch',
        severity: blurCount > 2 ? 'high' : 'medium'
      });
      if (blurCount > 2) setIsFlagged(true);
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [blurCount, id]);

  const handlePaste = useCallback((e: any) => {
    setPasteCount(prev => prev + 1);
    if (pasteCount > 3) {
      logProctoringEvent({
        sessionId: id as string,
        type: 'copy_paste',
        severity: 'high'
      });
      setIsFlagged(true);
    }
  }, [id, pasteCount]);

  useEffect(() => {
    const checkDevTools = () => {
      if (window.outerWidth - window.innerWidth > 200 || window.outerHeight - window.innerHeight > 200) {
        logProctoringEvent({
          sessionId: id as string,
          type: 'devtools',
          severity: 'high'
        });
        setIsFlagged(true);
      }
    };
    window.addEventListener('resize', checkDevTools);
    return () => window.removeEventListener('resize', checkDevTools);
  }, [id]);

  // ─── HELPERS ─────────────────────────────────────────────────────────────────

  const theoryQuestions = session?.questions.filter(q => q.id.startsWith('tq_')) as TheoryQuestion[] || [];
  const codingQuestion = session?.questions.find(q => q.id.startsWith('cq_')) as CodingQuestion;
  
  const allAttempted = () => {
    if (!session) return false;
    const allTheory = theoryQuestions.every(q => (theoryAnswers[q.id] || '').trim().length > 10);
    const codeAttempted = codingCode !== (codingQuestion?.starterCode[session.language] || '');
    return allTheory && codeAttempted;
  };

  const handleNext = () => {
    if (currentIndex < theoryQuestions.length - 1) setCurrentIndex(prev => prev + 1);
  };
  
  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!session) return;
    setSaving(true);
    try {
      const updatedQuestions = session.questions.map(q => {
        if (q.id.startsWith('tq_')) {
          return { ...q, answer: theoryAnswers[q.id] };
        } else {
          return { ...q, submittedCode: codingCode };
        }
      });
      
      await submitMockInterviewSession(session.id, updatedQuestions, isFlagged);
      
      if (isFlagged) {
        setCompletionMessage('Suspicious activity was detected during the interview. This has been recorded and will be reviewed as part of your evaluation.');
      } else {
        setCompletionMessage('Your performance report and detailed feedback will be available shortly.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to submit interview');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060E1E] flex items-center justify-center">
        <Loader2 size={32} className="text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (completionMessage) {
    return (
      <div className="min-h-screen bg-[#060E1E] text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-2xl p-8 text-center">
          {isFlagged ? (
            <AlertTriangle size={48} className="text-amber-500 mx-auto mb-4" />
          ) : (
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
          )}
          <h2 className="text-2xl font-bold mb-4">{isFlagged ? 'Under Review' : 'Interview Completed'}</h2>
          <p className="text-slate-400 mb-8">{completionMessage}</p>
          <button onClick={() => router.push('/mock-interview')} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-medium transition-colors">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const currentQ = theoryQuestions[currentIndex];
  
  // Overall progress (7 theory + 1 coding)
  const attemptedTheory = theoryQuestions.filter(q => (theoryAnswers[q.id] || '').trim().length > 10).length;
  const attemptedCode = codingCode !== (codingQuestion?.starterCode[session.language] || '') ? 1 : 0;
  const totalAttempted = attemptedTheory + attemptedCode;
  const totalItems = theoryQuestions.length + 1;
  const progressPct = (totalAttempted / totalItems) * 100;

  return (
    <div className="h-screen bg-[#060E1E] text-white flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="h-16 border-b border-white/5 bg-slate-900 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="font-bold text-lg text-white">Mock Interview</div>
          <div className="text-sm text-slate-400 border-l border-white/10 pl-4">
            {session.companyName || 'General Practice'} ({session.language})
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-400 mb-1">{totalAttempted} of {totalItems} completed</span>
            <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!allAttempted() || saving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Submit Interview
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: CODE EDITOR */}
        <div className={`${isEditorExpanded ? 'w-2/3' : 'w-1/3'} border-r border-white/5 bg-slate-950 flex flex-col transition-all duration-300`}>
          <div className="h-12 border-b border-white/5 bg-slate-900 flex items-center justify-between px-4 flex-shrink-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-400">
              <Code size={16} /> Coding Challenge
            </div>
            <button onClick={() => setIsEditorExpanded(!isEditorExpanded)} className="text-slate-400 hover:text-white p-1">
              {isEditorExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
          <div className="p-4 border-b border-white/5 flex-shrink-0 max-h-48 overflow-y-auto">
            <h3 className="font-semibold text-white mb-2">{codingQuestion?.title}</h3>
            <p className="text-sm text-slate-400">{codingQuestion?.description}</p>
          </div>
          <div className="flex-1" onPaste={handlePaste}>
            <MonacoEditor
              height="100%"
              language={session.language === 'python' ? 'python' : session.language === 'java' ? 'java' : 'javascript'}
              theme="vs-dark"
              value={codingCode}
              onChange={(v) => setCodingCode(v || '')}
              options={{ minimap: { enabled: false }, fontSize: 14 }}
            />
          </div>
        </div>

        {/* RIGHT PANEL: THEORY Q&A */}
        <div className="flex-1 bg-[#060E1E] flex flex-col relative">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-2xl mx-auto">
              <div className="mb-8">
                <span className="text-xs font-bold text-cyan-500 uppercase tracking-wider">
                  Theory Question {currentIndex + 1} of {theoryQuestions.length}
                </span>
                <h2 className="text-2xl font-bold text-white mt-2 leading-relaxed">
                  {currentQ?.question}
                </h2>
              </div>
              
              <div className="relative" onPaste={handlePaste}>
                <textarea
                  className="w-full h-64 bg-slate-900/50 border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 resize-none transition-all"
                  placeholder="Type your answer here. Be as detailed as possible..."
                  value={theoryAnswers[currentQ?.id] || ''}
                  onChange={e => setTheoryAnswers(prev => ({ ...prev, [currentQ?.id]: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="h-20 border-t border-white/5 bg-slate-900/50 flex items-center justify-between px-8 flex-shrink-0">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <div className="flex gap-2">
              {theoryQuestions.map((_, idx) => (
                <div key={idx} className={`w-2 h-2 rounded-full ${idx === currentIndex ? 'bg-cyan-500' : 'bg-slate-700'}`} />
              ))}
            </div>
            <button
              onClick={handleNext}
              disabled={currentIndex === theoryQuestions.length - 1}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-white rounded-lg transition-colors"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
