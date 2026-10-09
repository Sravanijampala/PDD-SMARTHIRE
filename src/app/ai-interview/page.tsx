'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mic, MicOff, Video, VideoOff, Volume2, VolumeX, Play, Pause,
  RotateCcw, X, Maximize, Minimize, Wifi, WifiOff, MessageSquare,
  Award, Download, FileText, CheckCircle2, AlertCircle, Loader2,
  ChevronRight, BarChart3, Clock, User, Zap
} from 'lucide-react';
import { AIInterviewer, type InterviewConfig, type InterviewResult, type InterviewStage, type EvaluationScore } from '../../lib/aiInterviewer';
import {
  speak as ttsSpeak, stopSpeaking, startListening, stopListening,
  isSpeaking as getTTSSpeaking, createMicMeter, speakWithReplay, replayLastQuestion,
  type TranscriptEvent
} from '../../lib/voiceEngine';
import { ProctoringEngine, ViolationEvent } from '../../lib/proctoringEngine';
import { FaceDetectionEngine } from '../../lib/faceDetection';
import { ObjectDetectionEngine } from '../../lib/objectDetection';
import {
  generateCertificateCanvas, downloadCertificateAsPNG, downloadCertificateAsPDF,
  generateFromResult, getBadgeLevel, BADGE_COLORS, generateBadgeSVG,
  generateCertificateNumber, generateVerificationId, type CertificateData
} from '../../lib/certificateGenerator';
import { downloadReportAsPDF, downloadTranscriptAsTXT } from '../../lib/reportGenerator';
import { useAuth } from '../../lib/authContext';
import { saveInterview } from '../../lib/firestore';
import Link from 'next/link';

// ─────────────────────────────────────────────
//  Stage labels for display
// ─────────────────────────────────────────────
const STAGE_LABELS: Record<InterviewStage, string> = {
  greeting: 'Welcome',
  candidate_confirmation: 'Confirmation',
  self_introduction: 'Introduction',
  warmup: 'Warm-up',
  technical: 'Technical Round',
  scenario: 'Scenario Round',
  behavioral: 'Behavioral Round',
  leadership: 'Leadership Round',
  candidate_questions: 'Your Questions',
  feedback_summary: 'Feedback',
  closing: 'Closing',
};

const STAGE_COLORS: Record<InterviewStage, string> = {
  greeting: 'text-cyan-400',
  candidate_confirmation: 'text-cyan-400',
  self_introduction: 'text-purple-400',
  warmup: 'text-blue-400',
  technical: 'text-emerald-400',
  scenario: 'text-orange-400',
  behavioral: 'text-pink-400',
  leadership: 'text-amber-400',
  candidate_questions: 'text-sky-400',
  feedback_summary: 'text-green-400',
  closing: 'text-slate-400',
};

type InterviewPhase = 'initializing' | 'active' | 'ai_speaking' | 'listening' | 'processing' | 'paused' | 'completed';

interface LiveScore {
  technical: number;
  communication: number;
  confidence: number;
  grammar: number;
  overall: number;
}

