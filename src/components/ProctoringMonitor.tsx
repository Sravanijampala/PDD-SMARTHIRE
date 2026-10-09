"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { AlertCircle, CheckCircle, Video, Mic, CameraOff } from 'lucide-react';

export interface ViolationRecord {
  id: string;
  type: 'multiple_faces' | 'no_face' | 'background_noise';
  timestamp: number;
  message: string;
  screenshotUrl: string | null;
}

export interface SensitivitySettings {
  audioThreshold?: number;
  audioDurationMs?: number;
  faceTimeoutMs?: number;
  checkIntervalMs?: number;
  maxViolations?: number;
}

export interface ProctoringMonitorProps {
  onViolation?: (violation: ViolationRecord) => void;
  onMaxViolations?: () => void;
  sensitivitySettings?: SensitivitySettings;
  className?: string;
}

export const ProctoringMonitor: React.FC<ProctoringMonitorProps> = ({
  onViolation,
  onMaxViolations,
  sensitivitySettings = {},
  className = '',
}) => {
  const settings = {
    audioThreshold: 40,
    audioDurationMs: 2500,
    faceTimeoutMs: 3000,
    checkIntervalMs: 1000,
    maxViolations: 5,
    ...sensitivitySettings,
  };

  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [status, setStatus] = useState<'green' | 'yellow' | 'red'>('yellow');
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const [violations, setViolations] = useState<ViolationRecord[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // State refs for the interval loop
  const consecutiveNoFaceFrames = useRef(0);
  const consecutiveNoiseFrames = useRef(0);
  const isCheckingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Load Face-API models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        setIsModelsLoaded(true);
      } catch (error) {
        console.error("Failed to load face-api models", error);
      }
    };
    loadModels();
  }, []);

  // 2. Request Permissions
  useEffect(() => {
    let active = true;
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Setup Audio Context
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        source.connect(analyserRef.current);

        setHasPermissions(true);
        setStatus('green');
      } catch (err) {
        console.error("Media permission error", err);
        setHasPermissions(false);
        setStatus('red');
      }
    };
    startMedia();

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach(track => track.stop());
      audioContextRef.current?.close().catch(() => {});
    };
  }, []);

  // 3. Main Loop
  const captureScreenshot = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.6);
  }, []);

  const triggerViolation = useCallback((type: ViolationRecord['type'], message: string) => {
    // Debounce: prevent same violation type within 4 seconds
    setViolations(prev => {
      const lastSameType = prev.filter(v => v.type === type).pop();
      if (lastSameType && Date.now() - lastSameType.timestamp < 4000) {
        return prev;
      }
      
      const newViolation: ViolationRecord = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        timestamp: Date.now(),
        message,
        screenshotUrl: captureScreenshot(),
      };

      if (onViolation) onViolation(newViolation);

      setActiveAlert(message);
      setStatus('red');
      
      setTimeout(() => {
        setActiveAlert(null);
        setStatus('green');
      }, 3000);

      const nextViolations = [...prev, newViolation];
      if (nextViolations.length >= settings.maxViolations && onMaxViolations) {
        onMaxViolations();
      }

      return nextViolations;
    });
  }, [captureScreenshot, onViolation, onMaxViolations, settings.maxViolations]);

  useEffect(() => {
    if (!isModelsLoaded || !hasPermissions) return;

    const checkFeed = async () => {
      if (isCheckingRef.current || !videoRef.current || !analyserRef.current) return;
      isCheckingRef.current = true;

      try {
        // --- FACE DETECTION ---
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
        const detections = await faceapi.detectAllFaces(videoRef.current, options);
        
        const faceCount = detections.length;

        if (faceCount === 0) {
          consecutiveNoFaceFrames.current += settings.checkIntervalMs;
          if (consecutiveNoFaceFrames.current >= settings.faceTimeoutMs) {
            triggerViolation('no_face', 'No face detected in the camera frame.');
            consecutiveNoFaceFrames.current = 0;
          }
        } else if (faceCount > 1) {
          triggerViolation('multiple_faces', 'Multiple faces detected in frame.');
          consecutiveNoFaceFrames.current = 0;
        } else {
          consecutiveNoFaceFrames.current = 0;
        }

        // --- AUDIO DETECTION ---
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const averageAudio = sum / bufferLength;

        if (averageAudio > settings.audioThreshold) {
          consecutiveNoiseFrames.current += settings.checkIntervalMs;
          if (consecutiveNoiseFrames.current >= settings.audioDurationMs) {
            triggerViolation('background_noise', 'Sustained background noise or talking detected.');
            consecutiveNoiseFrames.current = 0;
          }
        } else {
          consecutiveNoiseFrames.current = 0; // Reset if it drops below threshold
        }

      } catch (err) {
        console.error("Proctoring loop error:", err);
      } finally {
        isCheckingRef.current = false;
      }
    };

    intervalRef.current = setInterval(checkFeed, settings.checkIntervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isModelsLoaded, hasPermissions, settings, triggerViolation]);

  return (
    <div className={`flex flex-col gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 w-80 shadow-2xl relative ${className}`}>
      
      {/* Toast Alert overlay */}
      {activeAlert && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] bg-red-500/90 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg flex items-center gap-2 z-50 animate-bounce">
          <AlertCircle size={18} />
          {activeAlert}
        </div>
      )}

      {/* Hidden elements for processing */}
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      {/* UI Status Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <ShieldIcon className="text-cyan-400" /> Proctoring Monitor
        </h3>
        <div className={`w-3 h-3 rounded-full shadow-lg ${
          status === 'green' ? 'bg-emerald-400 shadow-emerald-400/50' : 
          status === 'yellow' ? 'bg-yellow-400 shadow-yellow-400/50' : 
          'bg-red-500 shadow-red-500/50'
        }`} />
      </div>

      {/* Permissions / Loading State */}
      <div className="text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2">
          {hasPermissions ? <CheckCircle size={14} className="text-emerald-400"/> : <CameraOff size={14} />}
          <span>Camera & Mic Access</span>
        </div>
        <div className="flex items-center gap-2">
          {isModelsLoaded ? <CheckCircle size={14} className="text-emerald-400"/> : <span className="animate-pulse w-3 h-3 bg-cyan-500 rounded-full inline-block" />}
          <span>{isModelsLoaded ? 'AI Models Loaded' : 'Loading AI Models...'}</span>
        </div>
      </div>

      {/* Violation Stats */}
      {violations.length > 0 && (
        <div className="mt-2 border-t border-slate-800 pt-3">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
            <span>Violations Detected:</span>
            <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded-full">{violations.length} / {settings.maxViolations}</span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
            {violations.map((v) => (
              <div key={v.id} className="bg-red-500/10 border border-red-500/20 rounded px-2 py-1.5 flex gap-2">
                {v.screenshotUrl && (
                  <img src={v.screenshotUrl} alt="Snapshot" className="w-8 h-8 rounded object-cover border border-red-500/30" />
                )}
                <div className="flex-1 flex flex-col justify-center">
                  <span className="text-[10px] text-red-300 font-bold leading-tight">{v.message}</span>
                  <span className="text-[9px] text-slate-500">{new Date(v.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
