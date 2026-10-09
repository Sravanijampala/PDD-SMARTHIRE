'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Download, Award, BarChart3, CheckCircle2, AlertCircle,
  Lightbulb, BookOpen, TrendingUp, MessageSquare, Loader2, ChevronRight
} from 'lucide-react';

// Sample report data (in production this would come from a session store/DB)
const SAMPLE_SCORES = {
  technical: 85,
  communication: 88,
  confidence: 78,
  grammar: 90,
  vocabulary: 82,
  problemSolving: 83,
  leadership: 76,
  behavioral: 87,
  eyeContact: 80,
  voiceClarity: 85,
  overall: 84,
  speakingSpeedWpm: 125,
  fillerWordsCount: 14,
};

const SAMPLE_STRENGTHS = [
  'Strong technical knowledge with clear explanations',
  'Excellent communication and articulation',
  'Grammatically correct and structured answers',
  'Good use of real-world examples',
];

const SAMPLE_WEAKNESSES = [
  'Confidence could be improved — occasional hesitation',
  'Leadership examples lacked depth',
  'Some answers were too brief for Hard difficulty',
];

const SAMPLE_SUGGESTIONS = [
  'Practice the STAR method (Situation, Task, Action, Result) for behavioral questions',
  'Record yourself answering mock questions to improve delivery confidence',
  'Prepare 3-5 detailed leadership stories from your past experience',
  'Study system design fundamentals with real-world scaling examples',
  "Research the target company's engineering culture and values before interviewing",
];

const SAMPLE_RESOURCES = [
  'Cracking the Coding Interview — Gayle Laakmann McDowell',
  'System Design Interview Vol. 1 & 2 — Alex Xu',
  'LeetCode Top 150 Interview Questions',
  'Grokking the System Design Interview (Educative.io)',
  'Behavioral Interview Mastery — YouTube (Exponent)',
];

