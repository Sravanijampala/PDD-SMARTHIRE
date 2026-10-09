'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, BookOpen, Code, Brain, MessageSquare, Award, TrendingUp,
  Clock, CheckCircle, Circle, PlayCircle, Lock, Star, Users, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '../../../../lib/authContext';
import {
  getCompanyTrack, getSessionsForTrack, getUserPrepProgress, updateSessionProgress,
  CompanyPrepTrack, PrepSession, UserPrepProgress
} from '../../../../lib/careerprepDb';

const SESSION_TYPE_CONFIG = {
  mcq: { icon: Brain, label: 'MCQ Round', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  coding: { icon: Code, label: 'Coding Round', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  hr: { icon: MessageSquare, label: 'HR Round', color: 'text-pink-400', bg: 'bg-pink-400/10' },
  technical: { icon: BookOpen, label: 'Technical Round', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  system_design: { icon: TrendingUp, label: 'System Design', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  behavioral: { icon: Award, label: 'Behavioral', color: 'text-rose-400', bg: 'bg-rose-400/10' },
};

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [track, setTrack] = useState<CompanyPrepTrack | null>(null);
  const [sessions, setSessions] = useState<PrepSession[]>([]);
  const [progress, setProgress] = useState<Record<string, UserPrepProgress>>({});
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([
        getCompanyTrack(id),
        getSessionsForTrack(id),
      ]);
      setTrack(t);
      setSessions(s);
      if (user?.id) {
        const p = await getUserPrepProgress(user.id, id);
        setProgress(p);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (session: PrepSession) => {
    if (!user?.id) {
      router.push(`/practice/company/${id}/session/${session.id}`);
      return;
    }
    await updateSessionProgress({
      userId: user.id,
      trackId: id,
      sessionId: session.id,
      status: 'in_progress',
    });
    setProgress(prev => ({
      ...prev,
      [session.id]: { userId: user.id, trackId: id, sessionId: session.id, status: 'in_progress' }
    }));
    router.push(`/practice/company/${id}/session/${session.id}`);
  };

  const completedCount = Object.values(progress).filter(p => p.status === 'completed').length;
  const progressPct = sessions.length > 0 ? Math.round((completedCount / sessions.length) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060E1E] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!track) {
    return (
      <div className="min-h-screen bg-[#060E1E] flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-slate-400">Track not found.</p>
          <Link href="/practice" className="mt-4 inline-block text-cyan-400 hover:underline">← Back to Practice Hub</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060E1E] text-white">
      {/* Hero Banner */}
      <div
        className="relative py-16 px-4 text-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${track.gradientFrom}33 0%, ${track.gradientTo}44 100%)` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#060E1E]" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <Link href="/practice" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6">
            <ArrowLeft size={16} /> Back to Practice Hub
          </Link>
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold">{track.companyName.charAt(0)}</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-2">{track.companyName} Interview Prep</h1>
          <p className="text-slate-300 text-lg mb-6">{track.tagline}</p>
          <div className="flex items-center justify-center gap-6 text-sm text-slate-400">
            <span className="flex items-center gap-1.5"><BookOpen size={14} />{track.sessionsCount} sessions</span>
            <span className="flex items-center gap-1.5"><Users size={14} />{(track.enrolledCount / 1000).toFixed(1)}k enrolled</span>
            <span className="flex items-center gap-1.5 text-amber-400"><Star size={14} className="fill-amber-400" />{track.rating}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        {user && sessions.length > 0 && (
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-semibold">Your Progress</span>
              <span className="text-cyan-400 font-bold">{completedCount}/{sessions.length} sessions</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-slate-400 text-xs mt-2">{progressPct}% Complete</p>
          </div>
        )}

        {/* Description */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">About This Track</h2>
          <p className="text-slate-400 leading-relaxed">{track.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {track.tags.map(tag => (
              <span key={tag} className="px-3 py-1 text-xs rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{tag}</span>
            ))}
          </div>
        </div>

        {/* Sessions List */}
        <h2 className="text-lg font-semibold text-white mb-4">Interview Sessions</h2>
        {sessions.length === 0 ? (
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-12 text-center">
            <BookOpen size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Sessions coming soon!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, i) => {
              const cfg = SESSION_TYPE_CONFIG[session.type] || SESSION_TYPE_CONFIG.technical;
              const Icon = cfg.icon;
              const prog = progress[session.id];
              const status = prog?.status || 'not_started';
              const isExpanded = expandedSession === session.id;

              return (
                <div key={session.id} className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
                  <button
                    className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/2 transition-colors"
                    onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                  >
                    {/* Order number */}
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-400 flex-shrink-0">
                      {i + 1}
                    </div>

                    {/* Type Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                      <Icon size={18} className={cfg.color} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold">{session.title}</h3>
                      <p className="text-slate-400 text-sm">{cfg.label} · {session.duration} min · {session.questionCount} questions</p>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {status === 'completed' && <CheckCircle size={18} className="text-emerald-400" />}
                      {status === 'in_progress' && <PlayCircle size={18} className="text-amber-400 animate-pulse" />}
                      {status === 'not_started' && <Circle size={18} className="text-slate-600" />}
                      {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-white/5 pt-4">
                      <p className="text-slate-400 text-sm mb-4">{session.description}</p>
                      <button
                        onClick={() => handleStart(session)}
                        className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-sm font-semibold transition-all"
                      >
                        {status === 'not_started' ? 'Start Session' : status === 'in_progress' ? 'Continue Session' : 'Review Session'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
