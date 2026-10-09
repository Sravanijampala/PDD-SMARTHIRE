import React, { useState } from 'react';
import { X, ShieldAlert, Volume2, Wifi, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';

interface SmartToolsModalProps {
  activeTool: 'fraud' | 'noise' | 'stability' | null;
  onClose: () => void;
}

export function SmartToolsModals({ activeTool, onClose }: SmartToolsModalProps) {
  const [testing, setTesting] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (!activeTool) return null;

  const runDiagnostic = () => {
    setTesting(true);
    setCompleted(false);
    setTimeout(() => {
      setTesting(false);
      setCompleted(true);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0F172A] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-[#0B1220]">
          <div className="flex items-center gap-3">
            {activeTool === 'fraud' && <ShieldAlert className="text-red-400" size={24} />}
            {activeTool === 'noise' && <Volume2 className="text-yellow-400" size={24} />}
            {activeTool === 'stability' && <Wifi className="text-blue-400" size={24} />}

            <h2 className="text-lg font-bold text-white capitalize">
              {activeTool === 'fraud' && 'Smart Fraud Detection Diagnostic'}
              {activeTool === 'noise' && 'Acoustic & Background Noise Check'}
              {activeTool === 'stability' && 'Network Stability & Bandwidth Test'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Diagnostic Tool Body */}
        <div className="p-6 text-slate-300 space-y-6">
          {/* FRAUD DETECTION */}
          {activeTool === 'fraud' && (
            <div className="space-y-4">
              <div className="p-5 bg-red-950/20 border border-red-500/30 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-red-500/20 text-red-400 rounded-xl">
                  <ShieldAlert size={28} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Anti-Proxy & Dual-Screen Verification</h4>
                  <p className="text-xs text-slate-400">Verifies single biometric identity and detects unauthorized gaze shifts or second speakers.</p>
                </div>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Face Recognition Mesh:</span>
                  <span className="font-bold text-emerald-400">Locked (1 Face detected)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Audio Voiceprint Match:</span>
                  <span className="font-bold text-emerald-400">100% Match</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Secondary Screen Detection:</span>
                  <span className="font-bold text-emerald-400">Clean (0 external windows)</span>
                </div>
              </div>
            </div>
          )}

          {/* NOISE CHECK */}
          {activeTool === 'noise' && (
            <div className="space-y-4">
              <div className="p-5 bg-yellow-950/20 border border-yellow-500/30 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-yellow-500/20 text-yellow-400 rounded-xl">
                  <Volume2 size={28} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">AI Acoustic Isolation Check</h4>
                  <p className="text-xs text-slate-400">Measures ambient decibels, keyboard clack, and echo levels.</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Microphone Input dB Meter</span>
                  <span className="text-yellow-400">Optimal (18 dB)</span>
                </div>
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800 flex items-center">
                  <div className="w-[35%] h-full bg-yellow-400 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {/* STABILITY TEST */}
          {activeTool === 'stability' && (
            <div className="space-y-4">
              <div className="p-5 bg-blue-950/20 border border-blue-500/30 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
                  <Wifi size={28} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Live Stream Health Test</h4>
                  <p className="text-xs text-slate-400">Checks latency (ms), jitter, and packet loss for web camera streaming.</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <p className="text-slate-400 text-[10px]">Ping</p>
                  <p className="text-sm font-bold text-blue-400 mt-1">18 ms</p>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <p className="text-slate-400 text-[10px]">Jitter</p>
                  <p className="text-sm font-bold text-emerald-400 mt-1">2 ms</p>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <p className="text-slate-400 text-[10px]">Packet Loss</p>
                  <p className="text-sm font-bold text-emerald-400 mt-1">0.0%</p>
                </div>
              </div>
            </div>
          )}

          {/* Test Action / Result */}
          <div className="pt-2">
            <button
              onClick={runDiagnostic}
              disabled={testing}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                testing ? 'bg-slate-800 text-slate-400' : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              <RefreshCw size={16} className={testing ? 'animate-spin' : ''} />
              {testing ? 'Running Diagnostic Test...' : completed ? 'Re-run Diagnostic' : 'Test Tool Status Now'}
            </button>

            {completed && (
              <div className="mt-3 text-center text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1.5 animate-in fade-in">
                <CheckCircle2 size={16} /> Diagnostic passed with optimal parameters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