function scoreColor(score: number): string {
  if (score >= 90) return '#00E676';
  if (score >= 80) return '#00BCD4';
  if (score >= 70) return '#FFD700';
  if (score >= 60) return '#FF9800';
  return '#F44336';
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-300 font-medium">{label}</span>
        <span className="font-extrabold" style={{ color: scoreColor(value) }}>{value}%</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${value}%`, backgroundColor: scoreColor(value) }}
        />
      </div>
    </div>
  );
}

// Simple radar chart using SVG
function RadarChart({ scores }: { scores: typeof SAMPLE_SCORES }) {
  const dims = [
    { label: 'Technical', value: scores.technical },
    { label: 'Comm.', value: scores.communication },
    { label: 'Confidence', value: scores.confidence },
    { label: 'Grammar', value: scores.grammar },
    { label: 'Vocab.', value: scores.vocabulary },
    { label: 'Problem\nSolving', value: scores.problemSolving },
    { label: 'Leadership', value: scores.leadership },
    { label: 'Behavioral', value: scores.behavioral },
  ];

  const n = dims.length;
  const cx = 160, cy = 160, r = 120;
  const angleStep = (2 * Math.PI) / n;

  const getPoint = (i: number, radius: number) => {
    const angle = i * angleStep - Math.PI / 2;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  };

  // Grid rings
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Data polygon
  const dataPoints = dims.map((d, i) => getPoint(i, (d.value / 100) * r));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <svg viewBox="0 0 320 320" className="w-full max-w-xs mx-auto">
      {/* Grid rings */}
      {rings.map((ring, ri) => {
        const ringPoints = dims.map((_, i) => getPoint(i, ring * r));
        const path = ringPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
        return <path key={ri} d={path} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
      })}

      {/* Axes */}
      {dims.map((_, i) => {
        const outer = getPoint(i, r);
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
      })}

      {/* Data fill */}
      <path d={dataPath} fill="rgba(0,191,255,0.15)" stroke="#00BFFF" strokeWidth="2.5" strokeLinejoin="round" />

      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="5" fill={scoreColor(dims[i].value)} />
      ))}

      {/* Labels */}
      {dims.map((d, i) => {
        const labelR = r + 32;
        const lp = getPoint(i, labelR);
        return (
          <g key={i}>
            <text
              x={lp.x} y={lp.y - 6}
              textAnchor="middle"
              fill="rgba(255,255,255,0.6)"
              fontSize="11"
              fontFamily="Arial, sans-serif"
            >
              {d.label}
            </text>
            <text
              x={lp.x} y={lp.y + 9}
              textAnchor="middle"
              fill={scoreColor(d.value)}
              fontSize="11"
              fontWeight="bold"
              fontFamily="Arial, sans-serif"
            >
              {d.value}%
            </text>
          </g>
        );
      })}

      {/* Center score */}
      <text x={cx} y={cy - 8} textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="Arial, sans-serif">
        {scores.overall}%
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily="Arial, sans-serif">
        Overall
      </text>
    </svg>
  );
}

function ReportContent() {
  const searchParams = useSearchParams();
  const company = searchParams.get('company') || 'Google';
  const role = searchParams.get('role') || 'Software Engineer';
  const difficulty = searchParams.get('difficulty') || 'Hard';
  const candidateName = searchParams.get('name') || 'Candidate';

  const [downloading, setDownloading] = useState(false);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      const { generateReportCanvas, downloadReportAsPDF } = await import('../../lib/reportGenerator');
      // Construct a minimal result object
      const mockResult = {
        scores: { ...SAMPLE_SCORES, sentiment: 'positive' as const },
        strengths: SAMPLE_STRENGTHS,
        weaknesses: SAMPLE_WEAKNESSES,
        mistakes: SAMPLE_WEAKNESSES,
        suggestions: SAMPLE_SUGGESTIONS,
        resources: SAMPLE_RESOURCES,
        summary: `Completed a ${difficulty} ${role} interview at ${company} with an overall score of ${SAMPLE_SCORES.overall}%.`,
        transcript: [],
        duration: 2400,
        questionCount: 12,
        stage: 'closing' as const,
      };
      await downloadReportAsPDF({ candidateName, company, role, difficulty: difficulty as 'Easy' | 'Medium' | 'Hard', result: mockResult });
    } catch (err) {
      console.error(err);
    }
    setDownloading(false);
  };

  return (
    <div className="min-h-screen bg-[#080F1E] text-slate-100">
      {/* Background */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-blue-500/4 rounded-full blur-[160px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-cyan-500/4 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#080F1E]/90 backdrop-blur-xl border-b border-slate-800/70 px-6 lg:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-white">Interview Report</h1>
            <p className="text-xs text-slate-400">{company} · {role} · {difficulty}</p>
          </div>
        </div>
        <button
          onClick={handleDownloadReport}
          disabled={downloading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm rounded-2xl transition-all shadow-lg disabled:opacity-60"
        >
          {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          Download PDF
        </button>
      </header>

      <main className="w-full px-6 lg:px-16 py-8 max-w-5xl mx-auto space-y-8">

        {/* Hero score card */}
        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-slate-700/50 rounded-3xl p-6 lg:p-8 flex flex-col sm:flex-row items-center gap-6">
          {/* Circular score */}
          <div className="relative w-36 h-36 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path stroke="#1E293B" strokeWidth="3" fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path stroke={scoreColor(SAMPLE_SCORES.overall)} strokeWidth="3" fill="none" strokeLinecap="round"
                strokeDasharray={`${SAMPLE_SCORES.overall},100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-white">{SAMPLE_SCORES.overall}%</span>
              <span className="text-xs text-slate-400">Overall</span>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Performance Report</p>
            <h2 className="text-2xl font-extrabold text-white mb-1">{role}</h2>
            <p className="text-slate-400 text-sm mb-3">{company} · {difficulty} Difficulty · Candidate: {candidateName}</p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-500/30">
                <TrendingUp size={12} /> Strong Performance
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 bg-cyan-950/40 px-3 py-1.5 rounded-full border border-cyan-500/30">
                <CheckCircle2 size={12} /> 12 Questions Answered
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 bg-purple-950/40 px-3 py-1.5 rounded-full border border-purple-500/30">
                <MessageSquare size={12} /> 40 min interview
              </div>
            </div>
          </div>
        </div>

        {/* Two-column: Radar + Score bars */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Radar chart */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="text-cyan-400" /> Performance Radar
            </h3>
            <RadarChart scores={SAMPLE_SCORES} />
          </div>

          {/* Score breakdown */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-purple-400" /> Detailed Scores
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Technical Knowledge', value: SAMPLE_SCORES.technical },
                { label: 'Communication', value: SAMPLE_SCORES.communication },
                { label: 'Confidence', value: SAMPLE_SCORES.confidence },
                { label: 'Grammar', value: SAMPLE_SCORES.grammar },
                { label: 'Problem Solving', value: SAMPLE_SCORES.problemSolving },
                { label: 'Behavioral', value: SAMPLE_SCORES.behavioral },
                { label: 'Eye Contact', value: SAMPLE_SCORES.eyeContact },
              ].map(item => (
                <ScoreBar key={item.label} label={item.label} value={animated ? item.value : 0} />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800">
              <div className="bg-slate-800/50 p-4 rounded-2xl text-center">
                <span className="text-2xl font-extrabold text-cyan-400">{SAMPLE_SCORES.speakingSpeedWpm}</span>
                <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Speaking WPM</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-2xl text-center">
                <span className="text-2xl font-extrabold text-red-400">{SAMPLE_SCORES.fillerWordsCount}</span>
                <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Filler Words</p>
              </div>
            </div>
          </div>
        </div>

        {/* Strengths + Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Strengths */}
          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-3xl p-6">
            <h3 className="text-sm font-bold text-emerald-400 mb-4 flex items-center gap-2">
              <CheckCircle2 size={16} /> Strengths
            </h3>
            <div className="space-y-3">
              {SAMPLE_STRENGTHS.map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 size={11} className="text-emerald-400" />
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{s}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Weaknesses */}
          <div className="bg-amber-950/20 border border-amber-500/20 rounded-3xl p-6">
            <h3 className="text-sm font-bold text-amber-400 mb-4 flex items-center gap-2">
              <AlertCircle size={16} /> Areas to Improve
            </h3>
            <div className="space-y-3">
              {SAMPLE_WEAKNESSES.map((w, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertCircle size={11} className="text-amber-400" />
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{w}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Lightbulb size={16} className="text-cyan-400" /> Improvement Suggestions
          </h3>
          <div className="space-y-3">
            {SAMPLE_SUGGESTIONS.map((s, i) => (
              <div key={i} className="flex items-start gap-4 p-3 bg-slate-800/40 rounded-2xl border border-slate-700/40">
                <div className="w-7 h-7 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-extrabold text-cyan-400">{i + 1}</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Learning resources */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen size={16} className="text-purple-400" /> Recommended Learning Resources
          </h3>
          <div className="space-y-3">
            {SAMPLE_RESOURCES.map((r, i) => (
              <div key={i} className="flex items-center gap-4 p-3.5 bg-slate-800/40 rounded-2xl border border-slate-700/40 hover:border-purple-500/30 transition-colors group">
                <div className="w-8 h-8 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={14} className="text-purple-400" />
                </div>
                <p className="text-sm text-slate-300 font-medium">{r}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex gap-3 flex-wrap justify-center pb-4">
          <Link href="/library">
            <button className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-sm rounded-2xl transition-all shadow-lg shadow-cyan-500/20">
              Practice Again <ChevronRight size={16} />
            </button>
          </Link>
          <Link href="/certificates">
            <button className="flex items-center gap-2 px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-2xl transition-all border border-slate-700">
              <Award size={15} /> My Certificates
            </button>
          </Link>
          <Link href="/dashboard">
            <button className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold text-sm rounded-2xl transition-all border border-slate-800">
              Dashboard
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function InterviewReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080F1E] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="text-cyan-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading your report...</p>
        </div>
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}
