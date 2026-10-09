'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Camera, Mic, Monitor, Server, AlertTriangle, 
  CheckCircle2, Loader2, Maximize, ShieldAlert 
} from 'lucide-react';
import { FaceDetectionEngine } from '../../lib/faceDetection';

type StepStatus = 'pending' | 'testing' | 'success' | 'failed';

function SecurityVerificationWizardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'Software Engineer';
  const difficulty = searchParams.get('difficulty') || 'Medium';
  const company = searchParams.get('company') || 'Google';

  const [currentStep, setCurrentStep] = useState(1);
  const [status, setStatus] = useState<StepStatus>('pending');
  const [errorMsg, setErrorMsg] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [faceEngine] = useState(() => new FaceDetectionEngine());

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    return () => stopMedia();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stopMedia = () => {
    stream?.getTracks().forEach(t => t.stop());
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    audioContextRef.current?.close();
  };

  const nextStep = () => {
    setStatus('pending');
    setErrorMsg('');
    setCurrentStep(c => c + 1);
  };

  // STEP 1 — System Compatibility
  useEffect(() => {
    if (currentStep === 1) {
      setStatus('testing');
      setTimeout(() => {
        const cpu = navigator.hardwareConcurrency || 2;
        const memory = (navigator as any).deviceMemory || 2;
        if (cpu >= 2 && memory >= 2) {
          setStatus('success');
        } else {
          setStatus('failed');
          setErrorMsg('Your system may not meet the minimum requirements for AI Face Tracking.');
        }
      }, 1500);
    }
  }, [currentStep]);

  // STEP 2 — Camera
  const requestCamera = async () => {
    setStatus('testing');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
      setStatus('success');
    } catch {
      setStatus('failed');
      setErrorMsg('Camera permission denied or camera not found.');
    }
  };

  // STEP 3 — Microphone
  const requestMic = async () => {
    setStatus('testing');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (stream) s.getAudioTracks().forEach(t => stream.addTrack(t));

      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyserRef.current = analyser;
      audioCtx.createMediaStreamSource(s).connect(analyser);

      const pcmData = new Float32Array(analyser.fftSize);
      const tick = () => {
        analyser.getFloatTimeDomainData(pcmData);
        let sum = 0;
        for (const a of pcmData) sum += a * a;
        setMicLevel(Math.min(100, Math.floor(Math.sqrt(sum / pcmData.length) * 1000)));
        animationRef.current = requestAnimationFrame(tick);
      };
      tick();
      setStatus('success');
    } catch {
      setStatus('failed');
      setErrorMsg('Microphone permission denied.');
    }
  };

  // STEP 4 — Face Recognition
  const testFaceDetection = async () => {
    setStatus('testing');
    try {
      await faceEngine.init();
      if (!videoRef.current) throw new Error('Video not running');
      setTimeout(async () => {
        try {
          const result = await faceEngine.detectFaces(videoRef.current!);
          if (result?.numFaces === 1) {
            setStatus('success');
          } else if (result && result.numFaces > 1) {
            setStatus('failed');
            setErrorMsg('Multiple faces detected. Please ensure you are alone.');
          } else {
            setStatus('failed');
            setErrorMsg('No face detected or lighting is too poor.');
          }
        } catch {
          setStatus('failed');
          setErrorMsg('No face detected or lighting is too poor.');
        }
      }, 2000);
    } catch {
      setStatus('failed');
      setErrorMsg('Failed to initialize AI face tracking engine.');
    }
  };

  // STEP 5 — Launch
  const launchInterview = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      router.push(`/ai-interview?${new URLSearchParams({ role, difficulty, company })}`);
    } catch {
      alert('Please allow fullscreen mode to begin the interview.');
    }
  };

  return (
    <div className="min-h-screen bg-[#060E1E] flex flex-col p-6 text-white font-sans">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold text-white mb-2">Security Verification Wizard</h1>
        <p className="text-slate-400">Proctored environment setup for SmartHire AI</p>
      </header>

      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Video Preview */}
        <div className="col-span-1 md:col-span-2">
          <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-700/50 aspect-video relative shadow-2xl">
            {currentStep >= 2 ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${status === 'testing' && currentStep === 4 ? 'opacity-50 blur-sm' : ''}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-800">
                <Camera size={48} className="text-slate-600" />
              </div>
            )}
            {currentStep === 4 && status === 'testing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-32 h-32 rounded-full border-4 border-cyan-400/50 animate-ping absolute" />
                <Loader2 size={48} className="text-cyan-400 animate-spin z-10" />
                <p className="z-10 mt-4 font-bold">Initializing AI Face Tracker...</p>
              </div>
            )}
          </div>

          {/* Action Area */}
          <div className="mt-8 bg-slate-900 rounded-3xl p-8 border border-slate-700/50">
            {currentStep === 1 && (
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                  <Server className="text-blue-400" /> System Compatibility
                </h3>
                <p className="text-slate-400 mb-6">Checking your browser, CPU, memory, and connection for a smooth AI interview experience.</p>
                {status === 'success' ? (
                  <button onClick={nextStep} className="bg-cyan-600 hover:bg-cyan-500 w-full py-4 rounded-2xl font-bold">Continue to Camera Check</button>
                ) : status === 'failed' ? (
                  <p className="text-red-400">{errorMsg}</p>
                ) : (
                  <div className="flex items-center gap-2 text-cyan-400"><Loader2 className="animate-spin" /> Checking system...</div>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                  <Camera className="text-emerald-400" /> Camera Verification
                </h3>
                <p className="text-slate-400 mb-6">SmartHire requires a working webcam to verify your identity and monitor eye contact.</p>
                {status === 'pending' || status === 'failed' ? (
                  <button onClick={requestCamera} className="bg-blue-600 hover:bg-blue-500 w-full py-4 rounded-2xl font-bold">Grant Camera Permission</button>
                ) : status === 'success' ? (
                  <button onClick={nextStep} className="bg-emerald-600 hover:bg-emerald-500 w-full py-4 rounded-2xl font-bold">Looks Good, Continue</button>
                ) : (
                  <Loader2 className="animate-spin text-cyan-400" />
                )}
                {errorMsg && <p className="text-red-400 mt-2">{errorMsg}</p>}
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                  <Mic className="text-purple-400" /> Microphone Check
                </h3>
                <p className="text-slate-400 mb-4">Please speak normally to test your microphone levels.</p>
                {status === 'success' && (
                  <div className="w-full bg-slate-800 rounded-full h-4 mb-6 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full transition-all duration-75" style={{ width: `${Math.min(100, micLevel * 2)}%` }} />
                  </div>
                )}
                {status === 'pending' || status === 'failed' ? (
                  <button onClick={requestMic} className="bg-blue-600 hover:bg-blue-500 w-full py-4 rounded-2xl font-bold">Grant Mic Permission</button>
                ) : status === 'success' ? (
                  <button onClick={nextStep} className="bg-emerald-600 hover:bg-emerald-500 w-full py-4 rounded-2xl font-bold">Microphone is Working</button>
                ) : (
                  <Loader2 className="animate-spin text-cyan-400" />
                )}
              </div>
            )}

            {currentStep === 4 && (
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                  <Monitor className="text-amber-400" /> Face Recognition & Environment
                </h3>
                <p className="text-slate-400 mb-6">Our AI verifies that exactly one face is in the frame and lighting is adequate.</p>
                {status === 'pending' || status === 'failed' ? (
                  <button onClick={testFaceDetection} className="bg-blue-600 hover:bg-blue-500 w-full py-4 rounded-2xl font-bold">Run Face Verification</button>
                ) : status === 'success' ? (
                  <button onClick={nextStep} className="bg-emerald-600 hover:bg-emerald-500 w-full py-4 rounded-2xl font-bold">Verification Passed</button>
                ) : null}
                {errorMsg && (
                  <p className="text-red-400 mt-4 text-center font-bold flex items-center justify-center gap-2">
                    <AlertTriangle /> {errorMsg}
                  </p>
                )}
              </div>
            )}

            {currentStep === 5 && (
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-red-400">
                  <ShieldAlert /> Exam Rules & Launch
                </h3>
                <ul className="text-slate-300 space-y-3 mb-6 bg-red-950/20 p-6 rounded-xl border border-red-900/50">
                  <li>• Do not exit <strong>fullscreen mode</strong>.</li>
                  <li>• Do not switch tabs or open other applications.</li>
                  <li>• Do not use <strong>copy/paste</strong>.</li>
                  <li>• Ensure no other voices or faces enter the frame.</li>
                  <li><strong className="text-red-400">3 violations will automatically terminate the interview.</strong></li>
                </ul>
                <button
                  onClick={launchInterview}
                  className="bg-red-600 hover:bg-red-500 w-full py-5 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                >
                  <Maximize size={20} /> Enter Fullscreen & Start Interview
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Step Tracker */}
        <div className="col-span-1">
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-700/50 sticky top-10">
            <h3 className="font-bold text-lg mb-6">Verification Progress</h3>
            <div className="space-y-6">
              {[
                { step: 1, label: 'System Check', icon: Server },
                { step: 2, label: 'Camera Test', icon: Camera },
                { step: 3, label: 'Microphone Test', icon: Mic },
                { step: 4, label: 'Face Tracking', icon: Monitor },
                { step: 5, label: 'Final Setup', icon: ShieldAlert },
              ].map(item => (
                <div
                  key={item.step}
                  className={`flex items-center gap-4 ${currentStep === item.step ? 'text-cyan-400' : currentStep > item.step ? 'text-emerald-400' : 'text-slate-600'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStep === item.step ? 'border-cyan-400 bg-cyan-900/20' : currentStep > item.step ? 'border-emerald-400 bg-emerald-900/20' : 'border-slate-700'}`}>
                    {currentStep > item.step ? <CheckCircle2 size={20} /> : <item.icon size={20} />}
                  </div>
                  <span className="font-bold text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// useSearchParams() requires a Suspense boundary for Next.js static export.
export default function SecurityVerificationWizard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#060E1E] flex items-center justify-center text-white">
        <Loader2 className="animate-spin mr-3" size={28} />
        <span className="font-bold text-lg">Loading...</span>
      </div>
    }>
      <SecurityVerificationWizardInner />
    </Suspense>
  );
}
