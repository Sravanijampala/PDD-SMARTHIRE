import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, X, Code, Network, Users, Lightbulb, Briefcase,
  Palette, Star, CheckCircle2, FileText, Zap, Calendar, Award,
  Camera, Mic, MicOff, Play, Search, UserCheck, Sliders, MessageSquare,
  Download, Upload, Volume2, VideoOff, RefreshCw, AlertCircle, VolumeX
} from 'lucide-react';

export type FeatureType =
  | 'prep_level'
  | 'interview_modules'
  | 'round_setup'
  | 'live_session'
  | 'feedback_modal'
  | 'performance_report'
  | 'resume'
  | 'performance'
  | 'recruiter'
  | 'recent_interview'
  | null;

interface FeatureModalProps {
  activeFeature: FeatureType;
  selectedModule?: string | null;
  selectedActivity?: { title: string; score: string } | null;
  onClose: () => void;
  onNavigate?: (feature: FeatureType) => void;
}

export function FeatureModals({
  activeFeature,
  selectedModule: initialModule,
  selectedActivity,
  onClose,
  onNavigate
}: FeatureModalProps) {
  const router = useRouter();
  // Navigation & selection states
  const [currentModule, setCurrentModule] = useState<string>(initialModule || 'Technical Round');
  const [selectedRole, setSelectedRole] = useState('Senior Android Developer');
  const [difficulty, setDifficulty] = useState<'Entry' | 'Mid-Level' | 'Senior'>('Mid-Level');
  const [includeCoding, setIncludeCoding] = useState(true);

  // Real Camera & Microphone Hardware states
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [hasRealCamera, setHasRealCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState(45);
  
  // AI Speech & Voice states
  const [isAISpeaking, setIsAISpeaking] = useState(true);
  const [aiSpeechText, setAiSpeechText] = useState('');
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // File Upload states for Resume Analyzer
  const [uploadedFileName, setUploadedFileName] = useState<string>('Selected_Resume.pdf');
  const [uploadedFileSize, setUploadedFileSize] = useState<string>('245 KB');
  const [atsScore, setAtsScore] = useState<number>(88);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Session & Feedback states
  const [sessionTime, setSessionTime] = useState(291);
  const [currentState, setCurrentState] = useState('Attentive & Listening');
  const [userThoughts, setUserThoughts] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [sessionPhase, setSessionPhase] = useState<'greeting' | 'interview' | 'closing'>('greeting');

  // Candidate Voice Reply states
  const [isListening, setIsListening] = useState(false);
  const [candidateTranscript, setCandidateTranscript] = useState('');
  const [replyError, setReplyError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Text-To-Speech: AI Speaks First Out Loud
  const speakAIGreeting = (text: string) => {
    setAiSpeechText(text);
    setIsAISpeaking(true);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setIsAISpeaking(true);
      };

      utterance.onend = () => {
        setIsAISpeaking(false);
      };

      utterance.onerror = () => {
        setIsAISpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsAISpeaking(false), 4000);
    }
  };

  // Start Real Hardware Webcam & Microphone Stream
  // Uses progressive fallback so laptop cameras always work
  const initWebcamStream = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not available in this browser.');
      }

      let stream: MediaStream | null = null;

      // Strategy 1: HD video + audio (best quality)
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
      } catch {
        // Strategy 2: Basic video + audio (works on most laptops)
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
        } catch {
          // Strategy 3: Video only (no mic — still shows face)
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
          } catch (finalErr: any) {
            throw finalErr;
          }
        }
      }

      if (!stream) throw new Error('Could not access camera.');

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn('Video play:', e));
      }

      setHasRealCamera(true);

      // Web Audio API mic level meter (only if audio track exists)
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const updateVolume = () => {
            if (!mediaStreamRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            setMicLevel(Math.min(100, Math.max(15, Math.round((avg / 128) * 100))));
            requestAnimationFrame(updateVolume);
          };
          updateVolume();
        } catch (e) {
          console.warn('Audio analyzer:', e);
        }
      }
    } catch (err: any) {
      console.warn('Webcam error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings and try again.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. Please connect a webcam and try again.');
      } else if (err.name === 'NotReadableError') {
        setCameraError('Camera is in use by another application. Please close other apps using the camera.');
      } else {
        setCameraError('Could not access camera. Click "Allow Camera & Mic" to try again.');
      }
      setHasRealCamera(false);
    }
  };

  useEffect(() => {
    if (activeFeature === 'live_session') {
      initWebcamStream();
      setSessionPhase('greeting');

      // Time-based greeting
      const hour = new Date().getHours();
      const timeGreeting =
        hour < 12 ? 'Good Morning' :
        hour < 17 ? 'Good Afternoon' : 'Good Evening';

      const greeting = `${timeGreeting}! I am Tech Guru Alex, your AI interviewer. Welcome to your SmartHire interview session for the ${selectedRole} position. I hope you are doing well today. Are you ready to begin? Please say "Yes, let's start" or click Proceed when you are ready.`;
      speakAIGreeting(greeting);
    } else {
      stopMediaStream();
      setSessionPhase('greeting');
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }

    return () => {
      stopMediaStream();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeFeature]);

  // Fallback volume meter oscillation when camera stream is pending
  useEffect(() => {
    if (activeFeature === 'live_session' && !hasRealCamera && micOn) {
      const interval = setInterval(() => {
        setMicLevel(Math.floor(Math.random() * 45) + 35);
      }, 300);
      return () => clearInterval(interval);
    }
  }, [activeFeature, hasRealCamera, micOn]);

  const stopMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setHasRealCamera(false);
  };

  const toggleMic = () => {
    setMicOn(prev => {
      const next = !prev;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getAudioTracks().forEach(t => (t.enabled = next));
      }
      return next;
    });
  };

  const toggleCam = () => {
    setCamOn(prev => {
      const next = !prev;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getVideoTracks().forEach(t => (t.enabled = next));
      }
      return next;
    });
  };

  // Start real voice capture for candidate reply
  const startCandidateReply = () => {
    setReplyError(null);
    // Stop AI speech first
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsAISpeaking(false);
    setCurrentState('Speaking & Answering');

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setReplyError('Speech recognition not supported in this browser. Try Chrome or Edge.');
      return;
    }

    if (isListening) {
      // Stop if already listening
      recognitionRef.current?.stop();
      setIsListening(false);
      setCurrentState('Attentive & Listening');
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    recognitionRef.current = rec;

    rec.onstart = () => {
      setIsListening(true);
      setCandidateTranscript('');
    };

    rec.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t + ' ';
        else interim += t;
      }
      setCandidateTranscript(final || interim);
    };

    rec.onerror = (e: any) => {
      if (e.error === 'no-speech') {
        setReplyError('No speech detected. Please speak clearly and try again.');
      } else if (e.error === 'not-allowed') {
        setReplyError('Microphone access denied. Click "Allow Camera & Mic" first.');
      } else {
        setReplyError(`Mic error: ${e.error}`);
      }
      setIsListening(false);
      setCurrentState('Attentive & Listening');
    };

    rec.onend = () => {
      setIsListening(false);
      setCurrentState('Attentive & Listening');
    };

    rec.start();
  };

  // Proceed to actual interview questions
  const proceedToInterview = () => {
    setSessionPhase('interview');
    const question = `Wonderful! Let us begin. ${selectedRole.includes('Android') ? 'Tell me about your experience with state management in Android, and how you approach software architecture decisions.' : 'Tell me about a challenging technical problem you solved recently and walk me through your approach.'}`;
    speakAIGreeting(question);
    setCandidateTranscript('');
  };

  // End session with thank you message
  const endWithThanks = () => {
    setSessionPhase('closing');
    const hour = new Date().getHours();
    const closingGreeting = hour < 12 ? 'Have a great morning!' : hour < 17 ? 'Have a wonderful afternoon!' : 'Have a great evening!';
    const closing = `Thank you so much for your time today. It was a pleasure speaking with you. We will review your performance and get back to you soon. ${closingGreeting} Take care and best of luck!`;
    speakAIGreeting(closing);
    setTimeout(() => setShowFeedbackModal(true), 5000);
  };

  // Handle File Selection from Native File Manager
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      setUploadedFileSize(`${(file.size / 1024).toFixed(1)} KB`);
      const score = Math.floor(Math.random() * 15) + 82;
      setAtsScore(score);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  if (!activeFeature) return null;

  const navigateTo = (feat: FeatureType) => {
    if (onNavigate) onNavigate(feat);
  };

  return (
    /* 100% Full Screen Entire Desktop Container */
    <div className="fixed inset-0 z-50 w-full h-full min-h-screen bg-[#0B1220] text-slate-100 flex flex-col overflow-y-auto animate-in fade-in duration-200">
      
      {/* Hidden File Input for Native File Manager */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
      />

      {/* ========================================================================= */}
      {/* 1. SCREEN 1: AI PREPARATION LEVEL */}
      {/* ========================================================================= */}
      {activeFeature === 'prep_level' && (
        <div className="flex flex-col min-h-screen w-full">
          <header className="sticky top-0 z-30 bg-[#090F1E]/90 backdrop-blur-xl border-b border-slate-800/80 px-6 lg:px-12 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onClose} className="p-2.5 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
                <ArrowLeft size={22} />
              </button>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">AI Preparation Level</h2>
            </div>
            <button onClick={onClose} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all">
              Close View
            </button>
          </header>

          <main className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-8 flex-1 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Overall Progress Card */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-[#111A2E] border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-xl">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Preparation Progress</p>
                  <div className="text-6xl font-extrabold text-blue-500 tracking-tight">65%</div>
                  
                  <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div className="w-[65%] h-full bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.6)]" />
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Milestone Status</h3>
                  <div className="space-y-3 text-xs">
                    <p className="flex items-center justify-between text-slate-300">
                      <span>Target Role:</span> <span className="font-bold text-cyan-400">Senior Android Developer</span>
                    </p>
                    <p className="flex items-center justify-between text-slate-300">
                      <span>Rounds Completed:</span> <span className="font-bold text-purple-400">12 Mock Rounds</span>
                    </p>
                    <p className="flex items-center justify-between text-slate-300">
                      <span>Estimated Readiness:</span> <span className="font-bold text-emerald-400">2 Weeks</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Skill Breakdown & AI Action Plan */}
              <div className="lg:col-span-2 space-y-8">
                {/* Skill Breakdown */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-6">
                  <h3 className="text-lg font-bold text-white">Skill Breakdown</h3>
                  
                  <div className="space-y-5 text-sm font-semibold">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-200">Coding Rounds</span>
                        <span className="text-slate-400">75%</span>
                      </div>
                      <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden">
                        <div className="w-[75%] h-full bg-blue-500 rounded-full" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-200">System Design</span>
                        <span className="text-slate-400">50%</span>
                      </div>
                      <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden">
                        <div className="w-[50%] h-full bg-purple-500 rounded-full" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-200">Behavioral Skills</span>
                        <span className="text-slate-400">80%</span>
                      </div>
                      <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden">
                        <div className="w-[80%] h-full bg-emerald-500 rounded-full" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-200">Resume Strength</span>
                        <span className="text-slate-400">60%</span>
                      </div>
                      <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden">
                        <div className="w-[60%] h-full bg-cyan-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Action Plan */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Zap className="text-amber-400" size={22} /> AI Action Plan
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-start gap-4 text-sm leading-relaxed text-slate-300 p-5 bg-slate-950/60 rounded-2xl border border-slate-800">
                      <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl flex-shrink-0">
                        <Zap size={18} fill="currentColor" />
                      </div>
                      <p className="mt-0.5">Complete 2 more System Design mock rounds to boost your architecture score.</p>
                    </div>

                    <div className="flex items-start gap-4 text-sm leading-relaxed text-slate-300 p-5 bg-slate-950/60 rounded-2xl border border-slate-800">
                      <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl flex-shrink-0">
                        <Zap size={18} fill="currentColor" />
                      </div>
                      <p className="mt-0.5">Review your data structure fundamentals, focusing on Graph and Dynamic Programming algorithms.</p>
                    </div>

                    <div className="flex items-start gap-4 text-sm leading-relaxed text-slate-300 p-5 bg-slate-950/60 rounded-2xl border border-slate-800">
                      <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl flex-shrink-0">
                        <Zap size={18} fill="currentColor" />
                      </div>
                      <p className="mt-0.5">Practice situational behavioral interview questions using the STAR framework.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SCREEN 2: INTERVIEW MODULES */}
      {/* ========================================================================= */}
      {activeFeature === 'interview_modules' && (
        <div className="flex flex-col min-h-screen w-full">
          <header className="sticky top-0 z-30 bg-[#090F1E]/90 backdrop-blur-xl border-b border-slate-800/80 px-6 lg:px-12 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onClose} className="p-2.5 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
                <ArrowLeft size={22} />
              </button>
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Live AI Interview</h2>
                <p className="text-xs text-slate-400 mt-0.5">17 companies · 19 roles · AI-powered real-time interviews</p>
              </div>
            </div>
            <button onClick={onClose} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all">
              Close
            </button>
          </header>

          <main className="max-w-5xl mx-auto w-full px-6 lg:px-12 py-10 flex-1 flex flex-col items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-7xl mb-4">🤖</div>
              <h3 className="text-3xl font-extrabold text-white mb-3">SmartHire AI Interviewer</h3>
              <p className="text-slate-400 text-base max-w-lg mx-auto leading-relaxed">
                Practice with Alex, your AI interviewer. Dynamic questions, real-time feedback, voice interaction, and professional certificates — all powered by GPT-4o.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
              {[
                { emoji: '🏢', label: '17 Companies', sub: 'Google, Meta, Amazon + 14 more' },
                { emoji: '💼', label: '19 Roles', sub: 'SWE, PM, Data, DevOps, AI...' },
                { emoji: '🏆', label: 'Certificates', sub: 'Bronze → Master badges' },
              ].map(item => (
                <div key={item.label} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-center">
                  <div className="text-3xl mb-2">{item.emoji}</div>
                  <p className="text-sm font-bold text-white">{item.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.sub}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={() => { onClose(); router.push('/library'); }}
                className="flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-base rounded-2xl transition-all shadow-2xl shadow-cyan-500/20"
              >
                <Play size={20} fill="white" /> Open Interview Library
              </button>
              <button onClick={onClose} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-base rounded-2xl transition-all border border-slate-700">
                Maybe Later
              </button>
            </div>
          </main>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SCREEN 3: TECHNICAL ROUND SETUP */}
      {/* ========================================================================= */}
      {activeFeature === 'round_setup' && (
        <div className="flex flex-col min-h-screen w-full">
          <header className="sticky top-0 z-30 bg-[#090F1E]/90 backdrop-blur-xl border-b border-slate-800/80 px-6 lg:px-12 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigateTo('interview_modules')} className="p-2.5 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
                <ArrowLeft size={22} />
              </button>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">{currentModule} Setup</h2>
            </div>
            <button onClick={onClose} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all">
              Close View
            </button>
          </header>

          <main className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-8 flex-1 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column: Job Role Selection */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-6">
                <h3 className="text-lg font-bold text-white">Select Job Role</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    'Senior Android Developer',
                    'Staff Engineer',
                    'Tech Lead',
                    'AI Architect',
                    'Backend Engineer',
                    'Frontend Developer',
                    'Full Stack Developer',
                    'QA Automation Engineer'
                  ].map((role) => (
                    <div
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                        selectedRole === role
                          ? 'bg-blue-950/40 border-blue-500/50 text-white font-bold'
                          : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedRole === role ? 'border-cyan-400 bg-cyan-950/40' : 'border-slate-600'
                      }`}>
                        {selectedRole === role && <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />}
                      </div>
                      <span className="text-xs">{role}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Difficulty & Assessment Options */}
              <div className="space-y-6">
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-6">
                  <h3 className="text-lg font-bold text-white">Difficulty Level</h3>
                  <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden relative border border-slate-800">
                    <div className={`h-full bg-blue-600 transition-all ${
                      difficulty === 'Entry' ? 'w-1/3' : difficulty === 'Mid-Level' ? 'w-2/3' : 'w-full'
                    }`} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 font-bold px-1 pt-1">
                    <span onClick={() => setDifficulty('Entry')} className={`cursor-pointer ${difficulty === 'Entry' ? 'text-blue-400 font-extrabold' : 'hover:text-white'}`}>Entry</span>
                    <span onClick={() => setDifficulty('Mid-Level')} className={`cursor-pointer ${difficulty === 'Mid-Level' ? 'text-blue-400 font-extrabold' : 'hover:text-white'}`}>Mid-Level</span>
                    <span onClick={() => setDifficulty('Senior')} className={`cursor-pointer ${difficulty === 'Senior' ? 'text-blue-400 font-extrabold' : 'hover:text-white'}`}>Senior</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white">Include Coding Assessment</h4>
                    <p className="text-xs text-slate-400 mt-1">Enables live code editor & algorithmic feedback during session.</p>
                  </div>
                  <div
                    onClick={() => setIncludeCoding(!includeCoding)}
                    className={`w-14 h-7 rounded-full cursor-pointer p-1 transition-colors ${
                      includeCoding ? 'bg-cyan-400' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                      includeCoding ? 'translate-x-7' : 'translate-x-0'
                    }`} />
                  </div>
                </div>

                <button
                  onClick={() => navigateTo('live_session')}
                  className="w-full py-4.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-3"
                >
                  <Play size={20} fill="currentColor" /> Start Practice
                </button>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SCREEN 4: LIVE AI PRACTICE ROOM (Real Integrated Webcam + AI Talks First) */}
      {/* ========================================================================= */}
      {activeFeature === 'live_session' && (
        <div className="flex flex-col min-h-screen w-full bg-[#050914] relative">
          <header className="sticky top-0 z-30 bg-[#080D1A]/90 backdrop-blur-xl border-b border-slate-800/80 px-6 lg:px-12 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-slate-300">Time: {sessionTime}s</span>
              <span className="text-xs font-bold text-purple-400 bg-purple-950/60 px-3.5 py-1 rounded-full border border-purple-500/30">
                Role: {selectedRole}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={initWebcamStream}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-md shadow-blue-600/30"
              >
                <Camera size={16} /> Allow Camera & Mic
              </button>

              <button onClick={toggleCam} className={`p-2.5 rounded-xl border transition-all ${camOn ? 'bg-slate-800 text-white border-slate-700' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                {camOn ? <Camera size={20} /> : <VideoOff size={20} />}
              </button>
              <button onClick={toggleMic} className={`p-2.5 rounded-xl border transition-all ${micOn ? 'bg-slate-800 text-white border-slate-700' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                {micOn ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              <span className="px-4 py-1.5 bg-red-600 text-white text-xs font-extrabold rounded-full tracking-wider uppercase shadow-lg shadow-red-600/30 animate-pulse">
                LIVE
              </span>
              <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl">
                Exit Room
              </button>
            </div>
          </header>

          <main className="w-full px-6 lg:px-12 py-8 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column: REAL WEBCAM VIDEO ELEMENT (Always rendered in DOM) */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden relative flex flex-col items-center justify-center shadow-2xl min-h-[500px]">
              
              {/* REAL WEBCAM HTML5 VIDEO TAG — front-facing, fills container */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover rounded-3xl ${
                  hasRealCamera && camOn ? 'block' : 'hidden'
                }`}
              />

              {/* CAMERA FALLBACK — shows correct state: off, not found, denied, or initializing */}
              {(!hasRealCamera || !camOn) && (() => {
                const isNotFound = cameraError?.includes('No camera found');
                const isDenied = cameraError?.includes('denied');
                const isInUse = cameraError?.includes('in use');
                const isCamOff = !cameraError && camOn === false;

                if (!camOn) {
                  // User manually turned camera off
                  return (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-tr from-slate-950 via-[#0B1426] to-slate-950 text-center">
                      <div className="w-32 h-32 rounded-full border-2 border-slate-700 flex items-center justify-center relative mb-4">
                        <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center">
                          <VideoOff size={44} className="text-slate-500" />
                        </div>
                      </div>
                      <h4 className="text-base font-extrabold text-slate-300 mb-1">Camera Turned Off</h4>
                      <p className="text-xs text-slate-500 font-medium max-w-sm">Click the camera icon below to re-enable your video feed.</p>
                    </div>
                  );
                }

                if (isNotFound) {
                  // No physical camera on device
                  return (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-tr from-slate-950 via-[#0B1426] to-slate-950 text-center">
                      <div className="w-32 h-32 rounded-full border-2 border-slate-600/60 flex items-center justify-center relative mb-4">
                        <div className="w-24 h-24 rounded-full bg-slate-800/80 flex items-center justify-center">
                          <VideoOff size={44} className="text-slate-400" />
                        </div>
                      </div>
                      <h4 className="text-base font-extrabold text-white mb-1">No Camera Detected</h4>
                      <p className="text-xs text-slate-400 font-medium max-w-xs mb-4 leading-relaxed">
                        No webcam found on this device. You can still continue — the AI interview works with microphone only.
                      </p>
                      <button
                        onClick={initWebcamStream}
                        className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-2 border border-slate-600"
                      >
                        <RefreshCw size={14} /> Try Again
                      </button>
                    </div>
                  );
                }

                if (isDenied) {
                  // Browser permission denied
                  return (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-tr from-slate-950 via-[#0B1426] to-slate-950 text-center">
                      <div className="w-32 h-32 rounded-full border-2 border-amber-500/40 flex items-center justify-center relative mb-4 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                        <div className="w-24 h-24 rounded-full bg-amber-900/20 flex items-center justify-center">
                          <AlertCircle size={44} className="text-amber-400" />
                        </div>
                      </div>
                      <h4 className="text-base font-extrabold text-white mb-1">Camera Permission Denied</h4>
                      <p className="text-xs text-amber-300/80 font-medium max-w-xs mb-4 leading-relaxed">
                        Click the 🔒 lock icon in your browser&apos;s address bar → Allow Camera → then retry.
                      </p>
                      <button
                        onClick={initWebcamStream}
                        className="px-5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-xl transition-all flex items-center gap-2 border border-amber-500/40"
                      >
                        <RefreshCw size={14} /> Retry After Allowing
                      </button>
                    </div>
                  );
                }

                if (isInUse) {
                  // Camera busy with another app
                  return (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-tr from-slate-950 via-[#0B1426] to-slate-950 text-center">
                      <div className="w-32 h-32 rounded-full border-2 border-orange-500/40 flex items-center justify-center relative mb-4">
                        <div className="w-24 h-24 rounded-full bg-orange-900/20 flex items-center justify-center">
                          <AlertCircle size={44} className="text-orange-400" />
                        </div>
                      </div>
                      <h4 className="text-base font-extrabold text-white mb-1">Camera In Use</h4>
                      <p className="text-xs text-orange-300/80 font-medium max-w-xs mb-4 leading-relaxed">
                        Your camera is being used by another app (e.g., Zoom, Teams). Close it and retry.
                      </p>
                      <button
                        onClick={initWebcamStream}
                        className="px-5 py-2.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 font-bold text-xs rounded-xl transition-all flex items-center gap-2 border border-orange-500/40"
                      >
                        <RefreshCw size={14} /> Retry Camera Access
                      </button>
                    </div>
                  );
                }

                // Default: camera not yet initialized — show enable button
                return (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-tr from-slate-950 via-[#0B1426] to-slate-950 text-center">
                    <div className="w-32 h-32 rounded-full border-2 border-cyan-500/50 flex items-center justify-center relative mb-4 shadow-[0_0_25px_rgba(6,182,212,0.3)]">
                      <div className="w-24 h-24 rounded-full bg-cyan-600/20 animate-pulse flex items-center justify-center">
                        <Camera size={44} className="text-cyan-400" />
                      </div>
                      <span className="absolute top-1 right-1 w-4 h-4 bg-cyan-400 border-2 border-slate-950 rounded-full animate-ping" />
                    </div>
                    <h4 className="text-base font-extrabold text-white mb-1">Camera Not Started</h4>
                    <p className="text-xs text-cyan-300/70 font-medium max-w-sm mb-4">
                      Click below to enable your webcam for the interview.
                    </p>
                    <button
                      onClick={initWebcamStream}
                      className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
                    >
                      <Camera size={16} /> Enable Camera
                    </button>
                  </div>
                );
              })()}

              {/* Live Microphone Audio Meter Overlay */}
              <div className="absolute bottom-6 left-6 right-6 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex items-center gap-4 z-20">
                <Volume2 size={20} className={micOn ? "text-cyan-400 animate-pulse" : "text-slate-500"} />
                <div className="flex-1 h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
                  <div
                    className="h-full bg-cyan-400 rounded-full transition-all duration-100 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                    style={{ width: `${micOn ? micLevel : 0}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-cyan-300 min-w-[44px] text-right">
                  {micOn ? `${micLevel}%` : 'MUTED'}
                </span>
              </div>
            </div>

            {/* Right Column: AI Interviewer (TALKS FIRST OUT LOUD) */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between gap-4 min-h-[500px]">
              
              <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-4xl shadow-lg transition-all ${
                  isAISpeaking ? 'bg-purple-600 animate-pulse ring-4 ring-purple-500/40' : 'bg-purple-600/30 border border-purple-500/40'
                }`}>
                  👩‍💻
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Assistant: Tech Guru Alex</h3>
                  <div className="flex items-center gap-2 text-xs font-semibold mt-0.5">
                    {isAISpeaking ? (
                      <span className="text-purple-400 flex items-center gap-1.5 animate-pulse font-bold">
                        <Volume2 size={16} /> AI Speaking Out Loud...
                      </span>
                    ) : (
                      <span className="text-cyan-400 animate-pulse font-bold">
                        Listening to candidate response...
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Live Speech Box */}
              <div className="bg-slate-950/90 border border-purple-500/30 rounded-2xl p-6 space-y-3 relative shadow-xl">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                    <SparkleIcon /> AI Interviewer (Speaking First)
                  </p>
                  <button
                    onClick={() => speakAIGreeting(`Hi, Good Evening! Let's get started with your technical evaluation for the ${selectedRole} position. Tell me about your software architecture experience.`)}
                    className="p-1.5 text-xs text-purple-300 hover:text-white rounded-lg hover:bg-purple-950/60 flex items-center gap-1"
                    title="Replay Voice Speech"
                  >
                    <Volume2 size={14} /> Replay Voice
                  </button>
                </div>

                <p className="text-base text-slate-100 leading-relaxed font-medium">
                  "{aiSpeechText || `Hi, Good Evening! I am Tech Guru Alex. Let's get started with your technical evaluation for the ${selectedRole} role.`}"
                </p>

                {/* Animated Speech Wave indicator */}
                {isAISpeaking && (
                  <div className="flex items-center gap-1 pt-2">
                    {[40, 80, 50, 90, 60, 100, 70, 40].map((h, i) => (
                      <div key={i} className="w-1 bg-purple-400 rounded-full animate-bounce" style={{ height: `${h / 4}px`, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                )}
              </div>

              {/* Performance Analysis Gauge */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-2 text-purple-300">
                    <Zap size={18} className="text-purple-400" /> Performance Analysis
                  </span>
                  <span className="text-emerald-400">Current State: {currentState}</span>
                </div>
                <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div className="w-[82%] h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.6)]" />
                </div>
              </div>

              {/* Controls — always visible at bottom */}
              <div className="flex flex-col gap-3 mt-auto pt-4">

                {/* Candidate transcript live display */}
                {(candidateTranscript || isListening) && (
                  <div className="bg-slate-950/90 border border-cyan-500/30 rounded-2xl p-4 space-y-2">
                    <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                      <Mic size={13} className={isListening ? 'animate-pulse text-red-400' : ''} />
                      {isListening ? 'Listening… (speak now)' : 'Your Answer'}
                    </p>
                    <p className="text-sm text-slate-100 leading-relaxed min-h-[40px]">
                      {candidateTranscript || <span className="text-slate-500 italic">Waiting for speech…</span>}
                    </p>
                  </div>
                )}

                {/* Reply error banner */}
                {replyError && (
                  <div className="flex items-start gap-2 bg-red-950/60 border border-red-500/40 rounded-2xl p-3">
                    <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-300">{replyError}</p>
                  </div>
                )}

                {/* GREETING PHASE — show Proceed button */}
                {sessionPhase === 'greeting' && (
                  <button
                    onClick={proceedToInterview}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-base rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/30 border-2 border-emerald-300"
                  >
                    ✅ Yes, Proceed with Interview
                  </button>
                )}

                {/* INTERVIEW PHASE — show mic reply + end interview */}
                {sessionPhase === 'interview' && (
                  <>
                    <button
                      onClick={startCandidateReply}
                      className={`w-full py-4 font-extrabold text-base rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl border-2 ${
                        isListening
                          ? 'bg-red-500 hover:bg-red-400 text-white border-red-300 animate-pulse shadow-red-500/30'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-300 shadow-cyan-500/30'
                      }`}
                    >
                      <Mic size={22} />
                      {isListening ? 'Stop Recording' : 'Candidate Reply Now'}
                    </button>

                    <button
                      onClick={endWithThanks}
                      className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-purple-600/30"
                    >
                      🏁 End Interview & Get Report
                    </button>
                  </>
                )}

                {/* CLOSING PHASE — show thank you state */}
                {sessionPhase === 'closing' && (
                  <div className="w-full py-4 bg-emerald-950/60 border border-emerald-500/30 rounded-2xl text-center space-y-1">
                    <p className="text-emerald-400 font-extrabold text-base">🎉 Interview Complete!</p>
                    <p className="text-slate-400 text-xs">AI is sharing closing remarks...</p>
                  </div>
                )}
              </div>
            </div>
          </main>

          {/* Overlay Feedback Modal */}
          {showFeedbackModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
              <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl p-8 space-y-6 shadow-2xl">
                <h3 className="text-xl font-extrabold text-slate-900">Interview Feedback</h3>
                <p className="text-xs text-slate-600">How was your experience with the AI Interviewer?</p>

                <textarea
                  value={userThoughts}
                  onChange={(e) => setUserThoughts(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-300 rounded-2xl text-xs focus:outline-none focus:border-purple-600 resize-none"
                />

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowFeedbackModal(false)}
                    className="px-5 py-2.5 text-xs font-bold text-cyan-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                        window.speechSynthesis.cancel();
                      }
                      setShowFeedbackModal(false);
                      navigateTo('performance_report');
                    }}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-lg"
                  >
                    Submit & View Report
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SCREEN 5: AI PERFORMANCE REPORT */}
      {/* ========================================================================= */}
      {activeFeature === 'performance_report' && (
        <div className="flex flex-col min-h-screen w-full bg-white text-slate-900">
          <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 lg:px-12 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigateTo('live_session')} className="p-2.5 text-slate-700 hover:bg-slate-100 rounded-xl">
                <ArrowLeft size={22} />
              </button>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Performance Report</h2>
            </div>
            <button onClick={onClose} className="px-5 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl">
              Return to Dashboard
            </button>
          </header>

          <main className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-8 flex-1 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Overall Score & Pentagon Chart */}
              <div className="lg:col-span-1 space-y-6">
                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="w-40 h-40 rounded-full border-4 border-slate-200 shadow-xl flex flex-col items-center justify-center bg-white">
                    <span className="text-6xl font-extrabold text-blue-600">85</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Overall Score</span>
                  </div>

                  <div className="flex items-center gap-1 text-amber-400 mt-6">
                    {[1, 2, 3, 4].map(i => <Star key={i} size={22} fill="currentColor" />)}
                    <Star size={22} className="text-amber-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-700 mt-2">Performance: Excellent</p>
                </div>

                {/* Pentagon Competency Chart */}
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center shadow-sm">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-6">Competency Breakdown</h4>
                  <div className="w-56 h-56 mx-auto relative flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <polygon points="50,10 90,38 75,85 25,85 10,38" fill="none" stroke="#E2E8F0" strokeWidth="1" />
                      <polygon points="50,25 78,45 68,75 32,75 22,45" fill="none" stroke="#E2E8F0" strokeWidth="1" />
                      <polygon points="50,15 85,40 70,80 28,78 15,40" fill="rgba(147, 51, 234, 0.25)" stroke="#9333EA" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Right Column: Analysis Details & Download Buttons */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 space-y-6 text-sm">
                  <h4 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">Analysis Details</h4>

                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-900 text-base">Strengths</h5>
                    <p className="text-slate-600 leading-relaxed">• Technical knowledge of core concepts.</p>
                    <p className="text-slate-600 leading-relaxed">• Confident and clear communication style.</p>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-900 text-base">Areas for Improvement</h5>
                    <p className="text-slate-600 leading-relaxed">• Could elaborate more on system design trade-offs.</p>
                    <p className="text-slate-600 leading-relaxed">• Try to reduce filler words during complex explanations.</p>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-900 text-base">Final AI Feedback</h5>
                    <p className="text-slate-600 leading-relaxed">
                      Overall, a very strong performance. You demonstrated a solid understanding of the role's requirements and maintained great eye contact.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <button
                    onClick={() => {
                      const content = `SmartHire AI Performance Report\n\nCandidate: Sravani Jampala\nRole: ${selectedRole}\nDate: ${new Date().toLocaleDateString()}\n\nOverall Score: 85/100\nRating: 4.5 Stars\nPerformance: Excellent\n\nSTRENGTHS\n- Technical knowledge of core concepts.\n- Confident and clear communication style.\n\nAREAS FOR IMPROVEMENT\n- Could elaborate more on system design trade-offs.\n- Try to reduce filler words during complex explanations.\n\nFINAL AI FEEDBACK\nOverall, a very strong performance.`;
                      const blob = new Blob([content], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `SmartHire_Report_${new Date().toISOString().split('T')[0]}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={18} /> Download PDF Report
                  </button>
                  <button
                    onClick={() => {
                      const log = `SmartHire Session Log\n\nDate: ${new Date().toLocaleDateString()}\nTime: ${new Date().toLocaleTimeString()}\nRole: ${selectedRole}\nDuration: ${sessionTime}s\n\n[00:00] AI: Hi! I am Tech Guru Alex. Tell me about your experience with ${selectedRole} architecture.\n[00:20] Candidate: Replied with architecture explanation.\n[00:50] AI: Can you walk through a challenging system design problem?\n[01:15] Candidate: Described scalable high-traffic system design.\n\nScores: Communication 91%, Technical 84%, Confidence 94%, Clarity 86%`;
                      const blob = new Blob([log], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `SmartHire_SessionLog_${new Date().toISOString().split('T')[0]}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={18} /> Download Session Log
                  </button>
                  <button onClick={onClose} className="py-4 border-2 border-slate-900 hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-2xl transition-all">
                    Return to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. SCREEN 6: AI RESUME ANALYZER */}
      {/* ========================================================================= */}
      {activeFeature === 'resume' && (
        <div className="flex flex-col min-h-screen w-full">
          <header className="sticky top-0 z-30 bg-[#090F1E]/90 backdrop-blur-xl border-b border-slate-800/80 px-6 lg:px-12 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">AI Resume Analyzer</h2>
              <p className="text-xs text-slate-400 mt-0.5">Optimize your resume for ATS systems</p>
            </div>
            <button onClick={onClose} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all">
              Back to Dashboard
            </button>
          </header>

          <main className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-8 flex-1 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column: File Manager Upload Box */}
              <div className="space-y-6">
                <div
                  onClick={triggerFileUpload}
                  className="bg-[#F0F4F8] hover:bg-white border-2 border-dashed border-cyan-500/40 rounded-3xl p-12 text-center cursor-pointer transition-all space-y-5 shadow-xl group"
                >
                  <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform">
                    <CheckCircle2 size={44} />
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-slate-900">{uploadedFileName}</p>
                    <p className="text-xs font-semibold text-slate-500 mt-1">Size: {uploadedFileSize}</p>
                  </div>
                  <button className="px-8 py-3.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md">
                    Upload New Resume from File Manager
                  </button>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-2 text-xs">
                  <h4 className="font-bold text-white uppercase tracking-wider">File Manager Guidance</h4>
                  <p className="text-slate-400">Supported Formats: PDF, DOCX, TXT (Max size 10MB)</p>
                </div>
              </div>

              {/* Right Column: ATS Score & Recommendations */}
              <div className="space-y-6">
                <div className="bg-[#2D2D35] border border-slate-700/80 rounded-3xl p-8 text-center space-y-4 shadow-xl">
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">ATS Match Score</p>
                  <div className="text-6xl font-extrabold text-emerald-400 tracking-tight">{atsScore}%</div>

                  <div className="pt-2">
                    <p className="text-xs font-bold text-slate-300 mb-3">Top Detected Skills</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {['Kotlin', 'Jetpack Compose', 'MVVM', 'Coroutines', 'REST APIs'].map(skill => (
                        <span key={skill} className="px-4 py-2 bg-[#1F1F24] border border-slate-700 rounded-xl text-xs font-medium text-slate-200">
                          ✓ {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Recommendations</h3>

                  <div className="space-y-4 text-xs leading-relaxed text-slate-300">
                    <div className="flex items-start gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                      <div className="p-2 bg-blue-600/30 text-blue-400 rounded-xl flex-shrink-0">
                        <FileText size={18} />
                      </div>
                      <p className="mt-0.5">Add more keywords related to 'MVVM' and 'Dagger Hilt'.</p>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                      <div className="p-2 bg-blue-600/30 text-blue-400 rounded-xl flex-shrink-0">
                        <FileText size={18} />
                      </div>
                      <p className="mt-0.5">Quantify your achievements with numbers (e.g., 'Improved performance by 30%').</p>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                      <div className="p-2 bg-blue-600/30 text-blue-400 rounded-xl flex-shrink-0">
                        <FileText size={18} />
                      </div>
                      <p className="mt-0.5">Ensure your contact details are easily readable by scanners.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. SCREEN 7: PERFORMANCE REPORTS */}
      {/* ========================================================================= */}
      {activeFeature === 'performance' && (
        <div className="flex flex-col min-h-screen w-full">
          <header className="sticky top-0 z-30 bg-[#090F1E]/90 backdrop-blur-xl border-b border-slate-800/80 px-6 lg:px-12 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onClose} className="p-2.5 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
                <ArrowLeft size={22} />
              </button>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Performance Reports</h2>
            </div>
            <button onClick={onClose} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all">
              Close View
            </button>
          </header>

          <main className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-8 flex-1 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Overall Progress Card */}
              <div className="lg:col-span-1">
                <div className="bg-[#E5F3FF] text-slate-900 rounded-3xl p-8 flex flex-col items-center text-center space-y-4 shadow-xl">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path className="text-slate-300" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-cyan-600" strokeDasharray="86, 100" strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <span className="absolute text-3xl font-black text-cyan-600">86%</span>
                  </div>

                  <div className="space-y-2 text-sm font-bold text-slate-600 pt-2">
                    <p className="flex items-center justify-center gap-2">
                      <Calendar size={18} /> Interviews: <span className="text-slate-900">10</span>
                    </p>
                    <p className="flex items-center justify-center gap-2">
                      <FileText size={18} /> Resumes: <span className="text-slate-900">3</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Competency Breakdown */}
              <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-6">
                <h3 className="text-lg font-bold text-white">Competency Breakdown</h3>

                <div className="space-y-5 text-sm font-semibold">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-200">Communication</span>
                      <span className="text-slate-300">91%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5">
                      <div className="w-[91%] h-full bg-blue-600 rounded-full" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-200">Technical Knowledge</span>
                      <span className="text-slate-300">84%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5">
                      <div className="w-[84%] h-full bg-blue-600 rounded-full" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-200">Confidence</span>
                      <span className="text-slate-300">94%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5">
                      <div className="w-[94%] h-full bg-blue-600 rounded-full" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-200">Clarity</span>
                      <span className="text-slate-300">86%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5">
                      <div className="w-[86%] h-full bg-blue-600 rounded-full" />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigateTo('performance_report')}
                  className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-sm rounded-2xl shadow-lg transition-all mt-4"
                >
                  View Detailed History
                </button>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. SCREEN 8: RECRUITER PORTAL */}
      {/* ========================================================================= */}
      {activeFeature === 'recruiter' && (
        <div className="flex flex-col min-h-screen w-full">
          <header className="sticky top-0 z-30 bg-[#090F1E]/90 backdrop-blur-xl border-b border-slate-800/80 px-6 lg:px-12 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onClose} className="p-2.5 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
                <ArrowLeft size={22} />
              </button>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Recruiter Portal</h2>
            </div>
            <button onClick={onClose} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all">
              Close View
            </button>
          </header>

          <main className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-8 flex-1 space-y-8">
            {/* Hiring Overview Cards */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Hiring Overview</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-[#111D36] border border-blue-500/30 rounded-3xl p-8 space-y-2">
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Active Jobs</p>
                  <p className="text-5xl font-extrabold text-blue-400">12</p>
                </div>

                <div className="bg-[#0F2B2B] border border-emerald-500/30 rounded-3xl p-8 space-y-2">
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">New Apps</p>
                  <p className="text-5xl font-extrabold text-emerald-400">148</p>
                </div>
              </div>
            </div>

            {/* Top Ranked Candidates List */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Top Ranked Candidates</h3>
              <div className="space-y-4">
                {[
                  { name: 'John Doe', score: '95%' },
                  { name: 'Jane Smith', score: '97%' },
                  { name: 'Alex Johnson', score: '90%' },
                  { name: 'Sravani Jampala', score: '90%' },
                ].map((cand) => (
                  <div key={cand.name} className="bg-[#2A2B30] border border-slate-700/80 rounded-2xl p-6 flex items-center justify-between shadow-lg hover:border-cyan-500/50 transition-all">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-full bg-slate-400 flex-shrink-0" />
                      <div>
                        <h4 className="text-lg font-bold text-white">{cand.name}</h4>
                        <p className="text-sm font-semibold text-emerald-400 mt-0.5">AI Match Score: {cand.score}</p>
                      </div>
                    </div>
                    <button className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all">
                      View Profile
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      )}

    </div>
  );
}

function SparkleIcon() {
  return (
    <svg className="w-4 h-4 text-purple-400 inline" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
    </svg>
  );
}
