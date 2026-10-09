'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle, ChevronRight, Brain, Code,
  MessageSquare, TrendingUp, PlayCircle, Loader2, Award, AlertCircle
} from 'lucide-react';
import { ProctoringEngine, ViolationEvent } from '../../../../../../lib/proctoringEngine';
import { ObjectDetectionEngine } from '../../../../../../lib/objectDetection';
import { BackgroundBlurEngine } from '../../../../../../lib/backgroundBlur';
import { useAuth } from '../../../../../../lib/authContext';
import {
  getCompanyTrack, getSessionsForTrack, getUserPrepProgress, updateSessionProgress,
  CompanyPrepTrack, PrepSession, UserPrepProgress
} from '../../../../../../lib/careerprepDb';
import { getQuestionsForSession, MockQuestion, getCodingQuestionsForSession, MockCodingQuestion } from '../../../../../../lib/mockQuestionsGenerator';
import Editor from '@monaco-editor/react';

export default function SessionPlayerPage() {
  const { id, sessionId } = useParams<{ id: string, sessionId: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [track, setTrack] = useState<CompanyPrepTrack | null>(null);
  const [session, setSession] = useState<PrepSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [codingQuestions, setCodingQuestions] = useState<MockCodingQuestion[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<string>('javascript');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  
  // Dummy state for internal player
  const [currentStep, setCurrentStep] = useState(0);

  // Proctoring
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const proctorRef = React.useRef<ProctoringEngine | null>(null);
  const objectEngineRef = React.useRef<ObjectDetectionEngine | null>(null);
  const blurEngineRef = React.useRef<BackgroundBlurEngine | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);

  useEffect(() => {
    // Start proctoring
    proctorRef.current = new ProctoringEngine((event: ViolationEvent, total: number) => {
      if (event.type === 'mobile_phone' || event.type === 'background_noise' || event.type === 'multiple_people') {
        setFatalError(`Malpractice Detected: ${event.message}`);
      } else if (total >= 3) {
        setFatalError("Session terminated due to multiple security violations.");
      }
    });
    proctorRef.current.start();

    // Start object detection
    const initProctoring = async () => {
      objectEngineRef.current = new ObjectDetectionEngine();
      blurEngineRef.current = new BackgroundBlurEngine();
      
      await Promise.all([
        objectEngineRef.current.init(),
        blurEngineRef.current.init()
      ]);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          
          if (canvasRef.current) {
             blurEngineRef.current.startBlurring(videoRef.current, canvasRef.current);
          }
        }
        proctorRef.current?.startAudioMonitoring(stream);
      } catch (e) {
        console.warn("Could not start camera/mic for proctoring");
      }

      const detectViolationsLoop = async () => {
        if (objectEngineRef.current && videoRef.current && proctorRef.current) {
          const { hasPhone, multiplePeople } = await objectEngineRef.current.detectViolations(videoRef.current);
          if (hasPhone) {
            proctorRef.current.reportViolation('mobile_phone', 'Mobile phone detected in camera view.');
          }
          if (multiplePeople) {
            proctorRef.current.reportViolation('multiple_people', 'Multiple people detected in frame.');
          }
        }
        if (objectEngineRef.current) {
          setTimeout(detectViolationsLoop, 2000);
        }
      };
      setTimeout(detectViolationsLoop, 2000);
    };
    initProctoring();

    return () => {
      if (proctorRef.current) proctorRef.current.stop();
      if (objectEngineRef.current) objectEngineRef.current.destroy();
      if (blurEngineRef.current) blurEngineRef.current.destroy();
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  useEffect(() => {
    if (id && sessionId) loadData();
  }, [id, sessionId]);

  useEffect(() => {
    if (currentStep > 0 && timeLeft !== null && timeLeft > 0) {
      const timerId = setInterval(() => setTimeLeft(prev => (prev ? prev - 1 : 0)), 1000);
      return () => clearInterval(timerId);
    } else if (timeLeft === 0) {
      // Auto complete when time runs out
      if (session?.type === 'technical') {
        setCurrentStep(codingQuestions.length + 1);
      } else {
        setCurrentStep(questions.length + 1);
      }
    }
  }, [currentStep, timeLeft, session, codingQuestions.length, questions.length]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [t, allS] = await Promise.all([
        getCompanyTrack(id),
        getSessionsForTrack(id)
      ]);
      setTrack(t);
      const s = allS.find(x => x.id === sessionId);
      setSession(s || null);
      if (t && s) {
        setTimeLeft(s.duration * 60);
        if (s.type === 'technical') {
          setCodingQuestions(getCodingQuestionsForSession(t.companyName));
        } else {
          setQuestions(getQuestionsForSession(t.companyName, s.type, 30));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!user?.id || !session) return;
    setSaving(true);
    try {
      await updateSessionProgress({
        userId: user.id,
        trackId: id,
        sessionId: session.id!,
        status: 'completed',
        score: Math.floor(Math.random() * 40) + 60, // Dummy score
      });
      router.push(`/practice/company/${id}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRunTests = async () => {
    setIsRunning(true);
    setOutput('Running...');
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: language === 'javascript' ? 'js' : language,
          code,
          stdin: ''
        })
      });
      const data = await res.json();
      if (data.error) {
        setOutput(`Error: ${data.error}`);
      } else {
        setOutput(data.run?.output || 'Execution finished with no output.');
      }
    } catch (err: any) {
      setOutput(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060E1E] flex items-center justify-center">
        <Loader2 size={32} className="text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!track || !session) {
    return (
      <div className="min-h-screen bg-[#060E1E] flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-slate-400">Session not found.</p>
          <Link href={`/practice/company/${id}`} className="mt-4 inline-block text-cyan-400 hover:underline">← Back to Track</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#060E1E] text-white flex flex-col overflow-hidden relative">
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />
      
      {/* PiP Camera Preview */}
      <div className="fixed bottom-6 right-6 w-48 h-36 bg-slate-900 border-2 border-slate-700 rounded-xl overflow-hidden shadow-2xl z-50">
         <canvas ref={canvasRef} className="w-full h-full object-cover transform -scale-x-100" />
      </div>
      
      {/* Fatal Error Modal */}
      {fatalError && (
        <div className="fixed inset-0 z-[200] bg-red-900/90 backdrop-blur-xl flex flex-col items-center justify-center p-4">
          <AlertCircle size={64} className="text-white mb-4 animate-bounce" />
          <h2 className="text-4xl font-extrabold text-white mb-2">Practice Terminated</h2>
          <p className="text-xl text-red-200 mb-8 max-w-lg text-center">{fatalError}</p>
          <Link href={`/practice/company/${id}`}>
            <button className="px-8 py-4 bg-white text-red-900 font-bold rounded-2xl shadow-xl hover:bg-slate-200 transition-all">
              Return to Track
            </button>
          </Link>
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href={`/practice/company/${id}`} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3 border-l border-white/10 pl-4">
            <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center font-bold text-sm">
              {track.companyName.charAt(0)}
            </div>
            <div>
              <p className="text-xs text-slate-400">{track.companyName}</p>
              <h1 className="text-sm font-semibold">{session.title}</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400 px-3 py-1 bg-slate-800 rounded-full font-mono font-bold">
            {timeLeft !== null && currentStep > 0 
              ? `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}` 
              : `${session.duration}:00`}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center relative">
        {/* Placeholder background graphic */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          {session.type === 'mcq' && <Brain size={400} />}
          {session.type === 'coding' && <Code size={400} />}
          {session.type === 'technical' && <TrendingUp size={400} />}
          {session.type === 'hr' && <MessageSquare size={400} />}
        </div>
        
        <div className={`${session.type === 'technical' && currentStep > 0 && currentStep <= codingQuestions.length ? 'w-full max-w-6xl flex flex-col md:flex-row gap-6 text-left' : 'max-w-2xl w-full text-center'} bg-slate-900/80 border border-white/5 rounded-3xl p-8 backdrop-blur-xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-500`}>
          {!(session.type === 'technical' && currentStep > 0 && currentStep <= codingQuestions.length) && (
            <>
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-2xl flex items-center justify-center mb-6">
                {session.type === 'mcq' && <Brain size={32} className="text-purple-400" />}
                {session.type === 'coding' && <Code size={32} className="text-cyan-400" />}
                {session.type === 'system_design' && <TrendingUp size={32} className="text-emerald-400" />}
                {session.type === 'hr' && <MessageSquare size={32} className="text-pink-400" />}
                {session.type === 'behavioral' && <Award size={32} className="text-rose-400" />}
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">{session.title}</h2>
              <p className="text-slate-400 mb-8">{session.description || 'Welcome to the session player. Complete the questions to advance.'}</p>
              
              {currentStep === 0 && (
                <div className="bg-slate-800/50 rounded-xl p-6 mb-8 text-left border border-white/5">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Session Details</h3>
                  <ul className="space-y-2 text-sm text-slate-400">
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-cyan-400"/> Type: <span className="capitalize text-white">{session.type}</span></li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-cyan-400"/> Questions: <span className="text-white">{session.type === 'technical' ? codingQuestions.length : (questions.length || session.questionCount)}</span></li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-cyan-400"/> Passing Score: <span className="text-white">70%</span></li>
                  </ul>
                </div>
              )}
            </>
          )}
          
          {currentStep === 0 ? (
            <button
              onClick={() => setCurrentStep(1)}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/30"
            >
              <PlayCircle size={20} /> Begin Assessment
            </button>
          ) : session.type === 'technical' && currentStep <= codingQuestions.length ? (
            <>
              {/* Left side: Problem */}
              <div className="flex-1 flex flex-col bg-slate-800/50 rounded-xl border border-white/10 p-6 overflow-y-auto max-h-[600px]">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-cyan-400 uppercase">Coding Challenge {currentStep} of {codingQuestions.length}</span>
                  <span className={`text-xs px-2 py-1 rounded font-bold ${codingQuestions[currentStep - 1]?.difficulty === 'Advanced' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {codingQuestions[currentStep - 1]?.difficulty}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{codingQuestions[currentStep - 1]?.title}</h3>
                <div className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                  {codingQuestions[currentStep - 1]?.problemStatement}
                </div>
              </div>

              {/* Right side: Editor */}
              <div className="flex-[1.5] flex flex-col gap-4">
                <div className="flex justify-end">
                  <select
                    value={language}
                    onChange={(e) => {
                      setLanguage(e.target.value);
                      setCode(codingQuestions[currentStep - 1]?.starterCode[e.target.value] || '');
                    }}
                    className="bg-slate-800 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-cyan-500"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                  </select>
                </div>
                <div className="h-[400px] rounded-xl overflow-hidden border border-white/10 bg-[#1e1e1e]">
                  <Editor
                    height="100%"
                    language={language}
                    theme="vs-dark"
                    value={code || codingQuestions[currentStep - 1]?.starterCode[language]}
                    onChange={(val) => setCode(val || '')}
                    options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 16 } }}
                  />
                </div>
                
                {/* Output Terminal */}
                <div className="h-[120px] bg-[#0d1117] border border-white/10 rounded-xl p-4 font-mono text-sm overflow-y-auto">
                  <div className="text-slate-500 mb-1">Terminal Output:</div>
                  <div className={`whitespace-pre-wrap ${output.includes('Error') ? 'text-red-400' : 'text-slate-300'}`}>
                    {output || 'Click "Run Tests" to execute your code.'}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={handleRunTests}
                    disabled={isRunning}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-white/5 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isRunning ? <Loader2 size={18} className="animate-spin" /> : <PlayCircle size={18} />}
                    Run Tests
                  </button>
                  <button 
                    onClick={() => {
                      setCurrentStep(prev => prev + 1);
                      setCode(''); // reset for next question
                      setOutput('');
                    }}
                    className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                  >
                    Submit Code <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </>
          ) : session.type !== 'technical' && currentStep <= questions.length ? (
            <div className="space-y-4 text-left">
              <div className="p-6 border border-white/10 rounded-xl bg-slate-800/50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-cyan-400 uppercase">Question {currentStep} of {questions.length}</span>
                  <span className="text-xs text-slate-400">Score: {Math.floor((currentStep - 1) * (100 / questions.length))}%</span>
                </div>
                <p className="text-lg text-white mb-6">
                  {questions[currentStep - 1]?.text}
                </p>
                
                <div className="space-y-3">
                  {questions[currentStep - 1]?.options.map((opt, i) => {
                    const isSelected = selectedOption === i;
                    const letter = ['A', 'B', 'C', 'D'][i] || '?';
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedOption(i)}
                        className={`w-full text-left p-4 rounded-lg border transition-all flex items-center gap-3 ${
                          isSelected 
                            ? 'border-cyan-500 bg-cyan-900/30 text-white' 
                            : 'border-white/5 bg-slate-900/50 hover:bg-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white'
                        }`}
                      >
                        <span className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm ${isSelected ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800 text-slate-400'}`}>
                          {letter}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                
                {selectedOption !== null && (
                  <button
                    onClick={() => {
                      setCurrentStep(prev => prev + 1);
                      setSelectedOption(null);
                    }}
                    className="mt-6 w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/30"
                  >
                    Next Question <ChevronRight size={20} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-8 border border-emerald-500/30 rounded-xl bg-emerald-900/20 text-center">
                <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Assessment Complete!</h3>
                <p className="text-slate-300">You have successfully answered all questions.</p>
              </div>
              <button
                onClick={handleComplete}
                disabled={saving}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 disabled:opacity-50"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Award size={20} />}
                Submit Results
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