// ─────────────────────────────────────────────
//  Waveform animation component
// ─────────────────────────────────────────────
function WaveformBars({ active, color = '#00BFFF', bars = 24 }: { active: boolean; color?: string; bars?: number }) {
  return (
    <div className="flex items-center gap-[3px]" style={{ height: 40 }}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 3,
            backgroundColor: color,
            borderRadius: 2,
            height: active ? `${20 + Math.sin(Date.now() / 200 + i * 0.5) * 15 + Math.random() * 8}px` : '4px',
            transition: 'height 0.1s ease',
            opacity: active ? 0.7 + Math.sin(i * 0.8) * 0.3 : 0.3,
            animation: active ? `wave-${i % 4} 0.${4 + (i % 5)}s ease-in-out infinite alternate` : 'none',
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
//  AI Avatar component
// ─────────────────────────────────────────────
function AIAvatar({ phase, stage }: { phase: InterviewPhase; stage: InterviewStage }) {
  const isSpeaking = phase === 'ai_speaking';
  const isThinking = phase === 'processing';

  return (
    <div className="relative flex flex-col items-center gap-4">
      {/* Avatar ring */}
      <div className={`relative w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center
        ${isSpeaking ? 'animate-pulse' : ''}`}
        style={{
          background: 'radial-gradient(circle, #0D1F3C 60%, #091428 100%)',
          boxShadow: isSpeaking
            ? '0 0 0 4px #00BFFF44, 0 0 40px #00BFFF33, 0 0 80px #00BFFF11'
            : isThinking
              ? '0 0 0 4px #A78BFA44, 0 0 30px #A78BFA22'
              : '0 0 0 2px #1E3A5F66',
        }}
      >
        {/* Outer ring animation */}
        {isSpeaking && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30 animate-ping" style={{ animationDuration: '1.5s' }} />
            <div className="absolute inset-[-8px] rounded-full border border-cyan-400/15 animate-ping" style={{ animationDuration: '2s' }} />
          </>
        )}

        {/* Avatar face */}
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border-2 border-slate-600 flex items-center justify-center text-5xl md:text-6xl overflow-hidden">
          <span className="select-none">🤖</span>
        </div>

        {/* Status indicator */}
        <div className={`absolute bottom-1 right-1 md:bottom-2 md:right-2 w-5 h-5 rounded-full border-2 border-[#060E1E] flex items-center justify-center
          ${isSpeaking ? 'bg-cyan-400' : isThinking ? 'bg-purple-400' : phase === 'listening' ? 'bg-emerald-400' : 'bg-slate-600'}`}>
          {isSpeaking && <Volume2 size={10} className="text-white" />}
          {isThinking && <div className="w-2 h-2 rounded-full bg-white animate-bounce" />}
          {phase === 'listening' && <Mic size={10} className="text-white" />}
        </div>
      </div>

      {/* Name + status */}
      <div className="text-center">
        <p className="text-white font-bold text-lg">Alex</p>
        <p className="text-xs text-slate-400">AI Interviewer · {STAGE_LABELS[stage]}</p>
      </div>

      {/* Speaking waveform */}
      {isSpeaking && (
        <div className="flex items-center gap-[3px]">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="bg-cyan-400 rounded-full"
              style={{
                width: 3,
                height: `${8 + Math.abs(Math.sin((Date.now() / 150 + i) * 0.8)) * 20}px`,
                animation: `waveBar 0.${3 + (i % 7)}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.04}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Thinking dots */}
      {isThinking && (
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Live Score Meter
// ─────────────────────────────────────────────
function ScoreMeter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span style={{ color }} className="font-bold">{value}%</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Post-interview result modal
// ─────────────────────────────────────────────
function ResultModal({
  result, candidateName, company, role, difficulty, onClose
}: {
  result: InterviewResult;
  candidateName: string;
  company: string;
  role: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  onClose: () => void;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [certCanvas, setCertCanvas] = useState<HTMLCanvasElement | null>(null);
  const [certData, setCertData] = useState<CertificateData | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [certGenerated, setCertGenerated] = useState(false);
  // Use a ref to ensure certData is generated exactly once (stable certificateNumber)
  const certDataRef = useRef<CertificateData | null>(null);
  const savedToFirestoreRef = useRef(false);

  const badgeLevel = getBadgeLevel(result.scores.overall);
  const badgeColors = BADGE_COLORS[badgeLevel];

  // ── Generate cert + save to localStorage on mount (once) ──────────────
  useEffect(() => {
    // Generate only once to keep certificateNumber stable
    if (certDataRef.current) return;

    const { canvas, data } = generateFromResult(candidateName, result, company, role, difficulty);
    certDataRef.current = data;
    setCertCanvas(canvas);
    setCertData(data);
    setCertGenerated(true);

    // Always save to localStorage immediately — no auth required
    try {
      const stored = localStorage.getItem('smarthire_certificates');
      const list: any[] = stored ? JSON.parse(stored) : [];
      if (!list.some((c: any) => c.certificateNumber === data.certificateNumber)) {
        const savedAt = Date.now();
        list.push({
          id: savedAt,
          savedAt,       // dedicated sort key — never overwritten by Firestore
          isSample: false,
          company: data.company,
          role: data.role,
          difficulty: data.difficulty,
          overallScore: data.overallScore,
          completionDate: data.completionDate,
          issueDate: data.issueDate,
          certificateNumber: data.certificateNumber,
          verificationId: data.verificationId,
          candidateName: data.candidateName,
        });
        localStorage.setItem('smarthire_certificates', JSON.stringify(list));
        console.log('[SmartHire] Certificate saved to localStorage:', data.certificateNumber);

        // Dispatch a storage event so same-tab listeners (certificates page) react immediately
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'smarthire_certificates',
          newValue: JSON.stringify(list),
          storageArea: localStorage,
        }));
      }
    } catch (e) {
      console.error('[SmartHire] Failed to save certificate to localStorage:', e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run exactly once on mount

  // ── Save to Firestore when user auth resolves ─────────────────────────
  useEffect(() => {
    if (!user?.id || !certDataRef.current || savedToFirestoreRef.current) return;
    savedToFirestoreRef.current = true;
    const data = certDataRef.current;

    const saveToFirestore = async () => {
      try {
        const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('../../lib/firebase');
        const certRef = doc(db, 'certificates', data.certificateNumber);
        await setDoc(certRef, {
          userId: user.id,
          candidateName: data.candidateName,
          company: data.company,
          role: data.role,
          difficulty: data.difficulty,
          overallScore: data.overallScore,
          completionDate: data.completionDate,
          issueDate: data.issueDate,
          certificateNumber: data.certificateNumber,
          verificationId: data.verificationId,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        console.log('[SmartHire] Certificate saved to Firestore:', data.certificateNumber);
      } catch (err) {
        console.error('[SmartHire] Failed to save certificate to Firestore:', err);
        savedToFirestoreRef.current = false; // Allow retry
      }
    };
    saveToFirestore();
  }, [user]); // Re-runs when auth state resolves

  const handleDownload = async (type: string) => {
    setDownloading(type);
    try {
      if (type === 'cert-png' && certCanvas) {
        downloadCertificateAsPNG(certCanvas, `SmartHire_Certificate_${candidateName.replace(/ /g, '_')}.png`);
      } else if (type === 'cert-pdf' && certCanvas) {
        await downloadCertificateAsPDF(certCanvas, `SmartHire_Certificate_${candidateName.replace(/ /g, '_')}.pdf`);
      } else if (type === 'report-pdf' && certData) {
        await downloadReportAsPDF({ candidateName, company, role, difficulty, result, certificateNumber: certData.certificateNumber });
      } else if (type === 'transcript') {
        downloadTranscriptAsTXT(result, candidateName);
      }
    } catch (err) {
      console.error('Download error:', err);
    }
    setTimeout(() => setDownloading(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0A1628] border border-slate-700/50 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900/40 to-cyan-900/40 border-b border-slate-700/50 p-6 text-center">
          <div className="text-6xl mb-3">{badgeColors.emoji}</div>
          <h2 className="text-3xl font-extrabold text-white">Interview Complete!</h2>
          <p className="text-slate-400 text-base mt-1">{role} · {company} · {difficulty}</p>
        </div>

        {/* Content Body (Two Columns on Web) */}
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Scores & Summary */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <div className="text-6xl font-extrabold" style={{ color: badgeColors.primary }}>
                  {result.scores.overall}%
                </div>
                <div className="text-sm text-slate-400 mt-1">Overall Score</div>
              </div>
              <div className="w-px h-16 bg-slate-700 mx-2" />
              <div className="text-center flex-1">
                <div className="text-3xl font-extrabold" style={{ color: badgeColors.primary }}>
                  {badgeLevel}
                </div>
                <div className="text-sm text-slate-400 mt-1">Achievement</div>
              </div>
              <div className="w-px h-16 bg-slate-700 mx-2" />
              <div className="text-center flex-1">
                <div className="text-3xl font-extrabold text-white">
                  {result.questionCount}
                </div>
                <div className="text-sm text-slate-400 mt-1">Questions</div>
              </div>
            </div>

            {/* Mini scores */}
            <div className="grid grid-cols-2 gap-4">
              <ScoreMeter label="Technical" value={result.scores.technical} color="#00BFFF" />
              <ScoreMeter label="Communication" value={result.scores.communication} color="#A78BFA" />
              <ScoreMeter label="Confidence" value={result.scores.confidence} color="#00E676" />
              <ScoreMeter label="Grammar" value={result.scores.grammar} color="#FFD700" />
            </div>

            {/* Summary */}
            <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 text-sm md:text-base text-slate-300 leading-relaxed shadow-inner">
              {result.summary}
            </div>
          </div>

          {/* Right Column: Certificate & Actions */}
          <div className="flex flex-col justify-between space-y-6">
            {/* Certificate preview */}
            {certGenerated && certCanvas ? (
              <div className="bg-slate-900/40 border border-slate-700/30 rounded-2xl p-4 text-center shadow-inner h-full flex flex-col justify-center">
                <p className="text-sm font-medium text-slate-400 mb-4">Certificate Preview</p>
                <img
                  src={certCanvas.toDataURL()}
                  alt="Certificate"
                  className="w-full rounded-xl object-contain max-h-56 mx-auto drop-shadow-xl"
                />
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-slate-700/30 rounded-2xl p-4 flex items-center justify-center h-full min-h-[200px]">
                <div className="text-slate-500 flex flex-col items-center">
                  <Loader2 size={32} className="animate-spin mb-2" />
                  <p>Generating Certificate...</p>
                </div>
              </div>
            )}

            <div>
              {/* Download buttons */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { key: 'cert-png', label: 'Cert PNG', icon: <Award size={15} />, color: 'bg-amber-600 hover:bg-amber-500', disabled: !certGenerated },
                  { key: 'cert-pdf', label: 'Cert PDF', icon: <FileText size={15} />, color: 'bg-orange-600 hover:bg-orange-500', disabled: !certGenerated },
                  { key: 'report-pdf', label: 'Full Report', icon: <BarChart3 size={15} />, color: 'bg-blue-600 hover:bg-blue-500', disabled: false },
                  { key: 'transcript', label: 'Transcript', icon: <MessageSquare size={15} />, color: 'bg-slate-700 hover:bg-slate-600', disabled: false },
                ].map(btn => (
                  <button
                    key={btn.key}
                    onClick={() => handleDownload(btn.key)}
                    disabled={btn.disabled || downloading === btn.key}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-white transition-all ${btn.color} disabled:opacity-40 shadow-lg`}
                  >
                    {downloading === btn.key ? <Loader2 size={15} className="animate-spin" /> : btn.icon}
                    {btn.label}
                  </button>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex gap-3">
                <Link href="/certificates" className="flex-1">
                  <button className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg">
                    <Award size={18} /> My Certificates
                  </button>
                </Link>
                <Link href="/dashboard" className="flex-1">
                  <button className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg">
                    Dashboard <ChevronRight size={18} />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Exit confirmation dialog
// ─────────────────────────────────────────────
function ExitDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0D1730] border border-slate-700/50 rounded-3xl p-8 max-w-sm w-full text-center">
        <AlertCircle size={48} className="text-amber-400 mx-auto mb-4" />
        <h3 className="text-xl font-extrabold text-white mb-2">Exit Interview?</h3>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          Are you sure you want to exit? Your progress will be saved and a partial report will be generated.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all">
            Keep Going
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all">
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main AI Interview Room
// ─────────────────────────────────────────────
function AIInterviewRoom() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // URL params
  const company = searchParams.get('company') || 'Google';
  const role = searchParams.get('role') || 'Software Engineer';
  const difficulty = (searchParams.get('difficulty') || 'Medium') as 'Easy' | 'Medium' | 'Hard';
  const candidateName = user?.name || searchParams.get('name') || 'Candidate';

  // Core state
  const [phase, setPhase] = useState<InterviewPhase>('initializing');
  const [stage, setStage] = useState<InterviewStage>('greeting');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [transcript, setTranscript] = useState(''); // live candidate transcript
  const [liveSubtitle, setLiveSubtitle] = useState(''); // AI subtitle
  const [questionNumber, setQuestionNumber] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Scores
  const [liveScore, setLiveScore] = useState<LiveScore>({ technical: 0, communication: 0, confidence: 0, grammar: 0, overall: 0 });
  const [accumulatedScores, setAccumulatedScores] = useState<Partial<EvaluationScore>[]>([]);
  const micLevelTextRef = useRef<HTMLSpanElement>(null);
  const micLevelBarRef = useRef<HTMLDivElement>(null);

  // Camera
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [hasCamera, setHasCamera] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // UI state
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [interviewResult, setInterviewResult] = useState<InterviewResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [conversationLog, setConversationLog] = useState<Array<{ role: 'ai' | 'candidate'; text: string; time: string }>>([]);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const micMeterRef = useRef<Awaited<ReturnType<typeof createMicMeter>> | null>(null);
  const aiRef = useRef<AIInterviewer | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const micLevelAnimRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const isEndedRef = useRef<boolean>(false);
  const endInterviewRef = useRef<() => void>(() => {}); // Always holds latest endInterview

  // Proctoring
  const [warnings, setWarnings] = useState<string[]>([]);
  const proctorRef = useRef<ProctoringEngine | null>(null);
  const faceEngineRef = useRef<FaceDetectionEngine | null>(null);
  const objectEngineRef = useRef<ObjectDetectionEngine | null>(null);
  const faceAnimRef = useRef<number>(0);

  // ── Keep endInterviewRef in sync with latest endInterview ──
  useEffect(() => {
    endInterviewRef.current = () => endInterview();
  });

  // ── Audio proctoring state sync ────────────────
  useEffect(() => {
    if (proctorRef.current) {
      proctorRef.current.expectedToSpeak = (phase === 'listening' || phase === 'active');
    }
  }, [phase]);

  // ── Internet monitor ─────────────────────────
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  // ── Timer ────────────────────────────────────
  useEffect(() => {
    if (phase === 'active' || phase === 'ai_speaking' || phase === 'listening' || phase === 'processing') {
      if (!timerRef.current) {
        startTimeRef.current = Date.now() - elapsedSeconds * 1000;
        timerRef.current = setInterval(() => {
          setElapsedSeconds(Math.round((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
      }
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // ── Mic level animation ───────────────────────
  useEffect(() => {
    const animate = () => {
      if (micMeterRef.current) {
        const level = micMeterRef.current.getLevel();
        if (micLevelTextRef.current) {
          micLevelTextRef.current.innerText = `${level}%`;
        }
        if (micLevelBarRef.current) {
          micLevelBarRef.current.style.width = `${level}%`;
          micLevelBarRef.current.style.backgroundColor = level > 10 ? '#34d399' : '#0f172a';
        }
      }
      micLevelAnimRef.current = requestAnimationFrame(animate);
    };
    micLevelAnimRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(micLevelAnimRef.current);
  }, []);

  // ── Auto-scroll conversation ──────────────────
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationLog]);

  // ── Keyboard shortcuts ────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && phase === 'listening') { e.preventDefault(); submitAnswer(); }
      if (e.code === 'KeyR' && (phase === 'active' || phase === 'listening')) replayQuestion();
      if (e.code === 'Escape') setShowExitDialog(true);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase]);

  // ── Initialize camera + AI on mount ──────────
  useEffect(() => {
    initInterview();
    return () => cleanup();
  }, []);

  const initInterview = async () => {
    setPhase('initializing');

    // Initialize Proctoring Engine
    proctorRef.current = new ProctoringEngine((event: ViolationEvent, total: number) => {
      // Add to warnings list
      setWarnings(prev => [...prev, event.message]);

      // These are ALL fatal malpractice violations → immediately terminate
      const fatalViolations = [
        'mobile_phone',       // phone detected
        'background_noise',   // voice detected while AI is speaking
        'multiple_people',    // another person in room
        'multiple_faces',     // another face in camera
        'off_camera_speaker', // voice with closed mouth
      ];

      if (fatalViolations.includes(event.type)) {
        // Use ref to avoid stale closure — always call the LATEST endInterview
        setFatalError(`🚨 Malpractice Detected: ${event.message}`);
        endInterviewRef.current();
        // Also stop all proctoring immediately
        proctorRef.current?.stop();
        faceEngineRef.current?.destroy();
        objectEngineRef.current?.destroy();
      } else if (event.type === 'no_face') {
        // Candidate left camera — terminate
        setFatalError(`Interview Terminated: ${event.message}`);
        endInterviewRef.current();
      } else if (total >= 3) {
        // 3 minor violations (tab switch, copy-paste, etc.) → terminate
        setFatalError('Interview terminated due to multiple security violations.');
        endInterviewRef.current();
      }
    });
    proctorRef.current.start();

    const isNative = typeof window !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // ── Init camera FIRST so videoRef.current is populated before detection loops ──
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: !isNative,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      if (!isNative) {
        micMeterRef.current = await createMicMeter(stream);
        proctorRef.current?.startAudioMonitoring(stream);
      }
      setHasCamera(true);
    } catch {
      if (!isNative) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          mediaStreamRef.current = audioStream;
          micMeterRef.current = await createMicMeter(audioStream);
          proctorRef.current?.startAudioMonitoring(audioStream);
        } catch {
          setInitError('Could not access microphone. Please grant microphone permission and refresh.');
          return;
        }
      }
    }

    // ── Initialize Face Engine (AFTER camera is ready) ──
    faceEngineRef.current = new FaceDetectionEngine();
    await faceEngineRef.current.init();

    // Start face detection loop (runs every 500ms)
    const detectFacesLoop = async () => {
      if (faceEngineRef.current && videoRef.current && videoRef.current.readyState >= 2 && proctorRef.current) {
        const { numFaces, mouthOpenness } = await faceEngineRef.current.detectFaces(videoRef.current);

        // ⚡ INSTANT: No face = terminate on first detection
        if (numFaces === 0) {
          proctorRef.current.reportViolation('no_face', '🚨 Candidate not visible in camera. Interview terminated.');
        }

        // ⚡ INSTANT: Another face = terminate on first detection
        if (numFaces > 1) {
          proctorRef.current.reportViolation('multiple_faces', `🚨 Another person detected in camera (${numFaces} faces). Interview terminated.`);
        }

        // Lip-Sync: off-camera speaker — terminate on first detection
        const currentMicLevel = micMeterRef.current?.getLevel() || 0;
        const isMouthClosed = mouthOpenness !== undefined && mouthOpenness < 8;
        const isSoundDetected = currentMicLevel > 5;

        // Debug readouts
        const dbgMouth = document.getElementById('debug-mouth');
        const dbgMic = document.getElementById('debug-mic');
        if (dbgMouth) dbgMouth.innerText = `Mouth: ${mouthOpenness !== undefined ? mouthOpenness.toFixed(1) : '--'}px`;
        if (dbgMic) dbgMic.innerText = `Mic: ${currentMicLevel.toFixed(1)}%`;

        if (isSoundDetected && isMouthClosed) {
          proctorRef.current.reportViolation('off_camera_speaker', '🚨 Voice detected but candidate mouth is closed — off-camera speaker suspected.');
        }
      }
      if (faceEngineRef.current) {
        setTimeout(detectFacesLoop, 500);
      }
    };
    setTimeout(detectFacesLoop, 2000);

    // ── Initialize Object Detection Engine ──
    objectEngineRef.current = new ObjectDetectionEngine();
    await objectEngineRef.current.init();

    // Start object detection loop (runs every 1000ms)
    const detectViolationsLoop = async () => {
      const dbgObj = document.getElementById('debug-obj');
      if (objectEngineRef.current && videoRef.current && videoRef.current.readyState >= 2 && proctorRef.current) {
        if (!objectEngineRef.current.initialized) {
          if (dbgObj) dbgObj.innerText = 'Object AI: ❌ failed to load';
          if (objectEngineRef.current) setTimeout(detectViolationsLoop, 1000);
          return;
        }
        if (dbgObj) dbgObj.innerText = 'Object AI: ✅ scanning...';
        const { hasPhone, multiplePeople } = await objectEngineRef.current.detectViolations(videoRef.current);

        // ⚡ INSTANT: First phone detection → terminate
        if (hasPhone) {
          if (dbgObj) dbgObj.innerText = 'Object AI: 🚨 PHONE!';
          proctorRef.current.reportViolation('mobile_phone', '🚨 Mobile phone detected. Interview terminated.');
        }

        // ⚡ INSTANT: First multiple people detection → terminate
        if (multiplePeople) {
          proctorRef.current.reportViolation('multiple_people', '🚨 Multiple people detected in camera frame. Interview terminated.');
        }
      }
      if (objectEngineRef.current) {
        setTimeout(detectViolationsLoop, 1000);
      }
    };
    setTimeout(detectViolationsLoop, 3000); // wait 3s for AI models to load first

    // Init AI Interviewer
    const config: InterviewConfig = {
      company, role, difficulty,
      candidateName,
    };
    aiRef.current = new AIInterviewer(config);

    // Small delay for smooth UX
    await new Promise(r => setTimeout(r, 800));
    setPhase('active');

    // Start with greeting
    await generateAIResponse();
  };

  const cleanup = () => {
    stopSpeaking();
    stopListening();
    if (timerRef.current) clearInterval(timerRef.current);
    cancelAnimationFrame(micLevelAnimRef.current);
    if (micMeterRef.current) micMeterRef.current.destroy();
    if (objectEngineRef.current) objectEngineRef.current.destroy();
    if (proctorRef.current) proctorRef.current.stop();
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
  };

  // ── Generate AI response ──────────────────────
  const generateAIResponse = useCallback(async () => {
    if (!aiRef.current) return;
    setPhase('processing');
    setTranscript('');

    try {
      const { text, stage: newStage, isEnding } = await aiRef.current.generateNextMessage();
      
      // Abort if the interview was terminated while the AI was thinking
      if (isEndedRef.current) return;
      
      setStage(newStage);
      setCurrentQuestion(text);
      setLiveSubtitle(text);
      setQuestionNumber(n => n + 1);

      // Add to conversation log
      const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      setConversationLog(prev => [...prev, { role: 'ai', text, time }]);

      // Speak the response
      setPhase('ai_speaking');
      await speakWithReplay(text);
      setLiveSubtitle('');

      if (isEnding || newStage === 'closing') {
        // Interview is over
        await endInterview();
      } else {
        // Now listen to candidate
        setPhase('listening');
        startCandidateListening();
      }
    } catch (err) {
      console.error('AI response error:', err);
      setPhase('listening');
      startCandidateListening();
    }
  }, []);

  // ── Start listening to candidate ─────────────
  const startCandidateListening = useCallback(() => {
    if (!micOn) return;

    startListening(
      (event: TranscriptEvent) => {
        setTranscript(event.final || event.interim);
      },
      async (finalTranscript: string) => {
        // Silence detected — candidate finished speaking
        if (!finalTranscript.trim()) {
          // Re-listen if nothing was captured
          setTimeout(startCandidateListening, 500);
          return;
        }

        await handleCandidateResponse(finalTranscript);
      },
      (error: string) => {
        console.warn('STT error:', error);
        setPhase('active');
      }
    );
  }, [micOn]);

  // ── Handle candidate response ─────────────────
  const handleCandidateResponse = useCallback(async (candidateText: string) => {
    if (!aiRef.current) return;

    stopListening();
    setPhase('processing');

    // Add to log
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setConversationLog(prev => [...prev, { role: 'candidate', text: candidateText, time }]);

    // Check face tracking before analyzing response
    let eyeContactScore = 70;
    if (faceEngineRef.current && videoRef.current) {
      const faceData = await faceEngineRef.current.detectFaces(videoRef.current);
      if (faceData) {
        if (faceData.numFaces > 1) {
          proctorRef.current?.reportViolation('multiple_faces', 'Multiple faces detected while answering.');
        } else if (faceData.numFaces === 0) {
          proctorRef.current?.reportViolation('no_face', 'No face detected while answering.');
        }
      }
    }

    const durationMs = Date.now() - startTimeRef.current;
    const scores = aiRef.current.analyzeResponse(candidateText, durationMs);
    scores.eyeContact = eyeContactScore;
    setAccumulatedScores(prev => [...prev, scores]);

    // Update live scores with running average
    setLiveScore(prev => {
      const newTech = scores.technical ?? prev.technical;
      const newComm = scores.communication ?? prev.communication;
      const newConf = scores.confidence ?? prev.confidence;
      const newGram = scores.grammar ?? prev.grammar;
      const avgTech = Math.round((prev.technical * 0.6 + newTech * 0.4));
      const avgComm = Math.round((prev.communication * 0.6 + newComm * 0.4));
      const avgConf = Math.round((prev.confidence * 0.6 + newConf * 0.4));
      const avgGram = Math.round((prev.grammar * 0.6 + newGram * 0.4));
      return {
        technical: avgTech || newTech,
        communication: avgComm || newComm,
        confidence: avgConf || newConf,
        grammar: avgGram || newGram,
        overall: Math.round(((avgTech || newTech) + (avgComm || newComm) + (avgConf || newConf) + (avgGram || newGram)) / 4),
      };
    });

    // Add candidate message to AI context
    aiRef.current.addCandidateResponse(candidateText);

    // Generate next AI question
    await generateAIResponse();
  }, [generateAIResponse]);

  // ── Manual submit ────────────────────────────
  const submitAnswer = useCallback(() => {
    if (phase !== 'listening') return;
    stopListening();
    if (transcript.trim()) {
      handleCandidateResponse(transcript);
    } else {
      handleCandidateResponse("I'd like to think about that for a moment before answering.");
    }
  }, [phase, transcript, handleCandidateResponse]);

  // ── Replay last question ─────────────────────
  const replayQuestion = useCallback(async () => {
    if (phase === 'ai_speaking') return;
    stopListening();
    setPhase('ai_speaking');
    await replayLastQuestion();
    setPhase('listening');
    startCandidateListening();
  }, [phase, startCandidateListening]);

  // ── Pause / resume ───────────────────────────
  const togglePause = useCallback(() => {
    if (isPaused) {
      setIsPaused(false);
      setPhase('listening');
      startCandidateListening();
    } else {
      setIsPaused(true);
      stopSpeaking();
      stopListening();
      setPhase('paused');
    }
  }, [isPaused, startCandidateListening]);

  // ── End interview ────────────────────────────
  const endInterview = useCallback(async () => {
    isEndedRef.current = true;
    stopSpeaking();
    stopListening();
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (!aiRef.current) return;

    setPhase('completed');
    const result = aiRef.current.generateResult(elapsedSeconds, accumulatedScores);
    setInterviewResult(result);

    // Save result to Firebase in real-time
    if (user?.id) {
      const interviewId = `${user.id}_${Date.now()}`;
      saveInterview(interviewId, {
        userId: user.id,
        candidateName,
        company,
        role,
        difficulty,
        duration: elapsedSeconds,
        result: {
          scores: result.scores,
          summary: result.summary,
          questionCount: result.questionCount
        },
        createdAt: new Date()
      }).catch(err => console.error('Failed to save interview data:', err));
    }

    // Small delay for dramatic effect
    await new Promise(r => setTimeout(r, 1200));
    setShowResult(true);
  }, [elapsedSeconds, accumulatedScores, user, candidateName, company, role, difficulty]);

  // ── Toggle mic ───────────────────────────────
  const toggleMic = () => {
    setMicOn(prev => {
      const next = !prev;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getAudioTracks().forEach(t => (t.enabled = next));
      }
      if (!next) stopListening();
      return next;
    });
  };

  // ── Toggle camera ────────────────────────────
  const toggleCam = () => {
    setCamOn(prev => {
      const next = !prev;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getVideoTracks().forEach(t => (t.enabled = next));
      }
      return next;
    });
  };

  // ── Fullscreen ───────────────────────────────
  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // ── Exit handler ─────────────────────────────
  const handleExit = () => {
    cleanup();
    endInterview();
  };

  // ── Format time ──────────────────────────────
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // ─────────────────────────────────────────────
  //  Render: Init error
  // ─────────────────────────────────────────────
  if (initError) {
    return (
      <div className="min-h-screen bg-[#060E1E] flex items-center justify-center px-4">
        <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-8 max-w-sm w-full text-center">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Setup Failed</h2>
          <p className="text-slate-400 text-sm mb-6">{initError}</p>
          <Link href="/interview-permissions">
            <button className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-2xl transition-all">
              Go Back & Check Permissions
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  //  Render: Initializing
  // ─────────────────────────────────────────────
  if (phase === 'initializing') {
    return (
      <div className="min-h-screen bg-[#060E1E] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Loader2 size={40} className="text-cyan-400 animate-spin" />
          </div>
          <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-ping" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-1">Setting Up Your Interview</h2>
          <p className="text-slate-400 text-sm">{company} · {role} · {difficulty}</p>
        </div>
        <div className="flex gap-2">
          {['Camera', 'Microphone', 'AI Engine'].map((s, i) => (
            <div key={s} className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
              <Loader2 size={11} className="animate-spin text-cyan-400" style={{ animationDelay: `${i * 0.2}s` }} />
              {s}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  //  Main interview room layout
  // ─────────────────────────────────────────────
  return (
    <div ref={containerRef} className="min-h-screen w-full bg-[#060E1E] text-slate-100 flex flex-col overflow-hidden">
      {/* CSS for wave animations */}
      <style>{`
        @keyframes waveBar { from { transform: scaleY(0.3); } to { transform: scaleY(1); } }
        @keyframes waveBar2 { from { transform: scaleY(0.5); } to { transform: scaleY(1.2); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      `}</style>

      {/* ── Top bar ──────────────────────────────── */}
      <header className="flex-shrink-0 bg-[#080D1A]/90 backdrop-blur-xl border-b border-slate-800/60 px-4 md:px-6 py-3 flex items-center justify-between gap-3 z-10">
        {/* Left: Company + role */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-red-400">LIVE</span>
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">{company} · {role}</p>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${STAGE_COLORS[stage]}`}>{STAGE_LABELS[stage]}</span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-500">Q{questionNumber}</span>
            </div>
          </div>
        </div>

        {/* Center: Timer + status */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border
            ${phase === 'ai_speaking' ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-400' :
              phase === 'listening' ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400' :
              phase === 'processing' ? 'bg-purple-950/60 border-purple-500/40 text-purple-400' :
              phase === 'paused' ? 'bg-amber-950/60 border-amber-500/40 text-amber-400' :
              'bg-slate-900 border-slate-700 text-slate-400'}`}
          >
            {phase === 'ai_speaking' && <><Volume2 size={11} /> AI Speaking</>}
            {phase === 'listening' && <><Mic size={11} /> Listening</>}
            {phase === 'processing' && <><Loader2 size={11} className="animate-spin" /> Thinking</>}
            {phase === 'paused' && <><Pause size={11} /> Paused</>}
            {phase === 'active' && <><Zap size={11} /> Ready</>}
          </div>
          <div className="flex items-center gap-1.5 text-sm font-mono font-bold text-slate-300 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
            <Clock size={13} className="text-slate-500" />
            {formatTime(elapsedSeconds)}
          </div>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-2">
          {isOnline
            ? <Wifi size={15} className="text-emerald-400" />
            : <WifiOff size={15} className="text-red-400 animate-pulse" />
          }
          <button onClick={toggleFullscreen} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
          <button onClick={() => setShowExitDialog(true)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>
      </header>

      {/* Violation Notification Toasts */}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[150] flex flex-col gap-2 items-center pointer-events-none w-full max-w-lg px-4">
        {warnings.slice(-3).map((msg, i) => (
          <div key={i} className="flex items-center gap-2 bg-amber-950/95 border border-amber-500/60 text-amber-300 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-sm animate-in slide-in-from-top w-full">
            <AlertCircle size={13} className="text-amber-400 flex-shrink-0" />
            <span>⚠ Security Violation: {msg}</span>
          </div>
        ))}
      </div>

      {/* Fatal Error Modal */}
      {fatalError && (
        <div className="fixed inset-0 z-[200] bg-red-900/90 backdrop-blur-xl flex flex-col items-center justify-center p-4">
          <AlertCircle size={64} className="text-white mb-4 animate-bounce" />
          <h2 className="text-4xl font-extrabold text-white mb-2">Interview Terminated</h2>
          <p className="text-xl text-red-200 mb-8 max-w-lg text-center">{fatalError}</p>
          <Link href="/dashboard">
            <button className="px-8 py-4 bg-white text-red-900 font-bold rounded-2xl shadow-xl hover:bg-slate-200 transition-all">
              Return to Dashboard
            </button>
          </Link>
        </div>
      )}

      {/* ── Main content ──────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden min-h-0">

        {/* ── Left panel: Camera + transcript ───────── */}
        <div className="lg:w-72 xl:w-80 flex-shrink-0 flex flex-col bg-[#080D1A] border-b lg:border-b-0 lg:border-r border-slate-800/60">

          {/* Camera preview */}
          <div className="relative aspect-video lg:aspect-auto lg:h-52 xl:h-60 bg-slate-950 flex-shrink-0 overflow-hidden">
            <video
              ref={videoRef}
              autoPlay playsInline muted
              className={`w-full h-full object-cover transform -scale-x-100 ${hasCamera && camOn ? 'opacity-100' : 'opacity-0'}`}
            />
            {(!hasCamera || !camOn) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950">
                <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <User size={28} className="text-slate-500" />
                </div>
                <span className="text-xs text-slate-500">{!hasCamera ? 'No Camera' : 'Camera Off'}</span>
              </div>
            )}
            {/* LIVE badge */}
            {hasCamera && camOn && (
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-white">YOU</span>
              </div>
            )}
          </div>

          {/* Mic meter */}
          <div className="px-4 py-3 border-b border-slate-800/60 flex-shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Mic size={12} className={micOn ? 'text-emerald-400' : 'text-slate-600'} />
                Microphone
              </div>
              <span ref={micLevelTextRef} className="text-xs font-bold text-emerald-400">0%</span>
            </div>
            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                ref={micLevelBarRef}
                className="h-full rounded-full transition-all duration-75"
                style={{
                  width: `0%`,
                  background: '#3B82F6',
                }}
              />
            </div>
          </div>

          {/* Conversation log */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold px-1">Conversation</p>
            {conversationLog.map((msg, i) => (
              <div key={i} style={{ animation: 'fadeIn 0.3s ease' }}
                className={`p-2.5 rounded-xl text-xs leading-relaxed border ${msg.role === 'ai'
                  ? 'bg-cyan-950/30 border-cyan-500/20 text-cyan-100'
                  : 'bg-slate-800/60 border-slate-700/40 text-slate-300'}`}>
                <span className={`font-bold text-[10px] block mb-1 ${msg.role === 'ai' ? 'text-cyan-400' : 'text-purple-400'}`}>
                  {msg.role === 'ai' ? '🤖 Alex' : '👤 You'} · {msg.time}
                </span>
                {msg.text.length > 120 ? `${msg.text.slice(0, 120)}…` : msg.text}
              </div>
            ))}
            <div ref={conversationEndRef} />
          </div>
        </div>

        {/* ── Center: AI avatar + current question ───── */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 py-6 gap-6 min-h-0">

          {/* AI Avatar */}
          <AIAvatar phase={phase} stage={stage} />

          {/* Current AI question display */}
          {currentQuestion && (
            <div className="w-full max-w-2xl">
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 md:p-6 text-center shadow-xl">
                <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${STAGE_COLORS[stage]}`}>
                  {STAGE_LABELS[stage]} — Question {questionNumber}
                </p>
                <p className="text-white text-base md:text-lg leading-relaxed font-medium">
                  {currentQuestion}
                </p>
              </div>
            </div>
          )}

          {/* Live subtitle (AI speaking) */}
          {liveSubtitle && phase === 'ai_speaking' && (
            <div className="w-full max-w-2xl">
              <div className="bg-cyan-950/20 border border-cyan-500/20 rounded-xl px-4 py-2 text-center">
                <p className="text-cyan-300 text-sm leading-relaxed italic">
                  "{liveSubtitle.slice(0, 160)}{liveSubtitle.length > 160 ? '…' : ''}"
                </p>
              </div>
            </div>
          )}

          {/* Candidate transcript */}
          {phase === 'listening' && (
            <div className="w-full max-w-2xl">
              <div className={`border rounded-2xl p-4 text-center transition-all
                ${transcript ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-slate-900/40 border-slate-700/40'}`}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-emerald-400">LISTENING...</span>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                </div>
                <p className={`text-sm leading-relaxed ${transcript ? 'text-white' : 'text-slate-500 italic'}`}>
                  {transcript || 'Speak your answer — I\'m listening...'}
                </p>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {/* Mic */}
            <button onClick={toggleMic}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all border
                ${micOn ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/60' : 'bg-red-950/40 border-red-500/40 text-red-400 hover:bg-red-950/60'}`}>
              {micOn ? <Mic size={15} /> : <MicOff size={15} />}
              {micOn ? 'Mic On' : 'Mic Off'}
            </button>

            {/* Camera */}
            <button onClick={toggleCam}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all border
                ${camOn ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'}`}>
              {camOn ? <Video size={15} /> : <VideoOff size={15} />}
              {camOn ? 'Camera On' : 'Camera Off'}
            </button>

            {/* Replay */}
            <button onClick={replayQuestion} disabled={phase === 'ai_speaking' || phase === 'processing'}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all disabled:opacity-40">
              <RotateCcw size={15} /> Replay
            </button>

            {/* Submit / Done answering */}
            {phase === 'listening' && (
              <button onClick={submitAnswer}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white transition-all shadow-lg shadow-cyan-500/20">
                <CheckCircle2 size={15} /> Done Answering
              </button>
            )}

            {/* Pause */}
            <button onClick={togglePause} disabled={phase === 'completed'}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all disabled:opacity-40">
              {isPaused ? <Play size={15} /> : <Pause size={15} />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>

            {/* End */}
            <button onClick={() => setShowExitDialog(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-950/60 transition-all">
              <X size={15} /> End
            </button>
          </div>
        </div>

        {/* ── Right panel: Live dashboard ───────────── */}
        <div className="lg:w-64 xl:w-72 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-slate-800/60 bg-[#080D1A] flex flex-col overflow-y-auto">
          <div className="p-4 space-y-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Live Dashboard</p>

            {/* Overall score circle */}
            <div className="flex justify-center">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path stroke="#1E293B" strokeWidth="3.5" fill="none" strokeDasharray="100,100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path stroke="#00BFFF" strokeWidth="3.5" fill="none" strokeLinecap="round"
                    strokeDasharray={`${liveScore.overall},100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-extrabold text-white">
                  {liveScore.overall || '--'}
                </span>
              </div>
            </div>
            <p className="text-center text-xs text-slate-500">Live Score</p>

            {/* Debug Info */}
            <div className="bg-slate-900 rounded-lg p-2 text-[10px] text-slate-400 font-mono space-y-0.5">
              <p id="debug-mouth">Mouth: --</p>
              <p id="debug-mic">Mic: --</p>
              <p id="debug-obj" className="text-slate-600">Object AI: loading...</p>
            </div>

            {/* Score bars */}
            <div className="space-y-3">
              <ScoreMeter label="Technical" value={liveScore.technical || 0} color="#00BFFF" />
              <ScoreMeter label="Communication" value={liveScore.communication || 0} color="#A78BFA" />
              <ScoreMeter label="Confidence" value={liveScore.confidence || 0} color="#00E676" />
              <ScoreMeter label="Grammar" value={liveScore.grammar || 0} color="#FFD700" />
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-800" />

            {/* Stage progress */}
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">Interview Stages</p>
              {(['greeting', 'warmup', 'technical', 'behavioral', 'leadership', 'closing'] as InterviewStage[]).map(s => {
                const stages: InterviewStage[] = ['greeting', 'candidate_confirmation', 'self_introduction', 'warmup', 'technical', 'scenario', 'behavioral', 'leadership', 'candidate_questions', 'feedback_summary', 'closing'];
                const currentIdx = stages.indexOf(stage);
                const sIdx = stages.indexOf(s);
                const isDone = sIdx < currentIdx;
                const isCurrent = s === stage;

                return (
                  <div key={s} className="flex items-center gap-2 py-1">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isDone ? 'bg-emerald-400' : isCurrent ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'}`} />
                    <span className={`text-xs ${isDone ? 'text-slate-500 line-through' : isCurrent ? `font-bold ${STAGE_COLORS[stage]}` : 'text-slate-600'}`}>
                      {STAGE_LABELS[s]}
                    </span>
                    {isDone && <CheckCircle2 size={10} className="text-emerald-400 ml-auto" />}
                    {isCurrent && <ChevronRight size={10} className="text-cyan-400 ml-auto animate-pulse" />}
                  </div>
                );
              })}
            </div>

            {/* Security Violations Panel */}
            {warnings.length > 0 && (
              <div className="bg-amber-950/30 border border-amber-500/20 rounded-xl p-3">
                <p className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1">
                  <AlertCircle size={10} /> Security ({warnings.length})
                </p>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {warnings.map((w, i) => (
                    <p key={i} className="text-[10px] text-amber-300/70 leading-tight">• {w}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="h-px bg-slate-800" />

            {/* Internet status */}
            <div className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold
              ${isOnline ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-400' : 'bg-red-950/30 border-red-500/20 text-red-400'}`}>
              {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
              {isOnline ? 'Connection: Stable' : 'No Connection!'}
            </div>

            {/* Difficulty badge */}
            <div className={`text-center text-xs font-bold py-1.5 rounded-xl border
              ${difficulty === 'Hard' ? 'bg-red-950/30 border-red-500/20 text-red-400' :
                difficulty === 'Medium' ? 'bg-amber-950/30 border-amber-500/20 text-amber-400' :
                'bg-emerald-950/30 border-emerald-500/20 text-emerald-400'}`}>
              {difficulty} Difficulty
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────── */}
      {showExitDialog && (
        <ExitDialog onConfirm={handleExit} onCancel={() => setShowExitDialog(false)} />
      )}

      {showResult && interviewResult && (
        <ResultModal
          result={interviewResult}
          candidateName={candidateName}
          company={company}
          role={role}
          difficulty={difficulty}
          onClose={() => router.push('/dashboard')}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Export with Suspense wrapper
// ─────────────────────────────────────────────
export default function AIInterviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#060E1E] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading Interview Room...</p>
        </div>
      </div>
    }>
      <AIInterviewRoom />
    </Suspense>
  );
}
